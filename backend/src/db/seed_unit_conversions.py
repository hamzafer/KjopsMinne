"""Seed database with common unit conversions."""
import asyncio
import uuid
from decimal import Decimal

from sqlalchemy import select

from src.db.engine import async_session_factory
from src.db.models import UnitConversion

# Standard conversions (to_unit is always canonical: g, ml, pcs)
CONVERSIONS = [
    # Volume to ml
    {"from_unit": "l", "to_unit": "ml", "factor": Decimal("1000")},
    {"from_unit": "dl", "to_unit": "ml", "factor": Decimal("100")},
    {"from_unit": "cl", "to_unit": "ml", "factor": Decimal("10")},
    {"from_unit": "cup", "to_unit": "ml", "factor": Decimal("240")},
    {"from_unit": "tbsp", "to_unit": "ml", "factor": Decimal("15")},
    {"from_unit": "tsp", "to_unit": "ml", "factor": Decimal("5")},
    {"from_unit": "ss", "to_unit": "ml", "factor": Decimal("15")},  # Norwegian: spiseskje
    {"from_unit": "ts", "to_unit": "ml", "factor": Decimal("5")},   # Norwegian: teskje

    # Weight to g
    {"from_unit": "kg", "to_unit": "g", "factor": Decimal("1000")},
    {"from_unit": "hg", "to_unit": "g", "factor": Decimal("100")},  # Norwegian: hektogram
    {"from_unit": "oz", "to_unit": "g", "factor": Decimal("28.3495")},
    {"from_unit": "lb", "to_unit": "g", "factor": Decimal("453.592")},

    # Count to pcs
    {"from_unit": "stk", "to_unit": "pcs", "factor": Decimal("1")},  # Norwegian: stykk
    {"from_unit": "pk", "to_unit": "pcs", "factor": Decimal("1")},   # Norwegian: pakke (treated as 1 unit)
    {"from_unit": "bx", "to_unit": "pcs", "factor": Decimal("1")},   # box

    # Identity conversions (canonical to canonical)
    {"from_unit": "g", "to_unit": "g", "factor": Decimal("1")},
    {"from_unit": "ml", "to_unit": "ml", "factor": Decimal("1")},
    {"from_unit": "pcs", "to_unit": "pcs", "factor": Decimal("1")},
]


async def seed_unit_conversions():
    """Insert unit conversions if they don't exist."""
    async with async_session_factory() as session:
        added = 0
        for conv_data in CONVERSIONS:
            # Check if exists
            result = await session.execute(
                select(UnitConversion).where(
                    UnitConversion.from_unit == conv_data["from_unit"],
                    UnitConversion.to_unit == conv_data["to_unit"],
                    UnitConversion.ingredient_id.is_(None),
                )
            )
            if not result.scalar_one_or_none():
                conversion = UnitConversion(
                    id=uuid.uuid4(),
                    from_unit=conv_data["from_unit"],
                    to_unit=conv_data["to_unit"],
                    factor=conv_data["factor"],
                    ingredient_id=None,
                )
                session.add(conversion)
                added += 1
                print(f"Added conversion: {conv_data['from_unit']} -> {conv_data['to_unit']}")
            else:
                print(f"Conversion exists: {conv_data['from_unit']} -> {conv_data['to_unit']}")

        await session.commit()
        print(f"Seeding complete! Added {added} conversions.")


if __name__ == "__main__":
    asyncio.run(seed_unit_conversions())
