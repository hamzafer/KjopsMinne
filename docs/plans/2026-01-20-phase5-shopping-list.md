# Phase 5: Shopping List Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement shopping list generation from meal plans with inventory-aware "to buy" quantities

**Architecture:** ShoppingList and ShoppingListItem models with a generation service that aggregates ingredients from planned meals, checks current inventory, and calculates what needs to be purchased. Backend-first approach matching Phases 1-4.

**Tech Stack:** FastAPI, SQLAlchemy 2.0 async, Pydantic v2, PostgreSQL

---

## Task 1: Create ShoppingList Model

**Files:**
- Modify: `backend/src/db/models.py`

**Step 1: Add ShoppingList model after Leftover**

```python
class ShoppingList(Base):
    __tablename__ = "shopping_lists"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    household_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("households.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    date_range_start: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    date_range_end: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    status: Mapped[str] = mapped_column(Text, default="active")  # active|completed|archived
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=func.now(), onupdate=func.now(), nullable=False
    )

    household: Mapped["Household"] = relationship("Household")
    items: Mapped[list["ShoppingListItem"]] = relationship(
        "ShoppingListItem", back_populates="shopping_list", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("idx_shopping_lists_household", "household_id"),
        Index("idx_shopping_lists_status", "status"),
        Index("idx_shopping_lists_date_range", "date_range_start", "date_range_end"),
    )
```

**Step 2: Commit**

```bash
git add backend/src/db/models.py
git commit -m "feat(models): add ShoppingList model"
```

---

## Task 2: Create ShoppingListItem Model

**Files:**
- Modify: `backend/src/db/models.py`

**Step 1: Add ShoppingListItem model after ShoppingList**

```python
class ShoppingListItem(Base):
    __tablename__ = "shopping_list_items"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    shopping_list_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("shopping_lists.id"), nullable=False
    )
    ingredient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ingredients.id"), nullable=False
    )
    required_quantity: Mapped[Decimal] = mapped_column(Numeric(10, 3), nullable=False)
    required_unit: Mapped[str] = mapped_column(Text, nullable=False)
    on_hand_quantity: Mapped[Decimal] = mapped_column(Numeric(10, 3), default=Decimal("0"))
    to_buy_quantity: Mapped[Decimal] = mapped_column(Numeric(10, 3), nullable=False)
    is_checked: Mapped[bool] = mapped_column(Boolean, default=False)
    actual_quantity: Mapped[Decimal | None] = mapped_column(Numeric(10, 3), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_meal_plans: Mapped[list] = mapped_column(ARRAY(UUID(as_uuid=True)), default=list)

    shopping_list: Mapped["ShoppingList"] = relationship(
        "ShoppingList", back_populates="items"
    )
    ingredient: Mapped["Ingredient"] = relationship("Ingredient")

    __table_args__ = (
        Index("idx_shopping_list_items_list", "shopping_list_id"),
        Index("idx_shopping_list_items_ingredient", "ingredient_id"),
        Index("idx_shopping_list_items_checked", "is_checked"),
    )
```

**Step 2: Commit**

```bash
git add backend/src/db/models.py
git commit -m "feat(models): add ShoppingListItem model"
```

---

## Task 3: Create Alembic Migration (006_shopping_lists.py)

**Files:**
- Create: `backend/alembic/versions/006_shopping_lists.py`

**Step 1: Create migration file**

```python
"""Add shopping list tables.

Revision ID: 006
Revises: 005
Create Date: 2026-01-20
"""
from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "006"
down_revision: str | None = "005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Create shopping_lists table
    op.create_table(
        "shopping_lists",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "household_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("households.id"),
            nullable=False,
        ),
        sa.Column("name", sa.Text, nullable=False),
        sa.Column("date_range_start", sa.DateTime, nullable=False),
        sa.Column("date_range_end", sa.DateTime, nullable=False),
        sa.Column("status", sa.Text, server_default="active"),
        sa.Column(
            "created_at", sa.DateTime, server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime, server_default=sa.func.now(), nullable=False
        ),
    )

    # Create shopping_list_items table
    op.create_table(
        "shopping_list_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "shopping_list_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("shopping_lists.id"),
            nullable=False,
        ),
        sa.Column(
            "ingredient_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("ingredients.id"),
            nullable=False,
        ),
        sa.Column("required_quantity", sa.Numeric(10, 3), nullable=False),
        sa.Column("required_unit", sa.Text, nullable=False),
        sa.Column("on_hand_quantity", sa.Numeric(10, 3), server_default="0"),
        sa.Column("to_buy_quantity", sa.Numeric(10, 3), nullable=False),
        sa.Column("is_checked", sa.Boolean, server_default="false"),
        sa.Column("actual_quantity", sa.Numeric(10, 3), nullable=True),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column(
            "source_meal_plans",
            postgresql.ARRAY(postgresql.UUID(as_uuid=True)),
            server_default="{}",
        ),
    )

    # Create indexes for shopping_lists
    op.create_index("idx_shopping_lists_household", "shopping_lists", ["household_id"])
    op.create_index("idx_shopping_lists_status", "shopping_lists", ["status"])
    op.create_index(
        "idx_shopping_lists_date_range",
        "shopping_lists",
        ["date_range_start", "date_range_end"],
    )

    # Create indexes for shopping_list_items
    op.create_index(
        "idx_shopping_list_items_list", "shopping_list_items", ["shopping_list_id"]
    )
    op.create_index(
        "idx_shopping_list_items_ingredient", "shopping_list_items", ["ingredient_id"]
    )
    op.create_index(
        "idx_shopping_list_items_checked", "shopping_list_items", ["is_checked"]
    )


def downgrade() -> None:
    op.drop_index("idx_shopping_list_items_checked", "shopping_list_items")
    op.drop_index("idx_shopping_list_items_ingredient", "shopping_list_items")
    op.drop_index("idx_shopping_list_items_list", "shopping_list_items")
    op.drop_index("idx_shopping_lists_date_range", "shopping_lists")
    op.drop_index("idx_shopping_lists_status", "shopping_lists")
    op.drop_index("idx_shopping_lists_household", "shopping_lists")
    op.drop_table("shopping_list_items")
    op.drop_table("shopping_lists")
```

**Step 2: Run migration**

```bash
cd backend && uv run alembic upgrade head
```

**Step 3: Commit**

```bash
git add backend/alembic/versions/006_shopping_lists.py
git commit -m "feat(db): add shopping_lists migration 006"
```

---

## Task 4: Create Shopping List Pydantic Schemas

**Files:**
- Create: `backend/src/schemas/shopping_list.py`

**Step 1: Create schemas**

```python
"""Pydantic schemas for shopping lists."""
from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


# ShoppingListItem Schemas
class ShoppingListItemBase(BaseModel):
    required_quantity: Decimal
    required_unit: str
    on_hand_quantity: Decimal = Decimal("0")
    to_buy_quantity: Decimal
    is_checked: bool = False
    notes: str | None = None


class ShoppingListItemCreate(ShoppingListItemBase):
    shopping_list_id: UUID
    ingredient_id: UUID
    source_meal_plans: list[UUID] = []


class ShoppingListItemUpdate(BaseModel):
    is_checked: bool | None = None
    actual_quantity: Decimal | None = None
    notes: str | None = None


class ShoppingListItemResponse(ShoppingListItemBase):
    id: UUID
    shopping_list_id: UUID
    ingredient_id: UUID
    actual_quantity: Decimal | None = None
    source_meal_plans: list[UUID] = []
    ingredient_name: str | None = None  # Populated from relationship

    model_config = ConfigDict(from_attributes=True)


# ShoppingList Schemas
class ShoppingListBase(BaseModel):
    name: str
    date_range_start: datetime
    date_range_end: datetime
    status: str = "active"


class ShoppingListCreate(ShoppingListBase):
    household_id: UUID


class ShoppingListUpdate(BaseModel):
    name: str | None = None
    status: str | None = None


class ShoppingListResponse(ShoppingListBase):
    id: UUID
    household_id: UUID
    created_at: datetime
    updated_at: datetime
    items: list[ShoppingListItemResponse] = []

    model_config = ConfigDict(from_attributes=True)


class ShoppingListListResponse(BaseModel):
    shopping_lists: list[ShoppingListResponse]
    total: int


# Generation Request/Response
class GenerateShoppingListRequest(BaseModel):
    household_id: UUID
    start_date: datetime
    end_date: datetime
    name: str | None = None  # Auto-generated if not provided


class GenerateShoppingListResponse(BaseModel):
    shopping_list: ShoppingListResponse
    meal_plans_included: int
    ingredients_aggregated: int
```

**Step 2: Lint and commit**

```bash
cd backend && uv run ruff check src/schemas/shopping_list.py --fix
git add backend/src/schemas/shopping_list.py
git commit -m "feat(schemas): add ShoppingList Pydantic schemas"
```

---

## Task 5: Create Shopping Generator Service (TDD)

**Files:**
- Create: `backend/tests/test_shopping_generator.py`
- Create: `backend/src/services/shopping_generator.py`

**Step 1: Write failing tests**

```python
"""Tests for shopping list generator service."""
import pytest
from decimal import Decimal
from uuid import uuid4

from src.services.shopping_generator import ShoppingGenerator


class TestAggregateIngredients:
    def test_aggregate_single_meal_plan(self):
        """Aggregate ingredients from a single meal plan."""
        generator = ShoppingGenerator()

        meal_plans = [
            {
                "id": uuid4(),
                "servings": 2,
                "recipe": {
                    "servings": 2,
                    "ingredients": [
                        {"ingredient_id": uuid4(), "quantity": Decimal("200"), "unit": "g"},
                        {"ingredient_id": uuid4(), "quantity": Decimal("2"), "unit": "pcs"},
                    ],
                },
            }
        ]

        result = generator.aggregate_ingredients(meal_plans)

        assert len(result) == 2
        # Quantities should match since servings ratio is 1:1

    def test_aggregate_multiple_meal_plans_same_ingredient(self):
        """Aggregate same ingredient from multiple meal plans."""
        generator = ShoppingGenerator()
        ingredient_id = uuid4()

        meal_plans = [
            {
                "id": uuid4(),
                "servings": 2,
                "recipe": {
                    "servings": 2,
                    "ingredients": [
                        {"ingredient_id": ingredient_id, "quantity": Decimal("100"), "unit": "g"},
                    ],
                },
            },
            {
                "id": uuid4(),
                "servings": 2,
                "recipe": {
                    "servings": 2,
                    "ingredients": [
                        {"ingredient_id": ingredient_id, "quantity": Decimal("150"), "unit": "g"},
                    ],
                },
            },
        ]

        result = generator.aggregate_ingredients(meal_plans)

        assert len(result) == 1
        assert result[ingredient_id]["quantity"] == Decimal("250")

    def test_aggregate_scales_by_servings(self):
        """Scale ingredients by planned vs recipe servings."""
        generator = ShoppingGenerator()
        ingredient_id = uuid4()

        meal_plans = [
            {
                "id": uuid4(),
                "servings": 4,  # Planning for 4
                "recipe": {
                    "servings": 2,  # Recipe serves 2
                    "ingredients": [
                        {"ingredient_id": ingredient_id, "quantity": Decimal("100"), "unit": "g"},
                    ],
                },
            },
        ]

        result = generator.aggregate_ingredients(meal_plans)

        assert result[ingredient_id]["quantity"] == Decimal("200")  # Doubled

    def test_aggregate_tracks_source_meal_plans(self):
        """Track which meal plans require each ingredient."""
        generator = ShoppingGenerator()
        ingredient_id = uuid4()
        meal_plan_id_1 = uuid4()
        meal_plan_id_2 = uuid4()

        meal_plans = [
            {
                "id": meal_plan_id_1,
                "servings": 2,
                "recipe": {
                    "servings": 2,
                    "ingredients": [
                        {"ingredient_id": ingredient_id, "quantity": Decimal("100"), "unit": "g"},
                    ],
                },
            },
            {
                "id": meal_plan_id_2,
                "servings": 2,
                "recipe": {
                    "servings": 2,
                    "ingredients": [
                        {"ingredient_id": ingredient_id, "quantity": Decimal("50"), "unit": "g"},
                    ],
                },
            },
        ]

        result = generator.aggregate_ingredients(meal_plans)

        assert meal_plan_id_1 in result[ingredient_id]["source_meal_plans"]
        assert meal_plan_id_2 in result[ingredient_id]["source_meal_plans"]


class TestCalculateToBuy:
    def test_calculate_to_buy_no_inventory(self):
        """Calculate to buy when no inventory exists."""
        generator = ShoppingGenerator()

        result = generator.calculate_to_buy(
            required_quantity=Decimal("500"),
            on_hand_quantity=Decimal("0"),
        )

        assert result == Decimal("500")

    def test_calculate_to_buy_partial_inventory(self):
        """Calculate to buy when some inventory exists."""
        generator = ShoppingGenerator()

        result = generator.calculate_to_buy(
            required_quantity=Decimal("500"),
            on_hand_quantity=Decimal("200"),
        )

        assert result == Decimal("300")

    def test_calculate_to_buy_sufficient_inventory(self):
        """Calculate to buy when inventory is sufficient."""
        generator = ShoppingGenerator()

        result = generator.calculate_to_buy(
            required_quantity=Decimal("500"),
            on_hand_quantity=Decimal("600"),
        )

        assert result == Decimal("0")

    def test_calculate_to_buy_exact_inventory(self):
        """Calculate to buy when inventory exactly matches."""
        generator = ShoppingGenerator()

        result = generator.calculate_to_buy(
            required_quantity=Decimal("500"),
            on_hand_quantity=Decimal("500"),
        )

        assert result == Decimal("0")


class TestGenerateListName:
    def test_generate_name_default(self):
        """Generate default list name from date range."""
        generator = ShoppingGenerator()
        from datetime import datetime

        result = generator.generate_list_name(
            start_date=datetime(2026, 1, 20),
            end_date=datetime(2026, 1, 26),
        )

        assert "Jan 20" in result
        assert "Jan 26" in result

    def test_generate_name_custom(self):
        """Use custom name if provided."""
        generator = ShoppingGenerator()
        from datetime import datetime

        result = generator.generate_list_name(
            start_date=datetime(2026, 1, 20),
            end_date=datetime(2026, 1, 26),
            custom_name="Weekly groceries",
        )

        assert result == "Weekly groceries"
```

**Step 2: Run tests (should fail)**

```bash
cd backend && uv run pytest tests/test_shopping_generator.py -v
```

**Step 3: Implement service**

```python
"""Shopping list generator service."""
from datetime import datetime
from decimal import Decimal
from typing import Any
from uuid import UUID


class ShoppingGenerator:
    """Generate shopping lists from meal plans."""

    def aggregate_ingredients(
        self, meal_plans: list[dict[str, Any]]
    ) -> dict[UUID, dict[str, Any]]:
        """Aggregate ingredients from multiple meal plans.

        Args:
            meal_plans: List of meal plan dicts with recipe and ingredients

        Returns:
            Dict mapping ingredient_id to aggregated data:
            {
                ingredient_id: {
                    "quantity": total_quantity,
                    "unit": canonical_unit,
                    "source_meal_plans": [meal_plan_ids],
                }
            }
        """
        aggregated: dict[UUID, dict[str, Any]] = {}

        for meal_plan in meal_plans:
            meal_plan_id = meal_plan["id"]
            planned_servings = meal_plan["servings"]
            recipe = meal_plan["recipe"]
            recipe_servings = recipe["servings"]

            # Calculate scaling factor
            scale = (
                Decimal(str(planned_servings)) / Decimal(str(recipe_servings))
                if recipe_servings > 0
                else Decimal("1")
            )

            for ingredient in recipe.get("ingredients", []):
                ingredient_id = ingredient.get("ingredient_id")
                if not ingredient_id:
                    continue

                quantity = Decimal(str(ingredient.get("quantity", 0))) * scale
                unit = ingredient.get("unit", "")

                if ingredient_id not in aggregated:
                    aggregated[ingredient_id] = {
                        "quantity": Decimal("0"),
                        "unit": unit,
                        "source_meal_plans": [],
                    }

                aggregated[ingredient_id]["quantity"] += quantity
                if meal_plan_id not in aggregated[ingredient_id]["source_meal_plans"]:
                    aggregated[ingredient_id]["source_meal_plans"].append(meal_plan_id)

        return aggregated

    def calculate_to_buy(
        self, required_quantity: Decimal, on_hand_quantity: Decimal
    ) -> Decimal:
        """Calculate quantity to buy.

        Args:
            required_quantity: Total quantity needed
            on_hand_quantity: Quantity currently in inventory

        Returns:
            Quantity to buy (never negative)
        """
        return max(Decimal("0"), required_quantity - on_hand_quantity)

    def generate_list_name(
        self,
        start_date: datetime,
        end_date: datetime,
        custom_name: str | None = None,
    ) -> str:
        """Generate shopping list name.

        Args:
            start_date: Date range start
            end_date: Date range end
            custom_name: Optional custom name

        Returns:
            List name
        """
        if custom_name:
            return custom_name

        start_str = start_date.strftime("%b %d")
        end_str = end_date.strftime("%b %d")
        return f"Shopping {start_str} - {end_str}"
```

**Step 4: Run tests (should pass)**

```bash
cd backend && uv run pytest tests/test_shopping_generator.py -v
```

**Step 5: Commit**

```bash
git add backend/src/services/shopping_generator.py backend/tests/test_shopping_generator.py
git commit -m "feat(services): add ShoppingGenerator with TDD"
```

---

## Task 6: Create Shopping List API Routes - List and Get

**Files:**
- Create: `backend/src/api/shopping_lists.py`

**Step 1: Create router with list and get endpoints**

```python
"""API routes for shopping lists."""
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from src.api.deps import DbSession
from src.db.models import ShoppingList, ShoppingListItem
from src.schemas.shopping_list import (
    ShoppingListListResponse,
    ShoppingListResponse,
    ShoppingListItemResponse,
)

router = APIRouter()


@router.get("/shopping-lists", response_model=ShoppingListListResponse)
async def list_shopping_lists(
    db: DbSession,
    household_id: UUID = Query(..., description="Household ID"),
    status: str | None = Query(None, description="Filter by status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> ShoppingListListResponse:
    """List shopping lists for a household."""
    query = select(ShoppingList).where(ShoppingList.household_id == household_id)

    if status:
        query = query.where(ShoppingList.status == status)

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)

    # Paginate and eager load items with ingredients
    query = query.options(
        selectinload(ShoppingList.items).selectinload(ShoppingListItem.ingredient)
    )
    query = query.order_by(ShoppingList.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    shopping_lists = result.scalars().all()

    return ShoppingListListResponse(
        shopping_lists=[
            _to_response(sl) for sl in shopping_lists
        ],
        total=total or 0,
    )


@router.get("/shopping-lists/{shopping_list_id}", response_model=ShoppingListResponse)
async def get_shopping_list(
    db: DbSession,
    shopping_list_id: UUID,
) -> ShoppingListResponse:
    """Get a shopping list by ID."""
    query = (
        select(ShoppingList)
        .where(ShoppingList.id == shopping_list_id)
        .options(
            selectinload(ShoppingList.items).selectinload(ShoppingListItem.ingredient)
        )
    )
    result = await db.execute(query)
    shopping_list = result.scalar_one_or_none()

    if not shopping_list:
        raise HTTPException(status_code=404, detail="Shopping list not found")

    return _to_response(shopping_list)


def _to_response(shopping_list: ShoppingList) -> ShoppingListResponse:
    """Convert ShoppingList model to response with ingredient names."""
    items = [
        ShoppingListItemResponse(
            id=item.id,
            shopping_list_id=item.shopping_list_id,
            ingredient_id=item.ingredient_id,
            required_quantity=item.required_quantity,
            required_unit=item.required_unit,
            on_hand_quantity=item.on_hand_quantity,
            to_buy_quantity=item.to_buy_quantity,
            is_checked=item.is_checked,
            actual_quantity=item.actual_quantity,
            notes=item.notes,
            source_meal_plans=item.source_meal_plans or [],
            ingredient_name=item.ingredient.name if item.ingredient else None,
        )
        for item in shopping_list.items
    ]

    return ShoppingListResponse(
        id=shopping_list.id,
        household_id=shopping_list.household_id,
        name=shopping_list.name,
        date_range_start=shopping_list.date_range_start,
        date_range_end=shopping_list.date_range_end,
        status=shopping_list.status,
        created_at=shopping_list.created_at,
        updated_at=shopping_list.updated_at,
        items=items,
    )
```

