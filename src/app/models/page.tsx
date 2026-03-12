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

interface PackageRelease {
  package: string;
  version: string;
  link: string;
  pubDate: string;
  notes: string;
}

const PACKAGE_COLORS: Record<string, string> = {
  "vLLM": "bg-cyan-900/40 text-cyan-300 border-cyan-700",
  "Unsloth": "bg-orange-900/40 text-orange-300 border-orange-700",
  "Transformers": "bg-yellow-900/40 text-yellow-300 border-yellow-700",
};

interface ArxivPaper {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  snippet: string;
  topic: string;
}

const TOPIC_COLORS: Record<string, string> = {
  "Key Information Extraction": "yellow",
  "Fraud Detection": "red",
  "LLMs": "blue",
  "VLMs": "purple",
  "Medical AI": "green",
};

const BADGE_CLASSES: Record<string, string> = {
  yellow: "bg-yellow-900/40 text-yellow-300 border-yellow-700",
  red: "bg-red-900/40 text-red-300 border-red-700",
  blue: "bg-blue-900/40 text-blue-300 border-blue-700",
  purple: "bg-purple-900/40 text-purple-300 border-purple-700",
  green: "bg-green-900/40 text-green-300 border-green-700",
};

const TOPICS = ["Key Information Extraction", "Fraud Detection", "LLMs", "VLMs", "Medical AI"];

export default function ModelsPage() {
  const [modelItems, setModelItems] = useState<ModelNews[]>([]);
  const [papers, setPapers] = useState<ArxivPaper[]>([]);
  const [releases, setReleases] = useState<PackageRelease[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [loadingPapers, setLoadingPapers] = useState(true);
  const [loadingReleases, setLoadingReleases] = useState(true);
  const [activeTopic, setActiveTopic] = useState<string>("all");

  useEffect(() => {
    fetch("/api/news")
      .then((res) => res.json())
      .then((data) => {
        const modelKeywords = [
          "model", "gpt", "claude", "gemini", "llama", "mistral",
          "opus", "sonnet", "haiku", "benchmark", "release", "launch",
          "parameter", "open-source", "fine-tun", "training",
        ];
        const allItems = [
          ...data.rss.map((r: ModelNews) => ({ ...r, url: r.link, date: r.pubDate })),
          ...(data.news || []).map((n: { title: string; url: string; publishedAt: string; source: string; description: string }) => ({
            title: n.title,
            link: n.url,
            pubDate: n.publishedAt,
            source: n.source,
            snippet: n.description,
          })),
        ];
        setModelItems(
          allItems.filter((item: ModelNews) => {
            const text = `${item.title} ${item.snippet}`.toLowerCase();
            return modelKeywords.some((kw) => text.includes(kw));
          })
        );
      })
      .catch(console.error)
      .finally(() => setLoadingNews(false));

    fetch("/api/arxiv")
      .then((res) => res.json())
      .then((data) => setPapers(data.papers || []))
      .catch(console.error)
      .finally(() => setLoadingPapers(false));

    fetch("/api/releases")
      .then((res) => res.json())
      .then((data) => setReleases(data.releases || []))
      .catch(console.error)
      .finally(() => setLoadingReleases(false));
  }, []);

  const filteredPapers =
    activeTopic === "all" ? papers : papers.filter((p) => p.topic === activeTopic);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">AI Model Updates</h1>
        <p className="text-sm text-zinc-400">
          Latest releases, benchmarks, and research papers
        </p>
      </div>

      {/* Model news */}
      {loadingNews ? (
        <div className="mb-10 flex justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      ) : modelItems.length > 0 && (
        <div className="mb-10">
          <h2 className="mb-3 text-lg font-semibold text-blue-400">Model News</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modelItems.map((item) => (
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

      {/* PyPI Package Releases */}
      <div className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-cyan-400">
          Library Releases
          <span className="ml-2 text-xs font-normal text-zinc-500">vLLM · Unsloth · Transformers</span>
        </h2>
        {loadingReleases ? (
          <div className="flex justify-center py-6">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
          </div>
        ) : releases.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center">
            <p className="text-zinc-400">No releases found.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {releases.map((r) => (
              <a
                key={`${r.package}-${r.version}`}
                href={r.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-600"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className={`rounded border px-2 py-0.5 text-xs font-semibold ${PACKAGE_COLORS[r.package] ?? "bg-zinc-800 text-zinc-300 border-zinc-600"}`}>
                    {r.package}
                  </span>
                  <span className="font-mono text-sm font-medium text-white">{r.version}</span>
                </div>
                {r.notes && (
                  <p className="mb-3 line-clamp-3 flex-1 text-xs text-zinc-400">{r.notes}</p>
                )}
                <div className="mt-auto text-xs text-zinc-500">
                  {r.pubDate ? new Date(r.pubDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : ""}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* arXiv Research Papers */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-orange-400">
          Research Papers
          <span className="ml-2 text-xs font-normal text-zinc-500">via arXiv</span>
        </h2>

        {/* Topic filter */}
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTopic("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTopic === "all"
                ? "bg-zinc-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            All
          </button>
          {TOPICS.map((topic) => {
            const color = TOPIC_COLORS[topic];
            const isActive = activeTopic === topic;
            return (
              <button
                key={topic}
                onClick={() => setActiveTopic(topic)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? BADGE_CLASSES[color]
                    : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                {topic}
              </button>
            );
          })}
        </div>

        {loadingPapers ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
          </div>
        ) : filteredPapers.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
            <p className="text-zinc-400">No papers found for this topic.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPapers.map((paper) => {
              const color = TOPIC_COLORS[paper.topic] || "blue";
              return (
                <a
                  key={paper.link}
                  href={paper.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-600"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className={`rounded border px-2 py-0.5 text-xs font-medium ${BADGE_CLASSES[color]}`}>
                      {paper.topic}
                    </span>
                  </div>
                  <p className="mb-2 line-clamp-3 text-sm font-medium leading-snug text-white group-hover:text-zinc-200">
                    {paper.title}
                  </p>
                  <p className="mb-3 line-clamp-3 flex-1 text-xs text-zinc-400">
                    {paper.snippet}
                  </p>
                  <div className="mt-auto flex items-center justify-between text-xs text-zinc-500">
                    <span>arXiv</span>
                    <span>
                      {paper.pubDate
                        ? new Date(paper.pubDate).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : ""}
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
