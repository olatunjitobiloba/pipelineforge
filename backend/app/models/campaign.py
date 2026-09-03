from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime
from uuid import UUID


class CampaignCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    niche: str = Field(..., min_length=1, max_length=100)
    city: str = Field(..., min_length=1, max_length=100)
    min_service_value: Optional[float] = Field(None, ge=0)
    exclusion_criteria: list[str] = Field(default_factory=list)
    outreach_angle: Optional[str] = Field(None, max_length=500)
    objective: Optional[str] = Field(None, max_length=500)


class CampaignUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    niche: Optional[str] = Field(None, min_length=1, max_length=100)
    city: Optional[str] = Field(None, min_length=1, max_length=100)
    min_service_value: Optional[float] = Field(None, ge=0)
    exclusion_criteria: Optional[list[str]] = None
    outreach_angle: Optional[str] = Field(None, max_length=500)
    objective: Optional[str] = Field(None, max_length=500)
    status: Optional[Literal["active", "paused", "archived"]] = None


class Campaign(BaseModel):
    id: UUID
    org_id: UUID
    name: str
    niche: str
    city: str
    min_service_value: Optional[float] = None
    exclusion_criteria: list[str] = Field(default_factory=list)
    outreach_angle: Optional[str] = None
    objective: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime