"""Inventory management service."""

from decimal import Decimal
from typing import Any


class InventoryService:
    """Service for inventory operations."""

    def calculate_remaining(self, lot: Any, events: list[Any]) -> Decimal:
        """
        Calculate remaining quantity for a lot based on events.

        Args:
            lot: InventoryLot with initial quantity
            events: List of InventoryEvent objects

        Returns:
            Remaining quantity after all events
        """
        remaining = lot.quantity
        for event in events:
            remaining += event.quantity_delta
        return remaining

    def can_consume(self, available: Decimal, requested: Decimal) -> bool:
        """
        Check if requested quantity can be consumed.

        Args:
            available: Currently available quantity
            requested: Amount requested to consume

        Returns:
            True if sufficient quantity available
        """
        return available >= requested
