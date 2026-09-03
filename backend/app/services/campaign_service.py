from supabase import Client
from fastapi import HTTPException
from app.models.campaign import CampaignCreate, CampaignUpdate


def create_campaign(supabase: Client, org_id: str, data: CampaignCreate) -> dict:
    payload = data.model_dump()
    payload["org_id"] = org_id

    result = supabase.table("campaigns").insert(payload).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create campaign")

    return result.data[0]


def list_campaigns(supabase: Client) -> list[dict]:
    # RLS automatically scopes this to the caller's org - no manual filter needed
    result = supabase.table("campaigns").select("*").order("created_at", desc=True).execute()
    return result.data or []


def get_campaign(supabase: Client, campaign_id: str) -> dict:
    result = supabase.table("campaigns").select("*").eq("id", campaign_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Campaign not found")

    return result.data[0]


def update_campaign(supabase: Client, campaign_id: str, data: CampaignUpdate) -> dict:
    payload = {k: v for k, v in data.model_dump().items() if v is not None}

    if not payload:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = supabase.table("campaigns").update(payload).eq("id", campaign_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Campaign not found or update failed")

    return result.data[0]