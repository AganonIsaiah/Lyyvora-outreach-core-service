from enum import Enum
from typing import List, Optional, Dict
from datetime import date
from pydantic import BaseModel
from configs.types import ClinicStatus

FilterType = str
EmailType = str
FilterState = Dict[str, List[str]]


class Filter(BaseModel):
    key: str
    label: str
    values: List[str]
    type: FilterType


class ClinicEmails(BaseModel):
    subject_line: str
    email_body: str
    type: EmailType


class Clinic(BaseModel):
    id: int
    name: str
    email: str
    website_url: str
    type: List[str]
    city: str
    province: str
    email_status: ClinicStatus
    total_reviews: int
    average_rating: float
    lead_score: float
    notes: str
    top_features: str
    emails_for_outreach: List[ClinicEmails]
    campaign_batch: str


class Metric(BaseModel):
    label: str
    value: float
    desc: str
    desc_value: Optional[float] = None


class CampaignStatus(BaseModel):
    max_word_limit: int
    number_of_clinics: int
    prompt: str
    contacted_clinics: int
    total_clinics: int
    clinic_percentage: float


class DashboardResponse(BaseModel):
    clinics_data: List[Clinic]
    metrics: List[Metric]
    filters: List[Filter]
    campaign_status: CampaignStatus
    show_export: bool
    total_clinics: int
    filtered_clinics_count: int
    not_generated_emails_count: int
    sent_count: int
    replied_count: int


class DashboardRequest(BaseModel):
    limit: int = 25
    page: int = 1
    name: Optional[List[str]] = None
    sub_type: Optional[List[str]] = None
    city: Optional[List[str]] = None
    province: Optional[List[str]] = None
    email_status: Optional[List[str]] = None
    campaign_batch: Optional[List[str]] = None
    sort_by: Optional[str] = None
    sort_order: str = "desc"
