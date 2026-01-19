from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class HouseholdCreate(BaseModel):
    name: str


class HouseholdResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    created_at: datetime


class UserCreate(BaseModel):
    email: str
    name: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    name: str
    household_id: UUID
    role: str
    created_at: datetime


class HouseholdWithUsers(HouseholdResponse):
    users: list[UserResponse] = []


class HouseholdCreateRequest(BaseModel):
    """Combined request for creating a household with its owner."""

    household: HouseholdCreate
    owner: UserCreate
