from fastapi import FastAPI, APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, HttpUrl
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import httpx
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import re

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# RapidAPI config
RAPIDAPI_KEY = os.environ.get('RAPIDAPI_KEY', '')
RAPIDAPI_HOST = os.environ.get('RAPIDAPI_HOST', 'social-media-video-downloader.p.rapidapi.com')

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

# Create the main app
app = FastAPI(title="SaveFlex API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Rate limit error handler
@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={
            "success": False,
            "error": "Rate limit exceeded. Please wait a moment before trying again.",
            "retry_after": 60
        }
    )

# Models
class VideoMetadata(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    duration: Optional[int] = None
    thumbnail_url: Optional[str] = None
    author: Optional[str] = None
    view_count: Optional[int] = None
    platform: str

class DownloadOption(BaseModel):
    quality: str
    format: str
    url: str
    size: Optional[str] = None

class DownloadRequest(BaseModel):
    url: str

class DownloadResponse(BaseModel):
    success: bool
    message: str
    platform: Optional[str] = None
    metadata: Optional[VideoMetadata] = None
    download_options: Optional[List[DownloadOption]] = None
    error: Optional[str] = None
    cached: bool = False

class CachedDownload(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    url: str
    platform: str
    response_data: Dict[str, Any]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc) + timedelta(hours=1))

# Platform detection
def detect_platform(url: str) -> Optional[str]:
    url_lower = url.lower()
    patterns = {
        'youtube': [r'youtube\.com', r'youtu\.be'],
        'instagram': [r'instagram\.com', r'instagr\.am'],
        'tiktok': [r'tiktok\.com', r'vm\.tiktok\.com'],
        'twitter': [r'twitter\.com', r'x\.com', r't\.co'],
        'facebook': [r'facebook\.com', r'fb\.watch', r'fb\.com']
    }
    for platform, regexes in patterns.items():
        for pattern in regexes:
            if re.search(pattern, url_lower):
                return platform
    return None

def extract_video_id(url: str, platform: str) -> Optional[str]:
    """Extract video ID from URL based on platform"""
    if platform == 'youtube':
        patterns = [
            r'(?:v=|\/videos\/|embed\/|youtu\.be\/|\/v\/|\/e\/|watch\?v%3D|watch\?feature=player_embedded&v=|%2Fvideos%2F|embed%\u200C\u200B2F|youtu\.be%2F|%2Fv%2F)([^#\&\?\n]*)',
            r'(?:youtube\.com\/shorts\/)([^#\&\?\n]*)'
        ]
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
    return url  # Return full URL for other platforms

