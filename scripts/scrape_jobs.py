#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = ["requests", "playwright"]
# ///
"""Scrape WTTJ (via Algolia) and Indeed FR (via Playwright) for AI/ML jobs.
Output: public/scraped-jobs.json
Run twice daily via GitHub Actions.
"""

import json
import os
from datetime import datetime, timezone

import requests

OUTPUT = os.path.join(os.path.dirname(__file__), "..", "public", "scraped-jobs.json")

# WTTJ public Algolia credentials (embedded in their frontend JS, search-only)
ALGOLIA_APP_ID = "CSEKHVMS53"
ALGOLIA_API_KEY = "4bd8f6215d0cc52b26430765769e65a0"
ALGOLIA_INDEX = "wttj_jobs_production_fr"


def scrape_wttj() -> list[dict]:
    """WTTJ via Algolia search API (public client-side key)."""
    try:
        res = requests.post(
            f"https://{ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/{ALGOLIA_INDEX}/query",
            headers={
                "X-Algolia-Application-Id": ALGOLIA_APP_ID,
                "X-Algolia-API-Key": ALGOLIA_API_KEY,
                "Content-Type": "application/json",
                "Referer": "https://www.welcometothejungle.com/",
                "Origin": "https://www.welcometothejungle.com",
            },
            json={
                "query": "machine learning intelligence artificielle data scientist",
                "hitsPerPage": 20,
                "filters": "language:fr",
            },
            timeout=15,
        )
        if not res.ok:
            print(f"WTTJ: HTTP {res.status_code} — {res.text[:200]}")
            return []

        hits = res.json().get("hits", [])
        result = []
        for j in hits:
            org = j.get("organization") or {}
            offices = j.get("offices") or [{}]
            city = offices[0].get("city", "France") if offices else "France"
            org_slug = org.get("slug", "")
            job_slug = j.get("slug", "")
            salary = None
            if j.get("salary_minimum") and j.get("salary_maximum"):
                salary = f"€{int(j['salary_minimum']//1000)}k–{int(j['salary_maximum']//1000)}k"
            result.append({
                "title": j.get("name", ""),
                "company": org.get("name", "Unknown"),
                "location": city,
                "url": (
                    f"https://www.welcometothejungle.com/fr/companies/{org_slug}/jobs/{job_slug}"
                    if org_slug and job_slug
                    else "https://www.welcometothejungle.com/fr/jobs"
                ),
                "source": "Welcome to the Jungle",
                "publishedAt": j.get("published_at") or datetime.now(timezone.utc).isoformat(),
                **({"salary": salary} if salary else {}),
            })
        print(f"WTTJ: {len(result)} jobs")
        return result
    except Exception as e:
        print(f"WTTJ error: {e}")
        return []


def scrape_indeed() -> list[dict]:
    """Indeed France via Playwright (headless Chromium to bypass security check)."""
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("Indeed: playwright not installed, skipping")
        return []

    jobs = []
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(
                user_agent=(
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                ),
                locale="fr-FR",
            )
            page = context.new_page()

            # Intercept Algolia-style JSON responses from Indeed's API
            api_jobs: list[dict] = []

            def handle_response(response):
                if "mosaic-provider-jobcards" in response.url or "api/mosaic" in response.url:
                    try:
                        data = response.json()
                        results = (
                            data.get("metaData", {})
                            .get("mosaicProviderJobCardsModel", {})
                            .get("results", [])
                        )
                        api_jobs.extend(results)
                    except Exception:
                        pass

            page.on("response", handle_response)

            page.goto(
                "https://fr.indeed.com/emplois"
                "?q=machine+learning+data+scientist+intelligence+artificielle"
                "&l=France&sort=date&fromage=7",
                wait_until="domcontentloaded",
                timeout=30000,
            )
            # Wait for job cards or a sign the page rendered
            try:
                page.wait_for_selector(
                    "div.job_seen_beacon, div[data-jk], #mosaic-provider-jobcards",
                    timeout=15000,
                )
            except Exception:
                pass

            if api_jobs:
                for j in api_jobs:
                    jobs.append({
                        "title": j.get("title", ""),
                        "company": j.get("company", "Unknown"),
                        "location": j.get("formattedLocation", "France"),
                        "url": f"https://fr.indeed.com/viewjob?jk={j.get('jobkey', '')}",
                        "source": "Indeed",
                        "publishedAt": j.get("pubDate") or datetime.now(timezone.utc).isoformat(),
                    })
            else:
                # Parse rendered HTML job cards
                cards = page.query_selector_all("div.job_seen_beacon, div[data-jk]")
                for card in cards:
                    title_el = card.query_selector("h2.jobTitle span[title], h2.jobTitle span")
                    company_el = card.query_selector("span.companyName, [data-testid='company-name']")
                    location_el = card.query_selector("div.companyLocation, [data-testid='text-location']")
                    link_el = card.query_selector("h2 a[href], h2.jobTitle a")
                    date_el = card.query_selector("span.date, [data-testid='myJobsStateDate']")

                    title = title_el.inner_text().strip() if title_el else ""
                    if not title:
                        continue
                    company = company_el.inner_text().strip() if company_el else "Unknown"
                    location = location_el.inner_text().strip() if location_el else "France"
                    href = link_el.get_attribute("href") if link_el else ""
                    if href and not href.startswith("http"):
                        href = "https://fr.indeed.com" + href
                    date_text = date_el.inner_text().strip() if date_el else ""

                    jobs.append({
                        "title": title,
                        "company": company,
                        "location": location,
                        "url": href or "https://fr.indeed.com",
                        "source": "Indeed",
                        "publishedAt": date_text or datetime.now(timezone.utc).isoformat(),
                    })

            browser.close()
        print(f"Indeed: {len(jobs)} jobs")
    except Exception as e:
        print(f"Indeed error: {e}")
    return jobs


def main():
    print("Scraping jobs...")
    wttj = scrape_wttj()
    indeed = scrape_indeed()

    all_jobs = wttj + indeed

    def sort_key(j):
        d = j["publishedAt"]
        try:
            return datetime.fromisoformat(d.replace("Z", "+00:00")).isoformat()
        except Exception:
            return "0"

    all_jobs.sort(key=sort_key, reverse=True)

    os.makedirs(os.path.dirname(os.path.abspath(OUTPUT)), exist_ok=True)
    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(all_jobs, f, ensure_ascii=False, indent=2)
    print(f"Wrote {len(all_jobs)} jobs → {OUTPUT}")


if __name__ == "__main__":
    main()
