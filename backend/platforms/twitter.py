"""Twitter/X fetch + parse."""
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

PLATFORM = "twitter"


async def fetch_twitter_video(url: str) -> Dict[str, Any]:
    headers = {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": RAPIDAPI_HOST,
    }
    api_url = f"https://{RAPIDAPI_HOST}/twitter/v2/post/details"
    async with httpx.AsyncClient(timeout=API_TIMEOUT_SECONDS) as client:
        response = await client.get(api_url, headers=headers, params={"postUrl": url})
        response.raise_for_status()
        return response.json()


def _build_metadata(metadata_info: Dict[str, Any]) -> VideoMetadata:
    text = metadata_info.get("text", "")
    return VideoMetadata(
        title=truncate_title(text) or "Twitter Post",
        description=text,
        thumbnail_url=metadata_info.get("thumbnailUrl"),
        author=extract_author_name(metadata_info, "name"),
        platform=PLATFORM,
    )


def _legacy_options(data: Dict[str, Any]) -> List[DownloadOption]:
    tweet = data.get("tweet", data)
    options: List[DownloadOption] = []
    for media in tweet.get("media", []) or []:
        if media.get("video_url"):
            options.append(
                DownloadOption(
                    quality="Original",
                    format="video/mp4",
                    url=media["video_url"],
                )
            )
    return options


def parse_twitter_response(data: Dict[str, Any]) -> DownloadResponse:
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
        message="Content found successfully",
        platform=PLATFORM,
        metadata=metadata,
        download_options=options,
    )
