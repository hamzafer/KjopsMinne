"""Admin endpoints for database management."""

from fastapi import APIRouter
from pydantic import BaseModel

from src.api.deps import AdminAuth
from src.db.seed_demo_data import seed_demo_data

router = APIRouter()


class SeedResponse(BaseModel):
    """Response from seed-demo endpoint."""

    status: str
    message: str


@router.post("/admin/seed-demo", response_model=SeedResponse)
async def seed_demo(
    _auth: AdminAuth,
    clear_first: bool = True,
) -> SeedResponse:
    """Seed database with demo data. Requires X-Admin-Key header."""
    await seed_demo_data(clear_first=clear_first)
    return SeedResponse(status="ok", message="Demo data seeded")
