"""Centralised environment/config for SaveFlex backend."""
import os
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# Mongo
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]

# RapidAPI
RAPIDAPI_KEY = os.environ.get("RAPIDAPI_KEY", "")
RAPIDAPI_HOST = os.environ.get(
    "RAPIDAPI_HOST", "social-media-video-downloader.p.rapidapi.com"
)
YTSTREAM_HOST = "ytstream-download-youtube-videos.p.rapidapi.com"

# CORS
CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*").split(",")

# Cache TTL in seconds (1 hour)
CACHE_TTL_SECONDS = 3600

# HTTP timeouts
API_TIMEOUT_SECONDS = 30.0
PROXY_STREAM_TIMEOUT_SECONDS = 120.0
PROXY_CHUNK_SIZE = 65536
