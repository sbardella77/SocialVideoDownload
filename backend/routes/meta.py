"""Read-only metadata routes (health, platforms, stats)."""
from datetime import datetime, timezone

from fastapi import APIRouter

from db import db

router = APIRouter()

_PLATFORMS_PAYLOAD = [
    {
        "id": "youtube",
        "name": "YouTube",
        "icon": "youtube",
        "supported_types": ["videos", "shorts", "live"],
        "description": "Download YouTube videos, shorts, and live streams",
    },
    {
        "id": "instagram",
        "name": "Instagram",
        "icon": "instagram",
        "supported_types": ["posts", "reels", "stories", "igtv"],
        "description": "Download Instagram reels, posts, stories, and IGTV",
    },
    {
        "id": "tiktok",
        "name": "TikTok",
        "icon": "tiktok",
        "supported_types": ["videos"],
        "description": "Download TikTok videos without watermark",
    },
    {
        "id": "x",
        "name": "X",
        "icon": "x",
        "supported_types": ["videos", "gifs"],
        "description": "Download X videos and GIFs",
    },
    {
        "id": "facebook",
        "name": "Facebook",
        "icon": "facebook",
        "supported_types": ["videos", "reels"],
        "description": "Download Facebook videos and reels",
    },
]


@router.get("/")
async def root():
    return {"message": "SaveFlex API", "version": "1.0.0"}


@router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}


@router.get("/platforms")
async def get_platforms():
    return {"platforms": _PLATFORMS_PAYLOAD}


@router.get("/stats")
async def get_stats():
    total_downloads = await db.download_cache.count_documents({})
    platforms_stats = await db.download_cache.aggregate(
        [{"$group": {"_id": "$platform", "count": {"$sum": 1}}}]
    ).to_list(10)
    return {
        "total_downloads": total_downloads,
        "by_platform": {item["_id"]: item["count"] for item in platforms_stats},
    }
