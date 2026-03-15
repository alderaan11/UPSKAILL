import httpx

from app.config import settings
from app.schemas.jobs import JobListing, LBBCompany

_TOKEN_URL = (
    "https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire"
)

JOBS_KEYWORDS = [
    "machine+learning", "data", "ia", "computer+vision", "intelligence+artificielle"
]
JOBS_BASE_URL = "https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search"

AI_ROME_CODES = ["M1805", "M1403", "M1204"]
LBB_URL = "https://api.francetravail.io/partenaire/labonneboite/v1/company/"


async def _get_token(scope: str) -> str | None:
    if not settings.france_travail_client_id or not settings.france_travail_client_secret:
        return None
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            res = await client.post(
                _TOKEN_URL,
                data={
                    "grant_type": "client_credentials",
                    "client_id": settings.france_travail_client_id,
                    "client_secret": settings.france_travail_client_secret,
                    "scope": scope,
                },
            )
        if not res.is_success:
            return None
        return res.json().get("access_token")
    except Exception:
        return None


async def fetch_france_travail_jobs() -> list[JobListing]:
    token = await _get_token("api_offresdemploiv2 o2dsoffre")
    if not token:
        return []

    headers = {"Authorization": f"Bearer {token}", "Accept": "application/json"}
    seen: set[str] = set()
    jobs: list[JobListing] = []

    async with httpx.AsyncClient(timeout=10) as client:
        for kw in JOBS_KEYWORDS:
            try:
                res = await client.get(
                    f"{JOBS_BASE_URL}?motsCles={kw}&sort=1&range=0-9",
                    headers=headers,
                )
                if not res.is_success:
                    continue
                for j in res.json().get("resultats") or []:
                    lieu = j.get("lieuTravail") or {}
                    entreprise = j.get("entreprise") or {}
                    origine = j.get("origineOffre") or {}
                    url = origine.get("urlOrigine") or (
                        f"https://candidat.francetravail.fr/offres/emploi/detail/{j['id']}"
                    )
                    if url in seen:
                        continue
                    seen.add(url)
                    jobs.append(
                        JobListing(
                            title=j.get("intitule", ""),
                            company=entreprise.get("nom", "Unknown"),
                            location=lieu.get("libelle", "France"),
                            url=url,
                            source="France Travail",
                            published_at=j.get("dateCreation", ""),
                        )
                    )
            except Exception:
                continue

    return jobs


async def fetch_lbb_companies(
    lat: float, lon: float, distance: int = 30
) -> list[LBBCompany]:
    token = await _get_token("api_labonneboitev1")
    if not token:
        return []

    params = {
        "latitude": str(lat),
        "longitude": str(lon),
        "rome_codes": ",".join(AI_ROME_CODES),
        "distance": str(distance),
        "sort": "score",
        "page_size": "20",
        "user": "upskaill",
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            res = await client.get(
                LBB_URL,
                params=params,
                headers={"Authorization": f"Bearer {token}", "Accept": "application/json"},
            )
        if not res.is_success:
            return []
        companies = res.json().get("companies") or []
        return [
            LBBCompany(
                name=c.get("name", ""),
                siret=c.get("siret", ""),
                naf_text=c.get("naf_text", ""),
                city=c.get("city", "France"),
                zipcode=c.get("zipcode", ""),
                stars=float(c.get("stars") or 0),
                headcount_text=c.get("headcount_text", ""),
                url=c.get("url")
                or f"https://labonneboite.francetravail.fr/entreprises/{c.get('siret')}/details",
            )
            for c in companies
        ]
    except Exception:
        return []
