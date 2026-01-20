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
