import asyncio
import re

import feedparser

from app.schemas.news import RedditPost

SUBREDDITS = ["MachineLearning", "artificial", "agenticai"]


async def _fetch_subreddit(subreddit: str) -> list[RedditPost]:
    url = f"https://www.reddit.com/r/{subreddit}/new.rss?limit=10"
    loop = asyncio.get_event_loop()
    feed = await loop.run_in_executor(None, feedparser.parse, url)
    posts = []
    for entry in feed.entries or []:
        link = entry.get("link", "")
        id_match = re.search(r"comments/([a-z0-9]+)/", link, re.I)
        post_id = id_match.group(1) if id_match else entry.get("id", link)
        posts.append(
            RedditPost(
                id=post_id,
                title=(entry.get("title", "") or "").replace("  ", " ").strip(),
                snippet=(entry.get("summary", "") or "")[:280].strip(),
                url=link,
                permalink=link,
                author=f"u/{entry.get('author', 'unknown')}",
                subreddit=f"r/{subreddit}",
                score=0,
                published_at=entry.get("published", entry.get("updated", "")),
            )
        )
    return posts


async def fetch_reddit_posts() -> list[RedditPost]:
    results = await asyncio.gather(
        *[_fetch_subreddit(s) for s in SUBREDDITS],
        return_exceptions=True,
    )
    posts: list[RedditPost] = []
    for r in results:
        if isinstance(r, list):
            posts.extend(r)
    return sorted(posts, key=lambda x: x.published_at, reverse=True)
