"""Tests for restock predictor service."""

from datetime import datetime
from decimal import Decimal

from src.services.restock_predictor import RestockPredictor


class TestCalculateAverageDailyUsage:
    def test_calculate_usage_from_events(self):
        """Calculate average daily usage from consumption events."""
        predictor = RestockPredictor()

        events = [
            {"quantity_delta": Decimal("-100"), "created_at": datetime(2026, 1, 1)},
            {"quantity_delta": Decimal("-50"), "created_at": datetime(2026, 1, 8)},
            {"quantity_delta": Decimal("-150"), "created_at": datetime(2026, 1, 15)},
        ]

        # 300g consumed over 14 days = ~21.43g/day
        result = predictor.calculate_average_daily_usage(events)

        assert result > Decimal("21")
        assert result < Decimal("22")

    def test_calculate_usage_no_events(self):
        """Return zero for no consumption events."""
        predictor = RestockPredictor()
        result = predictor.calculate_average_daily_usage([])
        assert result == Decimal("0")

    def test_calculate_usage_single_event(self):
        """Handle single event gracefully."""
        predictor = RestockPredictor()
        events = [
            {"quantity_delta": Decimal("-100"), "created_at": datetime(2026, 1, 1)},
        ]
        # Single event, assume 7 days default period
        result = predictor.calculate_average_daily_usage(events)
        assert result > Decimal("0")


class TestPredictRunout:
    def test_predict_runout_date(self):
        """Predict when ingredient will run out."""
        predictor = RestockPredictor()

        result = predictor.predict_runout(
            current_quantity=Decimal("500"),
            average_daily_usage=Decimal("50"),
            from_date=datetime(2026, 1, 20),
        )

        assert result["days_until_empty"] == 10
        assert result["predicted_runout_date"] == datetime(2026, 1, 30)
        # Recommended restock 3 days before
        assert result["recommended_restock_date"] == datetime(2026, 1, 27)

    def test_predict_runout_no_usage(self):
        """Return None for no usage data."""
        predictor = RestockPredictor()

        result = predictor.predict_runout(
            current_quantity=Decimal("500"),
            average_daily_usage=Decimal("0"),
            from_date=datetime(2026, 1, 20),
        )

        assert result["days_until_empty"] is None
        assert result["predicted_runout_date"] is None

    def test_predict_runout_already_empty(self):
        """Handle already empty inventory."""
        predictor = RestockPredictor()

        result = predictor.predict_runout(
            current_quantity=Decimal("0"),
            average_daily_usage=Decimal("50"),
            from_date=datetime(2026, 1, 20),
        )

        assert result["days_until_empty"] == 0
        assert result["predicted_runout_date"] == datetime(2026, 1, 20)
