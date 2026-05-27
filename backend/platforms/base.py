"""Shared helpers: platform detection + common parsing utilities."""
import re
from typing import Any, Dict, List, Optional

from models import DownloadOption, DownloadResponse

PLATFORM_PATTERNS = {
    "youtube": [r"youtube\.com", r"youtu\.be"],
    "instagram": [r"instagram\.com", r"instagr\.am"],
    "tiktok": [r"tiktok\.com", r"vm\.tiktok\.com"],
    "twitter": [r"twitter\.com", r"x\.com", r"t\.co"],
    "facebook": [r"facebook\.com", r"fb\.watch", r"fb\.com"],
}


def detect_platform(url: str) -> Optional[str]:
    """Return platform id (`youtube`, `instagram`, ...) or None."""
    url_lower = url.lower()
    for platform, regexes in PLATFORM_PATTERNS.items():
        if any(re.search(pattern, url_lower) for pattern in regexes):
            return platform
    return None


def truncate_title(title: Optional[str], max_len: int = 100) -> str:
    """Return a safe, length-bounded title."""
    if not title:
        return ""
    return title if len(title) <= max_len else title[:max_len] + "..."


def extract_error_message(data: Dict[str, Any]) -> Optional[str]:
    """If the upstream payload contains an `error` field, return a string message."""
    err = data.get("error")
    if not err:
        return None
    if isinstance(err, dict):
        return err.get("message", "Unknown error")
    return str(err)


def error_response(platform: str, message: str) -> DownloadResponse:
    return DownloadResponse(
        success=False,
        message=f"{platform.capitalize()} error: {message}",
        platform=platform,
        error=message,
    )


def parse_video_list(content: Dict[str, Any]) -> List[DownloadOption]:
    """Parse `content.videos[]` array into DownloadOption list."""
    out: List[DownloadOption] = []
    for video in content.get("videos", []) or []:
        if not video.get("url"):
            continue
        out.append(
            DownloadOption(
                quality=video.get("label", "Original"),
                format="video/mp4",
                url=video["url"],
                size=(video.get("metadata") or {}).get("content_length_text"),
            )
        )
    return out


def parse_image_list(content: Dict[str, Any]) -> List[DownloadOption]:
    """Parse `content.images[]` array into DownloadOption list."""
    out: List[DownloadOption] = []
    for img in content.get("images", []) or []:
        if not img.get("url"):
            continue
        out.append(
            DownloadOption(
                quality=img.get("label", "Original"),
                format="image/jpeg",
                url=img["url"],
            )
        )
    return out


def extract_author_name(metadata_info: Dict[str, Any], *keys: str) -> str:
    """Walk metadata_info['author'] for the first existing key (defaults 'Unknown')."""
    author = metadata_info.get("author")
    if not isinstance(author, dict):
        return "Unknown"
    for key in keys:
        val = author.get(key)
        if val:
            return val
    return "Unknown"
