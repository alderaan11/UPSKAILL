import asyncio

import feedparser

from app.schemas.news import FeedItem

AI_RSS_FEEDS = [
    {"url": "https://blog.openai.com/rss/", "source": "OpenAI Blog"},
    {"url": "https://www.anthropic.com/rss.xml", "source": "Anthropic Blog"},
    {"url": "https://blog.google/technology/ai/rss/", "source": "Google AI Blog"},
    {"url": "https://huggingface.co/blog/feed.xml", "source": "Hugging Face"},
    {"url": "https://ai.meta.com/blog/rss/", "source": "Meta AI"},
    {"url": "https://mistral.ai/feed.xml", "source": "Mistral AI"},
]


async def _fetch_feed(url: str, source: str) -> list[FeedItem]:
    loop = asyncio.get_event_loop()
    feed = await loop.run_in_executor(None, feedparser.parse, url)
    items = []
    for entry in (feed.entries or [])[:10]:
        items.append(
            FeedItem(
                title=entry.get("title", "Untitled"),
                link=entry.get("link", ""),
                pub_date=entry.get("published", entry.get("updated", "")),
                source=source,
                snippet=(entry.get("summary", "") or "")[:200],
            )
        )
    return items


async def fetch_all_feeds() -> list[FeedItem]:
    results = await asyncio.gather(
        *[_fetch_feed(f["url"], f["source"]) for f in AI_RSS_FEEDS],
        return_exceptions=True,
    )
    items: list[FeedItem] = []
    for r in results:
        if isinstance(r, list):
            items.extend(r)
    return sorted(items, key=lambda x: x.pub_date, reverse=True)
