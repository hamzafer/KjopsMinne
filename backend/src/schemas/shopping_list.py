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
    ingredient_name: str | None = None

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
    name: str | None = None


class GenerateShoppingListResponse(BaseModel):
    shopping_list: ShoppingListResponse
    meal_plans_included: int
    ingredients_aggregated: int
