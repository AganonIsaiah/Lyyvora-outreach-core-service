from fastapi import (
    FastAPI,
    Query,
    UploadFile,
    File,
    WebSocket,
    WebSocketDisconnect,
    BackgroundTasks,
    HTTPException,
    Body,
    Depends,
    Cookie,
    Response,
    Request,
)
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from contextlib import asynccontextmanager
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid
import csv
from io import StringIO

from .services.dashboard_service import generate_dashboard
from .services.import_service import process_uploaded_csv, drop_all_tables_supabase
from .services.ws_manager import manager
from .services.outreach_service import run_outreach_job
from .services.append_service import append_csv_to_leads
from .services.clinic_service import get_clinic_by_id
from .services.auth_service import (
    authenticate_user,
    create_access_token,
    decode_access_token,
)
from .services.email_scheduler import start_scheduler, stop_scheduler
from .services.email_service import send_email

from configs.database import supabase
from configs.configs import FRONTEND_URL
from .models.dashboard_models import DashboardRequest, DashboardResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    yield
    stop_scheduler()


app = FastAPI(title="Lyyvora Outreach API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_current_user(access_token: str = Cookie(None)):
    if not access_token:
        raise HTTPException(status_code=401, detail="Missing access token")
    payload = decode_access_token(access_token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload["sub"]


@app.get("/")
def home():
    return {"message": "Welcome"}


@app.post("/login")
def login(response: Response, form_data: OAuth2PasswordRequestForm = Depends()):
    if not authenticate_user(form_data.username, form_data.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": form_data.username})

    is_local = FRONTEND_URL.startswith("http://localhost")

    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax" if is_local else "none",
        secure=not is_local,
        max_age=60 * 60 * 8,
    )

    return {"message": "Login successful"}


@app.patch("/clinics/{clinic_id}/mark-replied")
def mark_replied(clinic_id: int, user: str = Depends(get_current_user)):
    res = supabase.table("leads").select("id").eq("id", clinic_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Clinic not found")

    supabase.table("leads").update({"email_status": "Replied"}).eq(
        "id", clinic_id
    ).execute()

    sl_res = (
        supabase.table("smartlead").select("id").eq("leads_id", clinic_id).execute()
    )
    if sl_res.data:
        smartlead_id = sl_res.data[0]["id"]
        se_res = (
            supabase.table("scheduled_emails")
            .select("id, status_1, status_2, status_3")
            .eq("smartlead_id", smartlead_id)
            .execute()
        )
        for row in se_res.data or []:
            updates = {
                f"status_{i}": "cancelled"
                for i in (1, 2, 3)
                if row.get(f"status_{i}") == "pending"
            }
            if updates:
                supabase.table("scheduled_emails").update(updates).eq(
                    "id", row["id"]
                ).execute()

    return {"message": "Status updated to Replied"}


@app.get("/clinics/{clinic_id}")
def get_clinic(clinic_id: int, user: str = Depends(get_current_user)) -> Dict[str, Any]:
    return get_clinic_by_id(clinic_id)


@app.post("/append-leads")
async def append_leads(
    file: UploadFile = File(...), user: str = Depends(get_current_user)
):
    try:
        res = append_csv_to_leads(file)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=(e))


@app.get("/export-smartlead-csv")
def export_smartlead_csv(
    campaign_batch: Optional[str] = Query(None), user: str = Depends(get_current_user)
):
    columns = [
        "clinic_name",
        "email",
        "subject_line_1",
        "email_body_1",
        "subject_line_2",
        "email_body_2",
        "subject_line_3",
        "email_body_3",
        "clinic_type",
        "city",
        "province",
    ]

    try:
        query = supabase.table("smartlead").select(",".join(columns))
        if campaign_batch:
            query = query.eq("campaign_batch", campaign_batch)

        resp = query.execute()
        rows = resp.data

        if campaign_batch:
            lead_ids_resp = (
                supabase.table("smartlead")
                .select("leads_id")
                .eq("campaign_batch", campaign_batch)
                .execute()
            )

            lead_ids = [r["leads_id"] for r in lead_ids_resp.data or []]

            if lead_ids:
                supabase.table("leads").update({"email_status": "Exported"}).in_(
                    "id", lead_ids
                ).execute()

        def row_generator(rows, header):
            output = StringIO()
            writer = csv.DictWriter(output, fieldnames=header)
            writer.writeheader()
            yield output.getvalue()
            output.seek(0)
            output.truncate(0)

            for row in rows:
                writer.writerow({k: row.get(k, "") for k in header})
                yield output.getvalue()
                output.seek(0)
                output.truncate(0)

        return StreamingResponse(
            row_generator(rows, columns),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=smartlead_ready.csv"},
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/drop-tables")
def drop_tables(user: str = Depends(get_current_user)):
    try:
        drop_all_tables_supabase()
        return {"status": "success", "message": "All tables dropped successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.websocket("/ws/outreach/{job_id}")
async def outreach_ws(websocket: WebSocket, job_id: str):
    token = websocket.query_params.get("token")
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        await websocket.close(code=1008)
        return

    await manager.connect(job_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(job_id)


@app.post("/generate-outreach")
def generate_outreach(
    request: Request,
    background_tasks: BackgroundTasks,
    payload: dict = Body(...),
    user: str = Depends(get_current_user),
):
    email_batch_size = payload.get("email_batch_size", 1)
    prompt = payload.get("prompt")
    email_word_limit = payload.get("email_word_limit", 120)

    job_id = str(uuid.uuid4())
    token = request.cookies.get("access_token")

    background_tasks.add_task(
        run_outreach_job, job_id, email_batch_size, prompt, email_word_limit
    )

    return {
        "job_id": job_id,
        "ws_url": f"wss://{FRONTEND_URL}/ws/outreach/{job_id}",
        "token": token,
    }


@app.post("/import-csv")
async def import_csv(
    file: UploadFile = File(...), user: str = Depends(get_current_user)
):
    res = process_uploaded_csv(file)
    return res


@app.post("/emails/schedule")
def schedule_email(payload: dict = Body(...), user: str = Depends(get_current_user)):
    smartlead_id = payload.get("smartlead_id")
    if not smartlead_id:
        raise HTTPException(status_code=400, detail="smartlead_id is required")

    res = (
        supabase.table("scheduled_emails")
        .insert(
            {
                "smartlead_id": smartlead_id,
                "send_1_at": payload.get("send_1_at"),
                "send_2_at": payload.get("send_2_at"),
                "send_3_at": payload.get("send_3_at"),
            }
        )
        .execute()
    )

    return {"message": "Emails scheduled", "id": res.data[0]["id"]}


@app.get("/emails")
def list_emails(user: str = Depends(get_current_user)):
    res = (
        supabase.table("scheduled_emails")
        .select(
            "*, smartlead(clinic_name, email, subject_line_1, subject_line_2, subject_line_3)"
        )
        .order("created_at", desc=True)
        .execute()
    )
    return res.data


@app.patch("/emails/schedule/{schedule_id}")
def update_schedule(
    schedule_id: str,
    payload: dict = Body(...),
    user: str = Depends(get_current_user),
):
    now = datetime.now(timezone.utc).isoformat()
    updates = {}
    for i in (1, 2, 3):
        key = f"send_{i}_at"
        if key in payload:
            if payload[key] < now:
                raise HTTPException(
                    status_code=400, detail=f"{key} cannot be in the past"
                )
            updates[key] = payload[key]

    if not updates:
        raise HTTPException(status_code=400, detail="No valid fields to update")

    supabase.table("scheduled_emails").update(updates).eq("id", schedule_id).execute()
    return {"message": "Schedule updated"}


@app.post("/emails/send-now/{schedule_id}/{sequence}")
def send_email_now(
    schedule_id: str,
    sequence: int,
    user: str = Depends(get_current_user),
):
    if sequence not in (1, 2, 3):
        raise HTTPException(status_code=400, detail="Sequence must be 1, 2, or 3")

    res = (
        supabase.table("scheduled_emails")
        .select(f"*, smartlead(email, subject_line_{sequence}, email_body_{sequence})")
        .eq("id", schedule_id)
        .maybe_single()
        .execute()
    )

    if not res.data:
        raise HTTPException(status_code=404, detail="Schedule not found")

    sl = res.data.get("smartlead") or {}

    try:
        send_email(
            recipient=sl.get("email"),
            subject=sl.get(f"subject_line_{sequence}"),
            body_html=sl.get(f"email_body_{sequence}"),
        )
        now_iso = datetime.now(timezone.utc).isoformat()
        supabase.table("scheduled_emails").update(
            {
                f"status_{sequence}": "sent",
                f"sent_{sequence}_at": now_iso,
                f"send_{sequence}_at": now_iso,
            }
        ).eq("id", schedule_id).execute()
    except Exception as e:
        supabase.table("scheduled_emails").update(
            {f"status_{sequence}": "failed", f"error_{sequence}": str(e)}
        ).eq("id", schedule_id).execute()
        raise HTTPException(status_code=500, detail=str(e))

    return {"message": f"Email {sequence} sent"}


@app.delete("/emails/{email_id}")
def cancel_email(email_id: str, user: str = Depends(get_current_user)):
    res = (
        supabase.table("scheduled_emails")
        .select("id, status_1, status_2, status_3")
        .eq("id", email_id)
        .execute()
    )

    if not res.data:
        raise HTTPException(status_code=404, detail="Schedule not found")

    row = res.data[0]
    updates = {
        f"status_{i}": "cancelled"
        for i in (1, 2, 3)
        if row.get(f"status_{i}") == "pending"
    }

    if not updates:
        raise HTTPException(status_code=400, detail="No pending emails to cancel")

    supabase.table("scheduled_emails").update(updates).eq("id", email_id).execute()
    return {"message": "Pending emails cancelled"}


@app.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(
    user: str = Depends(get_current_user),
    limit: int = Query(25, ge=1, le=100),
    page: int = Query(1, ge=1),
    name: Optional[List[str]] = Query(None),
    sub_type: Optional[List[str]] = Query(None),
    city: Optional[List[str]] = Query(None),
    province: Optional[List[str]] = Query(None),
    email_status: Optional[List[str]] = Query(None),
    campaign_batch: Optional[List[str]] = Query(None),
    sort_by: Optional[str] = Query(
        None, regex="^(email_status|lead_score|average_rating)$"
    ),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
):
    req = DashboardRequest(
        limit=limit,
        page=page,
        name=name,
        sub_type=sub_type,
        city=city,
        province=province,
        email_status=email_status,
        campaign_batch=campaign_batch,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    try:
        result = generate_dashboard(req)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {str(e)}")
