"""Unit tests for platform parsers — no external API calls.

These exercise the parsing logic (which handles broken/partial RapidAPI responses)
without hitting the network.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from platforms.facebook import parse_facebook_response


class TestFacebookParser:
    def test_video_only_streams_returns_error(self):
        """If every stream is video-only (DASH separated), surface a clear error."""
        payload = {
            "error": None,
            "contents": [
                {
                    "videos": [
                        {
                            "label": "video_hd",
                            "url": "https://fb.com/v.mp4",
                            "metadata": {"has_audio": False, "mime_type": "video/mp4"},
                        },
                        {
                            "label": "video_sd",
                            "url": "https://fb.com/v2.mp4",
                            "metadata": {"has_audio": False, "mime_type": "video/mp4"},
                        },
                    ]
                }
            ],
            "metadata": {"text": "Test"},
        }
        result = parse_facebook_response(payload)
        assert result.success is False
        assert "DASH" in (result.error or "")
        assert not result.download_options

    def test_mixed_streams_keeps_only_those_with_audio(self):
        payload = {
            "error": None,
            "contents": [
                {
                    "videos": [
                        {
                            "label": "video_hd",
                            "url": "https://fb.com/silent.mp4",
                            "metadata": {"has_audio": False},
                        },
                        {
                            "label": "native_sd",
                            "url": "https://fb.com/with-audio.mp4",
                            "metadata": {"has_audio": True},
                        },
                    ]
                }
            ],
            "metadata": {"text": "Mixed"},
        }
        result = parse_facebook_response(payload)
        assert result.success is True
        assert len(result.download_options) == 1
        assert result.download_options[0].url.endswith("with-audio.mp4")

    def test_normalises_native_labels(self):
        payload = {
            "error": None,
            "contents": [
                {
                    "videos": [
                        {
                            "label": "native_hd",
                            "url": "https://fb.com/hd.mp4",
                            "metadata": {"has_audio": True},
                        },
                        {
                            "label": "native_sd",
                            "url": "https://fb.com/sd.mp4",
                            "metadata": {"has_audio": True},
                        },
                    ]
                }
            ],
            "metadata": {"text": "Both"},
        }
        result = parse_facebook_response(payload)
        qualities = [o.quality for o in result.download_options]
        assert qualities == ["HD", "SD"]

    def test_upstream_error_surfaced(self):
        payload = {"error": {"message": "Video not found"}, "contents": [], "metadata": {}}
        result = parse_facebook_response(payload)
        assert result.success is False
        assert "not found" in (result.error or "").lower()
