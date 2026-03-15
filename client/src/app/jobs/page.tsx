"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import JobCard from "@/components/JobCard";
import LBBCard from "@/components/LBBCard";

interface LBBCompany {
  name: string;
  siret: string;
  naf_text: string;
  city: string;
  zipcode: string;
  stars: number;
  headcount_text: string;
  url: string;
}

interface Job {
  title: string;
  company: string;
  location: string;
  url: string;
  source: string;
  publishedAt: string;
  salary?: string;
}

const CITIES = [
  { label: "Paris", lat: 48.8566, lon: 2.3522 },
  { label: "Lyon", lat: 45.764, lon: 4.8357 },
  { label: "Bordeaux", lat: 44.8378, lon: -0.5792 },
  { label: "Toulouse", lat: 43.6047, lon: 1.4442 },
  { label: "Lille", lat: 50.6292, lon: 3.0573 },
  { label: "Nantes", lat: 47.2184, lon: -1.5536 },
  { label: "Grenoble", lat: 45.1885, lon: 5.7245 },
];

export default function JobsPage() {
  const [tab, setTab] = useState<"offres" | "entreprises">("offres");

  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  const [companies, setCompanies] = useState<LBBCompany[]>([]);
  const [lbbLoading, setLbbLoading] = useState(false);
  const [lbbFetched, setLbbFetched] = useState(false);
  const [selectedCity, setSelectedCity] = useState(CITIES[0]);

  useEffect(() => {
    fetch(`${API_URL}/api/jobs`)
      .then((res) => res.json())
      .then((data) => setJobs(data.jobs || []))
      .catch(console.error)
      .finally(() => setJobsLoading(false));
  }, []);

  useEffect(() => {
    if (tab !== "entreprises") return;
    loadLBB();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, selectedCity]);

  async function loadLBB() {
    setLbbLoading(true);
    setLbbFetched(false);
    try {
      const res = await fetch(
        `${API_URL}/api/lbb?lat=${selectedCity.lat}&lon=${selectedCity.lon}&distance=30`
      );
      const data = await res.json();
      setCompanies(data.companies || []);
    } catch {
      setCompanies([]);
    } finally {
      setLbbLoading(false);
      setLbbFetched(true);
    }
  }

  const filteredJobs =
    sourceFilter === "all" ? jobs : jobs.filter((j) => j.source === sourceFilter);
  const sources = ["all", ...new Set(jobs.map((j) => j.source))];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Job Board</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Offres AI/ML en France + entreprises qui recrutent
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl border border-gray-200 bg-gray-100 p-1 w-fit dark:border-gray-700 dark:bg-gray-800">
        <button
          onClick={() => setTab("offres")}
          className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
            tab === "offres" ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white" : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          }`}
        >
          Offres d&apos;emploi
        </button>
        <button
          onClick={() => setTab("entreprises")}
          className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
            tab === "entreprises" ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white" : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          }`}
        >
          Entreprises qui recrutent
        </button>
      </div>

      {/* Offres d'emploi */}
      {tab === "offres" && (
        <>
          {jobsLoading ? (
            <div className="flex h-[60vh] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            </div>
          ) : (
            <>
              <div className="mb-6 flex flex-wrap gap-1.5">
                {sources.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSourceFilter(s)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                      sourceFilter === s
                        ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                        : "text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {filteredJobs.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800/50">
                  <p className="text-gray-500 dark:text-gray-400">
                    Aucune offre trouvée. Ajoutez vos clés API dans .env.local.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredJobs.map((job, i) => (
                    <JobCard key={`${job.url}-${i}`} {...job} />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Entreprises qui recrutent */}
      {tab === "entreprises" && (
        <>
          <div className="mb-4">
            <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
              Entreprises ayant le plus de chances de recruter dans les 6 prochains mois
              pour des profils data / IA — données France Travail.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {CITIES.map((city) => (
                <button
                  key={city.label}
                  onClick={() => setSelectedCity(city)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    selectedCity.label === city.label
                      ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                  }`}
                >
                  {city.label}
                </button>
              ))}
            </div>
          </div>

          {lbbLoading ? (
            <div className="flex h-[40vh] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            </div>
          ) : lbbFetched && companies.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800/50">
              <p className="text-gray-500 dark:text-gray-400">
                Aucune entreprise trouvée. Vérifiez que{" "}
                <code className="text-gray-700 dark:text-gray-300">FRANCE_TRAVAIL_CLIENT_ID</code> et{" "}
                <code className="text-gray-700 dark:text-gray-300">FRANCE_TRAVAIL_CLIENT_SECRET</code> sont
                configurés.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {companies.map((company) => (
                <LBBCard key={company.siret} {...company} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
