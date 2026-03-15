from fastapi import APIRouter

from app.clients.github_releases import fetch_package_releases

router = APIRouter(prefix="/api")


@router.get("/releases")
async def get_releases():
    releases = await fetch_package_releases()
    return {"releases": releases}
