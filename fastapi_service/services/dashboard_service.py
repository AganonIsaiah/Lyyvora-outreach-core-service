import sqlite3
from typing import List, Optional

from ..models.dashboard_models import (
    Clinic, ClinicEmails, Metric, Filter,
    CampaignStatus, DashboardResponse, DashboardRequest
)
from shared.configs import DB_FILE
from shared.prompt_templates import prompt
from shared.types import ClinicStatus

STATUS_PRIORITY = {
    ClinicStatus.GENERATED: 2,
    ClinicStatus.NOT_GENERATED: 1,
}

# -------------------------
# Helpers
# -------------------------

def parse_comma_separated(values: Optional[List[str]]) -> Optional[List[str]]:
    if not values:
        return None
    result = []
    for v in values:
        result.extend([x.strip() for x in v.split(",") if x.strip()])
    return result


def build_multi_like(column: str, values: List[str], params: List[str], csv: bool = False):
    parts = []
    for v in values:
        if csv:
            parts.append(f"( ',' || REPLACE({column}, ' ', '') || ',' LIKE ? )")
            params.append(f"%,{v.replace(' ', '')},%")
        else:
            parts.append(f"{column} LIKE ?")
            params.append(f"%{v}%")
    return "(" + " OR ".join(parts) + ")"


# -------------------------
# Counts
# -------------------------

def get_total_clinics_count() -> int:
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT COUNT(*) FROM leads;")
        return cursor.fetchone()[0]
    finally:
        conn.close()


def get_total_filtered_clinics_count(
    name: Optional[List[str]] = None,
    sub_type: Optional[List[str]] = None,
    city: Optional[List[str]] = None,
    province: Optional[List[str]] = None,
    email_status: Optional[List[ClinicStatus]] = None,
    campaign_batch: Optional[List[str]] = None
) -> int:
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    filters = []
    params = []

    if name:
        filters.append(build_multi_like("l.clinic_name", name, params))
    if city:
        filters.append(build_multi_like("l.city", city, params))
    if province:
        filters.append(build_multi_like("l.province", province, params))
    if sub_type:
        filters.append(build_multi_like("l.clinic_sub_type", sub_type, params, csv=True))
    if email_status:
        placeholders = ",".join("?" for _ in email_status)
        filters.append(f"l.email_status IN ({placeholders})")
        params.extend([s.value for s in email_status])
    if campaign_batch:
        filters.append(build_multi_like("m.campaign_batch", campaign_batch, params))

    where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""

    query = f"""
        SELECT COUNT(DISTINCT l.id)
        FROM leads l
        LEFT JOIN smartlead m ON m.leads_id = l.id
        {where_clause}
    """

    cursor.execute(query, params)
    total = cursor.fetchone()[0]
    conn.close()
    return total


# -------------------------
# Filters
# -------------------------

def get_all_filter_values():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    def split_and_deduplicate(rows):
        types_set = set()
        for r in rows:
            if r[0]:
                for t in r[0].split(","):
                    types_set.add(t.strip())
        return sorted(types_set)

    data = {
        "name": [r[0] for r in cursor.execute(
            "SELECT DISTINCT clinic_name FROM leads WHERE clinic_name IS NOT NULL;"
        ).fetchall()],
        "city": [r[0] for r in cursor.execute(
            "SELECT DISTINCT city FROM leads WHERE city IS NOT NULL;"
        ).fetchall()],
        "province": [r[0] for r in cursor.execute(
            "SELECT DISTINCT province FROM leads WHERE province IS NOT NULL;"
        ).fetchall()],
        "type": split_and_deduplicate(cursor.execute(
            "SELECT DISTINCT clinic_sub_type FROM leads WHERE clinic_sub_type IS NOT NULL;"
        ).fetchall()),
        "campaign_batch": [r[0] for r in cursor.execute(
            "SELECT DISTINCT campaign_batch FROM smartlead WHERE campaign_batch IS NOT NULL;"
        ).fetchall()]
    }

    conn.close()
    return data


# -------------------------
# Clinics query
# -------------------------

