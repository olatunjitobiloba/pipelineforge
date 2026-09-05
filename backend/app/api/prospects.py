from fastapi import APIRouter, Depends, UploadFile, File, Query, Response
from app.core.auth import verify_token, AuthContext
from app.db.supabase_client import get_supabase_for_user
from app.models.prospect import Prospect, ProspectCreate, ProspectUpdate
from app.services import prospect_service
from app.utils.csv_parser import parse_csv
from app.services.prospect_service import score_one, score_campaign_prospects

router = APIRouter(prefix="/prospects", tags=["prospects"])


@router.post("", response_model=Prospect, status_code=201)
def create_prospect(data: ProspectCreate, auth: AuthContext = Depends(verify_token)):
    supabase = get_supabase_for_user(auth.token)
    org_id = prospect_service.get_org_id(supabase, auth.user_id)
    prospect_service.assert_campaign_belongs_to_org(supabase, data.campaign_id, org_id)
    return prospect_service.create_prospect(supabase, org_id, data)


@router.get("", response_model=list[Prospect])
def list_prospects(
    campaign_id: str = Query(..., description="Filter by campaign"),
    auth: AuthContext = Depends(verify_token),
):
    supabase = get_supabase_for_user(auth.token)
    return prospect_service.list_prospects(supabase, campaign_id)


@router.get("/{prospect_id}", response_model=Prospect)
def get_prospect(prospect_id: str, auth: AuthContext = Depends(verify_token)):
    supabase = get_supabase_for_user(auth.token)
    return prospect_service.get_prospect(supabase, prospect_id)


@router.patch("/{prospect_id}", response_model=Prospect)
def update_prospect(
    prospect_id: str,
    data: ProspectUpdate,
    auth: AuthContext = Depends(verify_token),
):
    supabase = get_supabase_for_user(auth.token)
    return prospect_service.update_prospect(supabase, prospect_id, data)


@router.delete("/{prospect_id}", status_code=204)
def delete_prospect(prospect_id: str, auth: AuthContext = Depends(verify_token)):
    supabase = get_supabase_for_user(auth.token)
    prospect_service.delete_prospect(supabase, prospect_id)
    return Response(status_code=204)


@router.post("/import/csv", status_code=200)
async def import_csv(
    campaign_id: str = Query(..., description="Target campaign for imported prospects"),
    file: UploadFile = File(...),
    auth: AuthContext = Depends(verify_token),
):
    if not file.filename or not file.filename.endswith(".csv"):
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Only .csv files are accepted")

    supabase = get_supabase_for_user(auth.token)
    org_id = prospect_service.get_org_id(supabase, auth.user_id)
    prospect_service.assert_campaign_belongs_to_org(supabase, campaign_id, org_id)

    contents = await file.read()
    valid_rows, errors = parse_csv(contents)

    if not valid_rows:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=422,
            detail={"message": "No valid rows found", "errors": errors}
        )

    result = prospect_service.bulk_insert_prospects(supabase, org_id, campaign_id, valid_rows)

    return {
        "inserted": result["inserted"],
        "skipped": len(errors),
        "errors": errors,
    }

@router.post("/{prospect_id}/score")
def score_prospect_endpoint(
    prospect_id: str,
    auth: AuthContext = Depends(verify_token),
):
    """Score a single prospect on demand."""
    supabase = get_supabase_for_user(auth.token)
    return score_one(supabase, prospect_id)


@router.post("/score/campaign")
def score_campaign_endpoint(
    campaign_id: str = Query(...),
    auth: AuthContext = Depends(verify_token),
):
    """Score all unscored prospects in a campaign (bulk)."""
    supabase = get_supabase_for_user(auth.token)
    return score_campaign_prospects(supabase, campaign_id)