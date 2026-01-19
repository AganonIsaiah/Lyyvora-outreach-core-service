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
from typing import List, Optional, Dict, Any
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

from configs.database import supabase
from .models.dashboard_models import DashboardRequest, DashboardResponse

app = FastAPI(title="Lyyvora Outreach API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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


@app.get("/me")
def me(user: str = Depends(get_current_user)):
    return {"username": user}


@app.post("/login")
def login(response: Response, form_data: OAuth2PasswordRequestForm = Depends()):
    if not authenticate_user(form_data.username, form_data.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": form_data.username})

    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=60 * 60,
    )

    return {"message": "Login successful"}


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

        if isinstance(resp.data, dict) and "code" in resp.data:
            raise HTTPException(
                status_code=500,
                detail=resp.data.get("message", "Unknown Supabase error"),
            )

        rows = resp.data

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

    return {"job_id": job_id, "ws_url": f"/ws/outreach/{job_id}", "token": token}


@app.post("/import-csv")
async def import_csv(
    file: UploadFile = File(...), user: str = Depends(get_current_user)
):
    res = process_uploaded_csv(file)
    return res


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
        import traceback

        print("Full error traceback:")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {str(e)}")
