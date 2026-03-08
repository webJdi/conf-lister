import re
import logging
from datetime import datetime
from typing import Optional
from urllib.parse import quote_plus

import httpx
from bs4 import BeautifulSoup

from app.models import ConferenceBase

logger = logging.getLogger(__name__)

# Common date patterns to extract from text
DATE_PATTERNS = [
    # "January 15-17, 2026" or "January 15 - 17, 2026"
    r"(\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}\s*[-–]\s*\d{1,2},?\s*\d{4}\b)",
    # "15-17 January 2026"
    r"(\b\d{1,2}\s*[-–]\s*\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December),?\s*\d{4}\b)",
    # "January 15, 2026"
    r"(\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s*\d{4}\b)",
    # "15 January 2026"
    r"(\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December),?\s*\d{4}\b)",
    # "Jan 15-17, 2026"
    r"(\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}\s*[-–]\s*\d{1,2},?\s*\d{4}\b)",
    # "Jan 15, 2026"
    r"(\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s*\d{4}\b)",
    # "2026-01-15"
    r"(\b\d{4}-\d{2}-\d{2}\b)",
]

# Patterns to parse dates
PARSE_DATE_FORMATS = [
    "%B %d, %Y",
    "%B %d %Y",
    "%d %B %Y",
    "%d %B, %Y",
    "%b %d, %Y",
    "%b %d %Y",
    "%Y-%m-%d",
]

OIL_GAS_KEYWORDS = [
    "oil", "gas", "petroleum", "energy", "upstream", "downstream",
    "midstream", "refin", "drilling", "subsea", "offshore", "LNG",
    "hydrocarbon", "pipeline", "reservoir",
]

TECH_KEYWORDS = [
    "digital transformation", "AI", "artificial intelligence",
    "machine learning", "ML", "data analytics", "IoT",
    "automation", "cloud", "innovation", "technology",
    "cyber", "digital twin", "predictive",
]


def _extract_date(text: str) -> tuple[Optional[str], Optional[datetime]]:
    """Extract the first date found in text."""
    for pattern in DATE_PATTERNS:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            date_str = match.group(1)
            # Clean range dates to just the start date for parsing
            clean = re.sub(r"\s*[-–]\s*\d{1,2}", "", date_str)
            for fmt in PARSE_DATE_FORMATS:
                try:
                    parsed = datetime.strptime(clean.strip().replace(",", ", ").replace("  ", " "), fmt)
                    return date_str, parsed
                except ValueError:
                    continue
            return date_str, None
    return None, None


def _is_relevant(text: str) -> bool:
    """Check if text is relevant to oil & gas + digital/AI topics."""
    text_lower = text.lower()
    has_oil_gas = any(kw.lower() in text_lower for kw in OIL_GAS_KEYWORDS)
    has_tech = any(kw.lower() in text_lower for kw in TECH_KEYWORDS)
    return has_oil_gas and has_tech


def _extract_topics(text: str) -> list[str]:
    """Extract relevant topic tags from text."""
    topics = []
    text_lower = text.lower()
    tag_map = {
        "Digital Transformation": ["digital transformation"],
        "AI/ML": ["artificial intelligence", " ai ", " ml ", "machine learning"],
        "IoT": ["iot", "internet of things"],
        "Data Analytics": ["data analytics", "big data", "data science"],
        "Cloud": ["cloud computing", "cloud"],
        "Automation": ["automation", "robotic"],
        "Cybersecurity": ["cyber", "security"],
        "Digital Twin": ["digital twin"],
        "Predictive Maintenance": ["predictive maintenance", "predictive analytics"],
    }
    for tag, keywords in tag_map.items():
        if any(kw in text_lower for kw in keywords):
            topics.append(tag)
    return topics


