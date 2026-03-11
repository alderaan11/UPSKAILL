"use client";

import { useEffect, useState } from "react";
import JobCard from "@/components/JobCard";

interface Job {
  title: string;
  company: string;
  location: string;
  url: string;
  source: string;
  publishedAt: string;
  salary?: string;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/jobs")
      .then((res) => res.json())
      .then((data) => setJobs(data.jobs || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredJobs =
    sourceFilter === "all"
      ? jobs
      : jobs.filter((j) => j.source === sourceFilter);

  const sources = ["all", ...new Set(jobs.map((j) => j.source))];

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">AI Job Board</h1>
        <p className="text-sm text-zinc-400">
          Latest AI/ML positions from Welcome to the Jungle &amp; Adzuna
        </p>
      </div>

      {/* Source filter */}
      <div className="mb-6 flex gap-2">
        {sources.map((s) => (
          <button
            key={s}
            onClick={() => setSourceFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
              sourceFilter === s
                ? "bg-green-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {filteredJobs.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <p className="text-zinc-400">
            No jobs found. Add your ADZUNA_APP_ID and ADZUNA_APP_KEY in
            .env.local to see listings.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredJobs.map((job, i) => (
            <JobCard key={`${job.url}-${i}`} {...job} />
          ))}
        </div>
      )}
    </div>
  );
}
