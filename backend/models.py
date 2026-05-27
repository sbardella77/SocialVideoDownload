"""Pydantic models shared across SaveFlex backend."""
import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any

from pydantic import BaseModel, Field, ConfigDict


class VideoMetadata(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    duration: Optional[int] = None
    thumbnail_url: Optional[str] = None
    author: Optional[str] = None
    view_count: Optional[int] = None
    platform: str


class DownloadOption(BaseModel):
    quality: str
    format: str
    url: str
    size: Optional[str] = None


class DownloadRequest(BaseModel):
    url: str


class DownloadResponse(BaseModel):
    success: bool
    message: str
    platform: Optional[str] = None
    metadata: Optional[VideoMetadata] = None
    download_options: Optional[List[DownloadOption]] = None
    error: Optional[str] = None
    cached: bool = False


class CachedDownload(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    url: str
    platform: str
    response_data: Dict[str, Any]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc) + timedelta(hours=1)
    )