# API Helper Functions
async def fetch_youtube_video(url: str) -> Dict[str, Any]:
    """Fetch YouTube video details"""
    video_id = extract_video_id(url, 'youtube')
    headers = {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": RAPIDAPI_HOST
    }
    api_url = f"https://{RAPIDAPI_HOST}/youtube/v3/video/details"
    # Note: Free plan only supports 1 renderable format
    params = {
        "videoId": video_id,
        "renderableFormats": "360p",
        "urlAccess": "proxied",
        "getTranscript": "false"
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(api_url, headers=headers, params=params)
        response.raise_for_status()
        return response.json()

def extract_instagram_shortcode(url: str) -> Optional[str]:
    """Extract shortcode from Instagram URL"""
    patterns = [
        r'instagram\.com/p/([A-Za-z0-9_-]+)',
        r'instagram\.com/reel/([A-Za-z0-9_-]+)',
        r'instagram\.com/tv/([A-Za-z0-9_-]+)',
        r'instagr\.am/p/([A-Za-z0-9_-]+)'
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None

async def fetch_instagram_video(url: str) -> Dict[str, Any]:
    """Fetch Instagram video/reel/post"""
    shortcode = extract_instagram_shortcode(url)
    if not shortcode:
        raise ValueError("Could not extract Instagram shortcode from URL")
    
    headers = {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": RAPIDAPI_HOST
    }
    api_url = f"https://{RAPIDAPI_HOST}/instagram/v3/media/post/details"
    params = {"shortcode": shortcode}
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(api_url, headers=headers, params=params)
        response.raise_for_status()
        return response.json()

async def fetch_tiktok_video(url: str) -> Dict[str, Any]:
    """Fetch TikTok video"""
    headers = {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": RAPIDAPI_HOST
    }
    api_url = f"https://{RAPIDAPI_HOST}/tiktok/v3/post/details"
    params = {"url": url}
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(api_url, headers=headers, params=params)
        response.raise_for_status()
        return response.json()

async def fetch_twitter_video(url: str) -> Dict[str, Any]:
    """Fetch Twitter/X video"""
    headers = {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": RAPIDAPI_HOST
    }
    api_url = f"https://{RAPIDAPI_HOST}/twitter/v2/post/details"
    params = {"postUrl": url}
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(api_url, headers=headers, params=params)
        response.raise_for_status()
        return response.json()

async def fetch_facebook_video(url: str) -> Dict[str, Any]:
    """Fetch Facebook video"""
    headers = {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": RAPIDAPI_HOST
    }
    api_url = f"https://{RAPIDAPI_HOST}/facebook/v3/post/details"
    params = {"url": url}
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(api_url, headers=headers, params=params)
        response.raise_for_status()
        return response.json()

def parse_youtube_response(data: Dict[str, Any]) -> DownloadResponse:
    """Parse YouTube API response"""
    contents = data.get('contents', [])
    metadata_info = data.get('metadata', {})
    
    # Extract metadata from the new API format
    title = metadata_info.get('title', 'YouTube Video')
    thumbnail_url = metadata_info.get('thumbnailUrl')
    author_info = metadata_info.get('author', {})
    author = author_info.get('name', 'Unknown') if isinstance(author_info, dict) else 'Unknown'
    additional_data = metadata_info.get('additionalData', {})
    view_count_raw = additional_data.get('view_count', '')
    
    # Parse duration 
    duration = None
    duration_val = additional_data.get('duration')
    if duration_val:
        if isinstance(duration_val, int):
            duration = duration_val
        elif isinstance(duration_val, str):
            parts = duration_val.split(':')
            try:
                if len(parts) == 3:
                    duration = int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
                elif len(parts) == 2:
                    duration = int(parts[0]) * 60 + int(parts[1])
            except:
                pass
    
    # Parse view count
    view_count = None
    if view_count_raw:
        view_count_str = str(view_count_raw).replace(',', '').replace(' ', '')
        try:
            view_count = int(view_count_str)
        except:
            pass
    
    metadata = VideoMetadata(
        title=title,
        description=metadata_info.get('description', ''),
        duration=duration,
        thumbnail_url=thumbnail_url,
        author=author,
        view_count=view_count,
        platform='youtube'
    )
    
    download_options = []
    
    # Parse from contents array
    for content in contents:
        # PRIORITY 1: renderableVideos - these have BOTH video AND audio merged
        renderable_videos = content.get('renderableVideos', [])
        for video in renderable_videos:
            render_config = video.get('renderConfig', {})
            execution_url = render_config.get('executionUrl')
            video_meta = video.get('metadata', {})
            
            # Only add if has audio and no error
            if execution_url and video_meta.get('has_audio') and not video.get('error'):
                download_options.append(DownloadOption(
                    quality=f"{video.get('label', 'unknown')} (HD with Audio)",
                    format='video/mp4',
                    url=execution_url,
                    size=video_meta.get('content_length_text')
                ))
        
        # PRIORITY 2: Regular videos (video only - no audio)
        videos = content.get('videos', [])
        for video in videos:
            if video.get('url'):
                video_meta = video.get('metadata', {})
                label = video.get('label', video_meta.get('quality_label', 'unknown'))
                download_options.append(DownloadOption(
                    quality=f"{label} (Video Only)",
                    format='video/mp4',
                    url=video.get('url'),
                    size=video_meta.get('content_length_text')
                ))
    
    return DownloadResponse(
        success=True,
        message="Video found successfully",
        platform='youtube',
        metadata=metadata,
        download_options=download_options
    )

def parse_instagram_response(data: Dict[str, Any]) -> DownloadResponse:
    """Parse Instagram API response - new v3 format"""
    # Check for API errors first
    error = data.get('error')
    if error:
        error_msg = error.get('message', 'Unknown error') if isinstance(error, dict) else str(error)
        return DownloadResponse(
            success=False,
            message=f"Instagram error: {error_msg}",
            platform='instagram',
            error=error_msg
        )
    
    contents = data.get('contents', [])
    metadata_info = data.get('metadata', {})
    
    # Extract metadata
    title = metadata_info.get('caption', 'Instagram Post')
    if title and len(title) > 100:
        title = title[:100] + '...'
    
    author_info = metadata_info.get('author', {})
    author = author_info.get('username', 'Unknown') if isinstance(author_info, dict) else 'Unknown'
    
    metadata = VideoMetadata(
        title=title or 'Instagram Post',
        description=metadata_info.get('caption', ''),
        thumbnail_url=metadata_info.get('thumbnailUrl'),
        author=author,
        platform='instagram'
    )
    
    download_options = []
    
    # Parse from contents array
    for content in contents:
        # Videos
        videos = content.get('videos', [])
        for video in videos:
            if video.get('url'):
                download_options.append(DownloadOption(
                    quality=video.get('label', 'Original'),
                    format='video/mp4',
                    url=video.get('url'),
                    size=video.get('metadata', {}).get('content_length_text')
                ))
        
        # Images (for posts without video)
        images = content.get('images', [])
        for img in images:
            if img.get('url'):
                download_options.append(DownloadOption(
                    quality=img.get('label', 'Original'),
                    format='image/jpeg',
                    url=img.get('url')
                ))
    
    # Fallback for old format
    if not download_options:
        post = data.get('post', data)
        video_url = post.get('videoUrl') or post.get('video_url')
        if video_url:
            download_options.append(DownloadOption(
                quality='Original',
                format='video/mp4',
                url=video_url
            ))
        image_url = post.get('displayUrl') or post.get('image_url')
        if image_url and not video_url:
            download_options.append(DownloadOption(
                quality='Original',
                format='image/jpeg',
                url=image_url
            ))
    
    return DownloadResponse(
        success=True,
        message="Content found successfully",
        platform='instagram',
        metadata=metadata,
        download_options=download_options
    )

def parse_tiktok_response(data: Dict[str, Any]) -> DownloadResponse:
    """Parse TikTok API response - new v3 format"""
    # Check for API errors first
    error = data.get('error')
    if error:
        error_msg = error.get('message', 'Unknown error') if isinstance(error, dict) else str(error)
        return DownloadResponse(
            success=False,
            message=f"TikTok error: {error_msg}",
            platform='tiktok',
            error=error_msg
        )
    
    contents = data.get('contents', [])
    metadata_info = data.get('metadata', {})
    
    # Extract metadata
    title = metadata_info.get('description', 'TikTok Video')
    if title and len(title) > 100:
        title = title[:100] + '...'
    
    author_info = metadata_info.get('author', {})
    author = author_info.get('nickname') or author_info.get('uniqueId', 'Unknown') if isinstance(author_info, dict) else 'Unknown'
    stats = metadata_info.get('stats', {})
    
    metadata = VideoMetadata(
        title=title or 'TikTok Video',
        description=metadata_info.get('description', ''),
        duration=metadata_info.get('duration'),
        thumbnail_url=metadata_info.get('cover') or metadata_info.get('thumbnailUrl'),
        author=author,
        view_count=stats.get('playCount'),
        platform='tiktok'
    )
    
    download_options = []
    
    # Parse from contents array
    for content in contents:
        videos = content.get('videos', [])
        for video in videos:
            if video.get('url'):
                download_options.append(DownloadOption(
                    quality=video.get('label', 'Original'),
                    format='video/mp4',
                    url=video.get('url'),
                    size=video.get('metadata', {}).get('content_length_text')
                ))
    
    # Fallback for old format
    if not download_options:
        video = data.get('video', data)
        play_url = video.get('playAddr') or video.get('downloadAddr') or video.get('video_url')
        if play_url:
            download_options.append(DownloadOption(
                quality='Original (No Watermark)',
                format='video/mp4',
                url=play_url
            ))
    
    return DownloadResponse(
        success=True,
        message="Video found successfully",
        platform='tiktok',
        metadata=metadata,
        download_options=download_options
    )

def parse_twitter_response(data: Dict[str, Any]) -> DownloadResponse:
    """Parse Twitter/X API response"""
    # This API might not support Twitter yet - provide graceful fallback
    contents = data.get('contents', [])
    metadata_info = data.get('metadata', {})
    
    metadata = VideoMetadata(
        title=metadata_info.get('text', 'Twitter Post')[:100] if metadata_info.get('text') else 'Twitter Post',
        description=metadata_info.get('text', ''),
        thumbnail_url=metadata_info.get('thumbnailUrl'),
        author=metadata_info.get('author', {}).get('name', 'Unknown') if isinstance(metadata_info.get('author'), dict) else 'Unknown',
        platform='twitter'
    )
    
    download_options = []
    for content in contents:
        videos = content.get('videos', [])
        for video in videos:
            if video.get('url'):
                download_options.append(DownloadOption(
                    quality=video.get('label', 'Original'),
                    format='video/mp4',
                    url=video.get('url')
                ))
    
    # Fallback for old format
    if not download_options:
        tweet = data.get('tweet', data)
        media = tweet.get('media', [])
        for m in media:
            if m.get('video_url'):
                download_options.append(DownloadOption(
                    quality='Original',
                    format='video/mp4',
                    url=m.get('video_url')
                ))
    
    return DownloadResponse(
        success=True,
        message="Content found successfully",
        platform='twitter',
        metadata=metadata,
        download_options=download_options
    )

def parse_facebook_response(data: Dict[str, Any]) -> DownloadResponse:
    """Parse Facebook API response - v3 format"""
    contents = data.get('contents', [])
    metadata_info = data.get('metadata', {})
    
    # Extract metadata
    title = metadata_info.get('title') or metadata_info.get('text', 'Facebook Video')
    if title and len(title) > 100:
        title = title[:100] + '...'
    
    author_info = metadata_info.get('author', {})
    author = author_info.get('name', 'Unknown') if isinstance(author_info, dict) else 'Unknown'
    
    metadata = VideoMetadata(
        title=title or 'Facebook Video',
        description=metadata_info.get('text', ''),
        thumbnail_url=metadata_info.get('thumbnailUrl'),
        author=author,
        platform='facebook'
    )
    
    download_options = []
    
    # Parse from contents array
    for content in contents:
        videos = content.get('videos', [])
        for video in videos:
            if video.get('url'):
                download_options.append(DownloadOption(
                    quality=video.get('label', 'Original'),
                    format='video/mp4',
                    url=video.get('url'),
                    size=video.get('metadata', {}).get('content_length_text')
                ))
    
    # Fallback for old format
    if not download_options:
        post = data.get('post', data)
        hd_url = post.get('hdUrl') or post.get('hd_url')
        if hd_url:
            download_options.append(DownloadOption(
                quality='HD',
                format='video/mp4',
                url=hd_url
            ))
        sd_url = post.get('sdUrl') or post.get('sd_url') or post.get('video_url')
        if sd_url:
            download_options.append(DownloadOption(
                quality='SD',
                format='video/mp4',
                url=sd_url
            ))
    
    return DownloadResponse(
        success=True,
        message="Video found successfully",
        platform='facebook',
        metadata=metadata,
        download_options=download_options
    )

# Routes
@api_router.get("/")
async def root():
    return {"message": "SaveFlex API", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

@api_router.get("/platforms")
async def get_platforms():
    """Get list of supported platforms"""
    platforms = [
        {
            "id": "youtube",
            "name": "YouTube",
            "icon": "youtube",
            "supported_types": ["videos", "shorts", "live"],
            "description": "Download YouTube videos, shorts, and live streams"
        },
        {
            "id": "instagram",
            "name": "Instagram",
            "icon": "instagram",
            "supported_types": ["posts", "reels", "stories", "igtv"],
            "description": "Download Instagram reels, posts, stories, and IGTV"
        },
        {
            "id": "tiktok",
            "name": "TikTok",
            "icon": "tiktok",
            "supported_types": ["videos"],
            "description": "Download TikTok videos without watermark"
        },
        {
            "id": "twitter",
            "name": "Twitter / X",
            "icon": "twitter",
            "supported_types": ["videos", "gifs"],
            "description": "Download Twitter/X videos and GIFs"
        },
        {
            "id": "facebook",
            "name": "Facebook",
            "icon": "facebook",
            "supported_types": ["videos", "reels"],
            "description": "Download Facebook videos and reels"
        }
    ]
    return {"platforms": platforms}

@api_router.post("/download", response_model=DownloadResponse)
@limiter.limit("30/minute")
async def download_video(request: Request, download_req: DownloadRequest):
    """Main download endpoint - auto-detects platform"""
    url = download_req.url.strip()
    
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")
    
    # Detect platform
    platform = detect_platform(url)
    if not platform:
        raise HTTPException(
            status_code=400, 
            detail="Unsupported URL. Please use a link from YouTube, Instagram, TikTok, Twitter/X, or Facebook."
        )
    
    # Check cache
    cached = await db.download_cache.find_one({
        "url": url,
        "expires_at": {"$gt": datetime.now(timezone.utc).isoformat()}
    }, {"_id": 0})
    
    if cached:
        response_data = cached.get('response_data', {})
        response_data['cached'] = True
        return DownloadResponse(**response_data)
    
    try:
        # Fetch based on platform
        if platform == 'youtube':
            api_response = await fetch_youtube_video(url)
            result = parse_youtube_response(api_response)
        elif platform == 'instagram':
            api_response = await fetch_instagram_video(url)
            result = parse_instagram_response(api_response)
        elif platform == 'tiktok':
            api_response = await fetch_tiktok_video(url)
            result = parse_tiktok_response(api_response)
        elif platform == 'twitter':
            api_response = await fetch_twitter_video(url)
            result = parse_twitter_response(api_response)
        elif platform == 'facebook':
            api_response = await fetch_facebook_video(url)
            result = parse_facebook_response(api_response)
        else:
            raise HTTPException(status_code=400, detail="Platform not supported")
        
        # Cache the result
        if result.success and result.download_options:
            cache_doc = {
                "id": str(uuid.uuid4()),
                "url": url,
                "platform": platform,
                "response_data": result.model_dump(),
                "created_at": datetime.now(timezone.utc).isoformat(),
                "expires_at": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()
            }
            await db.download_cache.insert_one(cache_doc)
        
        return result
        
    except httpx.HTTPStatusError as e:
        logger.error(f"API error for {platform}: {e.response.status_code} - {e.response.text}")
        raise HTTPException(
            status_code=503,
            detail=f"Unable to fetch from {platform}. The content may be private or unavailable."
        )
    except httpx.TimeoutException:
        logger.error(f"Timeout fetching from {platform}")
        raise HTTPException(
            status_code=504,
            detail="Request timed out. Please try again."
        )
    except Exception as e:
        logger.error(f"Error processing {platform} URL: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while processing your request. Please try again."
        )

@api_router.get("/stats")
async def get_stats():
    """Get download statistics"""
    total_downloads = await db.download_cache.count_documents({})
    platforms_stats = await db.download_cache.aggregate([
        {"$group": {"_id": "$platform", "count": {"$sum": 1}}}
    ]).to_list(10)
    
    return {
        "total_downloads": total_downloads,
        "by_platform": {item["_id"]: item["count"] for item in platforms_stats}
    }

# Include the router
app.include_router(api_router)

# Add rate limiter to app state
app.state.limiter = limiter

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
