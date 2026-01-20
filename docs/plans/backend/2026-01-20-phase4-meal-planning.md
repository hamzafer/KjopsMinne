# Phase 4: Meal Planning Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement meal planning with calendar-based planning, cook flow, and inventory consumption

**Architecture:** MealPlan and Leftover models with service layer for cooking (inventory consumption, FIFO cost calculation). Backend-first approach matching Phases 1-3.

**Tech Stack:** FastAPI, SQLAlchemy 2.0 async, Pydantic v2, PostgreSQL

---

## Task 1: Create MealPlan Model

**Files:**
- Modify: `backend/src/db/models.py`

**Step 1: Add MealPlan model after Recipe**

```python
class MealPlan(Base):
    __tablename__ = "meal_plans"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    household_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("households.id"), nullable=False
    )
    recipe_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("recipes.id"), nullable=False
    )
    planned_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    meal_type: Mapped[str] = mapped_column(Text, nullable=False)  # breakfast|lunch|dinner|snack
    servings: Mapped[int] = mapped_column(default=2)
    status: Mapped[str] = mapped_column(Text, default="planned")  # planned|cooked|skipped
    is_leftover_source: Mapped[bool] = mapped_column(Boolean, default=False)
    leftover_from_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("meal_plans.id"), nullable=True
    )
    cooked_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    actual_cost: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    cost_per_serving: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=func.now(), onupdate=func.now(), nullable=False
    )

    household: Mapped["Household"] = relationship("Household")
    recipe: Mapped["Recipe"] = relationship("Recipe")
    leftover_from: Mapped["MealPlan | None"] = relationship("MealPlan", remote_side="MealPlan.id")

    __table_args__ = (
        Index("idx_meal_plans_household", "household_id"),
        Index("idx_meal_plans_date", "planned_date"),
        Index("idx_meal_plans_recipe", "recipe_id"),
    )
```

**Step 2: Commit**

```bash
git add backend/src/db/models.py
git commit -m "feat(models): add MealPlan model"
```

---

## Task 2: Create Leftover Model

**Files:**
- Modify: `backend/src/db/models.py`

**Step 1: Add Leftover model after MealPlan**

```python
class Leftover(Base):
    __tablename__ = "leftovers"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    household_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("households.id"), nullable=False
    )
    meal_plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("meal_plans.id"), nullable=False
    )
    recipe_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("recipes.id"), nullable=False
    )
    remaining_servings: Mapped[int] = mapped_column(nullable=False)
    status: Mapped[str] = mapped_column(Text, default="available")  # available|consumed|discarded
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=func.now(), nullable=False
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    household: Mapped["Household"] = relationship("Household")
    meal_plan: Mapped["MealPlan"] = relationship("MealPlan")
    recipe: Mapped["Recipe"] = relationship("Recipe")

    __table_args__ = (
        Index("idx_leftovers_household", "household_id"),
        Index("idx_leftovers_status", "status"),
        Index("idx_leftovers_expires", "expires_at"),
    )
```

**Step 2: Commit**

```bash
git add backend/src/db/models.py
git commit -m "feat(models): add Leftover model"
```

---

## Task 3: Create Alembic Migration (005_meal_plans.py)

**Files:**
- Create: `backend/alembic/versions/005_meal_plans.py`

**Step 1: Create migration file**

