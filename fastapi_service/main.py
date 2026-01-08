from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
from typing import List
from datetime import date

from shared.types import (
    Clinic, ClinicStatus, ClinicEmails, Metric, Filter,
    CampaignStatus, DashboardResponse
)
from shared.configs import DB_FILE

app = FastAPI(title="Lyyvora Outreach API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------
# Status priority mapping
# ------------------------
STATUS_PRIORITY = {
    ClinicStatus.CLOSED: 7,
    ClinicStatus.REPLIED: 6,
    ClinicStatus.FOLLOW_UP_2: 5,
    ClinicStatus.FOLLOW_UP_1: 4,
    ClinicStatus.EMAIL_1_SENT: 3,
    ClinicStatus.NOT_CONTACTED: 2,
    ClinicStatus.NOT_QUEUED: 1,
}

# ------------------------
# DB Access (existing get_all_clinics_from_db) 
# ------------------------
def get_all_clinics_from_db(limit: int = 10, offset: int = 0) -> List[Clinic]:
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("""
        SELECT 
            l.id, l.clinic_name, l.clinic_main_type, l.clinic_sub_type,
            l.city, l.province, l.phone, l.email, l.website_url, l.website_desc,
            l.total_reviews, l.average_rating, l.status,
            s.score, s.top_features,
            m.subject_line, m.email_body
        FROM leads l
        LEFT JOIN lead_scores s ON s.leads_id = l.id
        LEFT JOIN smartlead m ON m.leads_id = l.id;
    """)

    rows = cursor.fetchall()
    clinics = []

    for row in rows:
        emails = []
        if row["subject_line"]:
            emails.append(
                ClinicEmails(
                    subject_line=row["subject_line"] or "",
                    email_body=row["email_body"] or "",
                    type="Email 1"
                )
            )

        clinic = Clinic(
            id=row["id"],
            name=row["clinic_name"],
            email=row["email"],
            website_url=row["website_url"] or "",
            type=[row["clinic_main_type"] or "Unknown"],
            city=row["city"] or "",
            province=row["province"] or "",
            status=ClinicStatus(row["status"]) if row["status"] else ClinicStatus.NOT_QUEUED,
            total_reviews=row["total_reviews"] or 0,
            average_rating=row["average_rating"] or 0.0,
            lead_score=row["score"] or 0,
            last_contact_date=None,
            next_contact_date=None,
            notes=row["website_desc"] or "",
            top_features=row["top_features"] or "",
            emails_for_outreach=emails
        )
        clinics.append(clinic)

    conn.close()
    clinics.sort(key=lambda c: STATUS_PRIORITY.get(c.status, 0), reverse=True)
    return clinics

# ------------------------
# Helper to get unique values for a filter
# ------------------------
def get_unique_values(clinics: List[Clinic], attr: str) -> List[str]:
    values = set()
    for c in clinics:
        val = getattr(c, attr, None)
        if val:
            if isinstance(val, list):
                values.update(val)
            else:
                values.add(val)
    return sorted(values)

# ------------------------
# Dashboard endpoint
# ------------------------
@app.get("/dashboard", response_model=DashboardResponse)
def get_dashboard():
    clinics = get_all_clinics_from_db()

    metrics = [
        Metric(label="Total Clinics", value=len(clinics), desc="Number of clinics"),
        Metric(label="Contacted Clinics", value=0, desc="Clinics contacted")
    ]

    # Create all 9 filters
    filters: List[Filter] = [
        Filter(key="name", label="Name", values=get_unique_values(clinics, "name"), type="select"),
        Filter(key="type", label="Type", values=get_unique_values(clinics, "type"), type="select"),
        Filter(key="city", label="City", values=get_unique_values(clinics, "city"), type="select"),
        Filter(key="province", label="Province", values=get_unique_values(clinics, "province"), type="select"),
        Filter(key="status", label="Status", values=[s.value for s in ClinicStatus], type="select"),
        Filter(key="lead_score", label="Lead Score", values=["Asc", "Desc"], type="sort"),
        Filter(key="average_rating", label="Average Rating", values=["Asc", "Desc"], type="sort"),
        Filter(key="last_contact_date", label="Last Contact Date", values=["Asc", "Desc"], type="sort"),
        Filter(key="next_contact_date", label="Next Contact Date", values=["Asc", "Desc"], type="sort"),
    ]

    campaign_status = CampaignStatus(
        daily_email_limit=100,
        follow_up_1=1,
        follow_up_2=1,
        prompt="Test prompt",
        contacted_clinics=0,
        total_clinics=len(clinics),
        clinic_percentage=0.0
    )

    return DashboardResponse(
        clinics_data=clinics,
        metrics=metrics,
        filters=filters,
        campaign_status=campaign_status
    )
