from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from src.schemas.item import CategoryResponse


class IngredientCreate(BaseModel):
    name: str
    canonical_name: str
    default_unit: str = "g"
    aliases: list[str] = []
    category_id: UUID | None = None


class IngredientUpdate(BaseModel):
    name: str | None = None
    canonical_name: str | None = None
    default_unit: str | None = None
    aliases: list[str] | None = None
    category_id: UUID | None = None


class IngredientResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    canonical_name: str
    default_unit: str
    aliases: list[str]
    category: CategoryResponse | None = None
    created_at: datetime


class IngredientMatch(BaseModel):
    """Result of matching a raw name to a canonical ingredient."""
    ingredient_id: UUID | None
    ingredient_name: str | None
    confidence: Decimal
    method: str  # "exact" | "alias" | "fuzzy" | "llm" | "none"


class UnitConversionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    from_unit: str
    to_unit: str
    factor: Decimal
    ingredient_id: UUID | None = None