```python
"""Add meal planning tables.

Revision ID: 005
Revises: 004
Create Date: 2026-01-20
"""
from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "005"
down_revision: str | None = "004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Create meal_plans table
    op.create_table(
        "meal_plans",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "household_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("households.id"),
            nullable=False,
        ),
        sa.Column(
            "recipe_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("recipes.id"),
            nullable=False,
        ),
        sa.Column("planned_date", sa.DateTime, nullable=False),
        sa.Column("meal_type", sa.Text, nullable=False),
        sa.Column("servings", sa.Integer, server_default="2"),
        sa.Column("status", sa.Text, server_default="planned"),
        sa.Column("is_leftover_source", sa.Boolean, server_default="false"),
        sa.Column(
            "leftover_from_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("meal_plans.id"),
            nullable=True,
        ),
        sa.Column("cooked_at", sa.DateTime, nullable=True),
        sa.Column("actual_cost", sa.Numeric(10, 2), nullable=True),
        sa.Column("cost_per_serving", sa.Numeric(10, 2), nullable=True),
        sa.Column(
            "created_at", sa.DateTime, server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime, server_default=sa.func.now(), nullable=False
        ),
    )

    # Create leftovers table
    op.create_table(
        "leftovers",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "household_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("households.id"),
            nullable=False,
        ),
        sa.Column(
            "meal_plan_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("meal_plans.id"),
            nullable=False,
        ),
        sa.Column(
            "recipe_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("recipes.id"),
            nullable=False,
        ),
        sa.Column("remaining_servings", sa.Integer, nullable=False),
        sa.Column("status", sa.Text, server_default="available"),
        sa.Column(
            "created_at", sa.DateTime, server_default=sa.func.now(), nullable=False
        ),
        sa.Column("expires_at", sa.DateTime, nullable=False),
    )

    # Create indexes for meal_plans
    op.create_index("idx_meal_plans_household", "meal_plans", ["household_id"])
    op.create_index("idx_meal_plans_date", "meal_plans", ["planned_date"])
    op.create_index("idx_meal_plans_recipe", "meal_plans", ["recipe_id"])

    # Create indexes for leftovers
    op.create_index("idx_leftovers_household", "leftovers", ["household_id"])
    op.create_index("idx_leftovers_status", "leftovers", ["status"])
    op.create_index("idx_leftovers_expires", "leftovers", ["expires_at"])


def downgrade() -> None:
    op.drop_index("idx_leftovers_expires", "leftovers")
    op.drop_index("idx_leftovers_status", "leftovers")
    op.drop_index("idx_leftovers_household", "leftovers")
    op.drop_index("idx_meal_plans_recipe", "meal_plans")
    op.drop_index("idx_meal_plans_date", "meal_plans")
    op.drop_index("idx_meal_plans_household", "meal_plans")
    op.drop_table("leftovers")
    op.drop_table("meal_plans")
```

**Step 2: Run migration**

```bash
cd backend && uv run alembic upgrade head
```

**Step 3: Commit**

```bash
git add backend/alembic/versions/005_meal_plans.py
git commit -m "feat(db): add meal_plans migration 005"
```

---

## Task 4: Create MealPlan Pydantic Schemas

**Files:**
- Create: `backend/src/schemas/meal_plan.py`

**Step 1: Create schemas**

```python
"""Pydantic schemas for meal plans and leftovers."""
from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from src.schemas.recipe import RecipeResponse


# Leftover Schemas
class LeftoverBase(BaseModel):
    remaining_servings: int
    status: str = "available"
    expires_at: datetime


class LeftoverCreate(LeftoverBase):
    household_id: UUID
    meal_plan_id: UUID
    recipe_id: UUID


class LeftoverResponse(LeftoverBase):
    id: UUID
    household_id: UUID
    meal_plan_id: UUID
    recipe_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# MealPlan Schemas
class MealPlanBase(BaseModel):
    planned_date: datetime
    meal_type: str  # breakfast|lunch|dinner|snack
    servings: int = 2
    is_leftover_source: bool = False


class MealPlanCreate(MealPlanBase):
    household_id: UUID
    recipe_id: UUID
    leftover_from_id: UUID | None = None


class MealPlanUpdate(BaseModel):
    planned_date: datetime | None = None
    meal_type: str | None = None
    servings: int | None = None
    status: str | None = None
    is_leftover_source: bool | None = None


class MealPlanResponse(MealPlanBase):
    id: UUID
    household_id: UUID
    recipe_id: UUID
    status: str
    leftover_from_id: UUID | None = None
    cooked_at: datetime | None = None
    actual_cost: Decimal | None = None
    cost_per_serving: Decimal | None = None
    created_at: datetime
    updated_at: datetime
    recipe: RecipeResponse | None = None

    model_config = ConfigDict(from_attributes=True)


class MealPlanListResponse(BaseModel):
    meal_plans: list[MealPlanResponse]
    total: int


# Cook Flow Schemas
class CookRequest(BaseModel):
    """Request to mark a meal as cooked."""
    actual_servings: int | None = None  # Override planned servings
    create_leftover: bool = False
    leftover_servings: int | None = None  # If creating leftover


class CookResponse(BaseModel):
    """Response after cooking a meal."""
    meal_plan: MealPlanResponse
    actual_cost: Decimal
    cost_per_serving: Decimal
    inventory_consumed: list[dict]  # List of consumed lots
    leftover: LeftoverResponse | None = None


class LeftoverListResponse(BaseModel):
    leftovers: list[LeftoverResponse]
    total: int
```

