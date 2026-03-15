import httpx

from app.schemas.news import PolymarketEvent

AI_KEYWORDS = [
    "ai", "artificial intelligence", "gpt", "claude", "gemini", "llm",
    "openai", "anthropic", "deepmind", "chatgpt", "machine learning",
    "neural", "model", "agi", "robot", "autonomous", "deep learning",
]


async def fetch_ai_polymarket_events() -> list[PolymarketEvent]:
    url = "https://gamma-api.polymarket.com/events?tag=ai&limit=10&active=true&closed=false"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            res = await client.get(url)
        if not res.is_success:
            return []
        events = res.json() or []
        return [
            PolymarketEvent(
                id=str(e.get("id", "")),
                title=e.get("title", ""),
                outcomes=e.get("outcomes") or [],
                outcome_prices=e.get("outcomePrices") or [],
                volume=float(e.get("volume") or 0),
            )
            for e in events
            if any(kw in (e.get("title") or "").lower() for kw in AI_KEYWORDS)
        ]
    except Exception:
        return []
