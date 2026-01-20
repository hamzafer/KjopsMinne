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
        raise HTTPException(
            status_code=400,
            detail="Ingredient with this canonical name already exists",
        )

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
