"use client";

import { useEffect, useState } from "react";
import NewsCard from "@/components/NewsCard";
import PolymarketCard from "@/components/PolymarketCard";

interface NewsData {
  rss: Array<{
    title: string;
    link: string;
    pubDate: string;
    source: string;
    snippet: string;
  }>;
  news: Array<{
    title: string;
    description: string;
    url: string;
    source: string;
    publishedAt: string;
    imageUrl: string | null;
  }>;
  polymarket: Array<{
    id: string;
    title: string;
    outcomes: string[];
    outcomePrices: string[];
    volume: number;
  }>;
  tweets: Array<{
    id: string;
    text: string;
    author: string;
    handle: string;
    url: string;
    publishedAt: string;
  }>;
  reddit: Array<{
    id: string;
    title: string;
    snippet: string;
    url: string;
    permalink: string;
    author: string;
    subreddit: string;
    score: number;
    publishedAt: string;
  }>;
}

const TABS = [
  { key: "all", label: "All" },
  { key: "news", label: "News" },
  { key: "rss", label: "RSS" },
  { key: "polymarket", label: "Markets" },
  { key: "reddit", label: "Reddit" },
  { key: "twitter", label: "X / Twitter" },
] as const;

type Tab = typeof TABS[number]["key"];

export default function NewsPage() {
  const [data, setData] = useState<NewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("all");

  useEffect(() => {
    fetch("/api/news")
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AI News Feed</h1>
        <p className="text-sm text-gray-500">
          Real-time updates from blogs, news, and prediction markets
        </p>
      </div>

      {/* Tab filters */}
      <div className="mb-6 flex flex-wrap gap-1.5 border-b border-gray-200 pb-4">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === key
                ? "bg-gray-900 text-white"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Polymarket */}
      {(tab === "all" || tab === "polymarket") &&
        data?.polymarket &&
        data.polymarket.length > 0 && (
          <div className="mb-10">
            <h2 className="mb-4 text-base font-semibold text-gray-900">
              Prediction Markets
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.polymarket.map((event) => (
                <PolymarketCard key={event.id} {...event} />
              ))}
            </div>
          </div>
        )}

      {/* News articles */}
      {(tab === "all" || tab === "news") &&
        data?.news &&
        data.news.length > 0 && (
          <div className="mb-10">
            <h2 className="mb-4 text-base font-semibold text-gray-900">
              Latest News
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.news.map((article) => (
                <NewsCard
                  key={article.url}
                  title={article.title}
                  snippet={article.description}
                  source={article.source}
                  url={article.url}
                  date={article.publishedAt}
                  imageUrl={article.imageUrl}
                />
              ))}
            </div>
          </div>
        )}

      {/* RSS feeds */}
      {(tab === "all" || tab === "rss") &&
        data?.rss &&
        data.rss.length > 0 && (
          <div className="mb-10">
            <h2 className="mb-4 text-base font-semibold text-gray-900">
              Blog & RSS Feeds
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.rss.map((item) => (
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
          </div>
        )}

      {/* Reddit */}
      {(tab === "all" || tab === "reddit") &&
        data?.reddit &&
        data.reddit.length > 0 && (
          <div className="mb-10">
            <h2 className="mb-4 text-base font-semibold text-gray-900">
              Reddit
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.reddit.map((post) => (
                <NewsCard
                  key={post.id}
                  title={post.title}
                  snippet={post.snippet || `${post.score} pts · ${post.subreddit}`}
                  source={`${post.subreddit} · ${post.author}`}
                  url={post.permalink}
                  date={post.publishedAt}
                />
              ))}
            </div>
          </div>
        )}

      {/* Tweets */}
      {(tab === "all" || tab === "twitter") &&
        data?.tweets &&
        data.tweets.length > 0 && (
          <div className="mb-10">
            <h2 className="mb-4 text-base font-semibold text-gray-900">
              X / Twitter
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.tweets.map((tweet) => (
                <NewsCard
                  key={tweet.id}
                  title={tweet.text.slice(0, 100) + (tweet.text.length > 100 ? "…" : "")}
                  snippet={tweet.text}
                  source={`${tweet.author} ${tweet.handle}`}
                  url={tweet.url}
                  date={tweet.publishedAt}
                />
              ))}
            </div>
          </div>
        )}
    </div>
  );
}