**Step 2: Lint and commit**

```bash
cd backend && uv run ruff check src/api/shopping_lists.py --fix
git add backend/src/api/shopping_lists.py
git commit -m "feat(api): add ShoppingList list and get endpoints"
```

---

## Task 7: Add Shopping List Generate Endpoint

**Files:**
- Modify: `backend/src/api/deps.py`
- Modify: `backend/src/api/shopping_lists.py`

**Step 1: Add ShoppingGenerator dependency to deps.py**

```python
from src.services.shopping_generator import ShoppingGenerator

def get_shopping_generator() -> ShoppingGenerator:
    return ShoppingGenerator()

ShoppingGeneratorDep = Annotated[ShoppingGenerator, Depends(get_shopping_generator)]
```

**Step 2: Add generate endpoint**

```python
from datetime import datetime
from decimal import Decimal

from src.api.deps import DbSession, ShoppingGeneratorDep
from src.db.models import (
    InventoryLot,
    MealPlan,
    Recipe,
    ShoppingList,
    ShoppingListItem,
)
from src.schemas.shopping_list import (
    GenerateShoppingListRequest,
    GenerateShoppingListResponse,
)


@router.post("/shopping-lists/generate", response_model=GenerateShoppingListResponse, status_code=201)
async def generate_shopping_list(
    db: DbSession,
    generator: ShoppingGeneratorDep,
    request: GenerateShoppingListRequest,
) -> GenerateShoppingListResponse:
    """Generate a shopping list from planned meals."""
    # Get planned meals in date range
    query = (
        select(MealPlan)
        .where(
            MealPlan.household_id == request.household_id,
            MealPlan.planned_date >= request.start_date,
            MealPlan.planned_date <= request.end_date,
            MealPlan.status == "planned",
        )
        .options(selectinload(MealPlan.recipe).selectinload(Recipe.ingredients))
    )
    result = await db.execute(query)
    meal_plans = result.scalars().all()

    # Convert to dict format for generator
    meal_plan_data = [
        {
            "id": mp.id,
            "servings": mp.servings,
            "recipe": {
                "servings": mp.recipe.servings,
                "ingredients": [
                    {
                        "ingredient_id": ri.ingredient_id,
                        "quantity": ri.quantity,
                        "unit": ri.unit,
                    }
                    for ri in mp.recipe.ingredients
                    if ri.ingredient_id and ri.quantity
                ],
            },
        }
        for mp in meal_plans
    ]

    # Aggregate ingredients
    aggregated = generator.aggregate_ingredients(meal_plan_data)

    # Generate list name
    list_name = generator.generate_list_name(
        start_date=request.start_date,
        end_date=request.end_date,
        custom_name=request.name,
    )

    # Create shopping list
    shopping_list = ShoppingList(
        household_id=request.household_id,
        name=list_name,
        date_range_start=request.start_date,
        date_range_end=request.end_date,
    )
    db.add(shopping_list)
    await db.flush()

    # Create items with inventory check
    for ingredient_id, data in aggregated.items():
        # Get current inventory for this ingredient
        inv_query = (
            select(func.coalesce(func.sum(InventoryLot.quantity), Decimal("0")))
            .where(
                InventoryLot.household_id == request.household_id,
                InventoryLot.ingredient_id == ingredient_id,
                InventoryLot.quantity > 0,
            )
        )
        on_hand = await db.scalar(inv_query) or Decimal("0")

        to_buy = generator.calculate_to_buy(
            required_quantity=data["quantity"],
            on_hand_quantity=on_hand,
        )

        item = ShoppingListItem(
            shopping_list_id=shopping_list.id,
            ingredient_id=ingredient_id,
            required_quantity=data["quantity"],
            required_unit=data["unit"],
            on_hand_quantity=on_hand,
            to_buy_quantity=to_buy,
            source_meal_plans=data["source_meal_plans"],
        )
        db.add(item)

    await db.flush()

    # Reload with items and ingredients
    query = (
        select(ShoppingList)
        .where(ShoppingList.id == shopping_list.id)
        .options(
            selectinload(ShoppingList.items).selectinload(ShoppingListItem.ingredient)
        )
    )
    result = await db.execute(query)
    shopping_list = result.scalar_one()

    return GenerateShoppingListResponse(
        shopping_list=_to_response(shopping_list),
        meal_plans_included=len(meal_plans),
        ingredients_aggregated=len(aggregated),
    )
```

