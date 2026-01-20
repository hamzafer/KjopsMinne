# Phase 2: Inventory Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add inventory tracking with lots, events, and receipt-to-inventory flow for the meal planning system.

**Architecture:** InventoryLot tracks individual purchases with FIFO costing. InventoryEvent provides an audit trail for all quantity changes. Receipt items can be mapped to ingredients and converted to inventory lots via a review screen.

**Tech Stack:** SQLAlchemy 2.0 async, FastAPI, Pydantic v2, PostgreSQL, Alembic migrations

---

## Task 1: Create InventoryLot Model

**Files:**
- Modify: `backend/src/db/models.py`

**Step 1: Add InventoryLot model**

Add after the `UnitConversion` class in `models.py`:

```python
class InventoryLot(Base):
    __tablename__ = "inventory_lots"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    household_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("households.id"), nullable=False
    )
    ingredient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ingredients.id"), nullable=False
    )
    quantity: Mapped[Decimal] = mapped_column(Numeric(10, 3), nullable=False)
    unit: Mapped[str] = mapped_column(Text, nullable=False)  # canonical: g, ml, pcs
    location: Mapped[str] = mapped_column(Text, default="pantry")  # pantry|fridge|freezer
    purchase_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    expiry_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    unit_cost: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    total_cost: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(Text, default="NOK")
    confidence: Mapped[Decimal] = mapped_column(Numeric(3, 2), default=Decimal("1.0"))
    source_type: Mapped[str] = mapped_column(Text, nullable=False)  # receipt|manual|barcode
    source_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=func.now(), onupdate=func.now(), nullable=False
    )

    household: Mapped["Household"] = relationship("Household")
    ingredient: Mapped["Ingredient"] = relationship("Ingredient")
    events: Mapped[list["InventoryEvent"]] = relationship(
        "InventoryEvent", back_populates="lot"
    )

    __table_args__ = (
        Index("idx_inventory_lots_household", "household_id"),
        Index("idx_inventory_lots_ingredient", "ingredient_id"),
        Index("idx_inventory_lots_location", "location"),
        Index("idx_inventory_lots_purchase_date", "purchase_date"),
    )
```

**Step 2: Commit**

```bash
git add backend/src/db/models.py
git commit -m "feat(models): add InventoryLot model"
```

---

## Task 2: Create InventoryEvent Model

**Files:**
- Modify: `backend/src/db/models.py`

**Step 1: Add InventoryEvent model**

Add after `InventoryLot` class:

```python
class InventoryEvent(Base):
    __tablename__ = "inventory_events"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    lot_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("inventory_lots.id"), nullable=False
    )
    event_type: Mapped[str] = mapped_column(
        Text, nullable=False
    )  # add|consume|adjust|discard|transfer
    quantity_delta: Mapped[Decimal] = mapped_column(Numeric(10, 3), nullable=False)
    unit: Mapped[str] = mapped_column(Text, nullable=False)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=func.now(), nullable=False
    )

    lot: Mapped["InventoryLot"] = relationship("InventoryLot", back_populates="events")
    user: Mapped["User | None"] = relationship("User")

    __table_args__ = (
        Index("idx_inventory_events_lot", "lot_id"),
        Index("idx_inventory_events_type", "event_type"),
        Index("idx_inventory_events_created", "created_at"),
    )
```

**Step 2: Commit**

```bash
git add backend/src/db/models.py
git commit -m "feat(models): add InventoryEvent model"
```

---

## Task 3: Create Alembic Migration

**Files:**
- Create: `backend/alembic/versions/003_inventory.py`

**Step 1: Create migration file**

