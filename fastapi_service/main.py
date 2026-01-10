from fastapi import FastAPI, Query, UploadFile, File, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import uuid 

from .models.dashboard_models import DashboardRequest, DashboardResponse
from core.outreach_generator.outreach_generator import run_email_generation

from .services.dashboard_service import generate_dashboard
from .services.import_service import process_uploaded_csv
from .services.ws_manager import manager
from .services.outreach_service import run_outreach_job


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
    email_batch_size: int = Query(1, ge=1, le=50),
    prompt: str | None = Query(None),
    email_word_limit: int = Query(120, ge=20, le=500)
):
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
    
    return generate_dashboard(req)