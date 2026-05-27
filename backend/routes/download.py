"""Download routes: /download (metadata + sources) + /proxy-download (file stream)."""
import logging
import re
import urllib.parse
from typing import AsyncIterator

import httpx
from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from slowapi import Limiter
from slowapi.util import get_remote_address

from config import API_TIMEOUT_SECONDS, PROXY_CHUNK_SIZE, PROXY_STREAM_TIMEOUT_SECONDS
from db import get_cached_response, store_cached_response
from models import DownloadRequest, DownloadResponse
from platforms import (
    detect_platform,
    fetch_facebook_video,
    fetch_instagram_video,
    fetch_tiktok_video,
    fetch_twitter_video,
    fetch_youtube_video,
    parse_facebook_response,
    parse_instagram_response,
    parse_tiktok_response,
    parse_twitter_response,
    parse_youtube_response,
)

logger = logging.getLogger(__name__)
limiter = Limiter(key_func=get_remote_address)

router = APIRouter()

# Map platform id to (fetch_fn, parse_fn) — keeps download_video small.
_PLATFORM_HANDLERS = {
    "youtube": (fetch_youtube_video, parse_youtube_response),
    "instagram": (fetch_instagram_video, parse_instagram_response),
    "tiktok": (fetch_tiktok_video, parse_tiktok_response),
    "twitter": (fetch_twitter_video, parse_twitter_response),
    "facebook": (fetch_facebook_video, parse_facebook_response),
}


# ---------- /api/download ----------

async def _dispatch(platform: str, url: str) -> DownloadResponse:
    """Call the right platform handler. Raises if platform unsupported."""
    handler = _PLATFORM_HANDLERS.get(platform)
    if not handler:
        raise HTTPException(status_code=400, detail="Platform not supported")
    fetch_fn, parse_fn = handler
    api_response = await fetch_fn(url)
    return parse_fn(api_response)


@router.post("/download", response_model=DownloadResponse)
@limiter.limit("30/minute")
async def download_video(request: Request, download_req: DownloadRequest):
    url = download_req.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")

    platform = detect_platform(url)
    if not platform:
        raise HTTPException(
            status_code=400,
            detail="Unsupported URL. Please use a link from YouTube, Instagram, TikTok, Twitter/X, or Facebook.",
        )

    cached = await get_cached_response(url)
    if cached:
        cached["cached"] = True
        return DownloadResponse(**cached)

    try:
        result = await _dispatch(platform, url)
    except httpx.HTTPStatusError as e:
        logger.error("API error for %s: %s - %s", platform, e.response.status_code, e.response.text)
        raise HTTPException(
            status_code=503,
            detail=f"Unable to fetch from {platform}. The content may be private or unavailable.",
        ) from e
    except httpx.TimeoutException as e:
        logger.error("Timeout fetching from %s", platform)
        raise HTTPException(status_code=504, detail="Request timed out. Please try again.") from e
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error processing %s URL: %s", platform, str(e))
        raise HTTPException(
            status_code=500,
            detail="An error occurred while processing your request. Please try again.",
        ) from e

    if result.success and result.download_options:
        await store_cached_response(url, platform, result.model_dump())

    return result


# ---------- /api/proxy-download ----------

_INVALID_FILENAME_RE = re.compile(r"[^\w\s\-\.]")
_ALLOWED_EXTS = (".mp4", ".webm", ".mp3", ".m4a")


def _sanitize_filename(filename: str) -> str:
    safe = _INVALID_FILENAME_RE.sub("", filename or "")
    if not safe:
        safe = "video.mp4"
    if not safe.endswith(_ALLOWED_EXTS):
        safe += ".mp4"
    return safe


async def _stream_remote(url: str) -> AsyncIterator[bytes]:
    async with httpx.AsyncClient(
        timeout=PROXY_STREAM_TIMEOUT_SECONDS, follow_redirects=True
    ) as client:
        async with client.stream("GET", url) as response:
            response.raise_for_status()
            async for chunk in response.aiter_bytes(chunk_size=PROXY_CHUNK_SIZE):
                yield chunk


async def _head_info(url: str) -> dict:
    """Best-effort metadata via HEAD; returns defaults on failure."""
    try:
        async with httpx.AsyncClient(
            timeout=API_TIMEOUT_SECONDS, follow_redirects=True
        ) as client:
            head = await client.head(url)
        return {
            "content_type": head.headers.get("content-type", "video/mp4"),
            "content_length": head.headers.get("content-length"),
        }
    except Exception:
        return {"content_type": "video/mp4", "content_length": None}


@router.get("/proxy-download")
@limiter.limit("10/minute")
async def proxy_download(
    request: Request,
    url: str = Query(..., description="Video URL to download"),
    filename: str = Query("video.mp4", description="Filename for download"),
):
    """Stream a remote file through the backend with Content-Disposition: attachment."""
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")

    decoded_url = urllib.parse.unquote(url)
    safe_filename = _sanitize_filename(filename)

    try:
        info = await _head_info(decoded_url)
        headers = {
            "Content-Disposition": f'attachment; filename="{safe_filename}"',
            "Content-Type": info["content_type"],
            "Cache-Control": "no-cache",
            "Access-Control-Expose-Headers": "Content-Disposition",
        }
        if info["content_length"]:
            headers["Content-Length"] = info["content_length"]

        return StreamingResponse(
            _stream_remote(decoded_url),
            headers=headers,
            media_type=info["content_type"],
        )
    except httpx.HTTPStatusError as e:
        logger.error("HTTP error during proxy download: %s", e.response.status_code)
        raise HTTPException(status_code=502, detail="Failed to fetch video from source") from e
    except Exception as e:
        logger.error("Error in proxy download: %s", str(e))
        raise HTTPException(status_code=500, detail="Failed to process download") from e
