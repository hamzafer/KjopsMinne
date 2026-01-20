"""Tests for inventory service."""
from decimal import Decimal
from unittest.mock import MagicMock

from src.services.inventory_service import InventoryService


class TestInventoryService:
    def setup_method(self):
        self.service = InventoryService()

    def test_calculate_remaining_quantity_with_events(self):
        """Calculate remaining quantity after events."""
        lot = MagicMock()
        lot.quantity = Decimal("1000")  # Initial quantity

        events = [
            MagicMock(quantity_delta=Decimal("-100")),  # consumed 100
            MagicMock(quantity_delta=Decimal("-50")),   # consumed 50
            MagicMock(quantity_delta=Decimal("200")),   # adjustment +200
        ]

        result = self.service.calculate_remaining(lot, events)
        assert result == Decimal("1050")  # 1000 - 100 - 50 + 200

    def test_calculate_remaining_quantity_no_events(self):
        """No events means original quantity."""
        lot = MagicMock()
        lot.quantity = Decimal("500")

        result = self.service.calculate_remaining(lot, [])
        assert result == Decimal("500")

    def test_can_consume_sufficient_quantity(self):
        """Can consume when quantity available."""
        result = self.service.can_consume(
            available=Decimal("100"),
            requested=Decimal("50")
        )
        assert result is True

    def test_can_consume_insufficient_quantity(self):
        """Cannot consume more than available."""
        result = self.service.can_consume(
            available=Decimal("100"),
            requested=Decimal("150")
        )
        assert result is False

    def test_can_consume_exact_quantity(self):
        """Can consume exact available amount."""
        result = self.service.can_consume(
            available=Decimal("100"),
            requested=Decimal("100")
        )
        assert result is True
