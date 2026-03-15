#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = ["twikit"]
# ///
"""Scrape AI-related tweets via twikit → public/scraped-tweets.json
Requires TWITTER_USERNAME, TWITTER_EMAIL, TWITTER_PASSWORD env vars.
Run every 2 hours via GitHub Actions.
"""

import asyncio
import json
import os
from datetime import datetime, timezone
from pathlib import Path

from twikit import Client

OUTPUT = Path("/app/data/scraped-tweets.json")
COOKIES_FILE = Path("/app/data/.twitter_cookies.json")

QUERIES = [
    "large language model release",
    "AI research breakthrough",
    "GPT OR Claude OR Gemini OR LLaMA",
    "machine learning paper",
    "artificial intelligence news",
]

NOW = datetime.now(timezone.utc).isoformat()


async def scrape() -> list[dict]:
    client = Client("en-US")

    if COOKIES_FILE.exists():
        client.load_cookies(str(COOKIES_FILE))
    else:
        username = os.environ["TWITTER_USERNAME"]
        email = os.environ["TWITTER_EMAIL"]
        password = os.environ["TWITTER_PASSWORD"]
        await client.login(
            auth_info_1=username,
            auth_info_2=email,
            password=password,
        )
        client.save_cookies(str(COOKIES_FILE))

    seen_ids: set[str] = set()
    tweets: list[dict] = []

    for query in QUERIES:
        try:
            results = await client.search_tweet(query, "Latest", count=20)
            for tweet in results:
                if tweet.id in seen_ids:
                    continue
                seen_ids.add(tweet.id)

                handle = tweet.user.screen_name if tweet.user else "unknown"
                author = tweet.user.name if tweet.user else "Unknown"
                url = f"https://x.com/{handle}/status/{tweet.id}"

                tweets.append(
                    {
                        "id": tweet.id,
                        "text": tweet.text,
                        "author": author,
                        "handle": f"@{handle}",
                        "url": url,
                        "publishedAt": (
                            tweet.created_at_datetime.isoformat()
                            if tweet.created_at_datetime
                            else NOW
                        ),
                    }
                )
            await asyncio.sleep(2)
        except Exception as exc:
            print(f"[WARN] Query '{query}' failed: {exc}")
            continue

    # Sort by date descending, keep top 50
    tweets.sort(key=lambda t: t["publishedAt"], reverse=True)
    return tweets[:50]


async def main() -> None:
    tweets = await scrape()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(tweets, ensure_ascii=False, indent=2))
    print(f"Saved {len(tweets)} tweets → {OUTPUT}")


if __name__ == "__main__":
    asyncio.run(main())