**Step 3: Commit**

```bash
git add backend/src/api/deps.py backend/src/api/shopping_lists.py
git commit -m "feat(api): add ShoppingList generate endpoint"
```

---

## Task 8: Add Shopping List Update Endpoint

**Files:**
- Modify: `backend/src/api/shopping_lists.py`

**Step 1: Add update endpoint**

```python
from src.schemas.shopping_list import ShoppingListUpdate


@router.patch("/shopping-lists/{shopping_list_id}", response_model=ShoppingListResponse)
async def update_shopping_list(
    db: DbSession,
    shopping_list_id: UUID,
    update_data: ShoppingListUpdate,
) -> ShoppingListResponse:
    """Update a shopping list."""
    query = (
        select(ShoppingList)
        .where(ShoppingList.id == shopping_list_id)
        .options(
            selectinload(ShoppingList.items).selectinload(ShoppingListItem.ingredient)
        )
    )
    result = await db.execute(query)
    shopping_list = result.scalar_one_or_none()

    if not shopping_list:
        raise HTTPException(status_code=404, detail="Shopping list not found")

    data = update_data.model_dump(exclude_unset=True)

    # Validate status if provided
    if "status" in data:
        if data["status"] not in ("active", "completed", "archived"):
            raise HTTPException(status_code=400, detail="Invalid status")

    for key, value in data.items():
        setattr(shopping_list, key, value)

    await db.flush()

    return _to_response(shopping_list)
```

**Step 2: Commit**

```bash
git add backend/src/api/shopping_lists.py
git commit -m "feat(api): add ShoppingList update endpoint"
```

---

## Task 9: Add Shopping List Item Update Endpoint

**Files:**
- Modify: `backend/src/api/shopping_lists.py`

**Step 1: Add item update endpoint**

