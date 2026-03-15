import asyncio
import json
from pathlib import Path

from app.clients import adzuna, france_travail
from app.schemas.jobs import JobListing, LBBCompany

_SCRAPED_JOBS_FILE = Path("/app/data/scraped-jobs.json")


def _read_scraped_jobs() -> list[JobListing]:
    try:
        raw = _SCRAPED_JOBS_FILE.read_text(encoding="utf-8")
        return [JobListing(**j) for j in json.loads(raw)]
    except Exception:
        return []


async def get_jobs() -> list[JobListing]:
    ft_jobs, adzuna_jobs = await asyncio.gather(
        france_travail.fetch_france_travail_jobs(),
        adzuna.fetch_adzuna_jobs(),
        return_exceptions=True,
    )
    jobs: list[JobListing] = [*_read_scraped_jobs()]
    if isinstance(ft_jobs, list):
        jobs.extend(ft_jobs)
    if isinstance(adzuna_jobs, list):
        jobs.extend(adzuna_jobs)

    seen: set[str] = set()
    unique = []
    for j in jobs:
        if j.url not in seen:
            seen.add(j.url)
            unique.append(j)

    return sorted(unique, key=lambda x: x.published_at, reverse=True)


async def get_lbb_companies(lat: float, lon: float, distance: int = 30) -> list[LBBCompany]:
    return await france_travail.fetch_lbb_companies(lat, lon, distance)
