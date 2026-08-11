import os
import json
import time
import random
import hmac
import hashlib
import requests
from datetime import datetime
from typing import Dict, Any
from supabase import Client
from models.payment import CreatePaymentRequest

class ZaloPayService:
    def __init__(self):
        self.app_id = os.getenv("ZALOPAY_APP_ID", "your_app_id")
        self.key1 = os.getenv("ZALOPAY_KEY1", "your_key_1")
        self.key2 = os.getenv("ZALOPAY_KEY2", "your_key_2")
        self.endpoint = os.getenv("ZALOPAY_ENDPOINT", "https://sb-openapi.zalopay.vn/v2/create")
        self.query_endpoint = os.getenv("ZALOPAY_QUERY_ENDPOINT", "https://sb-openapi.zalopay.vn/v2/query")
        self.callback_url = os.getenv("ZALOPAY_CALLBACK_URL", "http://localhost:8000/api/payment/callback")

    def _hmac_sha256(self, data: str, key: str) -> str:
        return hmac.new(key.encode('utf-8'), data.encode('utf-8'), hashlib.sha256).hexdigest()

    async def create_payment(self, req: CreatePaymentRequest) -> Dict[str, Any]:
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

        items_data = json.dumps([item.model_dump() for item in req.items])

        order_params = {
            "app_id": int(self.app_id),
            "app_trans_id": app_trans_id,
            "app_user": req.userid,
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

        response = requests.post(self.endpoint, data=order_params)
        result = response.json()
        result["app_trans_id"] = app_trans_id
        return result

    async def process_callback(self, data_str: str, req_mac: str, db: Client) -> Dict[str, Any]:
        mac = self._hmac_sha256(data_str, self.key2)

        if req_mac != mac:
            return {"return_code": -1, "return_message": "mac not equal"}

        data_json = json.loads(data_str)
        embed_data = json.loads(data_json.get("embed_data", "{}"))
        order_id = embed_data.get("order_id")
        user_id = data_json.get("app_user")

        # Cap nhat trang thai don hang trong Supabase
        if order_id:
            db.table("orders").update({
                "payment_status": "paid",
                "status": "processing"
            }).eq("id", order_id).execute()

        # Luu thong bao vao Supabase
        if user_id:
            db.table("notifications").insert({
                "user_id": user_id,
                "title": "Thanh toán thành công",
                "content": f"Đơn hàng của bạn ({data_json.get('app_trans_id')}) đã được cập nhật thành công.",
                "type": "order"
            }).execute()

        # TODO: Gui email thong bao qua Google Apps Script hoac Email Service
        # TODO: Gui FCM Push Notification toi thiết bị người dùng qua Firebase Admin SDK

        return {"return_code": 1, "return_message": "success"}

    async def check_order_status(self, app_trans_id: str) -> Dict[str, Any]:
        post_data = {
            "app_id": int(self.app_id),
            "app_trans_id": app_trans_id
        }

        data_to_sign = f"{post_data['app_id']}|{post_data['app_trans_id']}|{self.key1}"
        post_data["mac"] = self._hmac_sha256(data_to_sign, self.key1)

        headers = {"Content-Type": "application/x-www-form-urlencoded"}
        response = requests.post(self.query_endpoint, data=post_data, headers=headers)
        return response.json()
