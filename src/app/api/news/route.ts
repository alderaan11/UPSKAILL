import { NextResponse } from "next/server";
import { fetchAllFeeds } from "@/lib/rss";
import { fetchAINews } from "@/lib/newsapi";
import { fetchAIPolymarketEvents } from "@/lib/polymarket";
import { fetchScrapedTweets } from "@/lib/twitter";
import { fetchRedditPosts } from "@/lib/reddit";

export const dynamic = "force-dynamic";

export async function GET() {
  const [rssItems, newsArticles, polymarketEvents, redditPosts] =
    await Promise.allSettled([
      fetchAllFeeds(),
      fetchAINews(),
      fetchAIPolymarketEvents(),
      fetchRedditPosts(),
    ]);

  return NextResponse.json({
    rss: rssItems.status === "fulfilled" ? rssItems.value : [],
    news: newsArticles.status === "fulfilled" ? newsArticles.value : [],
    polymarket:
      polymarketEvents.status === "fulfilled" ? polymarketEvents.value : [],
    tweets: fetchScrapedTweets(),
    reddit: redditPosts.status === "fulfilled" ? redditPosts.value : [],
  });
}