```python
from src.schemas.shopping_list import ShoppingListItemUpdate


@router.patch(
    "/shopping-lists/{shopping_list_id}/items/{item_id}",
    response_model=ShoppingListItemResponse,
)
async def update_shopping_list_item(
    db: DbSession,
    shopping_list_id: UUID,
    item_id: UUID,
    update_data: ShoppingListItemUpdate,
) -> ShoppingListItemResponse:
    """Update a shopping list item (check off, add notes, set actual quantity)."""
    query = (
        select(ShoppingListItem)
        .where(
            ShoppingListItem.id == item_id,
            ShoppingListItem.shopping_list_id == shopping_list_id,
        )
        .options(selectinload(ShoppingListItem.ingredient))
    )
    result = await db.execute(query)
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(status_code=404, detail="Shopping list item not found")

    data = update_data.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(item, key, value)

    await db.flush()

    return ShoppingListItemResponse(
        id=item.id,
        shopping_list_id=item.shopping_list_id,
        ingredient_id=item.ingredient_id,
        required_quantity=item.required_quantity,
        required_unit=item.required_unit,
        on_hand_quantity=item.on_hand_quantity,
        to_buy_quantity=item.to_buy_quantity,
        is_checked=item.is_checked,
        actual_quantity=item.actual_quantity,
        notes=item.notes,
        source_meal_plans=item.source_meal_plans or [],
        ingredient_name=item.ingredient.name if item.ingredient else None,
    )
```

**Step 2: Commit**

```bash
git add backend/src/api/shopping_lists.py
git commit -m "feat(api): add ShoppingListItem update endpoint"
```

---

## Task 10: Add Shopping List Delete Endpoint

**Files:**
- Modify: `backend/src/api/shopping_lists.py`

**Step 1: Add delete endpoint**

```python
from fastapi import Response


@router.delete("/shopping-lists/{shopping_list_id}", status_code=204)
async def delete_shopping_list(
    db: DbSession,
    shopping_list_id: UUID,
) -> Response:
    """Delete a shopping list and all its items."""
    query = select(ShoppingList).where(ShoppingList.id == shopping_list_id)
    result = await db.execute(query)
    shopping_list = result.scalar_one_or_none()

    if not shopping_list:
        raise HTTPException(status_code=404, detail="Shopping list not found")

    await db.delete(shopping_list)
    await db.flush()

    return Response(status_code=204)
```

**Step 2: Commit**

```bash
git add backend/src/api/shopping_lists.py
git commit -m "feat(api): add ShoppingList delete endpoint"
```

---

## Task 11: Register Shopping List Router

**Files:**
- Modify: `backend/src/main.py`

**Step 1: Register router**

```python
from src.api import analytics, categories, households, inventory, meal_plans, receipts, recipes, shopping_lists

# Add to routers
app.include_router(shopping_lists.router, prefix="/api", tags=["shopping-lists"])
```

**Step 2: Commit**

```bash
git add backend/src/main.py
git commit -m "feat(api): register ShoppingList router"
```

---

## Task 12: Run All Tests

**Step 1: Run all tests**

```bash
cd backend && uv run pytest -v
```

**Step 2: Run linting**

```bash
cd backend && uv run ruff check .
```

**Expected:** All tests pass, no linting errors.

---

## Summary

Phase 5 adds shopping list capabilities:

| Endpoint | Description |
|----------|-------------|
| POST /api/shopping-lists/generate | Generate list from planned meals |
| GET /api/shopping-lists | List shopping lists |
| GET /api/shopping-lists/{id} | Get single shopping list |
| PATCH /api/shopping-lists/{id} | Update shopping list |
| PATCH /api/shopping-lists/{id}/items/{item_id} | Update item (check off, notes) |
| DELETE /api/shopping-lists/{id} | Delete shopping list |

Key features:
- Automatic generation from planned meals in date range
- Ingredient aggregation across multiple recipes
- Inventory-aware "to buy" quantities
- Track which meal plans require each ingredient
- Check off items while shopping
