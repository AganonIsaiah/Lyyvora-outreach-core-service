from enum import Enum
from typing import List, Optional, Dict
from datetime import date
from pydantic import BaseModel

class ClinicStatus(str, Enum):
  NOT_QUEUED = "Not Queued"
  NOT_CONTACTED = "Not Contacted"
  EMAIL_1_SENT = "Email 1 Sent"
  FOLLOW_UP_1 = "Follow-up 1"
  FOLLOW_UP_2 = "Follow-up 2"
  REPLIED = "Replied"
  CLOSED = "Closed"

FilterType = str  # "select" | "sort"
EmailType = str  # "Email 1" | "Follow-up 1" | "Follow-up 2"
FilterState = Dict[str, List[str]]  # Record<string, string[]> in TS

class Filter(BaseModel):
  key: str
  label: str
  values: List[str]
  type: FilterType

class SidebarRoute(BaseModel):
  label: str
  href: Routes

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
  status: ClinicStatus
  total_reviews: int
  average_rating: float
  lead_score: float
  last_contact_date: Optional[date] = None
  next_contact_date: Optional[date] = None
  notes: str
  top_features: str
  emails_for_outreach: List[ClinicEmails]

class Metric(BaseModel):
  label: str
  value: float
  desc: str
  desc_value: Optional[float] = None

class CampaignStatus(BaseModel):
  daily_email_limit: int
  follow_up_1: int
  follow_up_2: int
  prompt: str
  contacted_clinics: int
  total_clinics: int
  clinic_percentage: float

class DashboardResponse(BaseModel):
  clinics_data: List[Clinic]
  metrics: List[Metric]
  filters: List[Filter]
  campaign_status: CampaignStatus