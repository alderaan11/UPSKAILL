from fastapi import APIRouter

from app.clients.arxiv import fetch_arxiv_papers

router = APIRouter(prefix="/api")


@router.get("/arxiv")
async def get_arxiv():
    papers = await fetch_arxiv_papers()
    return {"papers": papers}
