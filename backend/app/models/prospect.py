from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, Literal
from datetime import datetime
from uuid import UUID


STAGES = Literal[
    "new", "researched", "scored", "contacted",
    "replied", "qualified", "call", "test", "won", "lost"
]

DATA_SOURCES = Literal["csv", "url", "manual"]


class ProspectCreate(BaseModel):
    campaign_id: str
    business_name: str = Field(..., min_length=1, max_length=300)
    website_url: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    location: Optional[str] = None
    data_source: DATA_SOURCES = "manual"


class ProspectUpdate(BaseModel):
    business_name: Optional[str] = Field(None, min_length=1, max_length=300)
    website_url: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    location: Optional[str] = None
    stage: Optional[STAGES] = None
    score: Optional[float] = Field(None, ge=0, le=100)
    human_verified: Optional[bool] = None


class Prospect(BaseModel):
    id: UUID
    org_id: UUID
    campaign_id: UUID
    business_name: str
    website_url: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    location: Optional[str] = None
    stage: str
    score: Optional[float] = None
    score_breakdown: Optional[dict] = None
    data_source: str
    human_verified: bool
    created_at: datetime
    updated_at: datetime


class ProspectCSVRow(BaseModel):
    """Validated shape of a single CSV row before DB insert."""
    business_name: str
    website_url: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    location: Optional[str] = None
