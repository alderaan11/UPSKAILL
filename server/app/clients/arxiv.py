import asyncio

import feedparser

from app.schemas.news import ArxivPaper

TOPICS = [
    {
        "query": "abs:%22key+information+extraction%22+OR+abs:%22document+understanding%22+OR+abs:%22information+extraction%22",
        "topic": "Key Information Extraction",
    },
    {
        "query": "abs:%22fraud+detection%22+OR+abs:%22anomaly+detection%22",
        "topic": "Fraud Detection",
    },
    {
        "query": "abs:%22large+language+model%22+AND+cat:cs.CL",
        "topic": "LLMs",
    },
    {
        "query": "abs:%22vision+language+model%22+OR+abs:%22multimodal+model%22+AND+cat:cs.CV",
        "topic": "VLMs",
    },
    {
        "query": "abs:%22medical+imaging%22+OR+abs:%22clinical+nlp%22+OR+abs:%22medical+AI%22",
        "topic": "Medical AI",
    },
]


async def _fetch_topic(query: str, topic: str) -> list[ArxivPaper]:
    url = (
        f"https://export.arxiv.org/api/query?search_query={query}"
        f"&max_results=10&sortBy=submittedDate&sortOrder=descending"
    )
    loop = asyncio.get_event_loop()
    feed = await loop.run_in_executor(None, feedparser.parse, url)
    papers = []
    for entry in feed.entries or []:
        papers.append(
            ArxivPaper(
                title=(entry.get("title", "Untitled") or "").replace("  ", " ").strip(),
                link=entry.get("link") or entry.get("id", ""),
                pub_date=entry.get("published", entry.get("updated", "")),
                source=f"arXiv · {topic}",
                snippet=(entry.get("summary", "") or "")[:280].strip(),
                topic=topic,
            )
        )
    return papers


async def fetch_arxiv_papers() -> list[ArxivPaper]:
    results = await asyncio.gather(
        *[_fetch_topic(t["query"], t["topic"]) for t in TOPICS],
        return_exceptions=True,
    )
    papers: list[ArxivPaper] = []
    for r in results:
        if isinstance(r, list):
            papers.extend(r)
    return sorted(papers, key=lambda x: x.pub_date, reverse=True)