```python
"""Add inventory tables.

Revision ID: 003
Revises: 002
Create Date: 2026-01-20
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "003"
down_revision: str | None = "002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Create inventory_lots table
    op.create_table(
        "inventory_lots",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "household_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("households.id"),
            nullable=False,
        ),
        sa.Column(
            "ingredient_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("ingredients.id"),
            nullable=False,
        ),
        sa.Column("quantity", sa.Numeric(10, 3), nullable=False),
        sa.Column("unit", sa.Text, nullable=False),
        sa.Column("location", sa.Text, server_default="pantry"),
        sa.Column("purchase_date", sa.DateTime, nullable=False),
        sa.Column("expiry_date", sa.DateTime, nullable=True),
        sa.Column("unit_cost", sa.Numeric(10, 2), nullable=False),
        sa.Column("total_cost", sa.Numeric(10, 2), nullable=False),
        sa.Column("currency", sa.Text, server_default="NOK"),
        sa.Column("confidence", sa.Numeric(3, 2), server_default="1.0"),
        sa.Column("source_type", sa.Text, nullable=False),
        sa.Column("source_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column(
            "created_at", sa.DateTime, server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime, server_default=sa.func.now(), nullable=False
        ),
    )

    # Create inventory_events table
    op.create_table(
        "inventory_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "lot_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("inventory_lots.id"),
            nullable=False,
        ),
        sa.Column("event_type", sa.Text, nullable=False),
        sa.Column("quantity_delta", sa.Numeric(10, 3), nullable=False),
        sa.Column("unit", sa.Text, nullable=False),
        sa.Column("reason", sa.Text, nullable=True),
        sa.Column(
            "created_by",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id"),
            nullable=True,
        ),
        sa.Column(
            "created_at", sa.DateTime, server_default=sa.func.now(), nullable=False
        ),
    )

    # Create indexes for inventory_lots
    op.create_index("idx_inventory_lots_household", "inventory_lots", ["household_id"])
    op.create_index("idx_inventory_lots_ingredient", "inventory_lots", ["ingredient_id"])
    op.create_index("idx_inventory_lots_location", "inventory_lots", ["location"])
    op.create_index(
        "idx_inventory_lots_purchase_date", "inventory_lots", ["purchase_date"]
    )

    # Create indexes for inventory_events
    op.create_index("idx_inventory_events_lot", "inventory_events", ["lot_id"])
    op.create_index("idx_inventory_events_type", "inventory_events", ["event_type"])
    op.create_index("idx_inventory_events_created", "inventory_events", ["created_at"])


def downgrade() -> None:
    op.drop_index("idx_inventory_events_created", "inventory_events")
    op.drop_index("idx_inventory_events_type", "inventory_events")
    op.drop_index("idx_inventory_events_lot", "inventory_events")
    op.drop_index("idx_inventory_lots_purchase_date", "inventory_lots")
    op.drop_index("idx_inventory_lots_location", "inventory_lots")
    op.drop_index("idx_inventory_lots_ingredient", "inventory_lots")
    op.drop_index("idx_inventory_lots_household", "inventory_lots")
    op.drop_table("inventory_events")
    op.drop_table("inventory_lots")
```

**Step 2: Run migration**

Run: `cd /Users/stan/dev/kvitteringshvelv/backend && uv run alembic upgrade head`

Expected: "Running upgrade 002 -> 003"

**Step 3: Verify tables exist**

Run: `cd /Users/stan/dev/kvitteringshvelv && make shell-db` then `\dt inventory*`

Expected: Shows `inventory_lots` and `inventory_events` tables

**Step 4: Commit**

```bash
git add backend/alembic/versions/003_inventory.py
git commit -m "feat(db): add inventory migration"
```

---

## Task 4: Create Inventory Pydantic Schemas

**Files:**
- Create: `backend/src/schemas/inventory.py`

**Step 1: Create schema file**

