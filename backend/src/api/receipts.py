from uuid import UUID

from fastapi import APIRouter, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from src.api.deps import DbSession
from src.db.models import Item, Receipt
from src.schemas.receipt import ReceiptListResponse, ReceiptResponse

router = APIRouter()


@router.get("/receipts", response_model=list[ReceiptListResponse])
async def list_receipts(
    db: DbSession,
    skip: int = 0,
    limit: int = 50,
):
    """List all receipts with item counts."""
    subquery = (
        select(Item.receipt_id, func.count(Item.id).label("item_count"))
        .group_by(Item.receipt_id)
        .subquery()
    )

    query = (
        select(
            Receipt.id,
            Receipt.merchant_name,
            Receipt.store_location,
            Receipt.purchase_date,
            Receipt.total_amount,
            Receipt.currency,
            func.coalesce(subquery.c.item_count, 0).label("item_count"),
        )
        .outerjoin(subquery, Receipt.id == subquery.c.receipt_id)
        .order_by(Receipt.purchase_date.desc())
        .offset(skip)
        .limit(limit)
    )

    result = await db.execute(query)
    rows = result.all()

    return [
        ReceiptListResponse(
            id=row.id,
            merchant_name=row.merchant_name,
            store_location=row.store_location,
            purchase_date=row.purchase_date,
            total_amount=row.total_amount,
            currency=row.currency,
            item_count=row.item_count,
        )
        for row in rows
    ]


@router.get("/receipts/{receipt_id}", response_model=ReceiptResponse)
async def get_receipt(receipt_id: UUID, db: DbSession):
    """Get a single receipt with all items."""
    query = (
        select(Receipt)
        .options(selectinload(Receipt.items).selectinload(Item.category))
        .where(Receipt.id == receipt_id)
    )

    result = await db.execute(query)
    receipt = result.scalar_one_or_none()

    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")

    return receipt


@router.delete("/receipts/{receipt_id}")
async def delete_receipt(receipt_id: UUID, db: DbSession):
    """Delete a receipt and all its items."""
    query = select(Receipt).where(Receipt.id == receipt_id)
    result = await db.execute(query)
    receipt = result.scalar_one_or_none()

    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")

    await db.delete(receipt)
    return {"message": "Receipt deleted"}
