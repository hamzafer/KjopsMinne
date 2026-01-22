"""Unit conversion service for canonical units (g, ml, pcs)."""

from decimal import Decimal


class UnitConverter:
    """Converts various units to canonical units (g, ml, pcs)."""

    # Standard conversions: from_unit -> (to_unit, factor)
    CONVERSIONS: dict[str, tuple[str, Decimal]] = {
        # Volume to ml
        "l": ("ml", Decimal("1000")),
        "dl": ("ml", Decimal("100")),
        "cl": ("ml", Decimal("10")),
        "cup": ("ml", Decimal("240")),
        "tbsp": ("ml", Decimal("15")),
        "tsp": ("ml", Decimal("5")),
        "ss": ("ml", Decimal("15")),  # Norwegian: spiseskje
        "ts": ("ml", Decimal("5")),  # Norwegian: teskje
        # Weight to g
        "kg": ("g", Decimal("1000")),
        "hg": ("g", Decimal("100")),
        "oz": ("g", Decimal("28.3495")),
        "lb": ("g", Decimal("453.592")),
        # Count to pcs
        "stk": ("pcs", Decimal("1")),
        "pk": ("pcs", Decimal("1")),
        "bx": ("pcs", Decimal("1")),
        # Identity
        "g": ("g", Decimal("1")),
        "ml": ("ml", Decimal("1")),
        "pcs": ("pcs", Decimal("1")),
    }

    def to_canonical(self, quantity: Decimal, unit: str) -> tuple[Decimal, str]:
        """
        Convert quantity and unit to canonical form.

        Returns (converted_quantity, canonical_unit).
        Unknown units are returned as-is.
        """
        unit_lower = unit.lower().strip()

        if unit_lower in self.CONVERSIONS:
            to_unit, factor = self.CONVERSIONS[unit_lower]
            return (quantity * factor, to_unit)

        return (quantity, unit)

    def is_canonical(self, unit: str) -> bool:
        """Check if unit is already canonical."""
        return unit.lower() in ("g", "ml", "pcs")
