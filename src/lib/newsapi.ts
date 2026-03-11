export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  imageUrl: string | null;
}

export async function fetchAINews(): Promise<NewsArticle[]> {
  const apiKey = process.env.NEWSAPI_KEY;
  if (!apiKey) return [];

  const res = await fetch(
    `https://newsapi.org/v2/everything?q=artificial+intelligence+OR+LLM+OR+GPT+OR+Claude&language=en&sortBy=publishedAt&pageSize=20`,
    {
      headers: { "X-Api-Key": apiKey },
      next: { revalidate: 300 }, // cache 5 min
    }
  );

  if (!res.ok) return [];

  const data = await res.json();
  return (data.articles || []).map((a: Record<string, unknown>) => ({
    title: a.title as string,
    description: a.description as string,
    url: a.url as string,
    source: (a.source as Record<string, string>)?.name || "Unknown",
    publishedAt: a.publishedAt as string,
    imageUrl: (a.urlToImage as string) || null,
  }));
}
