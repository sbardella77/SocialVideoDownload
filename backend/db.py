"""MongoDB client + small cache helpers."""
import logging
import uuid
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, Optional

from motor.motor_asyncio import AsyncIOMotorClient

from config import MONGO_URL, DB_NAME, CACHE_TTL_SECONDS

logger = logging.getLogger(__name__)

# Mongo is only a cache. A bad MONGO_URL (e.g. a mongodb+srv:// host that no
# longer resolves) raises at construction time, so disable the cache instead
# of crashing the whole server on import.
try:
    client: Optional[AsyncIOMotorClient] = AsyncIOMotorClient(
        MONGO_URL, serverSelectionTimeoutMS=3000
    )
    db = client[DB_NAME]
except Exception as exc:  # noqa: BLE001
    logger.warning("MongoDB disabled, cache off: %s", exc)
    client = None
    db = None


async def get_cached_response(url: str) -> Optional[Dict[str, Any]]:
    """Return the cached response_data dict or None if missing/expired."""
    if db is None:
        return None
    try:
        doc = await db.download_cache.find_one(
            {
                "url": url,
                "expires_at": {"$gt": datetime.now(timezone.utc).isoformat()},
            },
            {"_id": 0},
        )
    except Exception:
        return None
    if not doc:
        return None
    return doc.get("response_data")


async def store_cached_response(url: str, platform: str, response_data: Dict[str, Any]) -> None:
    if db is None:
        return
    now = datetime.now(timezone.utc)
    cache_doc = {
        "id": str(uuid.uuid4()),
        "url": url,
        "platform": platform,
        "response_data": response_data,
        "created_at": now.isoformat(),
        "expires_at": (now + timedelta(seconds=CACHE_TTL_SECONDS)).isoformat(),
    }
    try:
        await db.download_cache.insert_one(cache_doc)
    except Exception:
        pass


def close_client() -> None:
    if client is not None:
        client.close()
