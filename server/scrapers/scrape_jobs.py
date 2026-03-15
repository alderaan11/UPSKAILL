#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = ["requests", "playwright", "selenium", "webdriver-manager", "beautifulsoup4"]
# ///
"""Scrape French AI/ML job boards → public/scraped-jobs.json
Sources: WTTJ (Algolia), Indeed (Playwright), Hello Work, Jobijoba, Meteojob
Run twice daily via GitHub Actions.
"""

import json
import os
from datetime import datetime, timezone

import requests
from bs4 import BeautifulSoup

OUTPUT = os.path.join("/app/data", "scraped-jobs.json")

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

NOW = datetime.now(timezone.utc).isoformat()

# ── WTTJ via Algolia ────────────────────────────────────────────────────────

ALGOLIA_APP_ID = "CSEKHVMS53"
ALGOLIA_API_KEY = "4bd8f6215d0cc52b26430765769e65a0"
ALGOLIA_INDEX = "wttj_jobs_production_fr"


def scrape_wttj() -> list[dict]:
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
                "query": "machine learning data ia computer vision intelligence artificielle",
                "hitsPerPage": 20,
                "filters": "language:fr",
            },
            timeout=15,
        )
        if not res.ok:
            print(f"WTTJ: HTTP {res.status_code}")
            return []
        hits = res.json().get("hits", [])
        result = []
        for j in hits:
            org = j.get("organization") or {}
            offices = j.get("offices") or [{}]
            city = offices[0].get("city", "France") if offices else "France"
            org_slug, job_slug = org.get("slug", ""), j.get("slug", "")
            salary = None
            if j.get("salary_minimum") and j.get("salary_maximum"):
                salary = f"€{int(j['salary_minimum']//1000)}k–{int(j['salary_maximum']//1000)}k"
            result.append({
                "title": j.get("name", ""),
                "company": org.get("name", "Unknown"),
                "location": city,
                "url": (
                    f"https://www.welcometothejungle.com/fr/companies/{org_slug}/jobs/{job_slug}"
                    if org_slug and job_slug else "https://www.welcometothejungle.com/fr/jobs"
                ),
                "source": "Welcome to the Jungle",
                "publishedAt": j.get("published_at") or NOW,
                **({"salary": salary} if salary else {}),
            })
        print(f"WTTJ: {len(result)} jobs")
        return result
    except Exception as e:
        print(f"WTTJ error: {e}")
        return []


# ── Indeed via Playwright ───────────────────────────────────────────────────

def scrape_indeed() -> list[dict]:
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("Indeed: playwright not installed, skipping")
        return []

    jobs = []
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_context(
                user_agent=HEADERS["User-Agent"], locale="fr-FR"
            ).new_page()

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
                        "publishedAt": j.get("pubDate") or NOW,
                    })
            else:
                for card in page.query_selector_all("div.job_seen_beacon, div[data-jk]"):
                    title_el = card.query_selector("h2.jobTitle span[title], h2.jobTitle span")
                    company_el = card.query_selector("span.companyName, [data-testid='company-name']")
                    location_el = card.query_selector("div.companyLocation, [data-testid='text-location']")
                    link_el = card.query_selector("h2 a[href], h2.jobTitle a")
                    title = title_el.inner_text().strip() if title_el else ""
                    if not title:
                        continue
                    href = link_el.get_attribute("href") if link_el else ""
                    if href and not href.startswith("http"):
                        href = "https://fr.indeed.com" + href
                    jobs.append({
                        "title": title,
                        "company": company_el.inner_text().strip() if company_el else "Unknown",
                        "location": location_el.inner_text().strip() if location_el else "France",
                        "url": href or "https://fr.indeed.com",
                        "source": "Indeed",
                        "publishedAt": NOW,
                    })
            browser.close()
        print(f"Indeed: {len(jobs)} jobs")
    except Exception as e:
        print(f"Indeed error: {e}")
    return jobs


# ── Selenium helper ──────────────────────────────────────────────────────────

def _get_selenium_driver():
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.chrome.service import Service

    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1920,1080")
    options.add_argument(f"--user-agent={HEADERS['User-Agent']}")
    options.add_argument("--lang=fr-FR,fr;q=0.9")

    # GitHub Actions ships Chromium via apt; try that path first
    for binary, driver_path in [
        ("/usr/bin/chromium-browser", "/usr/bin/chromedriver"),
        ("/usr/bin/chromium", "/usr/bin/chromedriver"),
    ]:
        if os.path.exists(binary) and os.path.exists(driver_path):
            options.binary_location = binary
            return webdriver.Chrome(service=Service(driver_path), options=options)

    # Local dev fallback: webdriver-manager downloads the right ChromeDriver
    from webdriver_manager.chrome import ChromeDriverManager
    return webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)


def _selenium_get_html(url: str, wait_css: str, timeout: int = 15) -> str:
    """Load *url* with Selenium, wait for *wait_css* to appear, return page HTML."""
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.support.ui import WebDriverWait

    driver = _get_selenium_driver()
    try:
        driver.get(url)
        try:
            WebDriverWait(driver, timeout).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, wait_css))
            )
        except Exception:
            pass
        return driver.page_source
    finally:
        driver.quit()


# ── Hello Work via Selenium + BeautifulSoup ──────────────────────────────────

