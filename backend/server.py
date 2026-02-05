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
    params = {
        "videoId": video_id,
        "renderableFormats": "360p,480p,720p,1080p,highres",
        "urlAccess": "proxied",
        "getTranscript": "false"
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(api_url, headers=headers, params=params)
        response.raise_for_status()
        return response.json()

async def fetch_instagram_video(url: str) -> Dict[str, Any]:
    """Fetch Instagram video/reel/post"""
    headers = {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": RAPIDAPI_HOST
    }
    api_url = f"https://{RAPIDAPI_HOST}/instagram/v4/post/details"
    params = {"postUrl": url}
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
    api_url = f"https://{RAPIDAPI_HOST}/tiktok/v2/post/details"
    params = {"postUrl": url}
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
    api_url = f"https://{RAPIDAPI_HOST}/facebook/v2/post/details"
    params = {"postUrl": url}
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(api_url, headers=headers, params=params)
        response.raise_for_status()
        return response.json()

def parse_youtube_response(data: Dict[str, Any]) -> DownloadResponse:
    """Parse YouTube API response"""
    # Handle the actual API response format
    contents = data.get('contents', [])
    video_info = data.get('videoInfo', {})
    
    # Get video info from contents or direct videoInfo
    title = 'YouTube Video'
    author = 'Unknown'
    thumbnail_url = None
    duration = None
    view_count = None
    
    if contents:
        first_content = contents[0] if contents else {}
        title = first_content.get('title', video_info.get('title', 'YouTube Video'))
        author = first_content.get('author', video_info.get('author', 'Unknown'))
        thumbnail_url = first_content.get('thumbnail', video_info.get('thumbnail'))
        duration = first_content.get('lengthSeconds', video_info.get('lengthSeconds'))
    else:
        title = video_info.get('title', 'YouTube Video')
        author = video_info.get('author', 'Unknown')
        duration = video_info.get('lengthSeconds')
        thumbnails = video_info.get('thumbnail', [])
        if thumbnails and isinstance(thumbnails, list):
            thumbnail_url = thumbnails[0].get('url')
    
    metadata = VideoMetadata(
        title=title,
        description=video_info.get('description', ''),
        duration=duration,
        thumbnail_url=thumbnail_url,
        author=author,
        view_count=view_count,
        platform='youtube'
    )
    
    download_options = []
    
    # Parse from contents array (new format)
    for content in contents:
        videos = content.get('videos', [])
        for video in videos:
            if video.get('url'):
                download_options.append(DownloadOption(
                    quality=video.get('label', video.get('quality', 'unknown')),
                    format='video/mp4',
                    url=video.get('url'),
                    size=video.get('size')
                ))
    
    # Fallback to renditions format
    renditions = data.get('renditions', [])
    for r in renditions:
        if r.get('url'):
            download_options.append(DownloadOption(
                quality=r.get('qualityLabel', r.get('quality', 'unknown')),
                format=r.get('mimeType', 'video/mp4').split(';')[0],
                url=r.get('url'),
                size=r.get('contentLength')
            ))
    
    return DownloadResponse(
        success=True,
        message="Video found successfully",
        platform='youtube',
        metadata=metadata,
        download_options=download_options
    )

def parse_instagram_response(data: Dict[str, Any]) -> DownloadResponse:
    """Parse Instagram API response"""
    post = data.get('post', data)
    
    metadata = VideoMetadata(
        title=post.get('caption', '')[:100] if post.get('caption') else 'Instagram Post',
        description=post.get('caption', ''),
        thumbnail_url=post.get('thumbnail') or post.get('displayUrl'),
        author=post.get('owner', {}).get('username', 'Unknown'),
        platform='instagram'
    )
    
    download_options = []
    video_url = post.get('videoUrl') or post.get('video_url')
    if video_url:
        download_options.append(DownloadOption(
            quality='Original',
            format='video/mp4',
            url=video_url
        ))
    
    # Handle carousel posts
    carousel = post.get('carousel', []) or post.get('sidecar', [])
    for i, item in enumerate(carousel):
        item_url = item.get('videoUrl') or item.get('displayUrl')
        if item_url:
            download_options.append(DownloadOption(
                quality=f"Slide {i+1}",
                format='video/mp4' if item.get('isVideo') else 'image/jpeg',
                url=item_url
            ))
    
    # If no video, try image
    if not download_options:
        image_url = post.get('displayUrl') or post.get('image_url')
        if image_url:
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
    """Parse TikTok API response"""
    video = data.get('video', data)
    author = data.get('author', {})
    
    metadata = VideoMetadata(
        title=video.get('desc', video.get('description', 'TikTok Video'))[:100],
        description=video.get('desc', video.get('description', '')),
        duration=video.get('duration'),
        thumbnail_url=video.get('cover') or video.get('thumbnail'),
        author=author.get('nickname') or author.get('uniqueId', 'Unknown'),
        view_count=video.get('playCount') or video.get('stats', {}).get('playCount'),
        platform='tiktok'
    )
    
    download_options = []
    play_url = video.get('playAddr') or video.get('downloadAddr') or video.get('video_url')
    if play_url:
        download_options.append(DownloadOption(
            quality='Original (No Watermark)',
            format='video/mp4',
            url=play_url
        ))
    
    # Watermarked version
    watermark_url = video.get('downloadAddr')
    if watermark_url and watermark_url != play_url:
        download_options.append(DownloadOption(
            quality='With Watermark',
            format='video/mp4',
            url=watermark_url
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
    tweet = data.get('tweet', data)
    user = tweet.get('user', {})
    media = tweet.get('media', [])
    
    metadata = VideoMetadata(
        title=tweet.get('text', 'Twitter Post')[:100],
        description=tweet.get('text', ''),
        thumbnail_url=media[0].get('thumbnail') if media else None,
        author=user.get('name') or user.get('screen_name', 'Unknown'),
        view_count=tweet.get('view_count'),
        platform='twitter'
    )
    
    download_options = []
    for m in media:
        if m.get('type') == 'video' or m.get('video_url'):
            variants = m.get('variants', [])
            for v in variants:
                if v.get('url') and v.get('content_type', '').startswith('video'):
                    download_options.append(DownloadOption(
                        quality=f"{v.get('bitrate', 'unknown')}kbps" if v.get('bitrate') else 'Original',
                        format=v.get('content_type', 'video/mp4'),
                        url=v.get('url')
                    ))
            # Direct video URL
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
    """Parse Facebook API response"""
    post = data.get('post', data)
    
    metadata = VideoMetadata(
        title=post.get('title') or post.get('text', 'Facebook Video')[:100],
        description=post.get('text', ''),
        thumbnail_url=post.get('thumbnail'),
        author=post.get('author', {}).get('name', 'Unknown'),
        platform='facebook'
    )
    
    download_options = []
    # HD version
    hd_url = post.get('hdUrl') or post.get('hd_url')
    if hd_url:
        download_options.append(DownloadOption(
            quality='HD',
            format='video/mp4',
            url=hd_url
        ))
    
    # SD version
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
