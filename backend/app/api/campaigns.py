from fastapi import APIRouter, Depends
from app.core.auth import verify_token, AuthContext
from app.db.supabase_client import get_supabase_for_user
from app.models.campaign import Campaign, CampaignCreate, CampaignUpdate
from app.services import campaign_service

router = APIRouter(prefix="/campaigns", tags=["campaigns"])


@router.post("", response_model=Campaign, status_code=201)
def create_campaign(
    data: CampaignCreate,
    auth: AuthContext = Depends(verify_token),
):
    supabase = get_supabase_for_user(auth.token)

    # Fetch org_id from the user's own profile row (never trust client input)
    profile = supabase.table("profiles").select("org_id").eq("id", auth.user_id).single().execute()
    org_id = profile.data["org_id"]

    created = campaign_service.create_campaign(supabase, org_id, data)
    return created


@router.get("", response_model=list[Campaign])
def list_campaigns(auth: AuthContext = Depends(verify_token)):
    supabase = get_supabase_for_user(auth.token)
    return campaign_service.list_campaigns(supabase)


@router.get("/{campaign_id}", response_model=Campaign)
def get_campaign(campaign_id: str, auth: AuthContext = Depends(verify_token)):
    supabase = get_supabase_for_user(auth.token)
    return campaign_service.get_campaign(supabase, campaign_id)


@router.patch("/{campaign_id}", response_model=Campaign)
def update_campaign(
    campaign_id: str,
    data: CampaignUpdate,
    auth: AuthContext = Depends(verify_token),
):
    supabase = get_supabase_for_user(auth.token)
    return campaign_service.update_campaign(supabase, campaign_id, data)
