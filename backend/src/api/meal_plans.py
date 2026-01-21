"""API routes for meal plans."""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, Response
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from src.api.deps import DbSession, MealPlanServiceDep
from src.db.models import InventoryEvent, InventoryLot, Leftover, MealPlan, Recipe
from src.schemas.meal_plan import (
    CookRequest,
    CookResponse,
    LeftoverListResponse,
    LeftoverResponse,
    LeftoverUpdate,
    MealPlanCreate,
    MealPlanListResponse,
    MealPlanResponse,
    MealPlanUpdate,
)

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

    # Re-select with proper eager loading for nested relationships
    result = await db.execute(
        select(MealPlan)
        .where(MealPlan.id == meal_plan.id)
        .options(selectinload(MealPlan.recipe).selectinload(Recipe.ingredients))
    )
    meal_plan = result.scalar_one()

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

    # Convert timezone-aware dates to naive (DB stores naive dates)
    if start_date:
        if start_date.tzinfo is not None:
            start_date = start_date.replace(tzinfo=None)
        query = query.where(MealPlan.planned_date >= start_date)
    if end_date:
        if end_date.tzinfo is not None:
            end_date = end_date.replace(tzinfo=None)
        query = query.where(MealPlan.planned_date <= end_date)
    if status:
        query = query.where(MealPlan.status == status)

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)

    # Paginate and eager load recipe with ingredients
    query = query.options(selectinload(MealPlan.recipe).selectinload(Recipe.ingredients))
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


@router.patch("/meal-plans/{meal_plan_id}", response_model=MealPlanResponse)
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

    # Re-select with proper eager loading for nested relationships
    result = await db.execute(
        select(MealPlan)
        .where(MealPlan.id == meal_plan.id)
        .options(selectinload(MealPlan.recipe).selectinload(Recipe.ingredients))
    )
    meal_plan = result.scalar_one()

    return MealPlanResponse.model_validate(meal_plan)


@router.delete("/meal-plans/{meal_plan_id}", status_code=204)
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


@router.post("/meal-plans/{meal_plan_id}/cook", response_model=CookResponse)
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
        .options(selectinload(MealPlan.recipe).selectinload(Recipe.ingredients))
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
            lot = next(inv_lot for inv_lot in lots if inv_lot.id == consumed["lot_id"])

            event = InventoryEvent(
                lot_id=lot.id,
                event_type="consume",
                quantity_delta=-consumed["quantity"],
                unit=lot.unit,
                reason=f"cooked:meal_plan:{meal_plan_id}",
            )
            db.add(event)

            lot.quantity -= consumed["quantity"]

            inventory_consumed.append(
                {
                    "lot_id": str(consumed["lot_id"]),
                    "quantity": float(consumed["quantity"]),
                    "cost": float(consumed["cost"]),
                }
            )

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

    # Re-select with proper eager loading for nested relationships
    result = await db.execute(
        select(MealPlan)
        .where(MealPlan.id == meal_plan.id)
        .options(selectinload(MealPlan.recipe).selectinload(Recipe.ingredients))
    )
    meal_plan = result.scalar_one()

    return CookResponse(
        meal_plan=MealPlanResponse.model_validate(meal_plan),
        actual_cost=total_cost,
        cost_per_serving=meal_plan.cost_per_serving or Decimal("0"),
        inventory_consumed=inventory_consumed,
        leftover=leftover_response,
    )


@router.get("/leftovers", response_model=LeftoverListResponse)
async def list_leftovers(
    db: DbSession,
    household_id: UUID = Query(..., description="Household ID"),
    status: str | None = Query(None, description="Filter by status"),
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
    leftover_data: LeftoverUpdate,
) -> LeftoverResponse:
    """Update leftover status (consumed/discarded)."""
    query = select(Leftover).where(Leftover.id == leftover_id)
    result = await db.execute(query)
    leftover = result.scalar_one_or_none()

    if not leftover:
        raise HTTPException(status_code=404, detail="Leftover not found")

    update_data = leftover_data.model_dump(exclude_unset=True)

    # Validate status if provided
    if "status" in update_data:
        if update_data["status"] not in ("available", "consumed", "discarded"):
            raise HTTPException(status_code=400, detail="Invalid status")

    for key, value in update_data.items():
        setattr(leftover, key, value)

    await db.flush()

    return LeftoverResponse.model_validate(leftover)
