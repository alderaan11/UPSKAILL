"use client";

import { useEffect, useState } from "react";
import NewsCard from "@/components/NewsCard";

interface ModelNews {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  snippet: string;
}

export default function ModelsPage() {
  const [items, setItems] = useState<ModelNews[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/news")
      .then((res) => res.json())
      .then((data) => {
        // Filter for model-specific news from RSS and news
        const modelKeywords = [
          "model",
          "gpt",
          "claude",
          "gemini",
          "llama",
          "mistral",
          "opus",
          "sonnet",
          "haiku",
          "benchmark",
          "release",
          "launch",
          "parameter",
          "open-source",
          "fine-tun",
          "training",
        ];

        const allItems = [
          ...data.rss.map((r: ModelNews) => ({
            ...r,
            url: r.link,
            date: r.pubDate,
          })),
          ...(data.news || []).map(
            (n: {
              title: string;
              url: string;
              publishedAt: string;
              source: string;
              description: string;
            }) => ({
              title: n.title,
              link: n.url,
              pubDate: n.publishedAt,
              source: n.source,
              snippet: n.description,
            })
          ),
        ];

        const filtered = allItems.filter((item: ModelNews) => {
          const text = `${item.title} ${item.snippet}`.toLowerCase();
          return modelKeywords.some((kw) => text.includes(kw));
        });

        setItems(filtered);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">AI Model Updates</h1>
        <p className="text-sm text-zinc-400">
          Latest releases, benchmarks, and model announcements
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <p className="text-zinc-400">
            No model-specific news found right now. Check back later or add more
            API keys in .env.local
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <NewsCard
              key={item.link}
              title={item.title}
              snippet={item.snippet}
              source={item.source}
              url={item.link}
              date={item.pubDate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
