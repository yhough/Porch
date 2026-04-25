"""
Scrapes the City of Ithaca AgendaCenter for agenda and minutes PDFs.
Page is static HTML served by CivicEngage — no Playwright needed.

URL structure:
  /AgendaCenter/ViewFile/Agenda/_MMDDYYYY-{id}   → PDF (after one 301 redirect)
  /AgendaCenter/ViewFile/Minutes/_MMDDYYYY-{id}  → PDF (after one 301 redirect)
"""

import json
import re
import time
from datetime import datetime
from pathlib import Path
from urllib.parse import urljoin

from typing import Optional

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://www.cityofithaca.org"
AGENDA_CENTER_URL = f"{BASE_URL}/AgendaCenter"
DATA_DIR = Path(__file__).parent / "data"
RAW_DIR = DATA_DIR / "raw"
SEEN_FILE = DATA_DIR / "seen_links.json"
METADATA_FILE = DATA_DIR / "metadata.jsonl"
OCR_QUEUE_FILE = DATA_DIR / "ocr_queue.json"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}

# Slug-safe category name
def _slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", text.lower()).strip("_")


def _parse_date_from_url(href: str) -> Optional[str]:
    """Extract YYYY-MM-DD from URL fragment like _04142026-3191."""
    m = re.search(r"_(\d{2})(\d{2})(\d{4})-", href)
    if not m:
        return None
    month, day, year = m.group(1), m.group(2), m.group(3)
    try:
        return datetime(int(year), int(month), int(day)).strftime("%Y-%m-%d")
    except ValueError:
        return None


def _parse_title_from_aria(label: str) -> str:
    """
    Strip trailing doc-type suffix and leading date from aria-label.
    Input:  'April 14, 2026, City of Ithaca BZA April Agenda Packet. Agenda'
    Output: 'City of Ithaca BZA April Agenda Packet'
    """
    for suffix in (". Agenda", ". Minutes", ". Previous Version"):
        if label.endswith(suffix):
            label = label[: -len(suffix)]
            break
    # Date prefix is "Month DD, YYYY, " — skip first two comma-separated parts
    parts = label.split(", ", 2)
    if len(parts) == 3:
        return parts[2].strip()
    if len(parts) == 2:
        return parts[1].strip()
    return label.strip()


def fetch_documents() -> list[dict]:
    """
    Parse the AgendaCenter HTML and return a list of document records.
    Each record has: title, category, date, doc_type, url, doc_id.
    """
    resp = requests.get(AGENDA_CENTER_URL, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "lxml")

    documents = []

    # Each category is an <h2> followed by a <div id="category-panel-{N}">
    for h2 in soup.find_all("h2", attrs={"data-cp-toggle": "collapse"}):
        category_name = h2.get_text(strip=True)
        panel_id = h2.get("aria-controls", "")
        panel = soup.find("div", id=panel_id)
        if not panel:
            continue

        # Agenda links — class="pdf" inside the popout, or the main row anchor
        for a in panel.find_all("a", class_="pdf"):
            href = a.get("href", "")
            label = a.get("aria-label", "")

            if "/ViewFile/Agenda/" in href:
                doc_type = "agenda"
            elif "/ViewFile/Minutes/" in href:
                doc_type = "minutes"
            else:
                continue

            date_str = _parse_date_from_url(href)
            if not date_str:
                continue

            m = re.search(r"-(\d+)$", href)
            doc_id = m.group(1) if m else href.split("/")[-1]

            full_url = urljoin(BASE_URL, href)
            title = _parse_title_from_aria(label) if label else f"{category_name} {doc_type} {date_str}"

            documents.append({
                "title": title,
                "category": category_name,
                "date": date_str,
                "doc_type": doc_type,
                "url": full_url,
                "doc_id": doc_id,
            })

    # Deduplicate by URL (pdf class may appear multiple times in popout variants)
    seen = set()
    unique = []
    for doc in documents:
        if doc["url"] not in seen:
            seen.add(doc["url"])
            unique.append(doc)

    return unique


def load_seen() -> set[str]:
    if SEEN_FILE.exists():
        return set(json.loads(SEEN_FILE.read_text()))
    return set()


def save_seen(seen: set[str]) -> None:
    SEEN_FILE.write_text(json.dumps(sorted(seen), indent=2))


def download_pdf(url: str, dest: Path) -> bool:
    """Download a PDF with redirect following. Returns True on success."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=60, allow_redirects=True)
        resp.raise_for_status()
        if "pdf" not in resp.headers.get("content-type", "").lower():
            print(f"  ⚠  Unexpected content-type for {url}: {resp.headers.get('content-type')}")
            return False
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(resp.content)
        return True
    except Exception as e:
        print(f"  ✗  Download failed for {url}: {e}")
        return False


def make_filename(doc: dict) -> str:
    cat_slug = _slugify(doc["category"])[:40]
    return f"{doc['date']}_{cat_slug}_{doc['doc_type']}_{doc['doc_id']}"


def run_scraper() -> tuple[list[dict], list[dict]]:
    """
    Full scrape pass. Returns (new_docs, already_seen_docs).
    Downloads PDFs for new docs only.
    """
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    seen_urls = load_seen()
    all_docs = fetch_documents()
    print(f"  Found {len(all_docs)} total documents on the page.")

    new_docs = [d for d in all_docs if d["url"] not in seen_urls]
    print(f"  {len(new_docs)} are new (not yet downloaded).")

    downloaded = []
    for doc in new_docs:
        filename = make_filename(doc)
        dest = RAW_DIR / f"{filename}.pdf"
        print(f"  ↓ {doc['date']} [{doc['category']}] {doc['doc_type']} → {dest.name}")
        if download_pdf(doc["url"], dest):
            doc["raw_path"] = str(dest)
            doc["filename"] = filename
            downloaded.append(doc)
            seen_urls.add(doc["url"])
            save_seen(seen_urls)
        time.sleep(0.4)  # polite crawl rate

    return downloaded, [d for d in all_docs if d["url"] in seen_urls and d not in new_docs]