def get_all_clinics_from_db(
    limit: int = 10,
    offset: int = 0,
    name: Optional[List[str]] = None,
    sub_type: Optional[List[str]] = None,
    city: Optional[List[str]] = None,
    province: Optional[List[str]] = None,
    email_status: Optional[List[ClinicStatus]] = None,
    sort_by: Optional[str] = None,
    sort_order: str = "desc",
    campaign_batch: Optional[List[str]] = None
) -> List[Clinic]:

    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    filters = []
    params = []

    if name:
        filters.append(build_multi_like("l.clinic_name", name, params))
    if city:
        filters.append(build_multi_like("l.city", city, params))
    if province:
        filters.append(build_multi_like("l.province", province, params))
    if sub_type:
        filters.append(build_multi_like("l.clinic_sub_type", sub_type, params, csv=True))
    if email_status:
        placeholders = ",".join("?" for _ in email_status)
        filters.append(f"l.email_status IN ({placeholders})")
        params.extend([s.value for s in email_status])
    if campaign_batch:
        filters.append(build_multi_like("m.campaign_batch", campaign_batch, params))

    where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""
    order_clause = "ORDER BY s.score DESC"

    if sort_by == "email_status":
        order_clause = f"""
            ORDER BY CASE l.email_status
            {" ".join(f"WHEN '{s.value}' THEN {p}" for s, p in STATUS_PRIORITY.items())}
            END {"ASC" if sort_order == 'asc' else 'DESC'}
        """
    elif sort_by == "lead_score":
        order_clause = f"ORDER BY s.score {'ASC' if sort_order=='asc' else 'DESC'}"
    elif sort_by == "average_rating":
        order_clause = f"ORDER BY l.average_rating {'ASC' if sort_order=='asc' else 'DESC'}"

    query = f"""
        SELECT 
            l.id, l.clinic_name, l.clinic_sub_type,
            l.city, l.province, l.email, l.website_url, l.website_desc,
            l.total_reviews, l.average_rating, l.email_status,
            s.score, s.top_features,
            m.campaign_batch,
            m.subject_line_1, m.email_body_1,
            m.subject_line_2, m.email_body_2,
            m.subject_line_3, m.email_body_3
        FROM leads l
        LEFT JOIN lead_scores s ON s.leads_id = l.id
        LEFT JOIN smartlead m ON m.leads_id = l.id
        {where_clause}
        {order_clause}
        LIMIT ? OFFSET ?;
    """

    params.extend([limit, offset])
    cursor.execute(query, params)
    rows = cursor.fetchall()

    clinics = []

    for row in rows:
        emails: List[ClinicEmails] = []

        for i in range(1, 4):
            subject = row[f"subject_line_{i}"]
            body = row[f"email_body_{i}"]
            if subject or body:
                emails.append(ClinicEmails(
                    subject_line=subject or "",
                    email_body=body or "",
                    type=f"Email {i}"
                ))

        types_list = [t.strip() for t in (row["clinic_sub_type"] or "").split(",") if t.strip()]

        clinics.append(Clinic(
            id=row["id"],
            name=row["clinic_name"] or "Clinic Name",
            email=row["email"] or "N/A",
            website_url=row["website_url"] or "N/A",
            type=types_list if types_list else ["Unknown"],
            city=row["city"] or "N/A",
            province=row["province"] or "N/A",
            email_status=ClinicStatus(row["email_status"]) if row["email_status"] else ClinicStatus.NOT_QUEUED,
            total_reviews=row["total_reviews"] or 0,
            average_rating=row["average_rating"] or 0.0,
            lead_score=row["score"] or 0,
            notes=row["website_desc"] or "N/A",
            top_features=row["top_features"] or "",
            emails_for_outreach=emails,
            campaign_batch=row["campaign_batch"] or ""
        ))

    conn.close()
    return clinics


# -------------------------
# Utilities
# -------------------------

def has_lead_records() -> bool:
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT 1 FROM leads LIMIT 1;")
    exists = cursor.fetchone() is not None
    conn.close()
    return exists


# -------------------------
# Main dashboard
# -------------------------

def generate_dashboard(req: DashboardRequest):

    offset = (req.page - 1) * req.limit

    name = parse_comma_separated(req.name)
    sub_type = parse_comma_separated(req.sub_type)
    city = parse_comma_separated(req.city)
    province = parse_comma_separated(req.province)

    email_status = parse_comma_separated(req.email_status)
    email_status = [ClinicStatus(s) for s in email_status] if email_status else None

    campaign_batch = parse_comma_separated(req.campaign_batch)

    clinics = get_all_clinics_from_db(
        limit=req.limit,
        offset=offset,
        name=name,
        sub_type=sub_type,
        city=city,
        province=province,
        email_status=email_status,
        sort_by=req.sort_by,
        sort_order=req.sort_order,
        campaign_batch=campaign_batch
    )

    total_clinics = get_total_clinics_count()

    filtered_clinics_count = get_total_filtered_clinics_count(
        name=name,
        sub_type=sub_type,
        city=city,
        province=province,
        email_status=email_status,
        campaign_batch=campaign_batch
    )

    filter_values = get_all_filter_values()

    metrics = [
        Metric(label="Total Clinics", value=total_clinics, desc="Number of clinics")
    ]

    filters: list[Filter] = [
        Filter(key="name", label="Name", values=sorted(filter_values["name"]), type="select"),
        Filter(key="type", label="Type", values=sorted(filter_values["type"]), type="select"),
        Filter(key="city", label="City", values=sorted(filter_values["city"]), type="select"),
        Filter(key="campaign_batch", label="Campaign Batch ID", values=sorted(filter_values["campaign_batch"]), type="select"),
        Filter(key="province", label="Province", values=sorted(filter_values["province"]), type="select"),
        Filter(key="email_status", label="Email Status", values=[s.value for s in ClinicStatus], type="select"),
        Filter(key="lead_score", label="Lead Score", values=["Asc", "Desc"], type="sort"),
        Filter(key="average_rating", label="Average Rating", values=["Asc", "Desc"], type="sort")
    ]

    campaign_status = CampaignStatus(
        max_word_limit=120,
        number_of_clinics=10,
        prompt=prompt(),
        contacted_clinics=0,
        total_clinics=total_clinics,
        clinic_percentage=0.0
    )

    return DashboardResponse(
        clinics_data=clinics,
        metrics=metrics,
        filters=filters,
        campaign_status=campaign_status,
        total_clinics=total_clinics,
        filtered_clinics_count=filtered_clinics_count,
        show_export=has_lead_records()
    )
