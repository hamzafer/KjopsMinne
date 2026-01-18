from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class CategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    icon: str | None = None
    color: str | None = None


class ItemBase(BaseModel):
    raw_name: str
    canonical_name: str | None = None
    quantity: Decimal | None = None
    unit: str | None = None
    unit_price: Decimal | None = None
    total_price: Decimal
    is_pant: bool = False
    discount_amount: Decimal = Decimal("0")


class ItemCreate(ItemBase):
    category_id: UUID | None = None


class ItemResponse(ItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    receipt_id: UUID
    category: CategoryResponse | None = None