**Step 2: Lint and commit**

```bash
cd backend && uv run ruff check src/schemas/meal_plan.py --fix
git add backend/src/schemas/meal_plan.py
git commit -m "feat(schemas): add MealPlan Pydantic schemas"
```

---

## Task 5: Create MealPlan Service (TDD)

**Files:**
- Create: `backend/tests/test_meal_plan_service.py`
- Create: `backend/src/services/meal_plan_service.py`

**Step 1: Write failing tests**

```python
import pytest
from decimal import Decimal
from datetime import datetime, timedelta
from uuid import uuid4

from src.services.meal_plan_service import MealPlanService


class TestMealPlanService:
    def test_calculate_required_ingredients(self):
        """Calculate ingredients needed for a meal plan."""
        service = MealPlanService()

        recipe_ingredients = [
            {"ingredient_id": uuid4(), "quantity": Decimal("200"), "unit": "g"},
            {"ingredient_id": uuid4(), "quantity": Decimal("2"), "unit": "pcs"},
        ]

        result = service.calculate_required_ingredients(
            recipe_ingredients=recipe_ingredients,
            recipe_servings=2,
            planned_servings=4,
        )

        # Should double the quantities (4 servings vs 2 recipe servings)
        assert result[0]["quantity"] == Decimal("400")
        assert result[1]["quantity"] == Decimal("4")

    def test_calculate_required_ingredients_same_servings(self):
        """No scaling when servings match."""
        service = MealPlanService()

        recipe_ingredients = [
            {"ingredient_id": uuid4(), "quantity": Decimal("100"), "unit": "g"},
        ]

        result = service.calculate_required_ingredients(
            recipe_ingredients=recipe_ingredients,
            recipe_servings=2,
            planned_servings=2,
        )

        assert result[0]["quantity"] == Decimal("100")

    def test_calculate_cost_fifo(self):
        """Calculate cost using FIFO from inventory lots."""
        service = MealPlanService()

        ingredient_id = uuid4()
        lots = [
            {"id": uuid4(), "quantity": Decimal("100"), "unit_cost": Decimal("10.00"), "purchase_date": datetime.now() - timedelta(days=2)},
            {"id": uuid4(), "quantity": Decimal("100"), "unit_cost": Decimal("15.00"), "purchase_date": datetime.now() - timedelta(days=1)},
        ]

        # Need 150g - should take 100g @ 10kr + 50g @ 15kr = 1000kr + 750kr = 1750kr
        result = service.calculate_cost_fifo(
            lots=lots,
            required_quantity=Decimal("150"),
        )

        assert result["total_cost"] == Decimal("17.50")
        assert len(result["consumed"]) == 2
        assert result["consumed"][0]["quantity"] == Decimal("100")
        assert result["consumed"][1]["quantity"] == Decimal("50")

    def test_calculate_cost_insufficient_inventory(self):
        """Handle case where inventory is insufficient."""
        service = MealPlanService()

        lots = [
            {"id": uuid4(), "quantity": Decimal("50"), "unit_cost": Decimal("10.00"), "purchase_date": datetime.now()},
        ]

        result = service.calculate_cost_fifo(
            lots=lots,
            required_quantity=Decimal("100"),
        )

        assert result["shortage"] == Decimal("50")
        assert result["consumed"][0]["quantity"] == Decimal("50")
```

**Step 2: Run tests (should fail)**

```bash
cd backend && uv run pytest tests/test_meal_plan_service.py -v
```

**Step 3: Implement service**

