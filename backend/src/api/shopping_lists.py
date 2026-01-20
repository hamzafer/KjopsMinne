"""API routes for shopping lists."""
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, Response
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from src.api.deps import DbSession, ShoppingGeneratorDep
from src.db.models import InventoryLot, MealPlan, Recipe, ShoppingList, ShoppingListItem
from src.schemas.shopping_list import (
    GenerateShoppingListRequest,
    GenerateShoppingListResponse,
    ShoppingListItemResponse,
    ShoppingListItemUpdate,
    ShoppingListListResponse,
    ShoppingListResponse,
    ShoppingListUpdate,
)

router = APIRouter()


@router.post(
    "/shopping-lists/generate", response_model=GenerateShoppingListResponse, status_code=201
)
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
        inv_query = select(
            func.coalesce(func.sum(InventoryLot.quantity), Decimal("0"))
        ).where(
            InventoryLot.household_id == request.household_id,
            InventoryLot.ingredient_id == ingredient_id,
            InventoryLot.quantity > 0,
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

    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)

    query = query.options(
        selectinload(ShoppingList.items).selectinload(ShoppingListItem.ingredient)
    )
    query = query.order_by(ShoppingList.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    shopping_lists = result.scalars().all()

    return ShoppingListListResponse(
        shopping_lists=[_to_response(sl) for sl in shopping_lists],
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

    if "status" in data:
        if data["status"] not in ("active", "completed", "archived"):
            raise HTTPException(status_code=400, detail="Invalid status")

    for key, value in data.items():
        setattr(shopping_list, key, value)

    await db.flush()

    return _to_response(shopping_list)


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
