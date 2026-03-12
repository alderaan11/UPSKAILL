import Parser from "rss-parser";

const parser = new Parser();

export interface ArxivPaper {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  snippet: string;
  topic: string;
}

const TOPICS = [
  {
    query: "ti:%22key+information+extraction%22+OR+ti:%22document+understanding%22",
    topic: "Key Information Extraction",
    color: "yellow",
  },
  {
    query: "ti:%22fraud+detection%22+OR+ti:%22anomaly+detection%22+AND+cat:cs.LG",
    topic: "Fraud Detection",
    color: "red",
  },
  {
    query: "ti:%22large+language+model%22+OR+ti:%22language+model%22+AND+cat:cs.CL",
    topic: "LLMs",
    color: "blue",
  },
  {
    query: "ti:%22vision+language+model%22+OR+ti:%22multimodal%22+AND+cat:cs.CV",
    topic: "VLMs",
    color: "purple",
  },
  {
    query: "ti:%22medical%22+OR+ti:%22clinical%22+AND+cat:cs.AI",
    topic: "Medical AI",
    color: "green",
  },
];

export async function fetchArxivPapers(): Promise<ArxivPaper[]> {
  const results = await Promise.allSettled(
    TOPICS.map(async ({ query, topic }) => {
      const url = `https://export.arxiv.org/api/query?search_query=${query}&max_results=10&sortBy=submittedDate&sortOrder=descending`;
      const feed = await parser.parseURL(url);
      return (feed.items || []).map((item) => ({
        title: (item.title || "Untitled").replace(/\s+/g, " ").trim(),
        link: item.link || item.id || "",
        pubDate: item.pubDate || item.isoDate || "",
        source: `arXiv · ${topic}`,
        snippet: (item.contentSnippet || item.summary || "").slice(0, 280).trim(),
        topic,
      }));
    })
  );

  const papers: ArxivPaper[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") papers.push(...result.value);
  }

  return papers.sort(
    (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );
}

export const TOPIC_COLORS: Record<string, string> = Object.fromEntries(
  TOPICS.map(({ topic, color }) => [topic, color])
);
