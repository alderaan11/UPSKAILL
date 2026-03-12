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

const SUBREDDITS = ["MachineLearning", "artificial", "agenticai"];

async function fetchSubreddit(subreddit: string): Promise<RedditPost[]> {
  const res = await fetch(
    `https://www.reddit.com/r/${subreddit}/new.json?limit=10`,
    {
      headers: {
        "User-Agent": "ai-pulse/1.0 (news aggregator)",
        Accept: "application/json",
      },
      cache: "no-store",
    }
  );
  if (!res.ok) return [];

  const json = await res.json();
  const children = json?.data?.children ?? [];

  return children.map(({ data }: { data: Record<string, unknown> }) => ({
    id: String(data.id),
    title: String(data.title),
    snippet: String(data.selftext || "").slice(0, 280).trim(),
    url: String(data.url),
    permalink: `https://www.reddit.com${data.permalink}`,
    author: `u/${data.author}`,
    subreddit: `r/${data.subreddit}`,
    score: Number(data.score),
    publishedAt: new Date(Number(data.created_utc) * 1000).toISOString(),
  }));
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
