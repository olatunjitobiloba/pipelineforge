from supabase import Client
from fastapi import HTTPException
from app.models.prospect import ProspectCreate, ProspectUpdate


def get_org_id(supabase: Client, user_id: str) -> str:
    """Fetch org_id from the authenticated user's profile. Never trust client input."""
    result = supabase.table("profiles").select("org_id").eq("id", user_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return result.data["org_id"]


def assert_campaign_belongs_to_org(supabase: Client, campaign_id: str, org_id: str):
    """Verify the campaign exists and belongs to this org before inserting prospects into it."""
    result = (
        supabase.table("campaigns")
        .select("id")
        .eq("id", campaign_id)
        .eq("org_id", org_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Campaign not found or access denied")


def create_prospect(supabase: Client, org_id: str, data: ProspectCreate) -> dict:
    payload = data.model_dump()
    payload["org_id"] = org_id

    result = supabase.table("prospects").insert(payload).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create prospect")
    return result.data[0]


def bulk_insert_prospects(supabase: Client, org_id: str, campaign_id: str, rows: list[dict]) -> dict:
    """
    Insert multiple prospect rows in a single DB call.
    Each row is pre-validated before reaching here.
    """
    payload = [
        {**row, "org_id": org_id, "campaign_id": campaign_id, "data_source": "csv"}
        for row in rows
    ]

    result = supabase.table("prospects").insert(payload).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Bulk insert failed")
    return {"inserted": len(result.data)}


def list_prospects(supabase: Client, campaign_id: str) -> list[dict]:
    result = (
        supabase.table("prospects")
        .select("*")
        .eq("campaign_id", campaign_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


def get_prospect(supabase: Client, prospect_id: str) -> dict:
    result = supabase.table("prospects").select("*").eq("id", prospect_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Prospect not found")
    return result.data[0]


def update_prospect(supabase: Client, prospect_id: str, data: ProspectUpdate) -> dict:
    payload = {k: v for k, v in data.model_dump().items() if v is not None}
    if not payload:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = supabase.table("prospects").update(payload).eq("id", prospect_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Prospect not found or update failed")
    return result.data[0]