```python
# backend/src/schemas/inventory.py
"""Inventory Pydantic schemas."""
from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from src.schemas.ingredient import IngredientResponse


class InventoryLotCreate(BaseModel):
    """Create a new inventory lot."""
    ingredient_id: UUID
    quantity: Decimal = Field(..., ge=0)
    unit: str
    location: str = "pantry"
    purchase_date: datetime
    expiry_date: datetime | None = None
    unit_cost: Decimal = Field(..., ge=0)
    total_cost: Decimal = Field(..., ge=0)
    currency: str = "NOK"
    confidence: Decimal = Field(default=Decimal("1.0"), ge=0, le=1)
    source_type: str = "manual"
    source_id: UUID | None = None


class InventoryLotUpdate(BaseModel):
    """Update an inventory lot."""
    location: str | None = None
    expiry_date: datetime | None = None


class InventoryLotResponse(BaseModel):
    """Inventory lot response."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    household_id: UUID
    ingredient_id: UUID
    quantity: Decimal
    unit: str
    location: str
    purchase_date: datetime
    expiry_date: datetime | None
    unit_cost: Decimal
    total_cost: Decimal
    currency: str
    confidence: Decimal
    source_type: str
    source_id: UUID | None
    created_at: datetime
    updated_at: datetime
    ingredient: IngredientResponse | None = None


class InventoryEventCreate(BaseModel):
    """Create an inventory event."""
    event_type: str  # add|consume|adjust|discard|transfer
    quantity_delta: Decimal
    unit: str
    reason: str | None = None


class InventoryEventResponse(BaseModel):
    """Inventory event response."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    lot_id: UUID
    event_type: str
    quantity_delta: Decimal
    unit: str
    reason: str | None
    created_by: UUID | None
    created_at: datetime


class InventoryAggregatedItem(BaseModel):
    """Aggregated inventory by ingredient."""
    ingredient_id: UUID
    ingredient_name: str
    canonical_name: str
    total_quantity: Decimal
    unit: str
    lot_count: int
    locations: list[str]
    earliest_expiry: datetime | None


class ConsumeRequest(BaseModel):
    """Request to consume from a lot."""
    quantity: Decimal = Field(..., gt=0)
    reason: str | None = None


class DiscardRequest(BaseModel):
    """Request to discard a lot."""
    reason: str = "expired"


class TransferRequest(BaseModel):
    """Request to transfer lot to new location."""
    location: str  # pantry|fridge|freezer
```

**Step 2: Commit**

```bash
git add backend/src/schemas/inventory.py
git commit -m "feat(schemas): add inventory Pydantic schemas"
```

---

## Task 5: Create Inventory Service

**Files:**
- Create: `backend/src/services/inventory_service.py`
- Create: `backend/tests/test_inventory_service.py`

**Step 1: Write the failing test**

```python
# backend/tests/test_inventory_service.py
"""Tests for inventory service."""
import pytest
from decimal import Decimal
from unittest.mock import MagicMock, AsyncMock
import uuid

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
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/stan/dev/kvitteringshvelv/backend && uv run pytest tests/test_inventory_service.py -v`

Expected: ModuleNotFoundError

**Step 3: Write minimal implementation**

```python
# backend/src/services/inventory_service.py
"""Inventory management service."""
from decimal import Decimal


class InventoryService:
    """Service for inventory operations."""

    def calculate_remaining(self, lot, events: list) -> Decimal:
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
```

**Step 4: Run test to verify it passes**

Run: `cd /Users/stan/dev/kvitteringshvelv/backend && uv run pytest tests/test_inventory_service.py -v`

Expected: All 5 tests pass

**Step 5: Commit**

```bash
git add backend/src/services/inventory_service.py backend/tests/test_inventory_service.py
git commit -m "feat(services): add InventoryService with tests"
```

---

## Task 6: Create Inventory API Routes - List and Get

**Files:**
- Create: `backend/src/api/inventory.py`

**Step 1: Create inventory router with list and get endpoints**

