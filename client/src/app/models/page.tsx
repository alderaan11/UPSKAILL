"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
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
  "vLLM": "bg-cyan-50 text-cyan-700 border-cyan-200",
  "Unsloth": "bg-orange-50 text-orange-700 border-orange-200",
  "Transformers": "bg-yellow-50 text-yellow-700 border-yellow-200",
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
  yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
  red: "bg-red-50 text-red-700 border-red-200",
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  purple: "bg-purple-50 text-purple-700 border-purple-200",
  green: "bg-green-50 text-green-700 border-green-200",
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
    fetch(`${API_URL}/api/news`)
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

    fetch(`${API_URL}/api/arxiv`)
      .then((res) => res.json())
      .then((data) => setPapers(data.papers || []))
      .catch(console.error)
      .finally(() => setLoadingPapers(false));

    fetch(`${API_URL}/api/releases`)
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Model Updates</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Latest releases, benchmarks, and research papers
        </p>
      </div>

      {/* Model news */}
      {loadingNews ? (
        <div className="mb-10 flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      ) : modelItems.length > 0 && (
        <div className="mb-10">
          <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">Model News</h2>
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
        <h2 className="mb-1 text-base font-semibold text-gray-900 dark:text-white">Library Releases</h2>
        <p className="mb-4 text-xs text-gray-400 dark:text-gray-500">vLLM · Unsloth · Transformers</p>
        {loadingReleases ? (
          <div className="flex justify-center py-6">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          </div>
        ) : releases.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center dark:border-gray-700 dark:bg-gray-800/50">
            <p className="text-gray-500 dark:text-gray-400">No releases found.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {releases.map((r) => (
              <a
                key={`${r.package}-${r.version}`}
                href={r.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600"
              >
                <div className={`h-1 w-full ${r.package === "vLLM" ? "bg-cyan-500" : r.package === "Unsloth" ? "bg-orange-500" : "bg-yellow-500"}`} />
                <div className="flex flex-1 flex-col p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className={`rounded border px-2 py-0.5 text-xs font-semibold ${PACKAGE_COLORS[r.package] ?? "bg-gray-100 text-gray-700 border-gray-200"}`}>
                      {r.package}
                    </span>
                    <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">{r.version}</span>
                  </div>
                  {r.notes && (
                    <p className="mb-3 line-clamp-3 flex-1 text-xs text-gray-500 dark:text-gray-400">{r.notes}</p>
                  )}
                  <div className="mt-auto text-xs text-gray-400 dark:text-gray-500">
                    {r.pubDate ? new Date(r.pubDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : ""}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* arXiv Research Papers */}
      <div>
        <h2 className="mb-1 text-base font-semibold text-gray-900 dark:text-white">Research Papers</h2>
        <p className="mb-4 text-xs text-gray-400 dark:text-gray-500">via arXiv</p>

        {/* Topic filter */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveTopic("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTopic === "all"
                ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
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
                    : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-900 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-white"
                }`}
              >
                {topic}
              </button>
            );
          })}
        </div>

        {loadingPapers ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          </div>
        ) : filteredPapers.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800/50">
            <p className="text-gray-500 dark:text-gray-400">No papers found for this topic.</p>
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
                  className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600"
                >
                  <div className={`h-1 w-full ${color === "yellow" ? "bg-yellow-500" : color === "red" ? "bg-red-500" : color === "blue" ? "bg-blue-500" : color === "purple" ? "bg-purple-500" : "bg-green-500"}`} />
                  <div className="flex flex-1 flex-col p-4">
                    <div className="mb-2">
                      <span className={`rounded border px-2 py-0.5 text-xs font-medium ${BADGE_CLASSES[color]}`}>
                        {paper.topic}
                      </span>
                    </div>
                    <p className="mb-2 line-clamp-3 text-sm font-semibold leading-snug text-gray-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                      {paper.title}
                    </p>
                    <p className="mb-3 line-clamp-3 flex-1 text-xs text-gray-500 dark:text-gray-400">
                      {paper.snippet}
                    </p>
                    <div className="mt-auto flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
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
