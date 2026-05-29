"""Backend tests for SaveFlex API.
Covers: /api/health, /api/platforms, /api/download (X URL), /api/proxy-download.
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8001").rstrip("/")
API = f"{BASE_URL}/api"


# ---------- Health ----------
class TestHealth:
    def test_health(self):
        r = requests.get(f"{API}/health", timeout=20)
        assert r.status_code == 200
        data = r.json()
        assert data.get("status") == "healthy"
        assert "timestamp" in data


# ---------- Platforms ----------
class TestPlatforms:
    def test_platforms_list(self):
        r = requests.get(f"{API}/platforms", timeout=20)
        assert r.status_code == 200
        data = r.json()
        assert "platforms" in data
        assert isinstance(data["platforms"], list)
        ids = {p["id"] for p in data["platforms"]}
        # 5 known platforms
        assert {"youtube", "instagram", "tiktok", "x", "facebook"}.issubset(ids)
        for p in data["platforms"]:
            assert "name" in p and "icon" in p and "description" in p


# ---------- Download (X / Twitter) ----------
class TestDownloadX:
    def test_download_x_returns_structured_response(self):
        """Accept either success=true or graceful error (not a raw 500)."""
        payload = {"url": "https://x.com/elonmusk/status/1"}
        r = requests.post(f"{API}/download", json=payload, timeout=60)
        # 200 (success or success=false) or graceful 4xx/503. NOT 500.
        assert r.status_code in (200, 400, 404, 502, 503, 504), (
            f"Unexpected status {r.status_code}: {r.text[:200]}"
        )
        # Body should be JSON
        body = r.json()
        if r.status_code == 200:
            assert "success" in body
            assert body.get("platform") in ("twitter", "x", None)
            # When success=true, expect download_options
            if body.get("success"):
                assert "download_options" in body
        else:
            # FastAPI error has 'detail'
            assert "detail" in body or "error" in body or "message" in body

    def test_download_invalid_url(self):
        r = requests.post(f"{API}/download", json={"url": "not-a-url"}, timeout=20)
        assert r.status_code in (400, 422)

    def test_download_empty_url(self):
        r = requests.post(f"{API}/download", json={"url": ""}, timeout=20)
        assert r.status_code in (400, 422)


# ---------- Proxy Download ----------
class TestProxyDownload:
    SAMPLE_URL = "https://www.w3schools.com/html/mov_bbb.mp4"

    def test_proxy_download_returns_attachment(self):
        params = {"url": self.SAMPLE_URL, "filename": "test_video.mp4"}
        r = requests.get(f"{API}/proxy-download", params=params, timeout=90, stream=True)
        assert r.status_code == 200, f"Got {r.status_code}: {r.text[:200]}"

        cd = r.headers.get("Content-Disposition", "")
        assert "attachment" in cd.lower()
        assert "test_video.mp4" in cd

        # Read a small chunk to confirm bytes flow.
        chunk = next(r.iter_content(chunk_size=4096), b"")
        assert chunk and len(chunk) > 0
        r.close()

    def test_proxy_download_filename_sanitization(self):
        """Dangerous chars should be stripped; result should still be a valid filename."""
        bad_name = "../../etc/passwd<>?.mp4"
        params = {"url": self.SAMPLE_URL, "filename": bad_name}
        r = requests.get(f"{API}/proxy-download", params=params, timeout=90, stream=True)
        assert r.status_code == 200
        cd = r.headers.get("Content-Disposition", "")
        # Should not contain path traversal characters
        assert "../" not in cd
        assert "<" not in cd and ">" not in cd
        assert "attachment" in cd.lower()
        r.close()

    def test_proxy_download_empty_filename_defaults(self):
        params = {"url": self.SAMPLE_URL, "filename": "????"}
        r = requests.get(f"{API}/proxy-download", params=params, timeout=90, stream=True)
        assert r.status_code == 200
        cd = r.headers.get("Content-Disposition", "")
        assert "attachment" in cd.lower()
        # Should fall back to a .mp4 filename
        assert ".mp4" in cd.lower()
        r.close()
