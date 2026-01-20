"""Restock predictor service."""
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Any


class RestockPredictor:
    """Predict ingredient restock needs."""

    def calculate_average_daily_usage(
        self, consumption_events: list[dict[str, Any]]
    ) -> Decimal:
        """Calculate average daily usage from consumption events.

        Args:
            consumption_events: List of events with quantity_delta and created_at

        Returns:
            Average daily consumption (positive value)
        """
        if not consumption_events:
            return Decimal("0")

        # Sum total consumption (negative deltas)
        total_consumed = sum(
            abs(Decimal(str(e["quantity_delta"])))
            for e in consumption_events
            if Decimal(str(e["quantity_delta"])) < 0
        )

        if total_consumed == Decimal("0"):
            return Decimal("0")

        # Calculate time span
        dates = [e["created_at"] for e in consumption_events]
        if len(dates) == 1:
            # Single event, assume 7 day period
            days = 7
        else:
            min_date = min(dates)
            max_date = max(dates)
            days = max((max_date - min_date).days, 1)

        return total_consumed / Decimal(str(days))

    def predict_runout(
        self,
        current_quantity: Decimal,
        average_daily_usage: Decimal,
        from_date: datetime,
        restock_buffer_days: int = 3,
    ) -> dict[str, Any]:
        """Predict when ingredient will run out.

        Args:
            current_quantity: Current inventory quantity
            average_daily_usage: Average daily consumption
            from_date: Date to predict from
            restock_buffer_days: Days before runout to recommend restock

        Returns:
            Dict with days_until_empty, predicted_runout_date, recommended_restock_date
        """
        if average_daily_usage <= Decimal("0"):
            return {
                "days_until_empty": None,
                "predicted_runout_date": None,
                "recommended_restock_date": None,
            }

        if current_quantity <= Decimal("0"):
            return {
                "days_until_empty": 0,
                "predicted_runout_date": from_date,
                "recommended_restock_date": from_date,
            }

        days_until_empty = int(current_quantity / average_daily_usage)
        runout_date = from_date + timedelta(days=days_until_empty)
        restock_date = from_date + timedelta(days=max(0, days_until_empty - restock_buffer_days))

        return {
            "days_until_empty": days_until_empty,
            "predicted_runout_date": runout_date,
            "recommended_restock_date": restock_date,
        }
