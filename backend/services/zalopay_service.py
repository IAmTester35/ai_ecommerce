import json
import time
import random
import hmac
import hashlib
import asyncio
import logging
from datetime import datetime
from typing import Dict, Any
import httpx
from supabase import Client

from core.config import settings
from models.payment import CreatePaymentRequest

logger = logging.getLogger(__name__)

class ZaloPayService:
    def __init__(self):
        self.app_id = settings.ZALOPAY_APP_ID
        self.key1 = settings.ZALOPAY_KEY1
        self.key2 = settings.ZALOPAY_KEY2
        self.endpoint = settings.ZALOPAY_ENDPOINT
        self.query_endpoint = settings.ZALOPAY_QUERY_ENDPOINT
        self.callback_url = settings.ZALOPAY_CALLBACK_URL

    def _hmac_sha256(self, data: str, key: str) -> str:
        return hmac.new(key.encode('utf-8'), data.encode('utf-8'), hashlib.sha256).hexdigest()

    async def create_payment(self, req: CreatePaymentRequest, db: Client = None) -> Dict[str, Any]:
        """
        Tạo đơn hàng thanh toán ZaloPay bất đồng bộ.
        Xác thực số tiền đặt cọc trực tiếp từ cơ sở dữ liệu (SSOT) để phòng chống Price Tampering.
        """
        if not db:
            raise ValueError("Database client không khả dụng để xác thực đơn hàng.")

        order_res = await asyncio.to_thread(
            db.table("orders").select("id, deposit_amount, total_amount, deposit_status, payment_status, status").eq("id", req.order_id).maybe_single().execute
        )
        order_data = order_res.data if order_res else None
        if not order_data:
            raise ValueError(f"Không tìm thấy đơn hàng #{req.order_id} trong hệ thống.")

        if order_data.get("deposit_status") == "paid" or order_data.get("payment_status") == "paid":
            raise ValueError(f"Đơn hàng #{req.order_id} đã hoàn tất đặt cọc/thanh toán trước đó.")

        if order_data.get("status") == "cancelled":
            raise ValueError(f"Đơn hàng #{req.order_id} đã bị hủy, không thể khởi tạo thanh toán.")

        db_deposit = order_data.get("deposit_amount")
        db_total = order_data.get("total_amount")
        db_amount = db_deposit if (db_deposit is not None and db_deposit > 0) else db_total

        if not db_amount or db_amount <= 0:
            raise ValueError(f"Đơn hàng #{req.order_id} không có số tiền cần thanh toán hợp lệ trong hệ thống.")

        final_amount = int(db_amount)

        trans_id = random.randint(100000, 999999)
        app_trans_id = f"{datetime.now().strftime('%y%m%d')}_{trans_id}"
        app_time = int(time.time() * 1000)

        embed_data = json.dumps({
            "email": req.email,
            "name": req.name,
            "phone": req.phone,
            "address": req.address,
            "note": req.note,
            "order_id": req.order_id,
            "status": "Pending"
        })

        items_data = json.dumps([item.model_dump(by_alias=True) for item in req.items])

        order_params = {
            "app_id": self.app_id,
            "app_trans_id": app_trans_id,
            "app_user": req.user_id,
            "app_time": app_time,
            "item": items_data,
            "embed_data": embed_data,
            "amount": final_amount,
            "callback_url": self.callback_url,
            "description": req.note or f"Thanh toan don hang {app_trans_id}",
            "bank_code": ""
        }

        # Data string for MAC calculation: app_id|app_trans_id|app_user|amount|app_time|embed_data|item
        data_to_sign = f"{order_params['app_id']}|{order_params['app_trans_id']}|{order_params['app_user']}|{order_params['amount']}|{order_params['app_time']}|{order_params['embed_data']}|{order_params['item']}"
        order_params["mac"] = self._hmac_sha256(data_to_sign, self.key1)

        async with httpx.AsyncClient() as client:
            response = await client.post(self.endpoint, data=order_params, timeout=10.0)
            response.raise_for_status()
            result = response.json()

        result["app_trans_id"] = app_trans_id

        # Lưu app_trans_id vào bảng orders ngay khi khởi tạo thành công
        if db and req.order_id:
            try:
                await asyncio.to_thread(
                    db.table("orders").update({"app_trans_id": app_trans_id}).eq("id", req.order_id).execute
                )
            except Exception as save_err:
                logger.warning(f"Could not link app_trans_id to order {req.order_id}: {save_err}")

        return result

    async def process_callback(self, data_str: str, req_mac: str, db: Client) -> Dict[str, Any]:
        """
        Xử lý Callback tự động từ ZaloPay webhook với kiểm tra MAC an toàn và đối soát số tiền.
        """
        mac = self._hmac_sha256(data_str, self.key2)

        # Sử dụng hmac.compare_digest chống timing attack
        if not hmac.compare_digest(req_mac, mac):
            logger.warning("ZaloPay callback MAC verification failed.")
            return {"return_code": -1, "return_message": "mac not equal"}

        try:
            data_json = json.loads(data_str) if isinstance(data_str, str) else data_str
            raw_embed = data_json.get("embed_data", "{}")
            embed_data = json.loads(raw_embed) if isinstance(raw_embed, str) else (raw_embed or {})
            
            order_id = embed_data.get("order_id")
            user_id = data_json.get("app_user")
            app_trans_id = data_json.get("app_trans_id", "")
            cb_amount = data_json.get("amount")

            # Đối soát số tiền thực trả từ ZaloPay với giá trị trong DB nếu có order_id
            if order_id and db:
                order_check = await asyncio.to_thread(
                    db.table("orders").select("deposit_amount, total_amount").eq("id", order_id).maybe_single().execute
                )
                if order_check and order_check.data:
                    expected_amount = order_check.data.get("deposit_amount") or order_check.data.get("total_amount")
                    if cb_amount and expected_amount and int(cb_amount) < int(expected_amount):
                        logger.error(
                            f"ZaloPay callback amount mismatch for order {order_id}: "
                            f"paid={cb_amount}, expected={expected_amount}"
                        )
                        return {"return_code": 0, "return_message": "amount mismatch"}

            # Cập nhật trạng thái đơn hàng trong Supabase bất đồng bộ
            if order_id:
                await asyncio.to_thread(
                    db.table("orders").update({
                        "payment_status": "paid",
                        "deposit_status": "paid",
                        "status": "deposit_paid",
                        "app_trans_id": app_trans_id
                    }).eq("id", order_id).execute
                )

            # Lưu thông báo vào Supabase bất đồng bộ
            if user_id:
                await asyncio.to_thread(
                    db.table("notifications").insert({
                        "user_id": user_id,
                        "title": "Thanh toán thành công",
                        "content": f"Đơn hàng của bạn ({app_trans_id}) đã được cập nhật thành công.",
                        "type": "order"
                    }).execute
                )

            return {"return_code": 1, "return_message": "success"}

        except Exception as e:
            logger.error(f"Error processing ZaloPay callback: {e}")
            return {"return_code": 0, "return_message": f"Error processing callback: {str(e)}"}

    async def check_order_status(self, app_trans_id: str, db: Client = None) -> Dict[str, Any]:
        """
        Kiểm tra trạng thái đơn hàng ZaloPay bất đồng bộ và tự động đồng bộ DB nếu thành công.
        """
        post_data = {
            "app_id": self.app_id,
            "app_trans_id": app_trans_id
        }

        data_to_sign = f"{post_data['app_id']}|{post_data['app_trans_id']}|{self.key1}"
        post_data["mac"] = self._hmac_sha256(data_to_sign, self.key1)

        headers = {"Content-Type": "application/x-www-form-urlencoded"}
        async with httpx.AsyncClient() as client:
            response = await client.post(self.query_endpoint, data=post_data, headers=headers, timeout=10.0)
            response.raise_for_status()
            result = response.json()

        # Tự động cập nhật DB nếu ZaloPay xác nhận thanh toán thành công (return_code = 1)
        if result.get("return_code") == 1 and db:
            try:
                await asyncio.to_thread(
                    db.table("orders").update({
                        "payment_status": "paid",
                        "deposit_status": "paid",
                        "status": "deposit_paid",
                    }).eq("app_trans_id", app_trans_id).execute
                )
                logger.info(f"Auto-synchronized order status to deposit_paid for app_trans_id {app_trans_id}")
            except Exception as sync_err:
                logger.warning(f"Could not auto-sync order for app_trans_id {app_trans_id}: {sync_err}")

        return result