```python
"""Service for meal planning operations."""
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Any
from uuid import UUID


class MealPlanService:
    """Service for meal plan operations including cost calculation."""

    def calculate_required_ingredients(
        self,
        recipe_ingredients: list[dict[str, Any]],
        recipe_servings: int,
        planned_servings: int,
    ) -> list[dict[str, Any]]:
        """Calculate scaled ingredient quantities for planned servings.

        Args:
            recipe_ingredients: List of recipe ingredients with quantity and unit
            recipe_servings: Original recipe serving count
            planned_servings: Planned meal serving count

        Returns:
            List of ingredients with scaled quantities
        """
        if recipe_servings <= 0:
            return recipe_ingredients

        scale_factor = Decimal(planned_servings) / Decimal(recipe_servings)

        result = []
        for ing in recipe_ingredients:
            scaled = dict(ing)
            if ing.get("quantity") is not None:
                scaled["quantity"] = ing["quantity"] * scale_factor
            result.append(scaled)

        return result

    def calculate_cost_fifo(
        self,
        lots: list[dict[str, Any]],
        required_quantity: Decimal,
    ) -> dict[str, Any]:
        """Calculate cost using FIFO (oldest lots first).

        Args:
            lots: Inventory lots sorted by purchase_date (oldest first)
            required_quantity: Amount needed

        Returns:
            Dict with total_cost, consumed lots, and any shortage
        """
        # Sort by purchase date (FIFO)
        sorted_lots = sorted(lots, key=lambda x: x.get("purchase_date", datetime.max))

        consumed = []
        total_cost = Decimal("0")
        remaining = required_quantity

        for lot in sorted_lots:
            if remaining <= 0:
                break

            available = lot["quantity"]
            take = min(available, remaining)

            # Calculate cost for this portion
            cost = take * lot["unit_cost"] / lot["quantity"] if lot["quantity"] > 0 else Decimal("0")
            total_cost += cost

            consumed.append({
                "lot_id": lot["id"],
                "quantity": take,
                "cost": cost,
            })

            remaining -= take

        result = {
            "total_cost": total_cost,
            "consumed": consumed,
        }

        if remaining > 0:
            result["shortage"] = remaining

        return result

    def create_leftover(
        self,
        household_id: UUID,
        meal_plan_id: UUID,
        recipe_id: UUID,
        servings: int,
        expires_days: int = 3,
    ) -> dict[str, Any]:
        """Create leftover data for a cooked meal.

        Args:
            household_id: Household ID
            meal_plan_id: Source meal plan ID
            recipe_id: Recipe ID
            servings: Remaining servings
            expires_days: Days until leftover expires

        Returns:
            Leftover creation data
        """
        return {
            "household_id": household_id,
            "meal_plan_id": meal_plan_id,
            "recipe_id": recipe_id,
            "remaining_servings": servings,
            "status": "available",
            "expires_at": datetime.now() + timedelta(days=expires_days),
        }
```

**Step 4: Run tests (should pass)**

```bash
cd backend && uv run pytest tests/test_meal_plan_service.py -v
```

**Step 5: Commit**

```bash
git add backend/src/services/meal_plan_service.py backend/tests/test_meal_plan_service.py
git commit -m "feat(services): add MealPlanService with TDD"
```

---

## Task 6: Create MealPlan API Routes - List and Get

**Files:**
- Create: `backend/src/api/meal_plans.py`

**Step 1: Create router with list and get endpoints**

```python
"""API routes for meal plans."""
from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from src.api.deps import DbSession
from src.db.models import MealPlan
from src.schemas.meal_plan import MealPlanListResponse, MealPlanResponse

router = APIRouter(prefix="/api/meal-plans", tags=["meal-plans"])


@router.get("", response_model=MealPlanListResponse)
async def list_meal_plans(
    db: DbSession,
    household_id: UUID,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    status: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> MealPlanListResponse:
    """List meal plans for a household with optional date range filter."""
    query = select(MealPlan).where(MealPlan.household_id == household_id)

    if start_date:
        query = query.where(MealPlan.planned_date >= start_date)
    if end_date:
        query = query.where(MealPlan.planned_date <= end_date)
    if status:
        query = query.where(MealPlan.status == status)

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)

    # Paginate and eager load recipe
    query = query.options(selectinload(MealPlan.recipe).selectinload("ingredients"))
    query = query.order_by(MealPlan.planned_date.asc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    meal_plans = result.scalars().all()

    return MealPlanListResponse(
        meal_plans=[MealPlanResponse.model_validate(mp) for mp in meal_plans],
        total=total or 0,
    )


@router.get("/{meal_plan_id}", response_model=MealPlanResponse)
async def get_meal_plan(
    db: DbSession,
    meal_plan_id: UUID,
) -> MealPlanResponse:
    """Get a meal plan by ID."""
    query = select(MealPlan).where(MealPlan.id == meal_plan_id).options(
        selectinload(MealPlan.recipe).selectinload("ingredients")
    )
    result = await db.execute(query)
    meal_plan = result.scalar_one_or_none()

    if not meal_plan:
        raise HTTPException(status_code=404, detail="Meal plan not found")

    return MealPlanResponse.model_validate(meal_plan)
```

