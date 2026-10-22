# SaveFlex

Free online video downloader for YouTube, TikTok, Instagram, Facebook and X. Live at [saveflex.net](https://saveflex.net).

## Structure

- `frontend/`: React (Create React App + craco, Tailwind, shadcn/ui). Deployed on Vercel with root directory `frontend`.
- `backend/`: FastAPI API under `/api`. Deployed on Fly.io from the root `Dockerfile` and `fly.toml`.

Downloads are resolved through RapidAPI (YTStream for YouTube, Social Media Video Downloader for the other platforms). MongoDB is optional and only used as a one hour response cache.

## Backend

```bash
cd backend
pip install -r requirements-dev.txt
uvicorn server:app --reload --port 8080
```

Environment variables:

| Name | Required | Notes |
| --- | --- | --- |
| `RAPIDAPI_KEY` | yes | RapidAPI key used for all downloads |
| `MONGO_URL` | no | Cache database; the API works without it |
| `DB_NAME` | no | Defaults to `saveflex` |
| `CORS_ORIGINS` | no | Comma separated, defaults to `*` |

Tests run against a live server: `REACT_APP_BACKEND_URL=http://localhost:8080 pytest backend/tests`.

## Frontend

```bash
cd frontend
npm install
REACT_APP_BACKEND_URL=http://localhost:8080 npm start
```

`REACT_APP_BACKEND_URL` is read at build time, so it must also be set in the Vercel project.
