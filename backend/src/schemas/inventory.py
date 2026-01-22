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