**Step 2: Lint and commit**

```bash
cd backend && uv run ruff check src/api/meal_plans.py --fix
git add backend/src/api/meal_plans.py
git commit -m "feat(api): add MealPlan list and get endpoints"
```

---

## Task 7: Add MealPlan Create Endpoint

**Files:**
- Modify: `backend/src/api/meal_plans.py`

**Step 1: Add create endpoint**

```python
from src.schemas.meal_plan import MealPlanCreate, MealPlanListResponse, MealPlanResponse


@router.post("", response_model=MealPlanResponse, status_code=201)
async def create_meal_plan(
    db: DbSession,
    meal_plan_data: MealPlanCreate,
) -> MealPlanResponse:
    """Create a new meal plan."""
    meal_plan = MealPlan(
        household_id=meal_plan_data.household_id,
        recipe_id=meal_plan_data.recipe_id,
        planned_date=meal_plan_data.planned_date,
        meal_type=meal_plan_data.meal_type,
        servings=meal_plan_data.servings,
        is_leftover_source=meal_plan_data.is_leftover_source,
        leftover_from_id=meal_plan_data.leftover_from_id,
    )
    db.add(meal_plan)
    await db.flush()

    await db.refresh(meal_plan, ["recipe"])

    return MealPlanResponse.model_validate(meal_plan)
```

**Step 2: Commit**

```bash
git add backend/src/api/meal_plans.py
git commit -m "feat(api): add MealPlan create endpoint"
```

---

## Task 8: Add MealPlan Update Endpoint

**Files:**
- Modify: `backend/src/api/meal_plans.py`

**Step 1: Add update endpoint**

```python
from src.schemas.meal_plan import MealPlanCreate, MealPlanListResponse, MealPlanResponse, MealPlanUpdate


@router.patch("/{meal_plan_id}", response_model=MealPlanResponse)
async def update_meal_plan(
    db: DbSession,
    meal_plan_id: UUID,
    meal_plan_data: MealPlanUpdate,
) -> MealPlanResponse:
    """Update a meal plan."""
    query = select(MealPlan).where(MealPlan.id == meal_plan_id)
    result = await db.execute(query)
    meal_plan = result.scalar_one_or_none()

    if not meal_plan:
        raise HTTPException(status_code=404, detail="Meal plan not found")

    update_data = meal_plan_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(meal_plan, key, value)

    await db.flush()
    await db.refresh(meal_plan, ["recipe"])

    return MealPlanResponse.model_validate(meal_plan)
```

**Step 2: Commit**

```bash
git add backend/src/api/meal_plans.py
git commit -m "feat(api): add MealPlan update endpoint"
```

---

## Task 9: Add MealPlan Delete Endpoint

**Files:**
- Modify: `backend/src/api/meal_plans.py`

**Step 1: Add delete endpoint**

```python
from fastapi import APIRouter, HTTPException, Query, Response


@router.delete("/{meal_plan_id}", status_code=204)
async def delete_meal_plan(
    db: DbSession,
    meal_plan_id: UUID,
) -> Response:
    """Delete a meal plan."""
    query = select(MealPlan).where(MealPlan.id == meal_plan_id)
    result = await db.execute(query)
    meal_plan = result.scalar_one_or_none()

    if not meal_plan:
        raise HTTPException(status_code=404, detail="Meal plan not found")

    await db.delete(meal_plan)
    await db.flush()

    return Response(status_code=204)
```

**Step 2: Commit**

