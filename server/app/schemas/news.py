from pydantic import BaseModel


class FeedItem(BaseModel):
    title: str
    link: str
    pub_date: str
    source: str
    snippet: str


class NewsArticle(BaseModel):
    title: str
    description: str
    url: str
    source: str
    published_at: str
    image_url: str | None = None


class PolymarketEvent(BaseModel):
    id: str
    title: str
    outcomes: list[str]
    outcome_prices: list[str]
    volume: float


class Tweet(BaseModel):
    id: str
    text: str
    author: str
    handle: str
    url: str
    published_at: str


class RedditPost(BaseModel):
    id: str
    title: str
    snippet: str
    url: str
    permalink: str
    author: str
    subreddit: str
    score: int
    published_at: str


class ArxivPaper(BaseModel):
    title: str
    link: str
    pub_date: str
    source: str
    snippet: str
    topic: str


class PackageRelease(BaseModel):
    package: str
    version: str
    link: str
    pub_date: str
    notes: str
