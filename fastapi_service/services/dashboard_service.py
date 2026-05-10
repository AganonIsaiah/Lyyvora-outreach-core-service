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
from datetime import datetime

STATUS_PRIORITY = {
    ClinicStatus.REPLIED: 4,
    ClinicStatus.EXPORTED: 3,
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


def get_sent_count() -> int:
    resp = (
        supabase.table("scheduled_emails")
        .select("id", count="exact")
        .or_("status_1.eq.sent,status_2.eq.sent,status_3.eq.sent")
        .execute()
    )
    return resp.count or 0


def get_replied_count() -> int:
    resp = (
        supabase.table("leads")
        .select("id", count="exact")
        .eq("email_status", "Replied")
        .execute()
    )
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

    def batch_datetime(batch_str):
        try:
            ts_str = batch_str.split("_", 1)[1]
            return datetime.fromisoformat(ts_str)
        except Exception:
            return datetime.min

    unique_batches = {
        r["campaign_batch"] for r in campaign_batches if r.get("campaign_batch")
    }

    sorted_batches = sorted(unique_batches, key=batch_datetime, reverse=False)

    return {
        "name": set([r["clinic_name"] for r in names if r.get("clinic_name")]),
        "city": set([r["city"] for r in cities if r.get("city")]),
        "province": set([r["province"] for r in provinces if r.get("province")]),
        "type": set(type_set),
        "campaign_batch": sorted_batches,
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
    or_clauses = []

    if name:
        or_clauses.extend([f"clinic_name.ilike.%{n}%" for n in name])
    if city:
        or_clauses.extend([f"city.ilike.%{c}%" for c in city])
    if sub_type:
        or_clauses.extend([f"clinic_sub_type.ilike.%{st}%" for st in sub_type])

    if or_clauses:
        query = query.or_(",".join(or_clauses))

    if province:
        for p in province:
            query = query.ilike("province", f"%{p}%")
    if email_status:
        query = query.in_("email_status", [s.value for s in email_status])

    if campaign_batch and len(campaign_batch) > 0:
        matching_ids = []

        for batch_value in campaign_batch:
            ids = [
                r["leads_id"]
                for r in supabase.table("smartlead")
                .select("leads_id")
                .eq("campaign_batch", batch_value)
                .execute()
                .data
            ]
            matching_ids.extend(ids)

        matching_ids = list(set(matching_ids))

        if matching_ids:
            query = query.in_("id", matching_ids)
        else:
            query = query.eq("id", -1)

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

    def get_lead_score(c):
        scores = c.get("lead_scores") or []
        return scores[0].get("score") if scores else 0

    def get_email_status_priority(c):
        return STATUS_PRIORITY.get(ClinicStatus(c.get("email_status")), 0)

    reverse = sort_order.lower() != "asc"
    if sort_by == "lead_score" or sort_by is None:
        clinics_data.sort(
            key=lambda c: (get_lead_score(c), get_email_status_priority(c)),
            reverse=True,
        )
    elif sort_by == "average_rating":
        clinics_data.sort(key=lambda c: c.get("average_rating") or 0, reverse=reverse)
    elif sort_by == "email_status":
        clinics_data.sort(key=get_email_status_priority, reverse=reverse)

    paginated_data = clinics_data[offset : offset + limit]

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
    sent_count = get_sent_count()
    replied_count = get_replied_count()
    filter_values = get_all_filter_values()

    metrics = [
        Metric(label="Total Clinics", value=total_clinics, desc="Number of clinics")
    ]

    filters: list[Filter] = [
        Filter(
            key="campaign_batch",
            label="Campaign Batch ID",
            values=sorted(filter_values["campaign_batch"], reverse=True),
            type="select",
        ),
        Filter(
            key="email_status",
            label="Email Status",
            values=[
                ClinicStatus.REPLIED.value,
                ClinicStatus.EXPORTED.value,
                ClinicStatus.GENERATED.value,
                ClinicStatus.NOT_GENERATED.value,
            ],
            type="select",
        ),
    ]

    campaign_status = CampaignStatus(
        max_word_limit=75,
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
        sent_count=sent_count,
        replied_count=replied_count,
    )
