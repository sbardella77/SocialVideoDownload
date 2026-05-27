"""Facebook fetch + parse."""
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

PLATFORM = "facebook"


async def fetch_facebook_video(url: str) -> Dict[str, Any]:
    headers = {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": RAPIDAPI_HOST,
    }
    api_url = f"https://{RAPIDAPI_HOST}/facebook/v3/post/details"
    async with httpx.AsyncClient(timeout=API_TIMEOUT_SECONDS) as client:
        response = await client.get(api_url, headers=headers, params={"url": url})
        response.raise_for_status()
        return response.json()


def _build_metadata(metadata_info: Dict[str, Any]) -> VideoMetadata:
    title_text = metadata_info.get("title") or metadata_info.get("text", "")
    return VideoMetadata(
        title=truncate_title(title_text) or "Facebook Video",
        description=metadata_info.get("text", ""),
        thumbnail_url=metadata_info.get("thumbnailUrl"),
        author=extract_author_name(metadata_info, "name"),
        platform=PLATFORM,
    )


def _legacy_options(data: Dict[str, Any]) -> List[DownloadOption]:
    post = data.get("post", data)
    options: List[DownloadOption] = []
    hd_url = post.get("hdUrl") or post.get("hd_url")
    if hd_url:
        options.append(DownloadOption(quality="HD", format="video/mp4", url=hd_url))
    sd_url = post.get("sdUrl") or post.get("sd_url") or post.get("video_url")
    if sd_url:
        options.append(DownloadOption(quality="SD", format="video/mp4", url=sd_url))
    return options


def parse_facebook_response(data: Dict[str, Any]) -> DownloadResponse:
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
