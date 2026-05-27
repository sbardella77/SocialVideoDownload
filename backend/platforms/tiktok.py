"""TikTok fetch + parse."""
from typing import Any, Dict, List

import httpx

from config import API_TIMEOUT_SECONDS, RAPIDAPI_HOST, RAPIDAPI_KEY
from models import DownloadOption, DownloadResponse, VideoMetadata
from platforms.base import (
    error_response,
    extract_author_name,
    extract_error_message,
    parse_video_list,
    truncate_title,
)

PLATFORM = "tiktok"


async def fetch_tiktok_video(url: str) -> Dict[str, Any]:
    headers = {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": RAPIDAPI_HOST,
    }
    api_url = f"https://{RAPIDAPI_HOST}/tiktok/v3/post/details"
    async with httpx.AsyncClient(timeout=API_TIMEOUT_SECONDS) as client:
        response = await client.get(api_url, headers=headers, params={"url": url})
        response.raise_for_status()
        return response.json()


def _build_metadata(metadata_info: Dict[str, Any]) -> VideoMetadata:
    description = metadata_info.get("description", "")
    stats = metadata_info.get("stats") or {}
    return VideoMetadata(
        title=truncate_title(description) or "TikTok Video",
        description=description,
        duration=metadata_info.get("duration"),
        thumbnail_url=metadata_info.get("cover") or metadata_info.get("thumbnailUrl"),
        author=extract_author_name(metadata_info, "nickname", "uniqueId"),
        view_count=stats.get("playCount"),
        platform=PLATFORM,
    )


def _legacy_options(data: Dict[str, Any]) -> List[DownloadOption]:
    video = data.get("video", data)
    play_url = (
        video.get("playAddr") or video.get("downloadAddr") or video.get("video_url")
    )
    if not play_url:
        return []
    return [
        DownloadOption(
            quality="Original (No Watermark)",
            format="video/mp4",
            url=play_url,
        )
    ]


def parse_tiktok_response(data: Dict[str, Any]) -> DownloadResponse:
    err = extract_error_message(data)
    if err:
        return error_response(PLATFORM, err)

    metadata = _build_metadata(data.get("metadata", {}))

    options: List[DownloadOption] = []
    for content in data.get("contents", []) or []:
        options.extend(parse_video_list(content))

    if not options:
        options = _legacy_options(data)

    return DownloadResponse(
        success=True,
        message="Video found successfully",
        platform=PLATFORM,
        metadata=metadata,
        download_options=options,
    )
