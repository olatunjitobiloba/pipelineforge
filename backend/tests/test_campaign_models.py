import pytest
from pydantic import ValidationError
from app.models.campaign import CampaignCreate, CampaignUpdate


def test_campaign_create_valid():
    data = CampaignCreate(
        name="Roofing Q3 Push",
        niche="roofing",
        city="Austin",
        min_service_value=5000,
        exclusion_criteria=["out of state"],
        outreach_angle="curiosity",
        objective="test campaign for retainer conversion",
    )
    assert data.name == "Roofing Q3 Push"
    assert data.min_service_value == 5000


def test_campaign_create_missing_required_field():
    with pytest.raises(ValidationError):
        CampaignCreate(niche="roofing", city="Austin")  # missing 'name'


def test_campaign_create_rejects_negative_service_value():
    with pytest.raises(ValidationError):
        CampaignCreate(
            name="Test",
            niche="roofing",
            city="Austin",
            min_service_value=-100,
        )


def test_campaign_update_allows_partial_fields():
    data = CampaignUpdate(status="paused")
    assert data.status == "paused"
    assert data.name is None


def test_campaign_update_rejects_invalid_status():
    with pytest.raises(ValidationError):
        CampaignUpdate(status="deleted")  # not in allowed Literal values