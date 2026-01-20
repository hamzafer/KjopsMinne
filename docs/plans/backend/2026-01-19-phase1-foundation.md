# Phase 1: Foundation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Household, User, Ingredient, and UnitConversion models; extend Receipt/Item for inventory integration; create ingredient matching service.

**Architecture:** Extend existing SQLAlchemy models with new entities. Households own all data. Ingredients are canonical with aliases for matching. Receipt items gain ingredient mapping for inventory flow.

**Tech Stack:** FastAPI, SQLAlchemy 2.0 async, Alembic, Pydantic v2, pytest

---

## Task 1: Create Household and User Models

**Files:**
- Modify: `backend/src/db/models.py`

**Step 1: Add Household model**

Add after `class Base` (around line 11):

```python
class Household(Base):
    __tablename__ = "households"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=func.now(), nullable=False
    )

    users: Mapped[list["User"]] = relationship("User", back_populates="household")
    receipts: Mapped[list["Receipt"]] = relationship("Receipt", back_populates="household")
```

**Step 2: Add User model**

Add after Household:

```python
class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    household_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("households.id"), nullable=False
    )
    role: Mapped[str] = mapped_column(Text, default="member")  # "owner" | "member"
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=func.now(), nullable=False
    )

    household: Mapped["Household"] = relationship("Household", back_populates="users")

    __table_args__ = (Index("idx_users_household", household_id),)
```

**Step 3: Add household_id and inventory fields to Receipt**

Modify Receipt class, add after `id` field:

```python
    household_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("households.id"), nullable=True
    )
    inventory_status: Mapped[str] = mapped_column(Text, default="pending")  # "pending" | "reviewed" | "skipped"
```

Add relationship:

```python
    household: Mapped["Household | None"] = relationship("Household", back_populates="receipts")
```

**Step 4: Verify models compile**

Run: `cd /Users/stan/dev/kvitteringshvelv/backend && uv run python -c "from src.db.models import *; print('Models OK')"`

Expected: `Models OK`

**Step 5: Commit**

```bash
git add backend/src/db/models.py
git commit -m "feat(models): add Household, User models and Receipt extensions"
```

---

## Task 2: Create Ingredient Model

**Files:**
- Modify: `backend/src/db/models.py`

**Step 1: Add Ingredient model**

Add after User class:

```python
class Ingredient(Base):
    __tablename__ = "ingredients"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    canonical_name: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    default_unit: Mapped[str] = mapped_column(Text, default="g")  # g, ml, pcs
    aliases: Mapped[list[str]] = mapped_column(JSONB, default=list)
    category_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("categories.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=func.now(), nullable=False
    )

    category: Mapped["Category | None"] = relationship("Category")

    __table_args__ = (
        Index("idx_ingredients_canonical", canonical_name),
        Index("idx_ingredients_category", category_id),
    )
```

**Step 2: Add ingredient mapping fields to Item**

Modify Item class, add after `discount_amount`:

```python
    ingredient_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ingredients.id"), nullable=True
    )
    ingredient_confidence: Mapped[Decimal | None] = mapped_column(
        Numeric(3, 2), nullable=True
    )  # 0.00 to 1.00
    inventory_lot_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )  # FK added later when InventoryLot exists
    skip_inventory: Mapped[bool] = mapped_column(Boolean, default=False)
```

Add relationship:

```python
    ingredient: Mapped["Ingredient | None"] = relationship("Ingredient")
```

Add index to `__table_args__`:

```python
    __table_args__ = (
        Index("idx_items_receipt", receipt_id),
        Index("idx_items_category", category_id),
        Index("idx_items_ingredient", ingredient_id),
    )
```

**Step 3: Verify models compile**

Run: `cd /Users/stan/dev/kvitteringshvelv/backend && uv run python -c "from src.db.models import *; print('Models OK')"`

Expected: `Models OK`

**Step 4: Commit**

```bash
git add backend/src/db/models.py
git commit -m "feat(models): add Ingredient model and Item extensions"
```

---

## Task 3: Create UnitConversion Model

**Files:**
- Modify: `backend/src/db/models.py`

**Step 1: Add UnitConversion model**

Add after Ingredient class:

```python
class UnitConversion(Base):
    __tablename__ = "unit_conversions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    from_unit: Mapped[str] = mapped_column(Text, nullable=False)
    to_unit: Mapped[str] = mapped_column(Text, nullable=False)
    factor: Mapped[Decimal] = mapped_column(Numeric(10, 6), nullable=False)
    ingredient_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ingredients.id"), nullable=True
    )  # NULL = generic conversion, not ingredient-specific

    __table_args__ = (
        Index("idx_unit_conversions_from", from_unit),
        Index("idx_unit_conversions_ingredient", ingredient_id),
    )
```

**Step 2: Verify models compile**

Run: `cd /Users/stan/dev/kvitteringshvelv/backend && uv run python -c "from src.db.models import *; print('Models OK')"`

Expected: `Models OK`

**Step 3: Commit**

```bash
git add backend/src/db/models.py
git commit -m "feat(models): add UnitConversion model"
```

---

## Task 4: Create Alembic Migration

**Files:**
- Create: `backend/alembic/versions/002_household_ingredients.py`

