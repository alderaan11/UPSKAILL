import asyncio

from app.clients import newsapi, polymarket, reddit, rss, twitter
from app.schemas.news import (
    ArxivPaper,
    FeedItem,
    NewsArticle,
    PackageRelease,
    PolymarketEvent,
    RedditPost,
    Tweet,
)


async def get_news() -> dict:
    rss_items, news_articles, poly_events, reddit_posts = await asyncio.gather(
        rss.fetch_all_feeds(),
        newsapi.fetch_ai_news(),
        polymarket.fetch_ai_polymarket_events(),
        reddit.fetch_reddit_posts(),
        return_exceptions=True,
    )
    tweets: list[Tweet] = twitter.fetch_scraped_tweets()

    return {
        "rss": rss_items if isinstance(rss_items, list) else [],
        "news": news_articles if isinstance(news_articles, list) else [],
        "polymarket": poly_events if isinstance(poly_events, list) else [],
        "tweets": tweets,
        "reddit": reddit_posts if isinstance(reddit_posts, list) else [],
    }