```python
# backend/src/api/inventory.py
"""Inventory management API routes."""
import uuid
from decimal import Decimal

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from src.api.deps import DbSession
from src.db.models import Household, InventoryLot, InventoryEvent, Ingredient
from src.schemas.inventory import (
    InventoryLotCreate,
    InventoryLotResponse,
    InventoryLotUpdate,
    InventoryEventResponse,
    InventoryAggregatedItem,
    ConsumeRequest,
    DiscardRequest,
    TransferRequest,
)

router = APIRouter()


@router.get("/inventory", response_model=list[InventoryAggregatedItem])
async def get_inventory_aggregated(
    db: DbSession,
    household_id: uuid.UUID = Query(..., description="Household ID"),
    location: str | None = Query(None, description="Filter by location"),
):
    """Get aggregated inventory view by ingredient."""
    # Build subquery to sum quantities
    query = (
        select(
            InventoryLot.ingredient_id,
            Ingredient.name.label("ingredient_name"),
            Ingredient.canonical_name,
            func.sum(InventoryLot.quantity).label("total_quantity"),
            InventoryLot.unit,
            func.count(InventoryLot.id).label("lot_count"),
            func.array_agg(func.distinct(InventoryLot.location)).label("locations"),
            func.min(InventoryLot.expiry_date).label("earliest_expiry"),
        )
        .join(Ingredient, InventoryLot.ingredient_id == Ingredient.id)
        .where(InventoryLot.household_id == household_id)
        .where(InventoryLot.quantity > 0)
        .group_by(
            InventoryLot.ingredient_id,
            Ingredient.name,
            Ingredient.canonical_name,
            InventoryLot.unit,
        )
    )

    if location:
        query = query.where(InventoryLot.location == location)

    result = await db.execute(query)
    rows = result.all()

    return [
        InventoryAggregatedItem(
            ingredient_id=row.ingredient_id,
            ingredient_name=row.ingredient_name,
            canonical_name=row.canonical_name,
            total_quantity=row.total_quantity,
            unit=row.unit,
            lot_count=row.lot_count,
            locations=row.locations or [],
            earliest_expiry=row.earliest_expiry,
        )
        for row in rows
    ]


@router.get("/inventory/lots", response_model=list[InventoryLotResponse])
async def list_inventory_lots(
    db: DbSession,
    household_id: uuid.UUID = Query(..., description="Household ID"),
    ingredient_id: uuid.UUID | None = Query(None, description="Filter by ingredient"),
    location: str | None = Query(None, description="Filter by location"),
    skip: int = 0,
    limit: int = 50,
):
    """List all inventory lots for a household."""
    query = (
        select(InventoryLot)
        .options(selectinload(InventoryLot.ingredient))
        .where(InventoryLot.household_id == household_id)
        .where(InventoryLot.quantity > 0)
    )

    if ingredient_id:
        query = query.where(InventoryLot.ingredient_id == ingredient_id)
    if location:
        query = query.where(InventoryLot.location == location)

    query = query.order_by(InventoryLot.purchase_date.asc()).offset(skip).limit(limit)

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/inventory/lots/{lot_id}", response_model=InventoryLotResponse)
async def get_inventory_lot(lot_id: uuid.UUID, db: DbSession):
    """Get a specific inventory lot."""
    result = await db.execute(
        select(InventoryLot)
        .options(selectinload(InventoryLot.ingredient))
        .where(InventoryLot.id == lot_id)
    )
    lot = result.scalar_one_or_none()

    if not lot:
        raise HTTPException(status_code=404, detail="Inventory lot not found")

    return lot
```

**Step 2: Commit**

```bash
git add backend/src/api/inventory.py
git commit -m "feat(api): add inventory list and get endpoints"
```

---

## Task 7: Add Inventory Create Endpoint

**Files:**
- Modify: `backend/src/api/inventory.py`

**Step 1: Add create endpoint**

Add after the get endpoint:

```python
@router.post("/inventory/lots", response_model=InventoryLotResponse)
async def create_inventory_lot(
    data: InventoryLotCreate,
    household_id: uuid.UUID = Query(..., description="Household ID"),
    db: DbSession = None,
):
    """Create a new inventory lot manually."""
    # Verify household exists
    result = await db.execute(
        select(Household).where(Household.id == household_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Household not found")

    # Verify ingredient exists
    result = await db.execute(
        select(Ingredient).where(Ingredient.id == data.ingredient_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Ingredient not found")

    # Create lot
    lot = InventoryLot(
        id=uuid.uuid4(),
        household_id=household_id,
        ingredient_id=data.ingredient_id,
        quantity=data.quantity,
        unit=data.unit,
        location=data.location,
        purchase_date=data.purchase_date,
        expiry_date=data.expiry_date,
        unit_cost=data.unit_cost,
        total_cost=data.total_cost,
        currency=data.currency,
        confidence=data.confidence,
        source_type=data.source_type,
        source_id=data.source_id,
    )
    db.add(lot)

    # Create initial "add" event
    event = InventoryEvent(
        id=uuid.uuid4(),
        lot_id=lot.id,
        event_type="add",
        quantity_delta=data.quantity,
        unit=data.unit,
        reason="initial",
    )
    db.add(event)

    await db.flush()

    # Reload with ingredient
    result = await db.execute(
        select(InventoryLot)
        .options(selectinload(InventoryLot.ingredient))
        .where(InventoryLot.id == lot.id)
    )
    return result.scalar_one()
```

**Step 2: Add InventoryLot import if not present**

Make sure the imports at top include `InventoryEvent`:

```python
from src.db.models import Household, InventoryLot, InventoryEvent, Ingredient
```

**Step 3: Commit**

```bash
git add backend/src/api/inventory.py
git commit -m "feat(api): add inventory lot create endpoint"
```

---

## Task 8: Add Inventory Update Endpoint

**Files:**
- Modify: `backend/src/api/inventory.py`

