import asyncio
from fastapi import Header, HTTPException
from supabase import create_client, Client
from core.config import settings

# Khởi tạo Supabase client tập trung từ cấu hình
if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be configured in environment variables.")

supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

def get_supabase() -> Client:
    return supabase

async def _extract_user_id_from_header(authorization: str | None) -> str | None:
    """
    Helper trích xuất và xác thực user_id từ JWT Bearer token qua Supabase Auth.
    Chạy async qua thread pool để không block event loop.
    """
    if not authorization:
        return None

    parts = authorization.strip().split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None

    token = parts[1]
    try:
        user_resp = await asyncio.to_thread(supabase.auth.get_user, token)
        if user_resp and user_resp.user:
            return user_resp.user.id
    except Exception:
        return None

    return None

async def get_current_user_id(authorization: str = Header(None)) -> str:
    """
    Trích xuất user_id từ token. Bắt buộc có token hợp lệ, ngược lại trả về lỗi 401.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    user_id = await _extract_user_id_from_header(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired authentication token")

    return user_id

async def get_optional_user_id(authorization: str = Header(None)) -> str | None:
    """
    Trích xuất user_id nếu có token hợp lệ, trả về None nếu là khách vãng lai (guest).
    """
    return await _extract_user_id_from_header(authorization)
