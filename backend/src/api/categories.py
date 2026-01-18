from fastapi import APIRouter
from sqlalchemy import select

from src.api.deps import DbSession
from src.db.models import Category
from src.schemas.item import CategoryResponse

router = APIRouter()


@router.get("/categories", response_model=list[CategoryResponse])
async def list_categories(db: DbSession):
    """List all categories."""
    result = await db.execute(select(Category).order_by(Category.name))
    return result.scalars().all()
