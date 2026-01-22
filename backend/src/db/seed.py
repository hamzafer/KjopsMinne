"""Seed database with initial categories."""

import asyncio
import uuid

from sqlalchemy import select

from src.db.engine import async_session_factory
from src.db.models import Category

CATEGORIES = [
    {"name": "Meieri", "icon": "🥛", "color": "#60A5FA"},
    {"name": "Kjøtt", "icon": "🥩", "color": "#F87171"},
    {"name": "Fisk", "icon": "🐟", "color": "#38BDF8"},
    {"name": "Brød", "icon": "🍞", "color": "#FBBF24"},
    {"name": "Frukt", "icon": "🍎", "color": "#34D399"},
    {"name": "Grønnsaker", "icon": "🥬", "color": "#4ADE80"},
    {"name": "Drikke", "icon": "🥤", "color": "#A78BFA"},
    {"name": "Tørrvarer", "icon": "🌾", "color": "#D4A574"},
    {"name": "Frossen", "icon": "❄️", "color": "#93C5FD"},
    {"name": "Husholdning", "icon": "🧹", "color": "#F9A8D4"},
    {"name": "Snacks", "icon": "🍿", "color": "#FB923C"},
    {"name": "Pant", "icon": "♻️", "color": "#86EFAC"},
]


async def seed_categories():
    """Insert default categories if they don't exist."""
    async with async_session_factory() as session:
        for cat_data in CATEGORIES:
            # Check if exists
            result = await session.execute(
                select(Category).where(Category.name == cat_data["name"])
            )
            if not result.scalar_one_or_none():
                category = Category(
                    id=uuid.uuid4(),
                    name=cat_data["name"],
                    icon=cat_data["icon"],
                    color=cat_data["color"],
                )
                session.add(category)
                print(f"Added category: {cat_data['name']}")
            else:
                print(f"Category exists: {cat_data['name']}")

        await session.commit()
        print("Seeding complete!")


if __name__ == "__main__":
    asyncio.run(seed_categories())
