import fs from "fs";
import path from "path";

export interface ScrapedTweet {
  id: string;
  text: string;
  author: string;
  handle: string;
  url: string;
  publishedAt: string;
}

export function fetchScrapedTweets(): ScrapedTweet[] {
  const filePath = path.join(process.cwd(), "public", "scraped-tweets.json");
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as ScrapedTweet[];
  } catch {
    return [];
  }
}
