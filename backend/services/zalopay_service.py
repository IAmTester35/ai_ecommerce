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

    async def create_payment(self, req: CreatePaymentRequest) -> Dict[str, Any]:
        """
        Tạo đơn hàng thanh toán ZaloPay bất đồng bộ.
        """
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
            "amount": req.amount,
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
        return result

    async def process_callback(self, data_str: str, req_mac: str, db: Client) -> Dict[str, Any]:
        """
        Xử lý Callback tự động từ ZaloPay webhook với kiểm tra MAC an toàn.
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

            # Cập nhật trạng thái đơn hàng trong Supabase bất đồng bộ
            if order_id:
                await asyncio.to_thread(
                    db.table("orders").update({
                        "payment_status": "paid",
                        "deposit_status": "paid",
                        "status": "deposit_paid"
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

    async def check_order_status(self, app_trans_id: str) -> Dict[str, Any]:
        """
        Kiểm tra trạng thái đơn hàng ZaloPay bất đồng bộ.
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
            return response.json()
