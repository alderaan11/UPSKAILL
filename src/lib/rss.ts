import Parser from "rss-parser";

const parser = new Parser();

export interface FeedItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  snippet: string;
}

const AI_RSS_FEEDS = [
  { url: "https://blog.openai.com/rss/", source: "OpenAI Blog" },
  { url: "https://www.anthropic.com/rss.xml", source: "Anthropic Blog" },
  { url: "https://blog.google/technology/ai/rss/", source: "Google AI Blog" },
  { url: "https://huggingface.co/blog/feed.xml", source: "Hugging Face" },
  { url: "https://ai.meta.com/blog/rss/", source: "Meta AI" },
  { url: "https://mistral.ai/feed.xml", source: "Mistral AI" },
];

export async function fetchAllFeeds(): Promise<FeedItem[]> {
  const results = await Promise.allSettled(
    AI_RSS_FEEDS.map(async ({ url, source }) => {
      const feed = await parser.parseURL(url);
      return (feed.items || []).slice(0, 10).map((item) => ({
        title: item.title || "Untitled",
        link: item.link || "",
        pubDate: item.pubDate || item.isoDate || "",
        source,
        snippet: (item.contentSnippet || "").slice(0, 200),
      }));
    })
  );

  const items: FeedItem[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      items.push(...result.value);
    }
  }

  // Sort by date, newest first
  return items.sort(
    (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );
}
