import Parser from "rss-parser";

export interface RedditPost {
  id: string;
  title: string;
  snippet: string;
  url: string;
  permalink: string;
  author: string;
  subreddit: string;
  score: number;
  publishedAt: string;
}

const parser = new Parser({
  customFields: {
    item: [["media:thumbnail", "mediaThumbnail"]],
  },
});

const SUBREDDITS = ["MachineLearning", "artificial", "agenticai"];

async function fetchSubreddit(subreddit: string): Promise<RedditPost[]> {
  try {
    const feed = await parser.parseURL(
      `https://www.reddit.com/r/${subreddit}/new.rss?limit=10`
    );
    return (feed.items || []).map((item) => {
      // id is the last segment of the post URL: .../comments/<id>/...
      const idMatch = (item.link || "").match(/comments\/([a-z0-9]+)\//i);
      const id = idMatch ? idMatch[1] : item.guid || item.link || "";

      return {
        id,
        title: (item.title || "").replace(/\s+/g, " ").trim(),
        snippet: (item.contentSnippet || item.content || "").slice(0, 280).trim(),
        url: item.link || "",
        permalink: item.link || "",
        author: `u/${item.creator || item.author || "unknown"}`,
        subreddit: `r/${subreddit}`,
        score: 0,
        publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
      };
    });
  } catch {
    return [];
  }
}

export async function fetchRedditPosts(): Promise<RedditPost[]> {
  const results = await Promise.allSettled(
    SUBREDDITS.map((s) => fetchSubreddit(s))
  );

  const posts: RedditPost[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") posts.push(...r.value);
  }

  return posts.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}
