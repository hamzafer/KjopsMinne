"""API routes for meal plans."""

from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from src.api.deps import DbSession
from src.db.models import MealPlan, Recipe
from src.schemas.meal_plan import MealPlanCreate, MealPlanListResponse, MealPlanResponse

router = APIRouter()


@router.post("/meal-plans", response_model=MealPlanResponse, status_code=201)
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


@router.get("/meal-plans", response_model=MealPlanListResponse)
async def list_meal_plans(
    db: DbSession,
    household_id: UUID = Query(..., description="Household ID"),
    start_date: datetime | None = Query(None, description="Filter from date"),
    end_date: datetime | None = Query(None, description="Filter to date"),
    status: str | None = Query(None, description="Filter by status"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Results per page"),
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

    # Paginate and eager load recipe with ingredients
    query = query.options(
        selectinload(MealPlan.recipe).selectinload(Recipe.ingredients)
    )
    query = query.order_by(MealPlan.planned_date.asc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    meal_plans = result.scalars().all()

    return MealPlanListResponse(
        meal_plans=[MealPlanResponse.model_validate(mp) for mp in meal_plans],
        total=total or 0,
    )


@router.get("/meal-plans/{meal_plan_id}", response_model=MealPlanResponse)
async def get_meal_plan(
    db: DbSession,
    meal_plan_id: UUID,
) -> MealPlanResponse:
    """Get a meal plan by ID."""
    query = (
        select(MealPlan)
        .where(MealPlan.id == meal_plan_id)
        .options(selectinload(MealPlan.recipe).selectinload(Recipe.ingredients))
    )
    result = await db.execute(query)
    meal_plan = result.scalar_one_or_none()

    if not meal_plan:
        raise HTTPException(status_code=404, detail="Meal plan not found")

    return MealPlanResponse.model_validate(meal_plan)
