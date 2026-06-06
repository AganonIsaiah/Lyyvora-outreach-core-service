from typing import Dict, Any
from fastapi import HTTPException
from configs.database import supabase


def get_clinic_by_id(clinic_id: int) -> Dict[str, Any]:
    try:
        resp = (
            supabase.table("leads")
            .select("*")
            .eq("id", clinic_id)
            .maybe_single()
            .execute()
        )
        clinic = resp.data
        if not clinic:
            raise HTTPException(status_code=404, detail="Clinic not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching clinic: {e}")

    smartlead_id = None
    try:
        resp_sl = (
            supabase.table("smartlead")
            .select(
                "id, subject_line_1, email_body_1, "
                "subject_line_2, email_body_2, "
                "subject_line_3, email_body_3"
            )
            .eq("leads_id", clinic_id)
            .maybe_single()
            .execute()
        )
        smartlead_row = resp_sl.data if resp_sl.data else None
    except Exception as e:
        smartlead_row = None

    if smartlead_row:
        smartlead_id = smartlead_row.get("id")
        clinic["emails_for_outreach"] = [
            {
                "type": f"Email {i+1}",
                "subject_line": smartlead_row.get(f"subject_line_{i+1}"),
                "email_body": smartlead_row.get(f"email_body_{i+1}"),
            }
            for i in range(3)
        ]
    else:
        clinic["emails_for_outreach"] = []

    if smartlead_id:
        try:
            resp_sched = (
                supabase.table("scheduled_emails")
                .select(
                    "id, send_1_at, status_1, "
                    "send_2_at, status_2, "
                    "send_3_at, status_3"
                )
                .eq("smartlead_id", smartlead_id)
                .maybe_single()
                .execute()
            )
            clinic["schedule"] = resp_sched.data or {}
        except Exception:
            clinic["schedule"] = {}
    else:
        clinic["schedule"] = {}

    try:
        resp_ls = (
            supabase.table("lead_scores")
            .select("top_features", "score")
            .eq("leads_id", clinic_id)
            .maybe_single()
            .execute()
        )
        lead_scores_row = resp_ls.data

        if lead_scores_row:
            if lead_scores_row.get("top_features"):
                clinic["top_features"] = lead_scores_row["top_features"]
            else:
                clinic["top_features"] = "[]"

            if lead_scores_row.get("score"):
                clinic["lead_score"] = lead_scores_row["score"]
            else:
                clinic["lead_score"] = 0

    except Exception as e:
        clinic["top_features"] = "[]"
        clinic["lead_score"] = 0

    if isinstance(clinic.get("clinic_sub_type"), str):
        clinic["type"] = [s.strip() for s in clinic["clinic_sub_type"].split(",")]
    else:
        clinic["type"] = []

    clinic.setdefault("name", clinic.get("clinic_name") or "Clinic Name")
    clinic.setdefault("notes", clinic.get("website_desc") or "N/A")
    clinic.setdefault("email", clinic.get("email") or "N/A")
    clinic.setdefault("website_url", clinic.get("website_url") or "N/A")
    clinic.setdefault("city", clinic.get("city") or "N/A")
    clinic.setdefault("province", clinic.get("province") or "N/A")
    clinic.setdefault("total_reviews", clinic.get("total_reviews") or "N/A")
    clinic.setdefault("average_rating", clinic.get("average_rating") or "N/A")
    clinic.setdefault("email_status", clinic.get("email_status") or "N/A")
    clinic.setdefault("phone", clinic.get("phone") or "N/A")

    return clinic