**Step 1: Create migration file**

```python
"""Add household, user, ingredient, unit_conversion tables and extend receipt/item

Revision ID: 002
Revises: 001
Create Date: 2026-01-19

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Households table
    op.create_table(
        "households",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )

    # Users table
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.Text(), nullable=False, unique=True),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column(
            "household_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("households.id"),
            nullable=False,
        ),
        sa.Column("role", sa.Text(), server_default="member"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index("idx_users_household", "users", ["household_id"])

    # Ingredients table
    op.create_table(
        "ingredients",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("canonical_name", sa.Text(), nullable=False, unique=True),
        sa.Column("default_unit", sa.Text(), server_default="g"),
        sa.Column("aliases", postgresql.JSONB(), server_default="[]"),
        sa.Column(
            "category_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("categories.id"),
            nullable=True,
        ),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index("idx_ingredients_canonical", "ingredients", ["canonical_name"])
    op.create_index("idx_ingredients_category", "ingredients", ["category_id"])

    # Unit conversions table
    op.create_table(
        "unit_conversions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("from_unit", sa.Text(), nullable=False),
        sa.Column("to_unit", sa.Text(), nullable=False),
        sa.Column("factor", sa.Numeric(10, 6), nullable=False),
        sa.Column(
            "ingredient_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("ingredients.id"),
            nullable=True,
        ),
    )
    op.create_index("idx_unit_conversions_from", "unit_conversions", ["from_unit"])
    op.create_index("idx_unit_conversions_ingredient", "unit_conversions", ["ingredient_id"])

    # Extend receipts table
    op.add_column(
        "receipts",
        sa.Column(
            "household_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("households.id"),
            nullable=True,
        ),
    )
    op.add_column(
        "receipts",
        sa.Column("inventory_status", sa.Text(), server_default="pending"),
    )
    op.create_index("idx_receipts_household", "receipts", ["household_id"])

    # Extend items table
    op.add_column(
        "items",
        sa.Column(
            "ingredient_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("ingredients.id"),
            nullable=True,
        ),
    )
    op.add_column(
        "items",
        sa.Column("ingredient_confidence", sa.Numeric(3, 2), nullable=True),
    )
    op.add_column(
        "items",
        sa.Column("inventory_lot_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.add_column(
        "items",
        sa.Column("skip_inventory", sa.Boolean(), server_default="false"),
    )
    op.create_index("idx_items_ingredient", "items", ["ingredient_id"])


def downgrade() -> None:
    # Remove item extensions
    op.drop_index("idx_items_ingredient")
    op.drop_column("items", "skip_inventory")
    op.drop_column("items", "inventory_lot_id")
    op.drop_column("items", "ingredient_confidence")
    op.drop_column("items", "ingredient_id")

    # Remove receipt extensions
    op.drop_index("idx_receipts_household")
    op.drop_column("receipts", "inventory_status")
    op.drop_column("receipts", "household_id")

    # Drop tables in reverse order
    op.drop_index("idx_unit_conversions_ingredient")
    op.drop_index("idx_unit_conversions_from")
    op.drop_table("unit_conversions")

    op.drop_index("idx_ingredients_category")
    op.drop_index("idx_ingredients_canonical")
    op.drop_table("ingredients")

    op.drop_index("idx_users_household")
    op.drop_table("users")

    op.drop_table("households")
```

**Step 2: Run migration**

Run: `cd /Users/stan/dev/kvitteringshvelv && make up && sleep 5 && cd backend && uv run alembic upgrade head`

Expected: Migration applies successfully

**Step 3: Verify tables exist**

Run: `cd /Users/stan/dev/kvitteringshvelv && make shell-db` then `\dt`

Expected: See `households`, `users`, `ingredients`, `unit_conversions` tables

**Step 4: Commit**

```bash
git add backend/alembic/versions/002_household_ingredients.py
git commit -m "feat(db): add migration for household, ingredient, unit_conversion tables"
```

---

## Task 5: Create Pydantic Schemas

**Files:**
- Create: `backend/src/schemas/household.py`
- Create: `backend/src/schemas/ingredient.py`

**Step 1: Create household schemas**

```python
# backend/src/schemas/household.py
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class HouseholdCreate(BaseModel):
    name: str


class HouseholdResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    created_at: datetime


class UserCreate(BaseModel):
    email: str
    name: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    name: str
    household_id: UUID
    role: str
    created_at: datetime


class HouseholdWithUsers(HouseholdResponse):
    users: list[UserResponse] = []
```

**Step 2: Create ingredient schemas**

```python
# backend/src/schemas/ingredient.py
from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from src.schemas.item import CategoryResponse


class IngredientCreate(BaseModel):
    name: str
    canonical_name: str
    default_unit: str = "g"
    aliases: list[str] = []
    category_id: UUID | None = None


class IngredientUpdate(BaseModel):
    name: str | None = None
    canonical_name: str | None = None
    default_unit: str | None = None
    aliases: list[str] | None = None
    category_id: UUID | None = None


class IngredientResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    canonical_name: str
    default_unit: str
    aliases: list[str]
    category: CategoryResponse | None = None
    created_at: datetime


class IngredientMatch(BaseModel):
    """Result of matching a raw name to a canonical ingredient."""
    ingredient_id: UUID | None
    ingredient_name: str | None
    confidence: Decimal
    method: str  # "exact" | "alias" | "fuzzy" | "llm" | "none"


class UnitConversionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    from_unit: str
    to_unit: str
    factor: Decimal
    ingredient_id: UUID | None = None
```

