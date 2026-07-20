import os
from fastapi import Header, HTTPException, Depends
from supabase import create_client, Client

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

# Global Supabase client (using service role key or anon key, depending on env)
# For backend operations, we usually use the service role key to bypass RLS, 
# but here we just use what's in the environment.
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

async def get_admin_user_id(user_id: str = Depends(get_current_user_id)) -> str:
    """
    Checks if the user has 'admin' role in the profiles table.
    """
    response = supabase.table("profiles").select("role").eq("id", user_id).execute()
    if not response.data or response.data[0].get("role") != "admin":
        raise HTTPException(status_code=403, detail="Forbidden: Admins only")
    return user_id
