from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from src.schemas.item import ItemResponse


class ReceiptBase(BaseModel):
    merchant_name: str
    store_location: str | None = None
    purchase_date: datetime
    total_amount: Decimal
    currency: str = "NOK"
    payment_method: str | None = None
    warranty_months: int | None = None
    return_window_days: int | None = None


class ReceiptCreate(ReceiptBase):
    pass


class ReceiptResponse(ReceiptBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    image_path: str | None = None
    created_at: datetime
    updated_at: datetime
    items: list[ItemResponse] = []


class ReceiptListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    merchant_name: str
    store_location: str | None = None
    purchase_date: datetime
    total_amount: Decimal
    currency: str
    item_count: int = 0
