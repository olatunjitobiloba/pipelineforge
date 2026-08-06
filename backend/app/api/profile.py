from fastapi import APIRouter, Depends, HTTPException
from app.core.auth import verify_token, AuthContext
from app.db.supabase_client import get_supabase_for_user

router = APIRouter()


@router.get("/me")
def get_my_profile(auth: AuthContext = Depends(verify_token)):
    supabase = get_supabase_for_user(auth.token)

    result = supabase.table("profiles").select("*").eq("id", auth.user_id).single().execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")

    return {
        "user_id": auth.user_id,
        "email": auth.email,
        "profile": result.data,
    }