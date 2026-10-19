import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Calculates HMAC-SHA256 signature using Web Crypto API
 */
async function hmacSha256(key: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const keyData = enc.encode(key);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(data));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

Deno.serve(async (req: Request) => {
  // Only accept POST requests for webhook callback
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ return_code: 0, return_message: "Method Not Allowed" }),
      { headers: { "Content-Type": "application/json" }, status: 405 }
    );
  }

  try {
    let dataStr = "";
    let reqMac = "";

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await req.json();
      dataStr = typeof body.data === "string" ? body.data : JSON.stringify(body.data || {});
      reqMac = body.mac || "";
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      dataStr = formData.get("data")?.toString() || "";
      reqMac = formData.get("mac")?.toString() || "";
    } else {
      const rawText = await req.text();
      try {
        const parsed = JSON.parse(rawText);
        dataStr = typeof parsed.data === "string" ? parsed.data : JSON.stringify(parsed.data || {});
        reqMac = parsed.mac || "";
      } catch {
        const params = new URLSearchParams(rawText);
        dataStr = params.get("data") || "";
        reqMac = params.get("mac") || "";
      }
    }

    if (!dataStr || !reqMac) {
      console.warn("[ZaloPay Webhook] Missing data or mac in callback request");
      return new Response(
        JSON.stringify({ return_code: -1, return_message: "missing data or mac" }),
        { headers: { "Content-Type": "application/json" }, status: 200 }
      );
    }

    // 1. MAC Verification with ZALOPAY_KEY2
    const key2 = Deno.env.get("ZALOPAY_KEY2") || "trMrHtvjo6myautxDUiAcYsVtaeQ8nhf";
    const computedMac = await hmacSha256(key2, dataStr);

    if (!constantTimeCompare(reqMac, computedMac)) {
      console.warn(`[ZaloPay Webhook] MAC mismatch. Received: ${reqMac}, Computed: ${computedMac}`);
      return new Response(
        JSON.stringify({ return_code: -1, return_message: "mac not equal" }),
        { headers: { "Content-Type": "application/json" }, status: 200 }
      );
    }

    // 2. Parse Payload
    const dataJson = typeof dataStr === "string" ? JSON.parse(dataStr) : dataStr;
    const rawEmbed = dataJson.embed_data || "{}";
    const embedData = typeof rawEmbed === "string" ? JSON.parse(rawEmbed) : (rawEmbed || {});

    const orderId = embedData.order_id;
    const userId = dataJson.app_user;
    const appTransId = dataJson.app_trans_id || "";
    const cbAmount = Number(dataJson.amount);

    console.log(`[ZaloPay Webhook] Verified payment for order_id: ${orderId}, app_trans_id: ${appTransId}, amount: ${cbAmount}`);

    // 3. Supabase Client with Service Role
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 4. Validate Amount Against Database (SSOT)
    if (orderId && supabase) {
      const { data: orderData, error: orderErr } = await supabase
        .from("orders")
        .select("id, deposit_amount, total_amount, payment_status, deposit_status")
        .eq("id", orderId)
        .maybeSingle();

      if (orderErr) {
        console.error(`[ZaloPay Webhook] Error querying order ${orderId}:`, orderErr);
      } else if (orderData) {
        const expectedAmount = Number(orderData.deposit_amount || orderData.total_amount || 0);
        if (expectedAmount > 0 && cbAmount < expectedAmount) {
          console.error(
            `[ZaloPay Webhook] Amount mismatch for order ${orderId}: paid=${cbAmount}, expected=${expectedAmount}`
          );
          return new Response(
            JSON.stringify({ return_code: 0, return_message: "amount mismatch" }),
            { headers: { "Content-Type": "application/json" }, status: 200 }
          );
        }
      }

      // 5. Update Order Status in Supabase
      const { error: updateErr } = await supabase
        .from("orders")
        .update({
          payment_status: "paid",
          deposit_status: "paid",
          status: "deposit_paid",
          app_trans_id: appTransId,
        })
        .eq("id", orderId);

      if (updateErr) {
        console.error(`[ZaloPay Webhook] Error updating order ${orderId}:`, updateErr);
      } else {
        console.log(`[ZaloPay Webhook] Order ${orderId} successfully updated to deposit_paid`);
      }
    }

    // 6. Send Notification to User
    if (userId && supabase) {
      await supabase.from("notifications").insert({
        user_id: userId,
        title: "Đặt Cọc Xe Thành Công",
        body: `Đơn hàng #${orderId || appTransId} đã được xác nhận thanh toán đặt cọc qua cổng ZaloPay.`,
        type: "order",
      });
    }

    return new Response(
      JSON.stringify({ return_code: 1, return_message: "success" }),
      { headers: { "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err: any) {
    console.error("[ZaloPay Webhook] Internal server error:", err);
    return new Response(
      JSON.stringify({ return_code: 0, return_message: err.message || "Internal error" }),
      { headers: { "Content-Type": "application/json" }, status: 200 }
    );
  }
});
