from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ConferenceBase(BaseModel):
    name: str
    date: Optional[str] = None
    date_parsed: Optional[datetime] = None
    venue: Optional[str] = None
    description: Optional[str] = None
    url: Optional[str] = None
    category: str = "conference"  # "conference" or "award"
    sector: str = "oil_and_gas"
    topics: list[str] = Field(default_factory=list)
    source: Optional[str] = None


class ConferenceInDB(ConferenceBase):
    id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class ConferenceResponse(ConferenceInDB):
    pass


class ScrapeRequest(BaseModel):
    keywords: list[str] = Field(
        default_factory=lambda: [
            "oil gas digital transformation conference",
            "oil gas AI ML conference",
            "petroleum technology conference",
            "oil gas innovation awards",
            "energy digital transformation summit",
            "oil gas artificial intelligence conference",
        ]
    )
    max_results_per_keyword: int = Field(default=10, ge=1, le=50)


class ScrapeStatus(BaseModel):
    status: str
    message: str
    total_found: int = 0
    keywords_processed: int = 0


class KeywordList(BaseModel):
    keywords: list[str]
