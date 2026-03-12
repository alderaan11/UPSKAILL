import { readFileSync } from "fs";
import { join } from "path";

export interface JobListing {
  title: string;
  company: string;
  location: string;
  url: string;
  source: string;
  publishedAt: string;
  salary?: string;
}

// Scraped jobs from WTTJ + Indeed (updated twice daily by GitHub Actions)
export function fetchScrapedJobs(): JobListing[] {
  try {
    const raw = readFileSync(join(process.cwd(), "public", "scraped-jobs.json"), "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// France Travail (Pôle Emploi) — free official French job API
async function getFranceTravailToken(): Promise<string | null> {
  const clientId = process.env.FRANCE_TRAVAIL_CLIENT_ID;
  const clientSecret = process.env.FRANCE_TRAVAIL_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  try {
    const res = await fetch(
      "https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: clientId,
          client_secret: clientSecret,
          scope: "api_offresdemploiv2 o2dsoffre",
        }),
        cache: "no-store",
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.access_token ?? null;
  } catch {
    return null;
  }
}

function mapFTResult(j: Record<string, unknown>): JobListing {
  const lieu = (j.lieuTravail as Record<string, string>) ?? {};
  const entreprise = (j.entreprise as Record<string, string>) ?? {};
  const origine = (j.origineOffre as Record<string, string>) ?? {};
  return {
    title: j.intitule as string,
    company: entreprise.nom || "Unknown",
    location: lieu.libelle || "France",
    url:
      origine.urlOrigine ||
      `https://candidat.francetravail.fr/offres/emploi/detail/${j.id}`,
    source: "France Travail",
    publishedAt: j.dateCreation as string,
  };
}

export async function fetchFranceTravailJobs(): Promise<JobListing[]> {
  const token = await getFranceTravailToken();
  if (!token) return [];

  const KEYWORDS = ["machine+learning", "data", "ia", "computer+vision", "intelligence+artificielle"];
  const BASE = "https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search";

  const results = await Promise.allSettled(
    KEYWORDS.map((kw) =>
      fetch(`${BASE}?motsCles=${kw}&sort=1&range=0-9`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        cache: "no-store",
      }).then((r) => (r.ok ? r.json() : { resultats: [] }))
    )
  );

  const seen = new Set<string>();
  const jobs: JobListing[] = [];
  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    for (const j of result.value.resultats || []) {
      const mapped = mapFTResult(j);
      if (!seen.has(mapped.url)) {
        seen.add(mapped.url);
        jobs.push(mapped);
      }
    }
  }
  return jobs;
}

// Adzuna API — free tier available
export async function fetchAdzunaJobs(): Promise<JobListing[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) return [];

  try {
    const res = await fetch(
      `https://api.adzuna.com/v1/api/jobs/fr/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=10&what=artificial+intelligence+machine+learning&sort_by=date`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];

    const data = await res.json();
    return (data.results || []).map((j: Record<string, unknown>) => ({
      title: j.title as string,
      company: (j.company as Record<string, string>)?.display_name || "Unknown",
      location: (j.location as Record<string, string>)?.display_name || "Remote",
      url: j.redirect_url as string,
      source: "Adzuna",
      publishedAt: j.created as string,
      salary: j.salary_max
        ? `€${Math.round(j.salary_min as number)}-${Math.round(j.salary_max as number)}`
        : undefined,
    }));
  } catch {
    return [];
  }
}

export async function fetchAllJobs(): Promise<JobListing[]> {
  const [franceTravail, adzuna] = await Promise.allSettled([
    fetchFranceTravailJobs(),
    fetchAdzunaJobs(),
  ]);

  const jobs: JobListing[] = [...fetchScrapedJobs()];
  if (franceTravail.status === "fulfilled") jobs.push(...franceTravail.value);
  if (adzuna.status === "fulfilled") jobs.push(...adzuna.value);

  // Deduplicate by URL
  const seen = new Set<string>();
  const unique = jobs.filter((j) => {
    if (seen.has(j.url)) return false;
    seen.add(j.url);
    return true;
  });

  return unique.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}