```bash
git add backend/src/api/meal_plans.py
git commit -m "feat(api): add MealPlan delete endpoint"
```

---

## Task 10: Add MealPlan Cook Endpoint

**Files:**
- Modify: `backend/src/api/meal_plans.py`
- Modify: `backend/src/api/deps.py`

**Step 1: Add MealPlanService dependency to deps.py**

```python
from src.services.meal_plan_service import MealPlanService

def get_meal_plan_service() -> MealPlanService:
    return MealPlanService()

MealPlanServiceDep = Annotated[MealPlanService, Depends(get_meal_plan_service)]
```

**Step 2: Add cook endpoint**

```python
from datetime import datetime
from decimal import Decimal

from sqlalchemy import delete

from src.api.deps import DbSession, MealPlanServiceDep
from src.db.models import InventoryEvent, InventoryLot, Leftover, MealPlan, RecipeIngredient
from src.schemas.meal_plan import CookRequest, CookResponse, LeftoverResponse


@router.post("/{meal_plan_id}/cook", response_model=CookResponse)
async def cook_meal_plan(
    db: DbSession,
    meal_plan_service: MealPlanServiceDep,
    meal_plan_id: UUID,
    cook_data: CookRequest,
) -> CookResponse:
    """Mark a meal as cooked and consume inventory."""
    # Get meal plan with recipe and ingredients
    query = (
        select(MealPlan)
        .where(MealPlan.id == meal_plan_id)
        .options(
            selectinload(MealPlan.recipe).selectinload("ingredients")
        )
    )
    result = await db.execute(query)
    meal_plan = result.scalar_one_or_none()

    if not meal_plan:
        raise HTTPException(status_code=404, detail="Meal plan not found")

    if meal_plan.status == "cooked":
        raise HTTPException(status_code=400, detail="Meal already cooked")

    servings = cook_data.actual_servings or meal_plan.servings

    # Calculate required ingredients
    recipe_ingredients = [
        {
            "ingredient_id": ri.ingredient_id,
            "quantity": ri.quantity,
            "unit": ri.unit,
        }
        for ri in meal_plan.recipe.ingredients
        if ri.ingredient_id and ri.quantity
    ]

    required = meal_plan_service.calculate_required_ingredients(
        recipe_ingredients=recipe_ingredients,
        recipe_servings=meal_plan.recipe.servings,
        planned_servings=servings,
    )

    # Consume from inventory (FIFO)
    total_cost = Decimal("0")
    inventory_consumed = []

    for ing in required:
        if not ing.get("ingredient_id"):
            continue

        # Get inventory lots for this ingredient (oldest first)
        lots_query = (
            select(InventoryLot)
            .where(
                InventoryLot.household_id == meal_plan.household_id,
                InventoryLot.ingredient_id == ing["ingredient_id"],
                InventoryLot.quantity > 0,
            )
            .order_by(InventoryLot.purchase_date.asc())
        )
        lots_result = await db.execute(lots_query)
        lots = lots_result.scalars().all()

        lots_data = [
            {
                "id": lot.id,
                "quantity": lot.quantity,
                "unit_cost": lot.unit_cost,
                "purchase_date": lot.purchase_date,
            }
            for lot in lots
        ]

        cost_result = meal_plan_service.calculate_cost_fifo(
            lots=lots_data,
            required_quantity=ing["quantity"],
        )

        total_cost += cost_result["total_cost"]

        # Create consume events and update lot quantities
        for consumed in cost_result["consumed"]:
            lot = next(l for l in lots if l.id == consumed["lot_id"])

            event = InventoryEvent(
                lot_id=lot.id,
                event_type="consume",
                quantity_delta=-consumed["quantity"],
                unit=lot.unit,
                reason=f"cooked:meal_plan:{meal_plan_id}",
            )
            db.add(event)

            lot.quantity -= consumed["quantity"]

            inventory_consumed.append({
                "lot_id": str(consumed["lot_id"]),
                "quantity": float(consumed["quantity"]),
                "cost": float(consumed["cost"]),
            })

    # Update meal plan
    meal_plan.status = "cooked"
    meal_plan.cooked_at = datetime.now()
    meal_plan.actual_cost = total_cost
    meal_plan.cost_per_serving = total_cost / servings if servings > 0 else Decimal("0")

    # Create leftover if requested
    leftover_response = None
    if cook_data.create_leftover and cook_data.leftover_servings:
        leftover_data = meal_plan_service.create_leftover(
            household_id=meal_plan.household_id,
            meal_plan_id=meal_plan.id,
            recipe_id=meal_plan.recipe_id,
            servings=cook_data.leftover_servings,
        )
        leftover = Leftover(**leftover_data)
        db.add(leftover)
        await db.flush()
        leftover_response = LeftoverResponse.model_validate(leftover)
        meal_plan.is_leftover_source = True

    await db.flush()
    await db.refresh(meal_plan, ["recipe"])

    return CookResponse(
        meal_plan=MealPlanResponse.model_validate(meal_plan),
        actual_cost=total_cost,
        cost_per_serving=meal_plan.cost_per_serving or Decimal("0"),
        inventory_consumed=inventory_consumed,
        leftover=leftover_response,
    )
```

