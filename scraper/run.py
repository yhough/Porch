#!/usr/bin/env python3
"""
Porch Civic Intelligence — Ithaca AgendaCenter Pipeline

Usage:
    python3 run.py            # scrape, download, extract
    python3 run.py --dry-run  # show what would be downloaded, don't download
"""

import argparse
import sys
import time
from pathlib import Path

from scraper import run_scraper, fetch_documents, load_seen
from extractor import process_pdf


def main(dry_run: bool = False) -> None:
    print("=" * 60)
    print("  Porch — Ithaca AgendaCenter Scraper")
    print("=" * 60)

    if dry_run:
        print("\n[DRY RUN — no files will be written]\n")
        seen = load_seen()
        all_docs = fetch_documents()
        new_docs = [d for d in all_docs if d["url"] not in seen]
        print(f"  Total documents on page : {len(all_docs)}")
        print(f"  Already downloaded      : {len(all_docs) - len(new_docs)}")
        print(f"  Would download          : {len(new_docs)}\n")
        for doc in new_docs[:20]:
            print(f"    {doc['date']}  [{doc['category']}]  {doc['doc_type']}  {doc['title'][:60]}")
        if len(new_docs) > 20:
            print(f"    … and {len(new_docs) - 20} more")
        return

    # ── Step 1: Scrape and download ───────────────────────────────────────────
    print("\n[Step 1] Scraping AgendaCenter and downloading new PDFs…\n")
    t0 = time.time()
    downloaded, already_seen = run_scraper()
    elapsed_dl = time.time() - t0
    print(f"\n  Downloaded {len(downloaded)} new PDFs in {elapsed_dl:.1f}s.")

    if not downloaded:
        print("\n  Nothing new to process. All done.")
        _print_summary(0, 0, 0)
        return

    # ── Step 2: Extract text ──────────────────────────────────────────────────
    print("\n[Step 2] Extracting text from PDFs…\n")
    t1 = time.time()
    metadata_records = []
    ocr_flagged = 0

    for doc in downloaded:
        record = process_pdf(doc)
        metadata_records.append(record)
        if record.get("needs_ocr"):
            ocr_flagged += 1

    elapsed_ex = time.time() - t1
    print(f"\n  Extracted text from {len(metadata_records)} PDFs in {elapsed_ex:.1f}s.")

    _print_summary(len(downloaded), len(metadata_records), ocr_flagged)


def _print_summary(found: int, extracted: int, ocr: int) -> None:
    print("\n" + "=" * 60)
    print("  SUMMARY")
    print("=" * 60)
    print(f"  New documents found    : {found}")
    print(f"  PDFs downloaded        : {found}")
    print(f"  Text extracted         : {extracted}")
    print(f"  Flagged for OCR        : {ocr}")
    print(f"  Metadata written to    : scraper/data/metadata.jsonl")
    print(f"  OCR queue at           : scraper/data/ocr_queue.json")
    print("=" * 60)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ithaca AgendaCenter scraper")
    parser.add_argument("--dry-run", action="store_true", help="List new docs without downloading")
    args = parser.parse_args()
    main(dry_run=args.dry_run)