**Step 3: Commit**

```bash
git add backend/src/schemas/household.py backend/src/schemas/ingredient.py
git commit -m "feat(schemas): add Household, User, Ingredient schemas"
```

---

## Task 6: Create Ingredient Seed Data

**Files:**
- Create: `backend/src/db/seed_ingredients.py`

**Step 1: Create ingredient seed file**

```python
# backend/src/db/seed_ingredients.py
"""Seed database with common Norwegian grocery ingredients."""
import asyncio
import uuid

from sqlalchemy import select

from src.db.engine import async_session_factory
from src.db.models import Category, Ingredient

# Common Norwegian ingredients with aliases
INGREDIENTS = [
    # Meieri (Dairy)
    {"name": "Melk", "canonical_name": "melk", "default_unit": "ml", "aliases": ["milk", "helmelk", "lettmelk", "skummet"], "category": "Meieri"},
    {"name": "Ost", "canonical_name": "ost", "default_unit": "g", "aliases": ["cheese", "norvegia", "jarlsberg", "gulost"], "category": "Meieri"},
    {"name": "Smør", "canonical_name": "smor", "default_unit": "g", "aliases": ["butter", "meierismør"], "category": "Meieri"},
    {"name": "Yoghurt", "canonical_name": "yoghurt", "default_unit": "g", "aliases": ["youghurt", "yogurt"], "category": "Meieri"},
    {"name": "Rømme", "canonical_name": "romme", "default_unit": "ml", "aliases": ["sour cream", "lettrømme"], "category": "Meieri"},
    {"name": "Fløte", "canonical_name": "flote", "default_unit": "ml", "aliases": ["cream", "matfløte", "kremfløte"], "category": "Meieri"},
    {"name": "Egg", "canonical_name": "egg", "default_unit": "pcs", "aliases": ["eggs", "eggehvite"], "category": "Meieri"},

    # Kjøtt (Meat)
    {"name": "Kyllingfilet", "canonical_name": "kyllingfilet", "default_unit": "g", "aliases": ["chicken breast", "kylling", "kyl filet"], "category": "Kjøtt"},
    {"name": "Kjøttdeig", "canonical_name": "kjottdeig", "default_unit": "g", "aliases": ["minced meat", "deig", "storfedeig"], "category": "Kjøtt"},
    {"name": "Bacon", "canonical_name": "bacon", "default_unit": "g", "aliases": ["bakon"], "category": "Kjøtt"},
    {"name": "Pølser", "canonical_name": "polser", "default_unit": "pcs", "aliases": ["sausages", "grillpølser", "wiener"], "category": "Kjøtt"},
    {"name": "Skinke", "canonical_name": "skinke", "default_unit": "g", "aliases": ["ham", "kokt skinke"], "category": "Kjøtt"},

    # Fisk (Fish)
    {"name": "Laks", "canonical_name": "laks", "default_unit": "g", "aliases": ["salmon", "laksefilet"], "category": "Fisk"},
    {"name": "Torsk", "canonical_name": "torsk", "default_unit": "g", "aliases": ["cod", "torskefilet"], "category": "Fisk"},
    {"name": "Reker", "canonical_name": "reker", "default_unit": "g", "aliases": ["shrimp", "prawns"], "category": "Fisk"},

    # Grønnsaker (Vegetables)
    {"name": "Tomat", "canonical_name": "tomat", "default_unit": "g", "aliases": ["tomato", "tomater", "cherrytomater"], "category": "Grønnsaker"},
    {"name": "Løk", "canonical_name": "lok", "default_unit": "pcs", "aliases": ["onion", "rødløk", "gul løk"], "category": "Grønnsaker"},
    {"name": "Hvitløk", "canonical_name": "hvitlok", "default_unit": "pcs", "aliases": ["garlic", "hvitløksfedd"], "category": "Grønnsaker"},
    {"name": "Gulrot", "canonical_name": "gulrot", "default_unit": "g", "aliases": ["carrot", "gulrøtter"], "category": "Grønnsaker"},
    {"name": "Paprika", "canonical_name": "paprika", "default_unit": "pcs", "aliases": ["bell pepper", "rød paprika", "gul paprika"], "category": "Grønnsaker"},
    {"name": "Agurk", "canonical_name": "agurk", "default_unit": "pcs", "aliases": ["cucumber", "slangeagurk"], "category": "Grønnsaker"},
    {"name": "Salat", "canonical_name": "salat", "default_unit": "pcs", "aliases": ["lettuce", "isbergsalat", "romaine"], "category": "Grønnsaker"},
    {"name": "Brokkoli", "canonical_name": "brokkoli", "default_unit": "g", "aliases": ["broccoli"], "category": "Grønnsaker"},
    {"name": "Spinat", "canonical_name": "spinat", "default_unit": "g", "aliases": ["spinach"], "category": "Grønnsaker"},
    {"name": "Potet", "canonical_name": "potet", "default_unit": "g", "aliases": ["potato", "poteter", "mandelpoteter"], "category": "Grønnsaker"},

    # Frukt (Fruit)
    {"name": "Banan", "canonical_name": "banan", "default_unit": "pcs", "aliases": ["banana", "bananer"], "category": "Frukt"},
    {"name": "Eple", "canonical_name": "eple", "default_unit": "pcs", "aliases": ["apple", "epler"], "category": "Frukt"},
    {"name": "Appelsin", "canonical_name": "appelsin", "default_unit": "pcs", "aliases": ["orange", "appelsiner"], "category": "Frukt"},
    {"name": "Sitron", "canonical_name": "sitron", "default_unit": "pcs", "aliases": ["lemon", "sitroner"], "category": "Frukt"},
    {"name": "Avokado", "canonical_name": "avokado", "default_unit": "pcs", "aliases": ["avocado"], "category": "Frukt"},

    # Brød (Bread)
    {"name": "Brød", "canonical_name": "brod", "default_unit": "pcs", "aliases": ["bread", "grovbrød", "loff"], "category": "Brød"},
    {"name": "Rundstykker", "canonical_name": "rundstykker", "default_unit": "pcs", "aliases": ["rolls", "rundstykke"], "category": "Brød"},

    # Tørrvarer (Dry goods)
    {"name": "Pasta", "canonical_name": "pasta", "default_unit": "g", "aliases": ["spaghetti", "penne", "makaroni"], "category": "Tørrvarer"},
    {"name": "Ris", "canonical_name": "ris", "default_unit": "g", "aliases": ["rice", "jasminris", "basmati"], "category": "Tørrvarer"},
    {"name": "Mel", "canonical_name": "mel", "default_unit": "g", "aliases": ["flour", "hvetemel"], "category": "Tørrvarer"},
    {"name": "Sukker", "canonical_name": "sukker", "default_unit": "g", "aliases": ["sugar", "melis"], "category": "Tørrvarer"},
    {"name": "Salt", "canonical_name": "salt", "default_unit": "g", "aliases": ["sea salt", "havsalt"], "category": "Tørrvarer"},
    {"name": "Pepper", "canonical_name": "pepper", "default_unit": "g", "aliases": ["black pepper", "sort pepper"], "category": "Tørrvarer"},
    {"name": "Olivenolje", "canonical_name": "olivenolje", "default_unit": "ml", "aliases": ["olive oil", "extra virgin"], "category": "Tørrvarer"},
    {"name": "Hermetiske tomater", "canonical_name": "hermetiske_tomater", "default_unit": "g", "aliases": ["canned tomatoes", "hakkede tomater"], "category": "Tørrvarer"},

    # Drikke (Beverages)
    {"name": "Kaffe", "canonical_name": "kaffe", "default_unit": "g", "aliases": ["coffee", "filterkaffe"], "category": "Drikke"},
    {"name": "Te", "canonical_name": "te", "default_unit": "pcs", "aliases": ["tea", "teposer"], "category": "Drikke"},
    {"name": "Juice", "canonical_name": "juice", "default_unit": "ml", "aliases": ["appelsinjuice", "eplejuice"], "category": "Drikke"},
]


async def seed_ingredients():
    """Insert common ingredients if they don't exist."""
    async with async_session_factory() as session:
        # Get category mapping
        result = await session.execute(select(Category))
        categories = {cat.name: cat.id for cat in result.scalars().all()}

        added = 0
        for ing_data in INGREDIENTS:
            # Check if exists
            result = await session.execute(
                select(Ingredient).where(Ingredient.canonical_name == ing_data["canonical_name"])
            )
            if not result.scalar_one_or_none():
                category_id = categories.get(ing_data.get("category"))
                ingredient = Ingredient(
                    id=uuid.uuid4(),
                    name=ing_data["name"],
                    canonical_name=ing_data["canonical_name"],
                    default_unit=ing_data["default_unit"],
                    aliases=ing_data["aliases"],
                    category_id=category_id,
                )
                session.add(ingredient)
                added += 1
                print(f"Added ingredient: {ing_data['name']}")
            else:
                print(f"Ingredient exists: {ing_data['name']}")

        await session.commit()
        print(f"Seeding complete! Added {added} ingredients.")


if __name__ == "__main__":
    asyncio.run(seed_ingredients())
```

