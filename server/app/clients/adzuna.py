import httpx

from app.config import settings
from app.schemas.jobs import JobListing


async def fetch_adzuna_jobs() -> list[JobListing]:
    if not settings.adzuna_app_id or not settings.adzuna_app_key:
        return []

    url = (
        f"https://api.adzuna.com/v1/api/jobs/fr/search/1"
        f"?app_id={settings.adzuna_app_id}&app_key={settings.adzuna_app_key}"
        f"&results_per_page=10&what=artificial+intelligence+machine+learning&sort_by=date"
    )
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            res = await client.get(url)
        if not res.is_success:
            return []
        results = res.json().get("results") or []
        return [
            JobListing(
                title=j.get("title", ""),
                company=(j.get("company") or {}).get("display_name", "Unknown"),
                location=(j.get("location") or {}).get("display_name", "Remote"),
                url=j.get("redirect_url", ""),
                source="Adzuna",
                published_at=j.get("created", ""),
                salary=(
                    f"€{int(j['salary_min'])}-{int(j['salary_max'])}"
                    if j.get("salary_max")
                    else None
                ),
            )
            for j in results
        ]
    except Exception:
        return []
