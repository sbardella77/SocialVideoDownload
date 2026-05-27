"""YouTube fetch + parse (YTStream API)."""
import re
from typing import Any, Dict, List, Optional

import httpx

from config import API_TIMEOUT_SECONDS, RAPIDAPI_KEY, YTSTREAM_HOST
from models import DownloadOption, DownloadResponse, VideoMetadata

PLATFORM = "youtube"
MIN_AUDIO_BITRATE = 100_000

_VIDEO_ID_PATTERNS = [
    r"(?:v=|\/videos\/|embed\/|youtu\.be\/|\/v\/|\/e\/|watch\?v%3D|watch\?feature=player_embedded&v=|%2Fvideos%2F|embed%\u200C\u200B2F|youtu\.be%2F|%2Fv%2F)([^#\&\?\n]*)",
    r"(?:youtube\.com\/shorts\/)([^#\&\?\n]*)",
]


def extract_video_id(url: str) -> str:
    for pattern in _VIDEO_ID_PATTERNS:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return url


async def fetch_youtube_video(url: str) -> Dict[str, Any]:
    """Fetch YouTube video details using YTStream API (combined Video+Audio)."""
    video_id = extract_video_id(url)
    headers = {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": YTSTREAM_HOST,
    }
    api_url = f"https://{YTSTREAM_HOST}/dl"
    async with httpx.AsyncClient(timeout=API_TIMEOUT_SECONDS) as client:
        response = await client.get(api_url, headers=headers, params={"id": video_id})
        response.raise_for_status()
        return response.json()


# --- helpers (each <10 cyclomatic complexity) -------------------------------------------------

def _build_metadata(data: Dict[str, Any]) -> VideoMetadata:
    duration_raw = data.get("lengthSeconds")
    duration: Optional[int] = None
    try:
        duration = int(duration_raw) if duration_raw is not None else None
    except (TypeError, ValueError):
        duration = None

    thumbnails = data.get("thumbnail") or []
    thumbnail_url = (
        thumbnails[-1].get("url")
        if isinstance(thumbnails, list) and thumbnails
        else None
    )

    return VideoMetadata(
        title=data.get("title", "YouTube Video"),
        description=(data.get("description") or "")[:500],
        duration=duration,
        thumbnail_url=thumbnail_url,
        author=data.get("channelTitle", "Unknown"),
        view_count=None,
        platform=PLATFORM,
    )


def _video_audio_combined(formats: List[Dict[str, Any]]) -> List[DownloadOption]:
    """Pick formats that already include both video and audio."""
    out: List[DownloadOption] = []
    for fmt in formats or []:
        if not fmt.get("url"):
            continue
        if not fmt.get("audioQuality"):
            continue
        out.append(
            DownloadOption(
                quality=f"{fmt.get('qualityLabel', 'unknown')} (Video + Audio)",
                format="video/mp4",
                url=fmt["url"],
                size=fmt.get("contentLength"),
            )
        )
    return out


def _video_only_options(adaptive: List[Dict[str, Any]]) -> List[DownloadOption]:
    """Pick best video-only formats (mp4/webm), dedupe by qualityLabel."""
    out: List[DownloadOption] = []
    seen: set = set()
    for fmt in adaptive or []:
        url = fmt.get("url")
        mime_type = fmt.get("mimeType", "")
        quality_label = fmt.get("qualityLabel")
        if not (url and quality_label and "video" in mime_type):
            continue
        if quality_label in seen:
            continue
        if "mp4" not in mime_type and "webm" not in mime_type:
            continue
        seen.add(quality_label)
        format_type = "mp4" if "mp4" in mime_type else "webm"
        out.append(
            DownloadOption(
                quality=f"{quality_label} (Video)",
                format=f"video/{format_type}",
                url=url,
                size=fmt.get("contentLength"),
            )
        )
    return out


def _audio_only_option(adaptive: List[Dict[str, Any]]) -> Optional[DownloadOption]:
    """Return the first high-bitrate audio-only stream, if any."""
    for fmt in adaptive or []:
        url = fmt.get("url")
        mime_type = fmt.get("mimeType", "")
        if not (url and "audio" in mime_type):
            continue
        if (fmt.get("bitrate", 0) or 0) <= MIN_AUDIO_BITRATE:
            continue
        audio_quality = (fmt.get("audioQuality") or "MEDIUM").replace(
            "AUDIO_QUALITY_", ""
        )
        return DownloadOption(
            quality=f"Audio Only ({audio_quality})",
            format="audio/mp4",
            url=url,
            size=fmt.get("contentLength"),
        )
    return None


_QUALITY_ORDER = {
    "2160p": 1, "1440p": 2, "1080p": 3, "720p": 4,
    "480p": 5, "360p": 6, "240p": 7, "144p": 8,
}


def _sort_options(options: List[DownloadOption]) -> List[DownloadOption]:
    def sort_key(opt: DownloadOption):
        quality = opt.quality
        if "Video + Audio" in quality:
            return (0, quality)
        if "(Video)" in quality or "Video Only" in quality:
            q = quality.split(" ")[0]
            return (1, _QUALITY_ORDER.get(q, 99))
        return (2, quality)

    return sorted(options, key=sort_key)


# --- main parse ------------------------------------------------------------------------------

def parse_youtube_response(data: Dict[str, Any]) -> DownloadResponse:
    if data.get("status") != "OK":
        message = data.get("message", "Failed to fetch video")
        return DownloadResponse(
            success=False, message=message, platform=PLATFORM, error=message
        )

    options: List[DownloadOption] = []
    options.extend(_video_audio_combined(data.get("formats", [])))
    options.extend(_video_only_options(data.get("adaptiveFormats", [])))
    audio_opt = _audio_only_option(data.get("adaptiveFormats", []))
    if audio_opt:
        options.append(audio_opt)

    return DownloadResponse(
        success=True,
        message="Video found successfully",
        platform=PLATFORM,
        metadata=_build_metadata(data),
        download_options=_sort_options(options),
    )
