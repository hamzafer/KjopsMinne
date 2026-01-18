import uuid
from pathlib import Path

import aiofiles
from fastapi import APIRouter, HTTPException, UploadFile

from src.api.deps import DbSession, OCRServiceDep
from src.config import settings
from src.db.models import Category, Item, Receipt
from src.schemas.receipt import ReceiptResponse
from src.services.categorizer import categorize_item
from src.services.parser import parse_ocr_result
from sqlalchemy import select
from sqlalchemy.orm import selectinload

router = APIRouter()

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".heic"}


@router.post("/receipts/upload", response_model=ReceiptResponse)
async def upload_receipt(
    file: UploadFile,
    db: DbSession,
    ocr_service: OCRServiceDep,
):
    """Upload a receipt image for OCR processing."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # Save uploaded file
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)

    file_id = uuid.uuid4()
    filename = f"{file_id}{ext}"
    file_path = upload_dir / filename

    async with aiofiles.open(file_path, "wb") as f:
        content = await file.read()
        await f.write(content)

    # Process with OCR
    try:
        ocr_result = await ocr_service.extract_text(file_path)
    except Exception as e:
        # Clean up file on OCR failure
        file_path.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {e}")

    # Parse OCR result
    parsed = parse_ocr_result(ocr_result)

    # Fetch categories for item categorization
    cat_result = await db.execute(select(Category))
    categories = {c.name.lower(): c.id for c in cat_result.scalars().all()}

    # Create receipt
    receipt = Receipt(
        merchant_name=parsed.merchant_name,
        store_location=parsed.store_location,
        purchase_date=parsed.purchase_date,
        total_amount=parsed.total_amount,
        currency=parsed.currency,
        payment_method=parsed.payment_method,
        image_path=str(file_path),
        raw_ocr=ocr_result,
    )
    db.add(receipt)
    await db.flush()

    # Create items
    for item_data in parsed.items:
        category_name = categorize_item(item_data.raw_name)
        category_id = categories.get(category_name.lower()) if category_name else None

        item = Item(
            receipt_id=receipt.id,
            raw_name=item_data.raw_name,
            canonical_name=item_data.canonical_name,
            quantity=item_data.quantity,
            unit=item_data.unit,
            unit_price=item_data.unit_price,
            total_price=item_data.total_price,
            category_id=category_id,
            is_pant=item_data.is_pant,
            discount_amount=item_data.discount_amount,
        )
        db.add(item)

    await db.flush()

    # Reload with relationships
    query = (
        select(Receipt)
        .options(selectinload(Receipt.items).selectinload(Item.category))
        .where(Receipt.id == receipt.id)
    )
    result = await db.execute(query)
    receipt = result.scalar_one()

    return receipt