**Step 2: Run seeder**

Run: `cd /Users/stan/dev/kvitteringshvelv/backend && uv run python -m src.db.seed_ingredients`

Expected: See "Added ingredient: ..." messages

**Step 3: Verify ingredients exist**

Run: `cd /Users/stan/dev/kvitteringshvelv && make shell-db` then `SELECT name, canonical_name FROM ingredients LIMIT 5;`

Expected: See ingredient rows

**Step 4: Commit**

```bash
git add backend/src/db/seed_ingredients.py
git commit -m "feat(db): add Norwegian ingredient seed data"
```

---

## Task 7: Create Unit Conversion Seed Data

**Files:**
- Create: `backend/src/db/seed_unit_conversions.py`

**Step 1: Create unit conversion seed file**

```python
# backend/src/db/seed_unit_conversions.py
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
```

**Step 2: Run seeder**

Run: `cd /Users/stan/dev/kvitteringshvelv/backend && uv run python -m src.db.seed_unit_conversions`

Expected: See "Added conversion: ..." messages

**Step 3: Commit**

```bash
git add backend/src/db/seed_unit_conversions.py
git commit -m "feat(db): add unit conversion seed data"
```

---

## Task 8: Create Unit Converter Service

**Files:**
- Create: `backend/src/services/unit_converter.py`
- Create: `backend/tests/test_unit_converter.py`

