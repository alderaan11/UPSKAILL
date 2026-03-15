import asyncio

import feedparser

from app.schemas.news import PackageRelease

PACKAGES = [
    {"name": "vLLM", "feed": "https://github.com/vllm-project/vllm/releases.atom"},
    {"name": "Unsloth", "feed": "https://github.com/unslothai/unsloth/releases.atom"},
    {"name": "Transformers", "feed": "https://github.com/huggingface/transformers/releases.atom"},
]


async def _fetch_package(name: str, feed_url: str) -> list[PackageRelease]:
    loop = asyncio.get_event_loop()
    feed = await loop.run_in_executor(None, feedparser.parse, feed_url)
    releases = []
    for entry in (feed.entries or [])[:5]:
        releases.append(
            PackageRelease(
                package=name,
                version=(entry.get("title") or "").strip() or "unknown",
                link=entry.get("link", ""),
                pub_date=entry.get("published", entry.get("updated", "")),
                notes=(entry.get("summary", "") or "")[:300].strip(),
            )
        )
    return releases


async def fetch_package_releases() -> list[PackageRelease]:
    results = await asyncio.gather(
        *[_fetch_package(p["name"], p["feed"]) for p in PACKAGES],
        return_exceptions=True,
    )
    releases: list[PackageRelease] = []
    for r in results:
        if isinstance(r, list):
            releases.extend(r)
    return sorted(releases, key=lambda x: x.pub_date, reverse=True)
