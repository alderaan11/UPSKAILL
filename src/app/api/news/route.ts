import { NextResponse } from "next/server";
import { fetchAllFeeds } from "@/lib/rss";
import { fetchAINews } from "@/lib/newsapi";
import { fetchAIPolymarketEvents } from "@/lib/polymarket";

export const dynamic = "force-dynamic";

export async function GET() {
  const [rssItems, newsArticles, polymarketEvents] = await Promise.allSettled([
    fetchAllFeeds(),
    fetchAINews(),
    fetchAIPolymarketEvents(),
  ]);

  return NextResponse.json({
    rss: rssItems.status === "fulfilled" ? rssItems.value : [],
    news: newsArticles.status === "fulfilled" ? newsArticles.value : [],
    polymarket:
      polymarketEvents.status === "fulfilled" ? polymarketEvents.value : [],
  });
}