**Step 1: Write the failing test**

```python
# backend/tests/test_unit_converter.py
import pytest
from decimal import Decimal

from src.services.unit_converter import UnitConverter


class TestUnitConverter:
    def setup_method(self):
        self.converter = UnitConverter()

    def test_convert_kg_to_g(self):
        result = self.converter.to_canonical(Decimal("2"), "kg")
        assert result == (Decimal("2000"), "g")

    def test_convert_dl_to_ml(self):
        result = self.converter.to_canonical(Decimal("5"), "dl")
        assert result == (Decimal("500"), "ml")

    def test_convert_stk_to_pcs(self):
        result = self.converter.to_canonical(Decimal("3"), "stk")
        assert result == (Decimal("3"), "pcs")

    def test_convert_cup_to_ml(self):
        result = self.converter.to_canonical(Decimal("1"), "cup")
        assert result == (Decimal("240"), "ml")

    def test_convert_ss_to_ml(self):
        """Norwegian spiseskje (tablespoon)"""
        result = self.converter.to_canonical(Decimal("2"), "ss")
        assert result == (Decimal("30"), "ml")

    def test_identity_conversion_g(self):
        result = self.converter.to_canonical(Decimal("100"), "g")
        assert result == (Decimal("100"), "g")

    def test_unknown_unit_returns_as_is(self):
        result = self.converter.to_canonical(Decimal("5"), "unknown")
        assert result == (Decimal("5"), "unknown")

    def test_case_insensitive(self):
        result = self.converter.to_canonical(Decimal("1"), "KG")
        assert result == (Decimal("1000"), "g")
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/stan/dev/kvitteringshvelv/backend && uv run pytest tests/test_unit_converter.py -v`