def scrape_hellowork() -> list[dict]:
    try:
        html = _selenium_get_html(
            "https://www.hellowork.com/fr-fr/emploi/recherche.html"
            "?k=machine+learning+data+scientist+intelligence+artificielle&l=France",
            wait_css="a[href*='/emplois/']",
        )
    except Exception as e:
        print(f"Hello Work error: {e}")
        return []

    soup = BeautifulSoup(html, "html.parser")
    jobs = []

    for link in soup.select("a[href*='/emplois/']"):
        href = link.get("href", "")
        if not href.startswith("http"):
            href = "https://www.hellowork.com" + href

        li = link.find_parent("li")
        if not li:
            continue

        title_el = li.find(["h2", "h3", "strong"])
        title = title_el.get_text(strip=True) if title_el else link.get_text(strip=True)
        title = title.split("|")[0].strip()
        if not title:
            continue

        # Collect non-empty text nodes from spans/divs after the title
        texts = [
            s.get_text(strip=True)
            for s in li.select("span, p, div")
            if s.get_text(strip=True) and s.get_text(strip=True) != title
        ]
        company = texts[0] if len(texts) > 0 else "Unknown"
        location = texts[1] if len(texts) > 1 else "France"

        jobs.append({
            "title": title,
            "company": company,
            "location": location,
            "url": href,
            "source": "Hello Work",
            "publishedAt": NOW,
        })

    print(f"Hello Work: {len(jobs)} jobs")
    return jobs


# ── Jobijoba via Selenium + BeautifulSoup ────────────────────────────────────

def scrape_jobijoba() -> list[dict]:
    try:
        html = _selenium_get_html(
            "https://www.jobijoba.com/fr/jobs"
            "?q=machine+learning+data+scientist+intelligence+artificielle&l=France",
            wait_css="article, div[class*='offer'], li[class*='offer']",
        )
    except Exception as e:
        print(f"Jobijoba error: {e}")
        return []

    soup = BeautifulSoup(html, "html.parser")
    jobs = []

    for card in soup.select("article, div[class*='offer-item'], li[class*='offer'], div[class*='job-card']"):
        link_el = card.find("a", href=True)
        if not link_el:
            continue
        href = link_el["href"]
        if not href.startswith("http"):
            href = "https://www.jobijoba.com" + href

        title_el = card.find(["h2", "h3"]) or card.find(class_=lambda c: c and "title" in c)
        title = title_el.get_text(strip=True) if title_el else link_el.get_text(strip=True).split("\n")[0].strip()
        if not title:
            continue

        company_el = card.find(class_=lambda c: c and ("company" in c or "employer" in c))
        location_el = card.find(class_=lambda c: c and ("location" in c or "city" in c))

        jobs.append({
            "title": title,
            "company": company_el.get_text(strip=True) if company_el else "Unknown",
            "location": location_el.get_text(strip=True) if location_el else "France",
            "url": href,
            "source": "Jobijoba",
            "publishedAt": NOW,
        })

    print(f"Jobijoba: {len(jobs)} jobs")
    return jobs


# ── Meteojob via Selenium + BeautifulSoup ────────────────────────────────────

def scrape_meteojob() -> list[dict]:
    try:
        html = _selenium_get_html(
            "https://www.meteojob.com/jobsearch/offers"
            "?query=machine+learning+data+scientist+intelligence+artificielle",
            wait_css="article, [class*='wj-card'], [class*='offer-card']",
        )
    except Exception as e:
        print(f"Meteojob error: {e}")
        return []

    soup = BeautifulSoup(html, "html.parser")
    jobs = []

    for card in soup.select("article, div[class*='wj-card'], div[class*='offer-card'], li[class*='job-offer']"):
        title_el = card.find(["h2", "h3"]) or card.find(class_=lambda c: c and "title" in c)
        title = title_el.get_text(strip=True) if title_el else ""
        if not title:
            continue

        link_el = card.find("a", href=True)
        href = link_el["href"] if link_el else ""
        if href and not href.startswith("http"):
            href = "https://www.meteojob.com" + href

        company_el = card.find(class_=lambda c: c and ("company" in c or "employer" in c or "wj-company" in c))
        location_el = card.find(class_=lambda c: c and ("location" in c or "wj-location" in c or "city" in c))

        jobs.append({
            "title": title,
            "company": company_el.get_text(strip=True) if company_el else "Unknown",
            "location": location_el.get_text(strip=True) if location_el else "France",
            "url": href or "https://www.meteojob.com",
            "source": "Meteojob",
            "publishedAt": NOW,
        })

    print(f"Meteojob: {len(jobs)} jobs")
    return jobs


# ── Main ────────────────────────────────────────────────────────────────────

def main():
    print("Scraping jobs...")
    scrapers = [
        scrape_wttj,
        scrape_indeed,
        scrape_hellowork,
        scrape_jobijoba,
        scrape_meteojob,
    ]
    all_jobs = []
    for scraper in scrapers:
        all_jobs.extend(scraper())

    def sort_key(j):
        try:
            return datetime.fromisoformat(j["publishedAt"].replace("Z", "+00:00")).isoformat()
        except Exception:
            return "0"

    all_jobs.sort(key=sort_key, reverse=True)

    # Deduplicate by URL
    seen: set[str] = set()
    unique = []
    for j in all_jobs:
        if j["url"] not in seen:
            seen.add(j["url"])
            unique.append(j)

    os.makedirs(os.path.dirname(os.path.abspath(OUTPUT)), exist_ok=True)
    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(unique, f, ensure_ascii=False, indent=2)
    print(f"Wrote {len(unique)} jobs → {OUTPUT}")


if __name__ == "__main__":
    main()
