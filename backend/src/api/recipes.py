"""Recipe API routes."""

from uuid import UUID

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from src.api.deps import DbSession
from src.db.models import Recipe, RecipeIngredient
from src.schemas.recipe import RecipeCreate, RecipeListResponse, RecipeResponse

router = APIRouter()


@router.get("/recipes", response_model=RecipeListResponse)
async def list_recipes(
    db: DbSession,
    household_id: UUID = Query(..., description="Household ID"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Results per page"),
    search: str | None = Query(None, description="Search by recipe name"),
) -> RecipeListResponse:
    """List recipes for a household."""
    # Build query
    query = select(Recipe).where(Recipe.household_id == household_id)

    # Add search filter
    if search:
        query = query.where(Recipe.name.ilike(f"%{search}%"))

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)

    # Paginate and eager load ingredients
    query = query.options(selectinload(Recipe.ingredients))
    query = query.order_by(Recipe.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    recipes = result.scalars().all()

    return RecipeListResponse(
        recipes=[RecipeResponse.model_validate(r) for r in recipes],
        total=total or 0,
        page=page,
        page_size=page_size,
    )


@router.get("/recipes/{recipe_id}", response_model=RecipeResponse)
async def get_recipe(
    db: DbSession,
    recipe_id: UUID,
) -> RecipeResponse:
    """Get a recipe by ID."""
    query = (
        select(Recipe)
        .where(Recipe.id == recipe_id)
        .options(selectinload(Recipe.ingredients))
    )
    result = await db.execute(query)
    recipe = result.scalar_one_or_none()

    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    return RecipeResponse.model_validate(recipe)


@router.post("/recipes", response_model=RecipeResponse, status_code=201)
async def create_recipe(
    db: DbSession,
    recipe_data: RecipeCreate,
) -> RecipeResponse:
    """Create a new recipe with ingredients."""
    # Create recipe
    recipe = Recipe(
        household_id=recipe_data.household_id,
        name=recipe_data.name,
        source_url=recipe_data.source_url,
        servings=recipe_data.servings,
        prep_time_minutes=recipe_data.prep_time_minutes,
        cook_time_minutes=recipe_data.cook_time_minutes,
        instructions=recipe_data.instructions,
        tags=recipe_data.tags,
        image_url=recipe_data.image_url,
    )
    db.add(recipe)
    await db.flush()  # Get the recipe ID

    # Create ingredients
    for ing_data in recipe_data.ingredients:
        ingredient = RecipeIngredient(
            recipe_id=recipe.id,
            raw_text=ing_data.raw_text,
            quantity=ing_data.quantity,
            unit=ing_data.unit,
            notes=ing_data.notes,
            ingredient_id=ing_data.ingredient_id,
        )
        db.add(ingredient)

    await db.flush()

    # Refresh to load ingredients relationship
    await db.refresh(recipe, ["ingredients"])

    return RecipeResponse.model_validate(recipe)
