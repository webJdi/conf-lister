import csv
import io
import logging
from typing import Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse

from app.auth import get_current_user
from app.models import ScrapeRequest, ScrapeStatus, ConferenceResponse
from app.scraper import scrape_search_results
from app.services import (
    save_conferences,
    get_all_conferences,
    get_conference_by_id,
    delete_conference,
    update_conference,
    get_stats,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["conferences"])

# In-memory scrape status tracker
_scrape_status: dict = {"status": "idle", "message": "No scrape running", "total_found": 0, "keywords_processed": 0}


@router.post("/scrape", response_model=ScrapeStatus)
async def trigger_scrape(
    request: ScrapeRequest,
    user: dict = Depends(get_current_user),
):
    """Trigger a new scrape with the given keywords."""
    global _scrape_status
    _scrape_status = {
        "status": "running",
        "message": "Scraping in progress...",
        "total_found": 0,
        "keywords_processed": 0,
    }

    try:
        results = await scrape_search_results(
            keywords=request.keywords,
            max_results_per_keyword=request.max_results_per_keyword,
        )
        _scrape_status["keywords_processed"] = len(request.keywords)

        saved_count = await save_conferences(results)

        _scrape_status = {
            "status": "completed",
            "message": f"Scrape completed. Found {len(results)} results, saved {saved_count} new records.",
            "total_found": len(results),
            "keywords_processed": len(request.keywords),
        }
    except Exception as e:
        logger.error(f"Scrape failed: {e}")
        _scrape_status = {
            "status": "error",
            "message": f"Scrape failed: {str(e)}",
            "total_found": 0,
            "keywords_processed": 0,
        }
        raise HTTPException(status_code=500, detail=str(e))

    return ScrapeStatus(**_scrape_status)


@router.get("/scrape/status", response_model=ScrapeStatus)
async def get_scrape_status(user: dict = Depends(get_current_user)):
    """Get the current scrape status."""
    return ScrapeStatus(**_scrape_status)


@router.get("/conferences", response_model=list[ConferenceResponse])
async def list_conferences(
    category: Optional[str] = Query(None, description="Filter by 'conference' or 'award'"),
    user: dict = Depends(get_current_user),
):
    """List all conferences/awards sorted by closest date."""
    return await get_all_conferences(category=category)


@router.get("/conferences/download")
async def download_conferences(
    category: Optional[str] = Query(None),
    user: dict = Depends(get_current_user),
):
    """Download conferences as CSV."""
    conferences = await get_all_conferences(category=category)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Name", "Date", "Venue", "Category", "Topics", "Description", "URL"])

    for conf in conferences:
        writer.writerow([
            conf.name,
            conf.date or "",
            conf.venue or "",
            conf.category,
            ", ".join(conf.topics),
            conf.description or "",
            conf.url or "",
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=conferences.csv"},
    )


@router.get("/conferences/{conference_id}", response_model=ConferenceResponse)
async def get_conference(
    conference_id: str,
    user: dict = Depends(get_current_user),
):
    """Get a single conference by ID."""
    conf = await get_conference_by_id(conference_id)
    if not conf:
        raise HTTPException(status_code=404, detail="Conference not found")
    return conf


@router.delete("/conferences/{conference_id}")
async def remove_conference(
    conference_id: str,
    user: dict = Depends(get_current_user),
):
    """Delete a conference."""
    deleted = await delete_conference(conference_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Conference not found")
    return {"message": "Conference deleted"}


@router.put("/conferences/{conference_id}", response_model=ConferenceResponse)
async def edit_conference(
    conference_id: str,
    data: dict = Body(...),
    user: dict = Depends(get_current_user),
):
    """Update a conference."""
    # Only allow updating specific fields
    allowed_fields = {"name", "date", "venue", "description", "category", "topics", "url"}
    filtered = {k: v for k, v in data.items() if k in allowed_fields}
    if not filtered:
        raise HTTPException(status_code=400, detail="No valid fields to update")

    updated = await update_conference(conference_id, filtered)
    if not updated:
        raise HTTPException(status_code=404, detail="Conference not found")
    return updated


@router.get("/stats")
async def dashboard_stats(user: dict = Depends(get_current_user)):
    """Get dashboard statistics."""
    return await get_stats()
