"""Conference storage backed by Firestore."""

import logging
from datetime import datetime, timezone
from typing import Optional

from google.cloud.firestore_v1 import FieldFilter

from app.firebase_client import get_firestore_client
from app.models import ConferenceBase, ConferenceInDB

logger = logging.getLogger(__name__)

COLLECTION_NAME = "conferences"


def _doc_to_conference(doc) -> ConferenceInDB:
    data = doc.to_dict()
    data["id"] = doc.id
    # Firestore Timestamps → datetime (already datetime-like, just pass through)
    for field in ("date_parsed", "created_at", "updated_at"):
        val = data.get(field)
        if val and hasattr(val, "isoformat"):
            data[field] = val
    return ConferenceInDB(**data)


async def save_conferences(conferences: list[ConferenceBase]) -> int:
    """Save scraped conferences to Firestore. Returns count of new records."""
    db = get_firestore_client()
    collection = db.collection(COLLECTION_NAME)
    saved = 0

    for conf in conferences:
        existing = (
            collection
            .where(filter=FieldFilter("name_lower", "==", conf.name.lower().strip()))
            .limit(1)
            .get()
        )
        if list(existing):
            logger.info("Skipping duplicate: %s", conf.name)
            continue

        data = conf.model_dump()
        data["name_lower"] = conf.name.lower().strip()
        data["created_at"] = datetime.now(timezone.utc)
        data["updated_at"] = datetime.now(timezone.utc)
        collection.add(data)
        saved += 1
        logger.info("Saved: %s", conf.name)

    return saved


async def get_all_conferences(
    category: Optional[str] = None,
    sort_by_date: bool = True,
) -> list[ConferenceInDB]:
    db = get_firestore_client()
    collection = db.collection(COLLECTION_NAME)
    query = collection
    if category:
        query = query.where(filter=FieldFilter("category", "==", category))

    docs = query.stream()
    conferences = [_doc_to_conference(doc) for doc in docs]

    if sort_by_date:
        now = datetime.now(timezone.utc)

        def sort_key(c: ConferenceInDB):
            if c.date_parsed:
                dp = c.date_parsed
                if dp.tzinfo is None:
                    dp = dp.replace(tzinfo=timezone.utc)
                diff = (dp - now).total_seconds()
                return (0, diff) if diff >= 0 else (1, -diff)
            return (2, 0)

        conferences.sort(key=sort_key)

    return conferences


async def get_conference_by_id(conference_id: str) -> Optional[ConferenceInDB]:
    db = get_firestore_client()
    doc = db.collection(COLLECTION_NAME).document(conference_id).get()
    if doc.exists:
        return _doc_to_conference(doc)
    return None


async def delete_conference(conference_id: str) -> bool:
    db = get_firestore_client()
    doc_ref = db.collection(COLLECTION_NAME).document(conference_id)
    if doc_ref.get().exists:
        doc_ref.delete()
        return True
    return False


async def update_conference(
    conference_id: str, data: dict
) -> Optional[ConferenceInDB]:
    db = get_firestore_client()
    doc_ref = db.collection(COLLECTION_NAME).document(conference_id)
    if not doc_ref.get().exists:
        return None
    data["updated_at"] = datetime.now(timezone.utc)
    if "name" in data:
        data["name_lower"] = data["name"].lower().strip()
    doc_ref.update(data)
    return _doc_to_conference(doc_ref.get())


async def get_stats() -> dict:
    db = get_firestore_client()
    collection = db.collection(COLLECTION_NAME)
    all_docs = list(collection.stream())
    total = len(all_docs)

    conferences_count = awards_count = upcoming_count = 0
    now = datetime.now(timezone.utc)

    for doc in all_docs:
        d = doc.to_dict()
        if d.get("category") == "award":
            awards_count += 1
        else:
            conferences_count += 1
        dp = d.get("date_parsed")
        if dp:
            if hasattr(dp, "tzinfo") and dp.tzinfo is None:
                dp = dp.replace(tzinfo=timezone.utc)
            if dp >= now:
                upcoming_count += 1

    return {
        "total": total,
        "conferences": conferences_count,
        "awards": awards_count,
        "upcoming": upcoming_count,
    }


