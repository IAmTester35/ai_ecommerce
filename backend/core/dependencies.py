import os
from fastapi import Header, HTTPException, Depends
from supabase import create_client, Client

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

# Global Supabase client initialized with standard environment keys
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_supabase() -> Client:
    return supabase

async def get_current_user_id(authorization: str = Header(None)) -> str:
    """
    Extracts user_id from the Supabase JWT token sent in the Authorization header.
    Expects format: 'Bearer <token>'
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    
    try:
        token = authorization.split(" ")[1]
        user_resp = supabase.auth.get_user(token)
        if not user_resp or not user_resp.user:
             raise HTTPException(status_code=401, detail="Invalid token")
        return user_resp.user.id
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Unauthorized: {str(e)}")

async def get_optional_user_id(authorization: str = Header(None)) -> str | None:
    """
    Tương tự get_current_user_id nhưng trả về None thay vì lỗi 401 nếu không có token hoặc token không hợp lệ.
    Dành cho các API cho phép khách vãng lai.
    """
    if not authorization:
        return None
        
    try:
        token = authorization.split(" ")[1]
        user_resp = supabase.auth.get_user(token)
        if not user_resp or not user_resp.user:
            return None
        return user_resp.user.id
    except Exception:
        return None