**Step 1: Add update endpoint**

Add after create endpoint:

```python
@router.put("/inventory/lots/{lot_id}", response_model=InventoryLotResponse)
async def update_inventory_lot(
    lot_id: uuid.UUID,
    data: InventoryLotUpdate,
    db: DbSession,
):
    """Update an inventory lot (location, expiry only)."""
    result = await db.execute(
        select(InventoryLot).where(InventoryLot.id == lot_id)
    )
    lot = result.scalar_one_or_none()

    if not lot:
        raise HTTPException(status_code=404, detail="Inventory lot not found")

    if data.location is not None:
        lot.location = data.location
    if data.expiry_date is not None:
        lot.expiry_date = data.expiry_date

    await db.flush()

    # Reload with ingredient
    result = await db.execute(
        select(InventoryLot)
        .options(selectinload(InventoryLot.ingredient))
        .where(InventoryLot.id == lot.id)
    )
    return result.scalar_one()
```

**Step 2: Commit**

```bash
git add backend/src/api/inventory.py
git commit -m "feat(api): add inventory lot update endpoint"
```

---

## Task 9: Add Consume Endpoint

**Files:**
- Modify: `backend/src/api/inventory.py`

**Step 1: Add consume endpoint**

Add after update endpoint:

```python
@router.post("/inventory/lots/{lot_id}/consume", response_model=InventoryLotResponse)
async def consume_from_lot(
    lot_id: uuid.UUID,
    data: ConsumeRequest,
    db: DbSession,
):
    """Consume quantity from an inventory lot."""
    result = await db.execute(
        select(InventoryLot).where(InventoryLot.id == lot_id)
    )
    lot = result.scalar_one_or_none()

    if not lot:
        raise HTTPException(status_code=404, detail="Inventory lot not found")

    if lot.quantity < data.quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient quantity. Available: {lot.quantity}, requested: {data.quantity}"
        )

    # Update quantity
    lot.quantity -= data.quantity

    # Create consume event
    event = InventoryEvent(
        id=uuid.uuid4(),
        lot_id=lot.id,
        event_type="consume",
        quantity_delta=-data.quantity,
        unit=lot.unit,
        reason=data.reason,
    )
    db.add(event)

    await db.flush()

    # Reload with ingredient
    result = await db.execute(
        select(InventoryLot)
        .options(selectinload(InventoryLot.ingredient))
        .where(InventoryLot.id == lot.id)
    )
    return result.scalar_one()
```

**Step 2: Commit**

```bash
git add backend/src/api/inventory.py
git commit -m "feat(api): add inventory consume endpoint"
```

---

## Task 10: Add Discard Endpoint

**Files:**
- Modify: `backend/src/api/inventory.py`

**Step 1: Add discard endpoint**

Add after consume endpoint:

```python
@router.post("/inventory/lots/{lot_id}/discard", response_model=InventoryLotResponse)
async def discard_lot(
    lot_id: uuid.UUID,
    data: DiscardRequest,
    db: DbSession,
):
    """Discard entire inventory lot (expired, spoiled, etc)."""
    result = await db.execute(
        select(InventoryLot).where(InventoryLot.id == lot_id)
    )
    lot = result.scalar_one_or_none()

    if not lot:
        raise HTTPException(status_code=404, detail="Inventory lot not found")

    discarded_quantity = lot.quantity

    # Set quantity to 0
    lot.quantity = Decimal("0")

    # Create discard event
    event = InventoryEvent(
        id=uuid.uuid4(),
        lot_id=lot.id,
        event_type="discard",
        quantity_delta=-discarded_quantity,
        unit=lot.unit,
        reason=data.reason,
    )
    db.add(event)

    await db.flush()

    # Reload with ingredient
    result = await db.execute(
        select(InventoryLot)
        .options(selectinload(InventoryLot.ingredient))
        .where(InventoryLot.id == lot.id)
    )
    return result.scalar_one()
```

**Step 2: Commit**

```bash
git add backend/src/api/inventory.py
git commit -m "feat(api): add inventory discard endpoint"
```

---

## Task 11: Add Transfer Endpoint

**Files:**
- Modify: `backend/src/api/inventory.py`

**Step 1: Add transfer endpoint**

Add after discard endpoint:

