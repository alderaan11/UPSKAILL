import json
from pathlib import Path

from app.schemas.news import Tweet

DATA_FILE = Path("/app/data/scraped-tweets.json")


def fetch_scraped_tweets() -> list[Tweet]:
    try:
        raw = DATA_FILE.read_text(encoding="utf-8")
        return [Tweet(**t) for t in json.loads(raw)]
    except Exception:
        return []
