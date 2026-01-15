import sqlite3
from typing import List, Optional

from ..models.dashboard_models import (
    Clinic,
    ClinicEmails,
    Metric,
    Filter,
    CampaignStatus,
    DashboardResponse,
    DashboardRequest,
)
from configs.path_configs import DB_FILE
from configs.prompt_templates import prompt
from configs.types import ClinicStatus
from configs.queries import Queries

STATUS_PRIORITY = {
    ClinicStatus.GENERATED: 2,
    ClinicStatus.NOT_GENERATED: 1,
}


def parse_comma_separated(values: Optional[List[str]]) -> Optional[List[str]]:
    if not values:
        return None
    result = []
    for v in values:
        result.extend([x.strip() for x in v.split(",") if x.strip()])
    return result


def build_multi_like(
    column: str, values: List[str], params: List[str], csv: bool = False
):
    parts = []
    for v in values:
        if csv:
            parts.append(f"( ',' || REPLACE({column}, ' ', '') || ',' LIKE ? )")
            params.append(f"%,{v.replace(' ', '')},%")
        else:
            parts.append(f"{column} LIKE ?")
            params.append(f"%{v}%")
    return "(" + " OR ".join(parts) + ")"


def get_total_clinics_count() -> int:
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute(Queries.total_clinics_count())
        return cursor.fetchone()[0]
    finally:
        conn.close()


def get_total_filtered_clinics_count(
    name: Optional[List[str]] = None,
    sub_type: Optional[List[str]] = None,
    city: Optional[List[str]] = None,
    province: Optional[List[str]] = None,
    email_status: Optional[List[ClinicStatus]] = None,
    campaign_batch: Optional[List[str]] = None,
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
        filters.append(
            build_multi_like("l.clinic_sub_type", sub_type, params, csv=True)
        )
    if email_status:
        placeholders = ",".join("?" for _ in email_status)
        filters.append(f"l.email_status IN ({placeholders})")
        params.extend([s.value for s in email_status])
    if campaign_batch:
        filters.append(build_multi_like("m.campaign_batch", campaign_batch, params))

    where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""
    query = Queries.total_filtered_clinics_count(where_clause)

    cursor.execute(query, params)
    total = cursor.fetchone()[0]
    conn.close()
    return total


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
        "name": [
            r[0]
            for r in cursor.execute(
                Queries.distinct_values("leads", "clinic_name")
            ).fetchall()
        ],
        "city": [
            r[0]
            for r in cursor.execute(Queries.distinct_values("leads", "city")).fetchall()
        ],
        "province": [
            r[0]
            for r in cursor.execute(
                Queries.distinct_values("leads", "province")
            ).fetchall()
        ],
        "type": split_and_deduplicate(
            cursor.execute(
                Queries.distinct_values("leads", "clinic_sub_type")
            ).fetchall()
        ),
        "campaign_batch": [
            r[0]
            for r in cursor.execute(
                Queries.distinct_values("smartlead", "campaign_batch")
            ).fetchall()
        ],
    }

    conn.close()
    return data


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
    campaign_batch: Optional[List[str]] = None,
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
        filters.append(
            build_multi_like("l.clinic_sub_type", sub_type, params, csv=True)
        )
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
        order_clause = (
            f"ORDER BY l.average_rating {'ASC' if sort_order=='asc' else 'DESC'}"
        )

    query = Queries.all_clinics_query(where_clause, order_clause, limit, offset)
    params.extend([limit, offset])

    cursor.execute(query, params)
    rows = cursor.fetchall()

    clinics = []
    for row in rows:
        emails: List[ClinicEmails] = [
            ClinicEmails(
                subject_line=row[f"subject_line_{i}"] or "",
                email_body=row[f"email_body_{i}"] or "",
                type=f"Email {i}",
            )
            for i in range(1, 4)
            if row[f"subject_line_{i}"] or row[f"email_body_{i}"]
        ]

        types_list = [
            t.strip() for t in (row["clinic_sub_type"] or "").split(",") if t.strip()
        ]

        clinics.append(
            Clinic(
                id=row["id"],
                name=row["clinic_name"] or "Clinic Name",
                email=row["email"] or "N/A",
                website_url=row["website_url"] or "N/A",
                type=types_list if types_list else ["Unknown"],
                city=row["city"] or "N/A",
                province=row["province"] or "N/A",
                email_status=(
                    ClinicStatus(row["email_status"])
                    if row["email_status"]
                    else ClinicStatus.NOT_QUEUED
                ),
                total_reviews=row["total_reviews"] or 0,
                average_rating=row["average_rating"] or 0.0,
                lead_score=row["score"] or 0,
                notes=row["website_desc"] or "N/A",
                top_features=row["top_features"] or "",
                emails_for_outreach=emails,
                campaign_batch=row["campaign_batch"] or "",
            )
        )

    conn.close()
    return clinics


def get_not_generated_emails_count() -> int:
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute(
            Queries.not_generated_emails_count(), (ClinicStatus.NOT_GENERATED.value,)
        )
        return cursor.fetchone()[0]
    finally:
        conn.close()


def has_lead_records() -> bool:
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute(Queries.has_lead_records())
    exists = cursor.fetchone() is not None
    conn.close()
    return exists


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
        campaign_batch=campaign_batch,
    )

    total_clinics = get_total_clinics_count()
    not_generated_count = get_not_generated_emails_count()

    filtered_clinics_count = get_total_filtered_clinics_count(
        name=name,
        sub_type=sub_type,
        city=city,
        province=province,
        email_status=email_status,
        campaign_batch=campaign_batch,
    )

    filter_values = get_all_filter_values()

    metrics = [
        Metric(label="Total Clinics", value=total_clinics, desc="Number of clinics")
    ]

    filters: list[Filter] = [
        Filter(
            key="name",
            label="Name",
            values=sorted(filter_values["name"]),
            type="select",
        ),
        Filter(
            key="type",
            label="Type",
            values=sorted(filter_values["type"]),
            type="select",
        ),
        Filter(
            key="city",
            label="City",
            values=sorted(filter_values["city"]),
            type="select",
        ),
        Filter(
            key="campaign_batch",
            label="Campaign Batch ID",
            values=sorted(filter_values["campaign_batch"]),
            type="select",
        ),
        Filter(
            key="province",
            label="Province",
            values=sorted(filter_values["province"]),
            type="select",
        ),
        Filter(
            key="email_status",
            label="Email Status",
            values=[s.value for s in ClinicStatus],
            type="select",
        ),
        Filter(
            key="lead_score", label="Lead Score", values=["Asc", "Desc"], type="sort"
        ),
        Filter(
            key="average_rating",
            label="Average Rating",
            values=["Asc", "Desc"],
            type="sort",
        ),
    ]

    campaign_status = CampaignStatus(
        max_word_limit=120,
        number_of_clinics=10,
        prompt=prompt(),
        contacted_clinics=0,
        total_clinics=total_clinics,
        clinic_percentage=0.0,
    )

    return DashboardResponse(
        clinics_data=clinics,
        metrics=metrics,
        filters=filters,
        campaign_status=campaign_status,
        total_clinics=total_clinics,
        filtered_clinics_count=filtered_clinics_count,
        show_export=has_lead_records(),
        not_generated_emails_count=not_generated_count,
    )
