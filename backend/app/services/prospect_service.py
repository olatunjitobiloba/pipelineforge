from supabase import Client
from fastapi import HTTPException
from app.models.prospect import ProspectCreate, ProspectUpdate
from app.scoring.engine import score_prospect

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


def delete_prospect(supabase: Client, prospect_id: str) -> None:
    result = supabase.table("prospects").delete().eq("id", prospect_id).execute()
    if result.data is not None and len(result.data) == 0:
        raise HTTPException(status_code=404, detail="Prospect not found or delete failed")

def score_one(supabase: Client, prospect_id: str) -> dict:
    """Score a single prospect and persist result to DB."""
    prospect = get_prospect(supabase, prospect_id)

    result = score_prospect(prospect)

    updated = supabase.table("prospects").update({
        "score": result["score"],
        "score_breakdown": result["breakdown"],
        "stage": "scored",
    }).eq("id", prospect_id).execute()

    if not updated.data:
        raise HTTPException(status_code=500, detail="Failed to persist score")

    return {
        **updated.data[0],
        "engine": result["engine"],
    }


def score_campaign_prospects(supabase: Client, campaign_id: str) -> dict:
    """
    Score all unscored prospects in a campaign.
    Processes sequentially to stay within Groq's 30 req/min free tier.
    """
    prospects = (
        supabase.table("prospects")
        .select("*")
        .eq("campaign_id", campaign_id)
        .is_("score", "null")   # only unscored
        .execute()
    )

    rows = prospects.data or []
    if not rows:
        return {"scored": 0, "message": "No unscored prospects found"}

    scored = 0
    errors = []

    for p in rows:
        try:
            score_one(supabase, p["id"])
            scored += 1
        except Exception as e:
            errors.append(f"{p['business_name']}: {str(e)}")

    return {
        "scored": scored,
        "total": len(rows),
        "errors": errors,
    }
