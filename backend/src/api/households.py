"""Household management API routes."""
import uuid

from fastapi import APIRouter, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from src.api.deps import DbSession
from src.db.models import Household, User
from src.schemas.household import (
    HouseholdCreateRequest,
    HouseholdWithUsers,
    UserCreate,
    UserResponse,
)

router = APIRouter()


@router.post("/households", response_model=HouseholdWithUsers)
async def create_household(
    data: HouseholdCreateRequest,
    db: DbSession,
):
    """Create a new household with an owner."""
    # Create household
    household = Household(
        id=uuid.uuid4(),
        name=data.household.name,
    )
    db.add(household)
    await db.flush()

    # Create owner user
    user = User(
        id=uuid.uuid4(),
        email=data.owner.email,
        name=data.owner.name,
        household_id=household.id,
        role="owner",
    )
    db.add(user)
    await db.flush()

    # Reload with relationships
    result = await db.execute(
        select(Household)
        .options(selectinload(Household.users))
        .where(Household.id == household.id)
    )
    household = result.scalar_one()

    return household


@router.get("/households/{household_id}", response_model=HouseholdWithUsers)
async def get_household(household_id: uuid.UUID, db: DbSession):
    """Get a household with its users."""
    result = await db.execute(
        select(Household)
        .options(selectinload(Household.users))
        .where(Household.id == household_id)
    )
    household = result.scalar_one_or_none()

    if not household:
        raise HTTPException(status_code=404, detail="Household not found")

    return household


@router.post("/households/{household_id}/members", response_model=UserResponse)
async def add_member(
    household_id: uuid.UUID,
    data: UserCreate,
    db: DbSession,
):
    """Add a member to a household."""
    # Verify household exists
    result = await db.execute(
        select(Household).where(Household.id == household_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Household not found")

    # Check if email already exists
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        id=uuid.uuid4(),
        email=data.email,
        name=data.name,
        household_id=household_id,
        role="member",
    )
    db.add(user)
    await db.flush()

    return user


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: uuid.UUID, db: DbSession):
    """Get a user by ID."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user
