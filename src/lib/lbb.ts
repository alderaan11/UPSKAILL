export interface LBBCompany {
  name: string;
  siret: string;
  naf_text: string;
  city: string;
  zipcode: string;
  stars: number; // hiring potential 0–5
  headcount_text: string;
  url: string;
}

// ROME codes most relevant for AI / data / software roles in France
const AI_ROME_CODES = [
  "M1805", // Études et développement informatique-logiciel (ML engineers, data engineers)
  "M1403", // Études socio-économiques (data analysts, data scientists)
  "M1204", // Conception et organisation de la formation (AI trainers, applied research)
];

async function getLBBToken(): Promise<string | null> {
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
          scope: "api_labonneboitev1",
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

export async function fetchLBBCompanies(
  lat: number,
  lon: number,
  distance = 30
): Promise<LBBCompany[]> {
  const token = await getLBBToken();
  if (!token) return [];

  try {
    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      rome_codes: AI_ROME_CODES.join(","),
      distance: String(distance),
      sort: "score",
      page_size: "20",
      user: "aipulse",
    });

    const res = await fetch(
      `https://api.francetravail.io/partenaire/labonneboite/v1/company/?${params}`,
      {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        cache: "no-store",
      }
    );
    if (!res.ok) return [];

    const data = await res.json();
    return (data.companies || []).map((c: Record<string, unknown>) => ({
      name: (c.name as string) || "",
      siret: (c.siret as string) || "",
      naf_text: (c.naf_text as string) || "",
      city: (c.city as string) || "France",
      zipcode: (c.zipcode as string) || "",
      stars: (c.stars as number) ?? 0,
      headcount_text: (c.headcount_text as string) || "",
      url:
        (c.url as string) ||
        `https://labonneboite.francetravail.fr/entreprises/${c.siret}/details`,
    }));
  } catch {
    return [];
  }
}