**Step 3: Commit**

```bash
git add backend/src/api/meal_plans.py backend/src/api/deps.py
git commit -m "feat(api): add MealPlan cook endpoint with FIFO inventory consumption"
```

---

## Task 11: Add Leftover API Routes

**Files:**
- Modify: `backend/src/api/meal_plans.py`

**Step 1: Add leftover endpoints**

```python
from src.schemas.meal_plan import LeftoverListResponse, LeftoverResponse


@router.get("/leftovers", response_model=LeftoverListResponse)
async def list_leftovers(
    db: DbSession,
    household_id: UUID,
    status: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> LeftoverListResponse:
    """List leftovers for a household."""
    query = select(Leftover).where(Leftover.household_id == household_id)

    if status:
        query = query.where(Leftover.status == status)

    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)

    query = query.order_by(Leftover.expires_at.asc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    leftovers = result.scalars().all()

    return LeftoverListResponse(
        leftovers=[LeftoverResponse.model_validate(lo) for lo in leftovers],
        total=total or 0,
    )


@router.patch("/leftovers/{leftover_id}", response_model=LeftoverResponse)
async def update_leftover(
    db: DbSession,
    leftover_id: UUID,
    status: str,
) -> LeftoverResponse:
    """Update leftover status (consumed/discarded)."""
    query = select(Leftover).where(Leftover.id == leftover_id)
    result = await db.execute(query)
    leftover = result.scalar_one_or_none()

    if not leftover:
        raise HTTPException(status_code=404, detail="Leftover not found")

    if status not in ("available", "consumed", "discarded"):
        raise HTTPException(status_code=400, detail="Invalid status")

    leftover.status = status
    await db.flush()

    return LeftoverResponse.model_validate(leftover)
```

**Step 2: Commit**

```bash
git add backend/src/api/meal_plans.py
git commit -m "feat(api): add Leftover list and update endpoints"
```

---

## Task 12: Register MealPlan Router

**Files:**
- Modify: `backend/src/main.py`

**Step 1: Register router**

```python
from src.api import analytics, categories, households, inventory, meal_plans, receipts, recipes

# Add to routers
app.include_router(meal_plans.router, prefix="/api", tags=["meal-plans"])
```

**Step 2: Commit**

```bash
git add backend/src/main.py
git commit -m "feat(api): register MealPlan router"
```

---

## Task 13: Run All Tests

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

Phase 4 adds meal planning capabilities:

| Endpoint | Description |
|----------|-------------|
| GET /api/meal-plans | List meal plans with date range filter |
| GET /api/meal-plans/{id} | Get single meal plan |
| POST /api/meal-plans | Create meal plan |
| PATCH /api/meal-plans/{id} | Update meal plan |
| DELETE /api/meal-plans/{id} | Delete meal plan |
| POST /api/meal-plans/{id}/cook | Mark as cooked, consume inventory |
| GET /api/meal-plans/leftovers | List leftovers |
| PATCH /api/meal-plans/leftovers/{id} | Update leftover status |

Key features:
- Calendar-based meal planning by date and meal type
- Cook flow with automatic inventory consumption (FIFO)
- Cost calculation per meal and per serving
- Leftover tracking with expiration
