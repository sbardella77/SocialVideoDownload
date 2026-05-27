"""Instagram fetch + parse (RapidAPI Social Media Video Downloader v3)."""
import re
from typing import Any, Dict, List, Optional

import httpx

from config import API_TIMEOUT_SECONDS, RAPIDAPI_HOST, RAPIDAPI_KEY
from models import DownloadOption, DownloadResponse, VideoMetadata
from platforms.base import (
    error_response,
    extract_author_name,
    extract_error_message,
    parse_image_list,
    parse_video_list,
    truncate_title,
)

PLATFORM = "instagram"

_SHORTCODE_PATTERNS = [
    r"instagram\.com/p/([A-Za-z0-9_-]+)",
    r"instagram\.com/reel/([A-Za-z0-9_-]+)",
    r"instagram\.com/tv/([A-Za-z0-9_-]+)",
    r"instagr\.am/p/([A-Za-z0-9_-]+)",
]


def extract_shortcode(url: str) -> Optional[str]:
    for pattern in _SHORTCODE_PATTERNS:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


async def fetch_instagram_video(url: str) -> Dict[str, Any]:
    shortcode = extract_shortcode(url)
    if not shortcode:
        raise ValueError("Could not extract Instagram shortcode from URL")

    headers = {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": RAPIDAPI_HOST,
    }
    api_url = f"https://{RAPIDAPI_HOST}/instagram/v3/media/post/details"
    async with httpx.AsyncClient(timeout=API_TIMEOUT_SECONDS) as client:
        response = await client.get(api_url, headers=headers, params={"shortcode": shortcode})
        response.raise_for_status()
        return response.json()


def _build_metadata(metadata_info: Dict[str, Any]) -> VideoMetadata:
    caption = metadata_info.get("caption", "")
    return VideoMetadata(
        title=truncate_title(caption) or "Instagram Post",
        description=caption,
        thumbnail_url=metadata_info.get("thumbnailUrl"),
        author=extract_author_name(metadata_info, "username"),
        platform=PLATFORM,
    )


def _legacy_options(data: Dict[str, Any]) -> List[DownloadOption]:
    """Fallback parser for the older Instagram response shape."""
    post = data.get("post", data)
    video_url = post.get("videoUrl") or post.get("video_url")
    image_url = post.get("displayUrl") or post.get("image_url")
    options: List[DownloadOption] = []
    if video_url:
        options.append(
            DownloadOption(quality="Original", format="video/mp4", url=video_url)
        )
    elif image_url:
        options.append(
            DownloadOption(quality="Original", format="image/jpeg", url=image_url)
        )
    return options


def parse_instagram_response(data: Dict[str, Any]) -> DownloadResponse:
    err = extract_error_message(data)
    if err:
        return error_response(PLATFORM, err)

    metadata = _build_metadata(data.get("metadata", {}))

    options: List[DownloadOption] = []
    for content in data.get("contents", []) or []:
        options.extend(parse_video_list(content))
        options.extend(parse_image_list(content))

    if not options:
        options = _legacy_options(data)

    return DownloadResponse(
        success=True,
        message="Content found successfully",
        platform=PLATFORM,
        metadata=metadata,
        download_options=options,
    )
