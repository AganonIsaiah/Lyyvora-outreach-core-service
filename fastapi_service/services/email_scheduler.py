from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timezone
from configs.database import supabase
from configs.types import ClinicStatus
from .email_service import send_email

scheduler = BackgroundScheduler()


def process_pending_emails():
    now = datetime.now(timezone.utc).isoformat()

    res = (
        supabase.table("scheduled_emails")
        .select(
            "*, smartlead(leads_id, email, subject_line_1, email_body_1, subject_line_2, email_body_2, subject_line_3, email_body_3)"
        )
        .or_("status_1.eq.pending,status_2.eq.pending,status_3.eq.pending")
        .execute()
    )

    for row in res.data or []:
        sl = row.get("smartlead") or {}
        recipient = sl.get("email")

        if not recipient:
            continue

        for i in (1, 2, 3):
            send_at = row.get(f"send_{i}_at")
            status = row.get(f"status_{i}")

            if not send_at or status != "pending" or send_at > now:
                continue

            try:
                send_email(
                    recipient=recipient,
                    subject=sl.get(f"subject_line_{i}"),
                    body_html=sl.get(f"email_body_{i}"),
                )
                supabase.table("scheduled_emails").update(
                    {
                        f"status_{i}": "sent",
                        f"sent_{i}_at": datetime.now(timezone.utc).isoformat(),
                    }
                ).eq("id", row["id"]).execute()

                statuses = {
                    1: row.get("status_1"),
                    2: row.get("status_2"),
                    3: row.get("status_3"),
                }
                statuses[i] = "sent"
                if all(s == "sent" for s in statuses.values()):
                    lead_id = sl.get("leads_id")
                    if lead_id:
                        lead_res = (
                            supabase.table("leads")
                            .select("email_status")
                            .eq("id", lead_id)
                            .maybe_single()
                            .execute()
                        )
                        if lead_res.data and lead_res.data.get("email_status") != ClinicStatus.REPLIED.value:
                            supabase.table("leads").update(
                                {"email_status": ClinicStatus.NO_RESPONSE.value}
                            ).eq("id", lead_id).execute()

            except Exception as e:
                supabase.table("scheduled_emails").update(
                    {
                        f"status_{i}": "failed",
                        f"error_{i}": str(e),
                    }
                ).eq("id", row["id"]).execute()


def start_scheduler():
    scheduler.add_job(
        process_pending_emails, "interval", minutes=1, id="email_scheduler"
    )
    scheduler.start()


def stop_scheduler():
    scheduler.shutdown(wait=False)
