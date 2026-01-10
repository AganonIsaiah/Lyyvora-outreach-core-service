from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from .models.dashboard_models import DashboardRequest, DashboardResponse
from .services.dashboard_service import generate_dashboard

app = FastAPI(title="Lyyvora Outreach API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(
    limit: int = Query(25, ge=1, le=100),
    page: int = Query(1, ge=1),
    name: Optional[List[str]] = Query(None),
    sub_type: Optional[List[str]] = Query(None),
    city: Optional[List[str]] = Query(None),
    province: Optional[List[str]] = Query(None),
    status: Optional[List[str]] = Query(None),
    sort_by: Optional[str] = Query(None, regex="^(status|lead_score|average_rating)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$")
):
    req = DashboardRequest(
        limit=limit,
        page=page,
        name=name,
        sub_type=sub_type,
        city=city,
        province=province,
        status=status,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    return generate_dashboard(req)