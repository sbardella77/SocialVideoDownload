# SaveFlex - Social Media Video Downloader Platform

## Original Problem Statement
Build a Snapinsta-like downloader platform with:
- SEO-first architecture (not feature-first)
- Utility embedded inside content
- Monetization through ads (not users)
- Stateless, anonymous usage
- Cost-controlled backend

## Architecture

### Tech Stack
- **Frontend**: React 19 + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB (caching + stats)
- **APIs**: RapidAPI Social Media Video Downloader (Instagram/TikTok/X/Facebook) + YTStream (YouTube)
- **Ads**: Monetag Multitag (zone 10618740) + In-Page Push via sw.js
- **Analytics**: Umami Cloud (privacy-friendly, no cookie banner, website-id `04cf1563-a434-46fa-9f41-fec01d259f89`) + custom `download` event
- **SEO**: Dynamic JSON-LD (FAQPage, BreadcrumbList, SoftwareApplication, WebSite, HowTo)

### Key Design Decisions
1. SEO landing pages per platform (/youtube-downloader, /tiktok-downloader, etc.)
2. Stateless: no user accounts, no DB-persisted user data
3. Cost control: 1-hour response cache, 30 req/min rate limit, 10 req/min on proxy download
4. Mobile-first: proxied streaming download with `Content-Disposition: attachment` so iOS/Android save the file directly
5. Ads: single Monetag Multitag covers all formats automatically

## Core Requirements
- Multi-platform support (YouTube, Instagram, TikTok, X, Facebook)
- Auto-detection of platform from URL
- Multiple quality options + audio-only (YouTube)
- Watermark-free TikTok
- Fast, anonymous downloads
- Mobile responsive + mobile downloads work
- SEO-optimised with structured data

## What's Been Implemented

### Backend (FastAPI) — modular structure
- `/app/backend/server.py` (54 lines) — app entry, middleware, router wiring
- `/app/backend/config.py` — centralised env vars & constants
- `/app/backend/models.py` — Pydantic models (VideoMetadata, DownloadOption, DownloadResponse, ...)
- `/app/backend/db.py` — Mongo client + cache helpers (`get_cached_response`, `store_cached_response`)
- `/app/backend/platforms/{base,youtube,instagram,tiktok,twitter,facebook}.py` — per-platform fetch + parse. Parse functions split into small helpers (≤10 cyclomatic complexity each).
- `/app/backend/routes/{meta,download}.py` — meta (health/platforms/stats) and download (`/download` + `/proxy-download`) routers. `download_video` uses a `_PLATFORM_HANDLERS` dispatch map.
- [x] /api/health, /api/platforms, /api/stats
- [x] POST /api/download — auto-detects platform, returns metadata + download options
- [x] GET /api/proxy-download — streams remote file with `Content-Disposition: attachment` (forces mobile save)
- [x] Rate limiting (slowapi): 30/min /api/download, 10/min /api/proxy-download
- [x] MongoDB response cache (1h TTL)
- [x] YouTube via YTStream API (combined Video+Audio + audio-only)
- [x] Instagram/TikTok/X/Facebook via RapidAPI Social Media Video Downloader

### Frontend (React 19 + Tailwind + Shadcn)
- [x] Dark theme, mobile responsive
- [x] HomePage + 5 platform landing pages
- [x] Hero input, platform grid, FAQ accordion, How-to section
- [x] DownloadResult component — proxies download through `/api/proxy-download`
- [x] Toast notifications (sonner)
- [x] **Dynamic SEO** (`SEO.jsx` + `seoConfig.js`):
  - Per-page <title>, meta description, canonical, og + twitter tags
  - JSON-LD: FAQPage, BreadcrumbList, SoftwareApplication, WebSite, HowTo
  - 6 page configs (home + 5 platforms)
- [x] **Monetag Multitag** integrated in `index.html` (zone 10618740, `al5sm.com/tag.min.js`)
- [x] sw.js for Monetag In-Page Push (zone 10574900)
- [x] **Download History** (localStorage):
  - `useDownloadHistory` hook — max 20 items, dedupe by URL, cross-tab sync
  - `DownloadHistory` component — thumbnail, platform badge, relative time, re-download, remove, clear-all
  - Saved on download click, surfaced on home + all platform pages
- [x] robots.txt + sitemap.xml + Google site verification

### API Endpoints
- `GET  /api/health`
- `GET  /api/platforms`
- `POST /api/download`
- `GET  /api/proxy-download?url=&filename=`
- `GET  /api/stats`

### Tests
- Backend pytest suite at `/app/backend/tests/test_saveflex_api.py` (8 tests, 100% pass)

## Changelog

- **Feb 2026 — Initial build**: Backend, frontend, 5 platform pages, RapidAPI + YTStream integrations.
- **Feb 2026 — Mobile downloads**: `/api/proxy-download` streaming endpoint forces file save on mobile.
- **Feb 2026 — Monetag ads**: sw.js + (later) Multitag inline script for zone 10618740.
- **May 27 2026 — SEO JSON-LD**: dynamic `SEO` component + `seoConfig.js`, full structured data on all pages.
- **May 27 2026 — Download history**: `useDownloadHistory` hook + `DownloadHistory` UI with localStorage persistence.
- **May 27 2026 — Backend tests**: pytest regression suite added.
- **May 27 2026 — Umami Analytics**: privacy-friendly analytics integrated (pageviews + custom `download` event on every download click for conversion tracking).
- **May 27 2026 — Code quality fixes**: magic numbers → named constants, array-index keys → stable keys, empty catches → dev-only logging, removed dead AdSense code, refactored `DownloadResult.jsx` into small sub-components.
- **May 27 2026 — Backend refactor (Task F)**: monolithic `server.py` (843 lines) split into `config.py`, `models.py`, `db.py`, `platforms/*.py` (per-platform fetch+parse), `routes/*.py`. Parse functions decomposed into small helpers (cyclomatic complexity ≤10). All 8 pytest still pass.

## Prioritized Backlog

### P1
- [x] ~~Refactor `server.py` (~840 lines) into `routes/` + `services/` modules per platform~~ ✅ Done May 2026
- [ ] **i18n multi-language** (EN + IT minimum, add ES/FR/DE/PT for SEO long-tail) — react-i18next
- [ ] Recover from intermittent RapidAPI "post not found" on Instagram/TikTok (cached fallback or alternative API)

### P2
- [ ] Download progress indicator on proxy-download (`Content-Length` exposed, hook into XHR/fetch)
- [ ] Copy download link button on DownloadResult
- [ ] Social share buttons
- [ ] Light/Dark mode toggle (currently dark-only)
- [ ] Batch download support (paste multiple URLs)

### P3
- [ ] PWA support (manifest + offline)
- [ ] Browser extension
- [ ] Analytics integration (Plausible / GA4)
- [ ] Per-platform sitemaps for video downloader keywords (Snapinsta strategy)

## Known Issues
- Instagram/TikTok via RapidAPI occasionally returns "post not found" — third-party flakiness, graceful fallback in place.
- AdPlaceholder still references unused legacy AdSense code (publisher `ca-pub-5255520995564923`). Inactive (no `adSlot` is ever passed). Can be cleaned up during refactor.

## Test Credentials
None — app is fully anonymous, no auth.
