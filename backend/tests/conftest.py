# backend/tests/conftest.py
"""Pytest configuration and fixtures."""
import pytest


@pytest.fixture
def sample_receipt_item():
    """Sample receipt item data for testing."""
    return {
        "raw_name": "TINE MELK 1L",
        "total_price": "25.90",
    }


@pytest.fixture
def sample_ingredients():
    """Sample ingredients for testing matching."""
    from unittest.mock import MagicMock
    import uuid

    melk = MagicMock()
    melk.id = uuid.uuid4()
    melk.name = "Melk"
    melk.canonical_name = "melk"
    melk.aliases = ["milk", "helmelk", "lettmelk"]

    ost = MagicMock()
    ost.id = uuid.uuid4()
    ost.name = "Ost"
    ost.canonical_name = "ost"
    ost.aliases = ["cheese", "norvegia", "jarlsberg"]

    return [melk, ost]