async def scrape_search_results(
    keywords: list[str], max_results_per_keyword: int = 10
) -> list[ConferenceBase]:
    """
    Scrape search engine results for conference/award listings.
    Uses DuckDuckGo HTML search to avoid API key requirements.
    """
    all_conferences: list[ConferenceBase] = []
    seen_names: set[str] = set()

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    }

    async with httpx.AsyncClient(
        headers=headers, timeout=30.0, follow_redirects=True
    ) as client:
        for keyword in keywords:
            try:
                search_url = f"https://html.duckduckgo.com/html/?q={quote_plus(keyword)}"
                response = await client.get(search_url)
                response.raise_for_status()

                soup = BeautifulSoup(response.text, "lxml")
                results = soup.select(".result__body")[:max_results_per_keyword]

                for result in results:
                    try:
                        title_el = result.select_one(".result__title a, .result__a")
                        snippet_el = result.select_one(
                            ".result__snippet, .result__description"
                        )

                        if not title_el:
                            continue

                        title = title_el.get_text(strip=True)
                        url = title_el.get("href", "")
                        snippet = (
                            snippet_el.get_text(strip=True) if snippet_el else ""
                        )

                        full_text = f"{title} {snippet}"

                        # Skip if not relevant or already seen
                        name_key = re.sub(r"\W+", " ", title.lower()).strip()
                        if name_key in seen_names:
                            continue
                        if not _is_relevant(full_text):
                            continue

                        seen_names.add(name_key)

                        date_str, date_parsed = _extract_date(full_text)
                        topics = _extract_topics(full_text)

                        # Determine category
                        category = "conference"
                        if any(
                            w in full_text.lower()
                            for w in ["award", "recognition", "prize", "winner"]
                        ):
                            category = "award"

                        # Attempt to extract venue (city, country patterns)
                        venue = None
                        venue_match = re.search(
                            r"(?:in|at|held at|venue[:\s])\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)*(?:,\s*[A-Z][a-z]+(?:\s[A-Z][a-z]+)*)?)",
                            full_text,
                        )
                        if venue_match:
                            venue = venue_match.group(1)

                        conf = ConferenceBase(
                            name=title,
                            date=date_str,
                            date_parsed=date_parsed,
                            venue=venue,
                            description=snippet[:500] if snippet else None,
                            url=str(url) if url else None,
                            category=category,
                            sector="oil_and_gas",
                            topics=topics,
                            source=keyword,
                        )
                        all_conferences.append(conf)

                    except Exception as e:
                        logger.warning(f"Error parsing result: {e}")
                        continue

            except Exception as e:
                logger.error(f"Error scraping keyword '{keyword}': {e}")
                continue

    # Now try to enrich from known conference listing sites
    known_sources = [
        "https://10times.com/technology/oil-gas",
        "https://www.conferenceindex.org/conferences/petroleum",
    ]
    for source_url in known_sources:
        try:
            async with httpx.AsyncClient(
                headers=headers, timeout=30.0, follow_redirects=True
            ) as client:
                resp = await client.get(source_url)
                if resp.status_code == 200:
                    soup = BeautifulSoup(resp.text, "lxml")
                    # Extract event cards/listings
                    events = soup.select(
                        ".event-card, .conference-listing, article, .listing-item, .event-item"
                    )
                    for event in events[:max_results_per_keyword]:
                        try:
                            name_el = event.select_one(
                                "h2, h3, h4, .event-name, .title, a"
                            )
                            if not name_el:
                                continue
                            name = name_el.get_text(strip=True)
                            name_key = re.sub(r"\W+", " ", name.lower()).strip()
                            if name_key in seen_names or not name:
                                continue

                            event_text = event.get_text(" ", strip=True)
                            if not _is_relevant(event_text):
                                continue

                            seen_names.add(name_key)
                            date_str, date_parsed = _extract_date(event_text)
                            topics = _extract_topics(event_text)
                            venue_el = event.select_one(
                                ".venue, .location, .place"
                            )
                            venue = (
                                venue_el.get_text(strip=True)
                                if venue_el
                                else None
                            )

                            conf = ConferenceBase(
                                name=name,
                                date=date_str,
                                date_parsed=date_parsed,
                                venue=venue,
                                description=event_text[:500],
                                url=source_url,
                                category="conference",
                                sector="oil_and_gas",
                                topics=topics,
                                source=source_url,
                            )
                            all_conferences.append(conf)
                        except Exception as e:
                            logger.warning(f"Error parsing event from {source_url}: {e}")
                            continue
        except Exception as e:
            logger.warning(f"Error fetching {source_url}: {e}")

    return all_conferences
