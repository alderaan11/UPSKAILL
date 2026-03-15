import httpx

from app.config import settings
from app.schemas.news import NewsArticle


async def fetch_ai_news() -> list[NewsArticle]:
    if not settings.newsapi_key:
        return []

    url = (
        "https://newsapi.org/v2/everything"
        "?q=artificial+intelligence+OR+LLM+OR+GPT+OR+Claude+OR+machine+learning"
        "&language=en&sortBy=publishedAt&pageSize=10"
    )
    async with httpx.AsyncClient(timeout=10) as client:
        res = await client.get(url, headers={"X-Api-Key": settings.newsapi_key})
    if not res.is_success:
        return []

    articles = res.json().get("articles") or []
    return [
        NewsArticle(
            title=a.get("title", ""),
            description=a.get("description", ""),   
            url=a.get("url", ""),
            source=(a.get("source") or {}).get("name", "Unknown"),
            published_at=a.get("publishedAt", ""),
            image_url=a.get("urlToImage"),
        )
        for a in articles
    ]
