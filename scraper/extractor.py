"""
Extracts text from downloaded PDFs using pdfplumber.
Flags low-yield extractions for OCR in data/ocr_queue.json.
"""

import json
from pathlib import Path

import pdfplumber

DATA_DIR = Path(__file__).parent / "data"
TEXT_DIR = DATA_DIR / "text"
METADATA_FILE = DATA_DIR / "metadata.jsonl"
OCR_QUEUE_FILE = DATA_DIR / "ocr_queue.json"

# If a multi-page doc yields fewer than this many chars, flag for OCR
OCR_CHAR_THRESHOLD = 100


def extract_text(pdf_path: Path) -> tuple[str, bool]:
    """
    Returns (extracted_text, needs_ocr).
    needs_ocr is True when text is suspiciously short for a multi-page doc.
    """
    try:
        with pdfplumber.open(pdf_path) as pdf:
            pages = pdf.pages
            page_count = len(pages)
            text = "\n\n".join(
                (page.extract_text() or "") for page in pages
            ).strip()
            needs_ocr = page_count > 1 and len(text) < OCR_CHAR_THRESHOLD
            return text, needs_ocr
    except Exception as e:
        print(f"  ✗  pdfplumber failed on {pdf_path.name}: {e}")
        return "", True


def load_ocr_queue() -> list[dict]:
    if OCR_QUEUE_FILE.exists():
        return json.loads(OCR_QUEUE_FILE.read_text())
    return []


def save_ocr_queue(queue: list[dict]) -> None:
    OCR_QUEUE_FILE.write_text(json.dumps(queue, indent=2))


def process_pdf(doc: dict) -> dict:
    """
    Extracts text from doc["raw_path"], saves to data/text/, writes metadata.
    Returns the completed metadata record.
    """
    TEXT_DIR.mkdir(parents=True, exist_ok=True)

    raw_path = Path(doc["raw_path"])
    text_path = TEXT_DIR / f"{doc['filename']}.txt"

    text, needs_ocr = extract_text(raw_path)

    if needs_ocr:
        ocr_queue = load_ocr_queue()
        ocr_queue.append({"raw_path": str(raw_path), "reason": "low text yield"})
        save_ocr_queue(ocr_queue)
        print(f"  ⚑ Flagged for OCR: {raw_path.name} ({len(text)} chars extracted)")
    else:
        print(f"  ✓ Extracted {len(text):,} chars from {raw_path.name}")

    text_path.write_text(text, encoding="utf-8")

    metadata = {
        "source": "city_of_ithaca",
        "jurisdiction": "Ithaca, NY",
        "doc_type": doc["doc_type"],
        "category": doc["category"],
        "date": doc["date"],
        "title": doc["title"],
        "url": doc["url"],
        "doc_id": doc["doc_id"],
        "text_path": str(text_path),
        "raw_path": str(raw_path),
        "extracted_text_length": len(text),
        "needs_ocr": needs_ocr,
    }

    # Append to the JSONL file
    with open(METADATA_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(metadata) + "\n")

    return metadata
