from datetime import datetime
from decimal import Decimal

from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import func, select

from src.api.deps import DbSession
from src.db.models import Category, Item, Receipt

router = APIRouter()


class SummaryResponse(BaseModel):
    total_receipts: int
    total_spent: Decimal
    total_items: int
    avg_receipt_amount: Decimal
    period_start: datetime | None
    period_end: datetime | None


class CategorySpending(BaseModel):
    category_name: str
    category_color: str | None
    total_spent: Decimal
    item_count: int


class ByCategory(BaseModel):
    categories: list[CategorySpending]
    uncategorized_total: Decimal
    uncategorized_count: int


@router.get("/analytics/summary", response_model=SummaryResponse)
async def get_summary(
    db: DbSession,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
):
    """Get spending summary for a period."""
    query = select(
        func.count(Receipt.id).label("total_receipts"),
        func.coalesce(func.sum(Receipt.total_amount), 0).label("total_spent"),
        func.min(Receipt.purchase_date).label("period_start"),
        func.max(Receipt.purchase_date).label("period_end"),
    )

    if start_date:
        query = query.where(Receipt.purchase_date >= start_date)
    if end_date:
        query = query.where(Receipt.purchase_date <= end_date)

    result = await db.execute(query)
    row = result.one()

    # Get total items
    items_query = select(func.count(Item.id))
    if start_date or end_date:
        items_query = items_query.join(Receipt)
        if start_date:
            items_query = items_query.where(Receipt.purchase_date >= start_date)
        if end_date:
            items_query = items_query.where(Receipt.purchase_date <= end_date)

    items_result = await db.execute(items_query)
    total_items = items_result.scalar() or 0

    total_receipts = row.total_receipts or 0
    total_spent = Decimal(str(row.total_spent or 0))
    avg_amount = total_spent / total_receipts if total_receipts > 0 else Decimal("0")

    return SummaryResponse(
        total_receipts=total_receipts,
        total_spent=total_spent,
        total_items=total_items,
        avg_receipt_amount=avg_amount.quantize(Decimal("0.01")),
        period_start=row.period_start,
        period_end=row.period_end,
    )


@router.get("/analytics/by-category", response_model=ByCategory)
async def get_by_category(
    db: DbSession,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
):
    """Get spending breakdown by category."""
    # Categorized items
    query = (
        select(
            Category.name,
            Category.color,
            func.sum(Item.total_price).label("total_spent"),
            func.count(Item.id).label("item_count"),
        )
        .join(Item, Item.category_id == Category.id)
        .join(Receipt, Item.receipt_id == Receipt.id)
        .group_by(Category.id, Category.name, Category.color)
        .order_by(func.sum(Item.total_price).desc())
    )

    if start_date:
        query = query.where(Receipt.purchase_date >= start_date)
    if end_date:
        query = query.where(Receipt.purchase_date <= end_date)

    result = await db.execute(query)
    categories = [
        CategorySpending(
            category_name=row.name,
            category_color=row.color,
            total_spent=Decimal(str(row.total_spent)),
            item_count=row.item_count,
        )
        for row in result.all()
    ]

    # Uncategorized items
    uncat_query = select(
        func.coalesce(func.sum(Item.total_price), 0).label("total"),
        func.count(Item.id).label("count"),
    ).where(Item.category_id.is_(None))

    if start_date or end_date:
        uncat_query = uncat_query.join(Receipt, Item.receipt_id == Receipt.id)
        if start_date:
            uncat_query = uncat_query.where(Receipt.purchase_date >= start_date)
        if end_date:
            uncat_query = uncat_query.where(Receipt.purchase_date <= end_date)

    uncat_result = await db.execute(uncat_query)
    uncat_row = uncat_result.one()

    return ByCategory(
        categories=categories,
        uncategorized_total=Decimal(str(uncat_row.total or 0)),
        uncategorized_count=uncat_row.count or 0,
    )
