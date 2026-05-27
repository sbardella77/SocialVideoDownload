"""SaveFlex FastAPI app entry — wires middleware + routers."""
import logging

from fastapi import APIRouter, FastAPI, Request
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from starlette.middleware.cors import CORSMiddleware

from config import CORS_ORIGINS
from db import close_client
from routes import download_router, meta_router
from routes.download import limiter

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

app = FastAPI(title="SaveFlex API", version="1.0.0")

# Build the /api router and include sub-routers.
api_router = APIRouter(prefix="/api")
api_router.include_router(meta_router)
api_router.include_router(download_router)
app.include_router(api_router)

# Rate limiter — attached to app state so slowapi can find it.
app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={
            "success": False,
            "error": "Rate limit exceeded. Please wait a moment before trying again.",
            "retry_after": 60,
        },
    )


app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    close_client()
