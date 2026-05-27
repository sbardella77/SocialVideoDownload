"""MongoDB client + small cache helpers."""
import uuid
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, Optional

from motor.motor_asyncio import AsyncIOMotorClient

from config import MONGO_URL, DB_NAME, CACHE_TTL_SECONDS

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]


async def get_cached_response(url: str) -> Optional[Dict[str, Any]]:
    """Return the cached response_data dict or None if missing/expired."""
    doc = await db.download_cache.find_one(
        {
            "url": url,
            "expires_at": {"$gt": datetime.now(timezone.utc).isoformat()},
        },
        {"_id": 0},
    )
    if not doc:
        return None
    return doc.get("response_data")


async def store_cached_response(url: str, platform: str, response_data: Dict[str, Any]) -> None:
    now = datetime.now(timezone.utc)
    cache_doc = {
        "id": str(uuid.uuid4()),
        "url": url,
        "platform": platform,
        "response_data": response_data,
        "created_at": now.isoformat(),
        "expires_at": (now + timedelta(seconds=CACHE_TTL_SECONDS)).isoformat(),
    }
    await db.download_cache.insert_one(cache_doc)


def close_client() -> None:
    client.close()
