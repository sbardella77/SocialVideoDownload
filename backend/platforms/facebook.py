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

    # Track whether the API reported video-only (DASH separated) streams that
    # we had to filter out. If everything is video-only, give the user a clear
    # message instead of letting them download a silent file.
    all_videos: List[DownloadOption] = []
    video_only_seen = False
    for content in data.get("contents", []) or []:
        for video in content.get("videos", []) or []:
            meta = video.get("metadata") or {}
            if meta.get("has_audio") is False:
                video_only_seen = True
        all_videos.extend(parse_video_list(content, require_audio=True))

    if not all_videos:
        all_videos = _legacy_options(data)

    if not all_videos and video_only_seen:
        return error_response(
            PLATFORM,
            "This Facebook video only has separated audio/video streams (DASH). "
            "Try a different video (e.g. a regular Watch post) or download from "
            "facebook.com directly.",
        )

    return DownloadResponse(
        success=True,
        message="Video found successfully",
        platform=PLATFORM,
        metadata=metadata,
        download_options=all_videos,
    )
