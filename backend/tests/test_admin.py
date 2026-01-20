# backend/tests/test_admin.py
"""Tests for admin endpoints."""

from unittest.mock import AsyncMock, patch

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from src.api.deps import verify_admin_key
from src.main import app


class TestVerifyAdminKey:
    """Tests for the verify_admin_key dependency."""

    @pytest.mark.asyncio
    async def test_returns_503_when_admin_key_not_configured(self):
        """Should return 503 when admin_api_key is empty."""
        with patch("src.api.deps.settings") as mock_settings:
            mock_settings.admin_api_key = ""

            with pytest.raises(HTTPException) as exc_info:
                await verify_admin_key(x_admin_key="any-key")

            assert exc_info.value.status_code == 503
            assert exc_info.value.detail == "Admin API disabled"

    @pytest.mark.asyncio
    async def test_returns_403_for_invalid_key(self):
        """Should return 403 when key doesn't match."""
        with patch("src.api.deps.settings") as mock_settings:
            mock_settings.admin_api_key = "correct-key"

            with pytest.raises(HTTPException) as exc_info:
                await verify_admin_key(x_admin_key="wrong-key")

            assert exc_info.value.status_code == 403
            assert exc_info.value.detail == "Invalid admin key"

    @pytest.mark.asyncio
    async def test_passes_for_valid_key(self):
        """Should not raise when key matches."""
        with patch("src.api.deps.settings") as mock_settings:
            mock_settings.admin_api_key = "correct-key"

            # Should not raise
            result = await verify_admin_key(x_admin_key="correct-key")
            assert result is None


class TestSeedDemoEndpoint:
    """Tests for POST /api/admin/seed-demo endpoint."""

    def setup_method(self):
        self.client = TestClient(app)

    def test_returns_422_when_header_missing(self):
        """Should return 422 when X-Admin-Key header is missing."""
        response = self.client.post("/api/admin/seed-demo")

        assert response.status_code == 422
        data = response.json()
        assert data["detail"][0]["loc"] == ["header", "X-Admin-Key"]
        assert data["detail"][0]["type"] == "missing"

    def test_returns_503_when_admin_disabled(self):
        """Should return 503 when ADMIN_API_KEY env var is not set."""
        with patch("src.api.deps.settings") as mock_settings:
            mock_settings.admin_api_key = ""

            response = self.client.post(
                "/api/admin/seed-demo",
                headers={"X-Admin-Key": "any-key"},
            )

            assert response.status_code == 503
            assert response.json()["detail"] == "Admin API disabled"

    def test_returns_403_for_wrong_key(self):
        """Should return 403 when key doesn't match."""
        with patch("src.api.deps.settings") as mock_settings:
            mock_settings.admin_api_key = "correct-key"

            response = self.client.post(
                "/api/admin/seed-demo",
                headers={"X-Admin-Key": "wrong-key"},
            )

            assert response.status_code == 403
            assert response.json()["detail"] == "Invalid admin key"

    def test_returns_200_with_valid_key(self):
        """Should return 200 and seed data when key is valid."""
        with (
            patch("src.api.deps.settings") as mock_settings,
            patch("src.api.admin.seed_demo_data", new_callable=AsyncMock) as mock_seed,
        ):
            mock_settings.admin_api_key = "correct-key"
            mock_seed.return_value = None

            response = self.client.post(
                "/api/admin/seed-demo",
                headers={"X-Admin-Key": "correct-key"},
            )

            assert response.status_code == 200
            assert response.json() == {"status": "ok", "message": "Demo data seeded"}
            mock_seed.assert_called_once_with(clear_first=True)

    def test_passes_clear_first_false(self):
        """Should pass clear_first=False when specified."""
        with (
            patch("src.api.deps.settings") as mock_settings,
            patch("src.api.admin.seed_demo_data", new_callable=AsyncMock) as mock_seed,
        ):
            mock_settings.admin_api_key = "correct-key"
            mock_seed.return_value = None

            response = self.client.post(
                "/api/admin/seed-demo?clear_first=false",
                headers={"X-Admin-Key": "correct-key"},
            )

            assert response.status_code == 200
            mock_seed.assert_called_once_with(clear_first=False)
