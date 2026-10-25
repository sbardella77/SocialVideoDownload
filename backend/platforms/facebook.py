"""Facebook fetch + parse."""
import logging
import urllib.parse
from typing import Any, Dict, List, Optional

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

logger = logging.getLogger(__name__)

_BROWSER_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)
# Query params that identify the post; everything else (mibextid, rdid,
# share_url, ...) is share-sheet tracking that can confuse the upstream API.
_KEEP_PARAMS = {"v", "story_fbid", "id", "fbid", "set"}
_TRANSIENT_ERROR_MARKERS = (
    "parse error",
    "socket hang up",
    "econnreset",
    "etimedout",
    "timeout",
    "connection",
)
_FRIENDLY_ERROR = (
    "We couldn't read this Facebook video. Make sure the post is public, "
    "then try again or copy the link from the video's own page."
)


def clean_facebook_url(url: str) -> str:
    """Drop tracking query params and fragments from a Facebook URL."""
    parts = urllib.parse.urlsplit(url.strip())
    query = [
        (k, v) for k, v in urllib.parse.parse_qsl(parts.query) if k in _KEEP_PARAMS
    ]
    return urllib.parse.urlunsplit(
        (parts.scheme or "https", parts.netloc, parts.path, urllib.parse.urlencode(query), "")
    )


def _is_share_link(url: str) -> bool:
    lower = url.lower()
    return "fb.watch/" in lower or "/share/" in lower


def _is_usable_redirect(url: str) -> bool:
    lower = url.lower()
    return "facebook.com" in lower and "/login" not in lower and "/checkpoint" not in lower


async def resolve_facebook_url(url: str) -> str:
    """Expand share links (/share/v/..., fb.watch) to the canonical post URL.

    The upstream API often fails on these redirecting links. Best-effort:
    on any problem the original URL is returned.
    """
    if not _is_share_link(url):
        return url
    try:
        async with httpx.AsyncClient(
            timeout=10.0, follow_redirects=True, headers={"user-agent": _BROWSER_UA}
        ) as client:
            response = await client.head(url)
        final = str(response.url)
        if final != url and _is_usable_redirect(final):
            return clean_facebook_url(final)
    except httpx.HTTPError as e:
        logger.info("Could not expand Facebook share link: %s", e)
    return url


def _is_transient(data: Dict[str, Any]) -> bool:
    err = (extract_error_message(data) or "").lower()
    return any(marker in err for marker in _TRANSIENT_ERROR_MARKERS)


async def _call_upstream(client: httpx.AsyncClient, url: str) -> Dict[str, Any]:
    response = await client.get(
        f"https://{RAPIDAPI_HOST}/facebook/v3/post/details",
        headers={"x-rapidapi-key": RAPIDAPI_KEY, "x-rapidapi-host": RAPIDAPI_HOST},
        params={"url": url},
    )
    response.raise_for_status()
    return response.json()


async def fetch_facebook_video(url: str) -> Dict[str, Any]:
    cleaned = clean_facebook_url(url)
    resolved = await resolve_facebook_url(cleaned)
    candidates = list(dict.fromkeys([resolved, cleaned]))

    data: Optional[Dict[str, Any]] = None
    async with httpx.AsyncClient(timeout=API_TIMEOUT_SECONDS) as client:
        for candidate in candidates:
            # The upstream occasionally fails to talk to Facebook with errors
            # like "Parse Error: Data after `Connection: close`"; retry those.
            for _ in range(2):
                data = await _call_upstream(client, candidate)
                if not extract_error_message(data):
                    return data
                if not _is_transient(data):
                    break
            logger.warning(
                "Facebook upstream error for %s: %s", candidate, extract_error_message(data)
            )
    return data or {}


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
        # Raw upstream errors are technical (HTTP parser messages etc.);
        # show users something they can act on.
        return error_response(PLATFORM, _FRIENDLY_ERROR)

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