```python
@router.post("/inventory/lots/{lot_id}/transfer", response_model=InventoryLotResponse)
async def transfer_lot(
    lot_id: uuid.UUID,
    data: TransferRequest,
    db: DbSession,
):
    """Transfer inventory lot to a different location."""
    result = await db.execute(
        select(InventoryLot).where(InventoryLot.id == lot_id)
    )
    lot = result.scalar_one_or_none()

    if not lot:
        raise HTTPException(status_code=404, detail="Inventory lot not found")

    valid_locations = ["pantry", "fridge", "freezer"]
    if data.location not in valid_locations:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid location. Must be one of: {valid_locations}"
        )

    old_location = lot.location
    lot.location = data.location

    # Create transfer event
    event = InventoryEvent(
        id=uuid.uuid4(),
        lot_id=lot.id,
        event_type="transfer",
        quantity_delta=Decimal("0"),
        unit=lot.unit,
        reason=f"moved from {old_location} to {data.location}",
    )
    db.add(event)

    await db.flush()

    # Reload with ingredient
    result = await db.execute(
        select(InventoryLot)
        .options(selectinload(InventoryLot.ingredient))
        .where(InventoryLot.id == lot.id)
    )
    return result.scalar_one()
```

**Step 2: Commit**

```bash
git add backend/src/api/inventory.py
git commit -m "feat(api): add inventory transfer endpoint"
```

---

## Task 12: Register Inventory Router

**Files:**
- Modify: `backend/src/main.py`

**Step 1: Add inventory router import and registration**

In imports section, add `inventory` to the import:

```python
from src.api import analytics, categories, households, ingredients, inventory, receipts, upload
```

In router registration section, add:

```python
app.include_router(inventory.router, prefix="/api", tags=["inventory"])
```

**Step 2: Verify API starts**

Run: `curl -s http://localhost:8000/docs | grep -o "inventory" | head -1`

Expected: "inventory"

**Step 3: Commit**

```bash
git add backend/src/main.py
git commit -m "feat(api): register inventory router"
```

---

## Task 13: Add Inventory Events Endpoint

**Files:**
- Modify: `backend/src/api/inventory.py`

**Step 1: Add events listing endpoint**

Add at end of file:

```python
@router.get(
    "/inventory/lots/{lot_id}/events",
    response_model=list[InventoryEventResponse]
)
async def get_lot_events(
    lot_id: uuid.UUID,
    db: DbSession,
    skip: int = 0,
    limit: int = 50,
):
    """Get event history for an inventory lot."""
    # Verify lot exists
    result = await db.execute(
        select(InventoryLot).where(InventoryLot.id == lot_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Inventory lot not found")

    query = (
        select(InventoryEvent)
        .where(InventoryEvent.lot_id == lot_id)
        .order_by(InventoryEvent.created_at.desc())
        .offset(skip)
        .limit(limit)
    )

    result = await db.execute(query)
    return result.scalars().all()
```

**Step 2: Commit**

```bash
git add backend/src/api/inventory.py
git commit -m "feat(api): add inventory events endpoint"
```

---

## Task 14: Run All Tests

**Files:** None (verification only)

**Step 1: Run all backend tests**

Run: `cd /Users/stan/dev/kvitteringshvelv/backend && uv run pytest -v`

Expected: All tests pass (17+ existing + 5 new inventory service tests)

**Step 2: Run linting**

Run: `cd /Users/stan/dev/kvitteringshvelv && make lint`

Expected: No errors

---

## Summary

**Phase 2 Complete!** You now have:

1. **Database models**: InventoryLot and InventoryEvent with proper indexes
2. **Migration**: `003_inventory.py` creates both tables
3. **Schemas**: Pydantic schemas for all inventory operations
4. **Service**: InventoryService with quantity calculation logic
5. **API endpoints**:
   - `GET /api/inventory` - Aggregated view
   - `GET /api/inventory/lots` - List lots
   - `POST /api/inventory/lots` - Create lot
   - `GET /api/inventory/lots/{id}` - Get lot
   - `PUT /api/inventory/lots/{id}` - Update lot
   - `POST /api/inventory/lots/{id}/consume` - Consume
   - `POST /api/inventory/lots/{id}/discard` - Discard
   - `POST /api/inventory/lots/{id}/transfer` - Transfer
   - `GET /api/inventory/lots/{id}/events` - Event history

**Next: Phase 3 (Recipes)** will add recipe import and management.
