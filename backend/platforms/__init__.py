"""Platform sub-package: detection + per-platform fetch & parse."""
from platforms.base import detect_platform  # noqa: F401
from platforms.youtube import fetch_youtube_video, parse_youtube_response  # noqa: F401
from platforms.instagram import fetch_instagram_video, parse_instagram_response  # noqa: F401
from platforms.tiktok import fetch_tiktok_video, parse_tiktok_response  # noqa: F401
from platforms.twitter import fetch_twitter_video, parse_twitter_response  # noqa: F401
from platforms.facebook import fetch_facebook_video, parse_facebook_response  # noqa: F401