Expected: ModuleNotFoundError or ImportError (service doesn't exist yet)

**Step 3: Write minimal implementation**

```python
# backend/src/services/unit_converter.py
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
        "ts": ("ml", Decimal("5")),   # Norwegian: teskje
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
```

**Step 4: Run test to verify it passes**

Run: `cd /Users/stan/dev/kvitteringshvelv/backend && uv run pytest tests/test_unit_converter.py -v`

Expected: All tests pass

**Step 5: Commit**

```bash
git add backend/src/services/unit_converter.py backend/tests/test_unit_converter.py
git commit -m "feat(services): add UnitConverter with tests"
```

---

## Task 9: Create Ingredient Matcher Service

**Files:**
- Create: `backend/src/services/ingredient_matcher.py`
- Create: `backend/tests/test_ingredient_matcher.py`

**Step 1: Write the failing test**

```python
# backend/tests/test_ingredient_matcher.py
import pytest
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock
import uuid

from src.services.ingredient_matcher import IngredientMatcher


class TestIngredientMatcher:
    def setup_method(self):
        self.matcher = IngredientMatcher()

    def test_normalize_removes_weight_suffix(self):
        result = self.matcher.normalize_name("TOMAT 500G")
        assert result == "tomat"

    def test_normalize_removes_brand_prefix(self):
        result = self.matcher.normalize_name("TINE MELK 1L")
        assert result == "melk"

    def test_normalize_handles_quantity_prefix(self):
        result = self.matcher.normalize_name("2X YOGHURT")
        assert result == "yoghurt"

    def test_normalize_norwegian_characters(self):
        result = self.matcher.normalize_name("RØKT LAKS")
        assert result == "rokt laks"

    def test_exact_match_returns_high_confidence(self):
        # Mock ingredient with canonical_name "melk"
        ingredient = MagicMock()
        ingredient.id = uuid.uuid4()
        ingredient.name = "Melk"
        ingredient.canonical_name = "melk"
        ingredient.aliases = ["milk"]

        result = self.matcher.match_against_ingredient("melk", ingredient)
        assert result is not None
        assert result.confidence == Decimal("1.0")
        assert result.method == "exact"

    def test_alias_match_returns_good_confidence(self):
        ingredient = MagicMock()
        ingredient.id = uuid.uuid4()
        ingredient.name = "Melk"
        ingredient.canonical_name = "melk"
        ingredient.aliases = ["milk", "helmelk", "lettmelk"]

        result = self.matcher.match_against_ingredient("lettmelk", ingredient)
        assert result is not None
        assert result.confidence == Decimal("0.95")
        assert result.method == "alias"

    def test_fuzzy_match_substring(self):
        ingredient = MagicMock()
        ingredient.id = uuid.uuid4()
        ingredient.name = "Kyllingfilet"
        ingredient.canonical_name = "kyllingfilet"
        ingredient.aliases = ["chicken breast", "kylling"]

        result = self.matcher.match_against_ingredient("kylling", ingredient)
        assert result is not None
        assert result.confidence >= Decimal("0.8")
        assert result.method in ("alias", "fuzzy")

    def test_no_match_returns_none(self):
        ingredient = MagicMock()
        ingredient.id = uuid.uuid4()
        ingredient.name = "Melk"
        ingredient.canonical_name = "melk"
        ingredient.aliases = ["milk"]

        result = self.matcher.match_against_ingredient("sjokolade", ingredient)
        assert result is None
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/stan/dev/kvitteringshvelv/backend && uv run pytest tests/test_ingredient_matcher.py -v`

Expected: ModuleNotFoundError (service doesn't exist yet)

**Step 3: Write minimal implementation**

```python
# backend/src/services/ingredient_matcher.py
"""Ingredient matching service for mapping receipt items to canonical ingredients."""
import re
from decimal import Decimal
from difflib import SequenceMatcher
from uuid import UUID

from pydantic import BaseModel


class MatchResult(BaseModel):
    """Result of matching a raw name to a canonical ingredient."""
    ingredient_id: UUID
    ingredient_name: str
    confidence: Decimal
    method: str  # "exact" | "alias" | "fuzzy" | "llm" | "none"


class IngredientMatcher:
    """Matches receipt item names to canonical ingredients."""

    # Norwegian brand prefixes to remove
    BRAND_PREFIXES = [
        "tine", "q-", "mills", "gilde", "prior", "nordfjord",
        "first price", "eldorado", "rema", "coop", "xtra",
    ]

    # Patterns to remove from names
    REMOVE_PATTERNS = [
        r"\d+\s*[xX]\s*",          # "2x", "3X"
        r"\d+\s*(g|kg|ml|l|dl|cl)\b",  # "500g", "1L"
        r"\d+\s*(stk|pk)\b",       # "6stk", "2pk"
        r"\d+%",                    # "3.5%"
    ]

    # Norwegian character replacements for fuzzy matching
    CHAR_MAP = {
        "æ": "ae", "ø": "o", "å": "a",
        "é": "e", "è": "e", "ê": "e",
    }

    def normalize_name(self, raw_name: str) -> str:
        """Normalize a raw receipt name for matching."""
        name = raw_name.lower().strip()

        # Remove patterns (weight, quantity, etc.)
        for pattern in self.REMOVE_PATTERNS:
            name = re.sub(pattern, "", name, flags=re.IGNORECASE)

        # Remove brand prefixes
        for brand in self.BRAND_PREFIXES:
            if name.startswith(brand + " "):
                name = name[len(brand) + 1:]
                break

        # Normalize Norwegian characters
        for char, replacement in self.CHAR_MAP.items():
            name = name.replace(char, replacement)

        # Clean up whitespace
        name = " ".join(name.split())

        return name

    def match_against_ingredient(self, normalized_name: str, ingredient) -> MatchResult | None:
        """
        Try to match a normalized name against a single ingredient.

        Returns MatchResult if match found, None otherwise.
        """
        # Exact match on canonical_name
        if normalized_name == ingredient.canonical_name:
            return MatchResult(
                ingredient_id=ingredient.id,
                ingredient_name=ingredient.name,
                confidence=Decimal("1.0"),
                method="exact",
            )

        # Check aliases
        for alias in ingredient.aliases:
            alias_normalized = alias.lower()
            if normalized_name == alias_normalized:
                return MatchResult(
                    ingredient_id=ingredient.id,
                    ingredient_name=ingredient.name,
                    confidence=Decimal("0.95"),
                    method="alias",
                )

        # Fuzzy matching: check if name contains canonical or vice versa
        canonical = ingredient.canonical_name
        if canonical in normalized_name or normalized_name in canonical:
            # Substring match
            ratio = SequenceMatcher(None, normalized_name, canonical).ratio()
            if ratio > 0.5:
                return MatchResult(
                    ingredient_id=ingredient.id,
                    ingredient_name=ingredient.name,
                    confidence=Decimal(str(round(0.7 + (ratio * 0.2), 2))),
                    method="fuzzy",
                )

        # Check aliases for fuzzy
        for alias in ingredient.aliases:
            alias_lower = alias.lower()
            if alias_lower in normalized_name or normalized_name in alias_lower:
                ratio = SequenceMatcher(None, normalized_name, alias_lower).ratio()
                if ratio > 0.5:
                    return MatchResult(
                        ingredient_id=ingredient.id,
                        ingredient_name=ingredient.name,
                        confidence=Decimal(str(round(0.6 + (ratio * 0.25), 2))),
                        method="fuzzy",
                    )

        return None

    async def match(
        self,
        raw_name: str,
        ingredients: list,
    ) -> MatchResult | None:
        """
        Match a raw receipt item name to the best canonical ingredient.

        Args:
            raw_name: The raw name from the receipt (e.g., "TINE MELK 1L")
            ingredients: List of Ingredient objects to match against

        Returns:
            Best MatchResult or None if no good match found
        """
        normalized = self.normalize_name(raw_name)

        best_match: MatchResult | None = None

        for ingredient in ingredients:
            match = self.match_against_ingredient(normalized, ingredient)
            if match:
                if best_match is None or match.confidence > best_match.confidence:
                    best_match = match

        # Return only if confidence is above threshold
        if best_match and best_match.confidence >= Decimal("0.6"):
            return best_match

        return None
```

**Step 4: Run test to verify it passes**

Run: `cd /Users/stan/dev/kvitteringshvelv/backend && uv run pytest tests/test_ingredient_matcher.py -v`

Expected: All tests pass

**Step 5: Commit**

```bash
git add backend/src/services/ingredient_matcher.py backend/tests/test_ingredient_matcher.py
git commit -m "feat(services): add IngredientMatcher with tests"
```

---

## Task 10: Create Household API Routes

**Files:**
- Create: `backend/src/api/households.py`
- Modify: `backend/src/main.py`

**Step 1: Create households router**

```python
# backend/src/api/households.py
"""Household management API routes."""
import uuid

from fastapi import APIRouter, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from src.api.deps import DbSession
from src.db.models import Household, User
from src.schemas.household import (
    HouseholdCreate,
    HouseholdResponse,
    HouseholdWithUsers,
    UserCreate,
    UserResponse,
)

router = APIRouter()


@router.post("/households", response_model=HouseholdWithUsers)
async def create_household(
    data: HouseholdCreate,
    owner: UserCreate,
    db: DbSession,
):
    """Create a new household with an owner."""
    # Create household
    household = Household(
        id=uuid.uuid4(),
        name=data.name,
    )
    db.add(household)
    await db.flush()

    # Create owner user
    user = User(
        id=uuid.uuid4(),
        email=owner.email,
        name=owner.name,
        household_id=household.id,
        role="owner",
    )
    db.add(user)
    await db.flush()

    # Reload with relationships
    result = await db.execute(
        select(Household)
        .options(selectinload(Household.users))
        .where(Household.id == household.id)
    )
    household = result.scalar_one()

    return household


@router.get("/households/{household_id}", response_model=HouseholdWithUsers)
async def get_household(household_id: uuid.UUID, db: DbSession):
    """Get a household with its users."""
    result = await db.execute(
        select(Household)
        .options(selectinload(Household.users))
        .where(Household.id == household_id)
    )
    household = result.scalar_one_or_none()

    if not household:
        raise HTTPException(status_code=404, detail="Household not found")

    return household


@router.post("/households/{household_id}/members", response_model=UserResponse)
async def add_member(
    household_id: uuid.UUID,
    data: UserCreate,
    db: DbSession,
):
    """Add a member to a household."""
    # Verify household exists
    result = await db.execute(
        select(Household).where(Household.id == household_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Household not found")

    # Check if email already exists
    result = await db.execute(
        select(User).where(User.email == data.email)
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        id=uuid.uuid4(),
        email=data.email,
        name=data.name,
        household_id=household_id,
        role="member",
    )
    db.add(user)
    await db.flush()

    return user


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: uuid.UUID, db: DbSession):
    """Get a user by ID."""
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user
```

**Step 2: Register router in main.py**

Add import and include:

```python
# In imports section
from src.api.households import router as households_router

# In router includes section (after existing includes)
app.include_router(households_router, prefix="/api", tags=["households"])
```

**Step 3: Verify API starts**

Run: `cd /Users/stan/dev/kvitteringshvelv && make up && sleep 5 && curl http://localhost:8000/docs`

Expected: Should return HTML (Swagger UI)

**Step 4: Commit**

```bash
git add backend/src/api/households.py backend/src/main.py
git commit -m "feat(api): add household management endpoints"
```

---

## Task 11: Create Ingredients API Routes

**Files:**
- Create: `backend/src/api/ingredients.py`
- Modify: `backend/src/main.py`

**Step 1: Create ingredients router**

```python
# backend/src/api/ingredients.py
"""Ingredient management API routes."""
import uuid

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from src.api.deps import DbSession
from src.db.models import Ingredient
from src.schemas.ingredient import (
    IngredientCreate,
    IngredientResponse,
    IngredientUpdate,
)

router = APIRouter()


@router.get("/ingredients", response_model=list[IngredientResponse])
async def list_ingredients(
    db: DbSession,
    search: str | None = Query(None, description="Search by name or alias"),
    category_id: uuid.UUID | None = Query(None, description="Filter by category"),
    skip: int = 0,
    limit: int = 50,
):
    """List all ingredients with optional filtering."""
    query = select(Ingredient).options(selectinload(Ingredient.category))

    if search:
        search_lower = f"%{search.lower()}%"
        query = query.where(
            Ingredient.name.ilike(search_lower) |
            Ingredient.canonical_name.ilike(search_lower)
        )

    if category_id:
        query = query.where(Ingredient.category_id == category_id)

    query = query.order_by(Ingredient.name).offset(skip).limit(limit)

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/ingredients/{ingredient_id}", response_model=IngredientResponse)
async def get_ingredient(ingredient_id: uuid.UUID, db: DbSession):
    """Get an ingredient by ID."""
    result = await db.execute(
        select(Ingredient)
        .options(selectinload(Ingredient.category))
        .where(Ingredient.id == ingredient_id)
    )
    ingredient = result.scalar_one_or_none()

    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")

    return ingredient


@router.post("/ingredients", response_model=IngredientResponse)
async def create_ingredient(data: IngredientCreate, db: DbSession):
    """Create a new ingredient."""
    # Check for duplicate canonical_name
    result = await db.execute(
        select(Ingredient).where(Ingredient.canonical_name == data.canonical_name)
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Ingredient with this canonical name already exists")

    ingredient = Ingredient(
        id=uuid.uuid4(),
        name=data.name,
        canonical_name=data.canonical_name,
        default_unit=data.default_unit,
        aliases=data.aliases,
        category_id=data.category_id,
    )
    db.add(ingredient)
    await db.flush()

    # Reload with category
    result = await db.execute(
        select(Ingredient)
        .options(selectinload(Ingredient.category))
        .where(Ingredient.id == ingredient.id)
    )
    return result.scalar_one()


@router.put("/ingredients/{ingredient_id}", response_model=IngredientResponse)
async def update_ingredient(
    ingredient_id: uuid.UUID,
    data: IngredientUpdate,
    db: DbSession,
):
    """Update an ingredient."""
    result = await db.execute(
        select(Ingredient).where(Ingredient.id == ingredient_id)
    )
    ingredient = result.scalar_one_or_none()

    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")

    # Update fields if provided
    if data.name is not None:
        ingredient.name = data.name
    if data.canonical_name is not None:
        ingredient.canonical_name = data.canonical_name
    if data.default_unit is not None:
        ingredient.default_unit = data.default_unit
    if data.aliases is not None:
        ingredient.aliases = data.aliases
    if data.category_id is not None:
        ingredient.category_id = data.category_id

    await db.flush()

    # Reload with category
    result = await db.execute(
        select(Ingredient)
        .options(selectinload(Ingredient.category))
        .where(Ingredient.id == ingredient.id)
    )
    return result.scalar_one()


@router.delete("/ingredients/{ingredient_id}")
async def delete_ingredient(ingredient_id: uuid.UUID, db: DbSession):
    """Delete an ingredient."""
    result = await db.execute(
        select(Ingredient).where(Ingredient.id == ingredient_id)
    )
    ingredient = result.scalar_one_or_none()

    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")

    await db.delete(ingredient)
    return {"message": "Ingredient deleted"}
```

**Step 2: Register router in main.py**

Add import and include:

```python
# In imports section
from src.api.ingredients import router as ingredients_router

# In router includes section
app.include_router(ingredients_router, prefix="/api", tags=["ingredients"])
```

**Step 3: Verify API**

Run: `curl http://localhost:8000/api/ingredients | head`

Expected: JSON array of ingredients

**Step 4: Commit**

```bash
git add backend/src/api/ingredients.py backend/src/main.py
git commit -m "feat(api): add ingredient management endpoints"
```

---

## Task 12: Create pytest Configuration

**Files:**
- Create: `backend/pytest.ini`
- Create: `backend/tests/__init__.py`
- Create: `backend/tests/conftest.py`

**Step 1: Create pytest.ini**

```ini
# backend/pytest.ini
[pytest]
asyncio_mode = auto
testpaths = tests
python_files = test_*.py
python_functions = test_*
addopts = -v --tb=short
```

**Step 2: Create tests/__init__.py**

```python
# backend/tests/__init__.py
```

**Step 3: Create conftest.py**

```python
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
```

**Step 4: Run all tests**

Run: `cd /Users/stan/dev/kvitteringshvelv/backend && uv run pytest`

Expected: All tests pass

**Step 5: Commit**

```bash
git add backend/pytest.ini backend/tests/__init__.py backend/tests/conftest.py
git commit -m "chore(tests): add pytest configuration"
```

---

## Task 13: Update Makefile with Seed Commands

**Files:**
- Modify: `Makefile`

**Step 1: Add seed commands**

Add after existing targets:

```makefile
# Seed data
seed-categories:
	cd backend && uv run python -m src.db.seed

seed-ingredients:
	cd backend && uv run python -m src.db.seed_ingredients

seed-units:
	cd backend && uv run python -m src.db.seed_unit_conversions

seed-all: seed-categories seed-ingredients seed-units
	@echo "All seed data loaded"
```

**Step 2: Verify commands work**

Run: `make seed-all`

Expected: Seeding messages for categories, ingredients, and unit conversions

**Step 3: Commit**

```bash
git add Makefile
git commit -m "chore(make): add seed commands for ingredients and unit conversions"
```

---

## Summary

**Phase 1 Complete!** You now have:

1. **Database models**: Household, User, Ingredient, UnitConversion + Receipt/Item extensions
2. **Migration**: `002_household_ingredients.py` with all new tables and columns
3. **Seed data**: Norwegian ingredients (~45) and unit conversions (~18)
4. **Services**: UnitConverter and IngredientMatcher with tests
5. **API endpoints**: `/api/households/*` and `/api/ingredients/*`
6. **Test infrastructure**: pytest configured with fixtures

**Next: Phase 2 (Inventory)** will build on this foundation to add InventoryLot, InventoryEvent, and the receipt → inventory flow.
