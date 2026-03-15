from fastapi import APIRouter

from app.services import news_service

router = APIRouter(prefix="/api")


@router.get("/news")
async def get_news():
    return await news_service.get_news()
