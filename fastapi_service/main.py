from fastapi import FastAPI, Query, UploadFile, File, WebSocket, WebSocketDisconnect, BackgroundTasks, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from typing import List, Optional, Dict, Any
import uuid 
import csv
import sqlite3
from io import StringIO

from .models.dashboard_models import DashboardRequest, DashboardResponse
from .services.dashboard_service import generate_dashboard
from .services.import_service import process_uploaded_csv, drop_all_tables
from .services.ws_manager import manager
from .services.outreach_service import run_outreach_job
from .services.append_service import append_csv_to_leads
from shared.configs import DB_FILE

app = FastAPI(title="Lyyvora Outreach API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "Welcome"}

@app.get("/clinics/{clinic_id}")
def get_clinic(clinic_id: int) -> Dict[str, Any]:
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("""
        SELECT l.*, COALESCE(ls.score, 0) AS lead_score, ls.top_features, ls.explanation
        FROM leads l
        LEFT JOIN lead_scores ls
        ON l.id = ls.leads_id AND ls.model_version = 'rules_v1'
        WHERE l.id = ?
    """, (clinic_id,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Clinic not found")

    clinic = dict(row)
    cursor.execute("""
        SELECT 
            subject_line_1, email_body_1,
            subject_line_2, email_body_2,
            subject_line_3, email_body_3
        FROM smartlead
        WHERE leads_id = ?
        LIMIT 1
    """, (clinic_id,))
    smartlead_row = cursor.fetchone()
    conn.close()

    if smartlead_row:
        clinic["emails_for_outreach"] = [
            {
                "type": "Email 1",
                "subject_line": smartlead_row["subject_line_1"],
                "email_body": smartlead_row["email_body_1"]
            },
            {
                "type": "Email 2",
                "subject_line": smartlead_row["subject_line_2"],
                "email_body": smartlead_row["email_body_2"]
            },
            {
                "type": "Email 3",
                "subject_line": smartlead_row["subject_line_3"],
                "email_body": smartlead_row["email_body_3"]
            }
        ]
    else:
        clinic["emails_for_outreach"] = []

    if isinstance(clinic.get("clinic_sub_type"), str):
        clinic["type"] = [s.strip() for s in clinic["clinic_sub_type"].split(",")]
    else:
        clinic["type"] = []

    clinic["name"] = clinic.get("clinic_name") or "Clinic Name"
    clinic["lead_score"] = clinic.get("lead_score") or 0
    clinic["notes"] = clinic.get("website_desc") or "N/A"
    clinic["email"] = clinic.get("email") or "N/A"
    clinic["website_url"] = clinic.get("website_url") or "N/A"
    clinic["city"] = clinic.get("city") or "N/A"
    clinic["province"] = clinic.get("province") or "N/A"
    clinic["total_reviews"] = clinic.get("total_reviews") or "N/A"
    clinic["average_rating"] = clinic.get("average_rating") or "N/A"
    clinic["email_status"] = clinic.get("email_status") or "N/A"

    return clinic


@app.post("/append-leads")
async def append_leads(file: UploadFile = File(...)):
    try:
        res = append_csv_to_leads(file)
        return res 
    except Exception as e:
        raise HTTPException(status_code=500, detail=(e))

@app.get("/export-smartlead-csv")
def export_smartlead_csv():
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT clinic_name, email, subject_line_1, email_body_1,
                   subject_line_2, email_body_2, subject_line_3, email_body_3,
                   clinic_type, city, province
            FROM smartlead
        """)
        rows = cursor.fetchall()

        header = [
            "clinic_name", "email", "subject_line_1", "email_body_1",
            "subject_line_2", "email_body_2", "subject_line_3", "email_body_3",
            "clinic_type", "city", "province"
        ]

        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(header)
        writer.writerows(rows)
        output.seek(0)

        return StreamingResponse(
            output,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=smartlead_ready.csv"}
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/drop-tables")
def drop_tables():
  try:
    drop_all_tables()
    return {"status": "success", "message": "All tables dropped successfully."}
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws/outreach/{job_id}")
async def outreach_ws(websocket: WebSocket, job_id: str):
    await manager.connect(job_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(job_id)

@app.post("/generate-outreach")
def generate_outreach(
    background_tasks: BackgroundTasks,
    payload: dict = Body(...)
):
    email_batch_size = payload.get("email_batch_size", 1)
    prompt = payload.get("prompt")
    email_word_limit = payload.get("email_word_limit", 120)

    job_id = str(uuid.uuid4())

    background_tasks.add_task(
        run_outreach_job,
        job_id,
        email_batch_size,
        prompt,
        email_word_limit
    )

    return {
        "job_id": job_id,
        "ws_url": f"/ws/outreach/{job_id}"
    }


@app.post("/import-csv")
async def import_csv(file: UploadFile = File(...)):
    res = process_uploaded_csv(file)
    return res

@app.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(
    limit: int = Query(1, ge=1, le=100),
    page: int = Query(1, ge=1),
    name: Optional[List[str]] = Query(None),
    sub_type: Optional[List[str]] = Query(None),
    city: Optional[List[str]] = Query(None),
    province: Optional[List[str]] = Query(None),
    email_status: Optional[List[str]] = Query(None),
    sort_by: Optional[str] = Query(None, regex="^(email_status|lead_score|average_rating)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$")
):
    req = DashboardRequest(
        limit=limit,
        page=page,
        name=name,
        sub_type=sub_type,
        city=city,
        province=province,
        email_status=email_status,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    try:
        return generate_dashboard(req)
    except sqlite3.Error:
        print("SQLite error:", e)

        return DashboardResponse(
            clinics_data=[],
            filters=[],
            campaign_status={},
            metrics=[],
            show_export=False,
            total_clinics=0,
            filtered_clinics_count=0
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))