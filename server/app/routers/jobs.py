from fastapi import APIRouter, Query

from app.services import jobs_service

router = APIRouter(prefix="/api")


@router.get("/jobs")
async def get_jobs():
    jobs = await jobs_service.get_jobs()
    return {"jobs": jobs}


@router.get("/lbb")
async def get_lbb(
    lat: float = Query(48.8566),
    lon: float = Query(2.3522),
    distance: int = Query(30),
):
    companies = await jobs_service.get_lbb_companies(lat, lon, distance)
    return {"companies": companies}
