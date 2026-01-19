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
from configs.types import ClinicStatus
from configs.prompt_templates import prompt
from configs.database import supabase

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


def get_total_clinics_count() -> int:
    resp = supabase.table("leads").select("id", count="exact").execute()
    return resp.count or 0


def get_not_generated_emails_count() -> int:
    resp = (
        supabase.table("leads")
        .select("id", count="exact")
        .eq("email_status", ClinicStatus.NOT_GENERATED.value)
        .execute()
    )
    return resp.count or 0


def has_lead_records() -> bool:
    resp = supabase.table("leads").select("id").limit(1).execute()
    return bool(resp.data)


def get_all_filter_values():
    """Fetch unique filter values from Supabase"""
    names = supabase.table("leads").select("clinic_name").execute().data
    cities = supabase.table("leads").select("city").execute().data
    provinces = supabase.table("leads").select("province").execute().data
    types = supabase.table("leads").select("clinic_sub_type").execute().data
    campaign_batches = (
        supabase.table("smartlead").select("campaign_batch").execute().data
    )

    type_set = set()
    for t in types:
        val = t.get("clinic_sub_type")
        if val:
            for subtype in val.split(","):
                type_set.add(subtype.strip())

    return {
        "name": set([r["clinic_name"] for r in names if r.get("clinic_name")]),
        "city": set([r["city"] for r in cities if r.get("city")]),
        "province": set([r["province"] for r in provinces if r.get("province")]),
        "type": set(type_set),
        "campaign_batch": set(
            [r["campaign_batch"] for r in campaign_batches if r.get("campaign_batch")]
        ),
    }


def build_filters(
    query,
    name: Optional[List[str]] = None,
    city: Optional[List[str]] = None,
    province: Optional[List[str]] = None,
    sub_type: Optional[List[str]] = None,
    email_status: Optional[List[ClinicStatus]] = None,
    campaign_batch: Optional[List[str]] = None,
):
    """Apply filters to Supabase query"""
    # OR filters for name, city, sub_type
    or_clauses = []

    if name:
        or_clauses.extend([f"clinic_name.ilike.%{n}%" for n in name])
    if city:
        or_clauses.extend([f"city.ilike.%{c}%" for c in city])
    if sub_type:
        or_clauses.extend([f"clinic_sub_type.ilike.%{st}%" for st in sub_type])

    if or_clauses:
        # Supabase expects 'or' as comma-separated string of conditions
        query = query.or_(",".join(or_clauses))

    # AND filters
    if province:
        for p in province:
            query = query.ilike("province", f"%{p}%")
    if email_status:
        query = query.in_("email_status", [s.value for s in email_status])
    if campaign_batch and len(campaign_batch) > 0:
        # Only the first value counts for campaign_batch
        query = query.eq("smartlead.campaign_batch", campaign_batch[0])

    return query


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
    # --- Fetch all filtered records first (for correct global sorting) ---
    query = supabase.table("leads").select(
        """
        id,
        clinic_name,
        clinic_sub_type,
        city,
        province,
        email,
        website_url,
        website_desc,
        total_reviews,
        average_rating,
        email_status,
        lead_scores(score, top_features),
        "smartlead"!left(
            campaign_batch,
            subject_line_1,
            email_body_1,
            subject_line_2,
            email_body_2,
            subject_line_3,
            email_body_3
        )
        """
    )

    query = build_filters(
        query, name, city, province, sub_type, email_status, campaign_batch
    )
    clinics_data = query.execute().data or []

    # --- Sort globally ---
    def get_lead_score(c):
        scores = c.get("lead_scores") or []
        return scores[0].get("score") if scores else 0

    def get_email_status_priority(c):
        return STATUS_PRIORITY.get(ClinicStatus(c.get("email_status")), 0)

    reverse = sort_order.lower() != "asc"
    if sort_by == "lead_score" or sort_by is None:
        clinics_data.sort(key=get_lead_score, reverse=reverse)
    elif sort_by == "average_rating":
        clinics_data.sort(key=lambda c: c.get("average_rating") or 0, reverse=reverse)
    elif sort_by == "email_status":
        clinics_data.sort(key=get_email_status_priority, reverse=reverse)

    # --- Paginate manually ---
    paginated_data = clinics_data[offset : offset + limit]

    # --- Map to Clinic objects ---
    result = []
    for row in paginated_data:
        lead_scores_list = row.get("lead_scores") or []
        lead_score_data = lead_scores_list[0] if lead_scores_list else {}

        smartlead_list = row.get("smartlead") or []
        smartlead = smartlead_list[0] if smartlead_list else {}

        emails: List[ClinicEmails] = [
            ClinicEmails(
                subject_line=smartlead.get(f"subject_line_{i}") or "",
                email_body=smartlead.get(f"email_body_{i}") or "",
                type=f"Email {i}",
            )
            for i in range(1, 4)
            if smartlead.get(f"subject_line_{i}") or smartlead.get(f"email_body_{i}")
        ]

        types_list = [
            t.strip()
            for t in (row.get("clinic_sub_type") or "").split(",")
            if t.strip()
        ]

        result.append(
            Clinic(
                id=row["id"],
                name=row.get("clinic_name") or "Clinic Name",
                email=row.get("email") or "N/A",
                website_url=row.get("website_url") or "N/A",
                type=types_list if types_list else ["Unknown"],
                city=row.get("city") or "N/A",
                province=row.get("province") or "N/A",
                email_status=ClinicStatus(row.get("email_status"))
                if row.get("email_status")
                else ClinicStatus.NOT_QUEUED,
                total_reviews=row.get("total_reviews") or 0,
                average_rating=row.get("average_rating") or 0.0,
                lead_score=lead_score_data.get("score") or 0,
                notes=row.get("website_desc") or "N/A",
                top_features=lead_score_data.get("top_features") or "",
                emails_for_outreach=emails,
                campaign_batch=smartlead.get("campaign_batch") or "",
            )
        )
    return result


def get_total_filtered_clinics_count(
    name: Optional[List[str]] = None,
    sub_type: Optional[List[str]] = None,
    city: Optional[List[str]] = None,
    province: Optional[List[str]] = None,
    email_status: Optional[List[ClinicStatus]] = None,
    campaign_batch: Optional[List[str]] = None,
) -> int:
    query = supabase.table("leads").select("id", count="exact")
    query = build_filters(
        query, name, city, province, sub_type, email_status, campaign_batch
    )
    resp = query.execute()
    return resp.count or 0


def generate_dashboard(req: DashboardRequest):
    offset = (req.page - 1) * req.limit

    name = parse_comma_separated(req.name)
    sub_type = parse_comma_separated(req.sub_type)
    city = parse_comma_separated(req.city)
    province = parse_comma_separated(req.province)
    campaign_batch = parse_comma_separated(req.campaign_batch)
    email_status = parse_comma_separated(req.email_status)
    email_status = [ClinicStatus(s) for s in email_status] if email_status else None

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
    filtered_clinics_count = get_total_filtered_clinics_count(
        name=name,
        sub_type=sub_type,
        city=city,
        province=province,
        email_status=email_status,
        campaign_batch=campaign_batch,
    )
    not_generated_count = get_not_generated_emails_count()
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
