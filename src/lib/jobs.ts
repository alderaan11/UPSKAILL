export interface JobListing {
  title: string;
  company: string;
  location: string;
  url: string;
  source: string;
  publishedAt: string;
  salary?: string;
}

// Welcome to the Jungle — scrape their public search API
export async function fetchWTTJJobs(): Promise<JobListing[]> {
  try {
    const res = await fetch(
      "https://www.welcometothejungle.com/api/v1/jobs?query=artificial+intelligence&page=1&per_page=20",
      { next: { revalidate: 600 } }
    );
    if (!res.ok) return [];

    const data = await res.json();
    return (data.jobs || data.results || []).map(
      (j: Record<string, unknown>) => ({
        title: j.name as string,
        company:
          (j.organization as Record<string, string>)?.name || "Unknown",
        location: (j.office as Record<string, string>)?.city || "Remote",
        url: `https://www.welcometothejungle.com/en/companies/${(j.organization as Record<string, string>)?.slug}/jobs/${j.slug}`,
        source: "Welcome to the Jungle",
        publishedAt: j.published_at as string,
      })
    );
  } catch {
    return [];
  }
}

// Adzuna API — free tier available
export async function fetchAdzunaJobs(): Promise<JobListing[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) return [];

  try {
    const res = await fetch(
      `https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=20&what=artificial+intelligence+machine+learning&sort_by=date`,
      { next: { revalidate: 600 } }
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
        ? `$${Math.round(j.salary_min as number)}-${Math.round(j.salary_max as number)}`
        : undefined,
    }));
  } catch {
    return [];
  }
}

export async function fetchAllJobs(): Promise<JobListing[]> {
  const [wttj, adzuna] = await Promise.allSettled([
    fetchWTTJJobs(),
    fetchAdzunaJobs(),
  ]);

  const jobs: JobListing[] = [];
  if (wttj.status === "fulfilled") jobs.push(...wttj.value);
  if (adzuna.status === "fulfilled") jobs.push(...adzuna.value);

  return jobs.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}
