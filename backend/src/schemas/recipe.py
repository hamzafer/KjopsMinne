# backend/src/schemas/recipe.py
"""Recipe Pydantic schemas."""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


# Recipe Ingredient Schemas
class RecipeIngredientBase(BaseModel):
    """Base schema for recipe ingredients."""

    raw_text: str
    quantity: Decimal | None = None
    unit: str | None = None
    notes: str | None = None
    ingredient_id: UUID | None = None


class RecipeIngredientCreate(RecipeIngredientBase):
    """Create a new recipe ingredient."""

    pass


class RecipeIngredientResponse(RecipeIngredientBase):
    """Recipe ingredient response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID


# Recipe Schemas
class RecipeBase(BaseModel):
    """Base schema for recipes."""

    name: str
    source_url: str | None = None
    servings: int = 2
    prep_time_minutes: int | None = None
    cook_time_minutes: int | None = None
    instructions: str
    tags: list[str] = []
    image_url: str | None = None


class RecipeCreate(RecipeBase):
    """Create a new recipe."""

    household_id: UUID
    ingredients: list[RecipeIngredientCreate] = []


class RecipeUpdate(BaseModel):
    """Update an existing recipe."""

    name: str | None = None
    source_url: str | None = None
    servings: int | None = None
    prep_time_minutes: int | None = None
    cook_time_minutes: int | None = None
    instructions: str | None = None
    tags: list[str] | None = None
    image_url: str | None = None
    ingredients: list[RecipeIngredientCreate] | None = None


class RecipeResponse(RecipeBase):
    """Recipe response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    household_id: UUID
    import_confidence: Decimal | None = None
    ingredients: list[RecipeIngredientResponse] = []
    created_at: datetime
    updated_at: datetime


class RecipeListResponse(BaseModel):
    """Paginated list of recipes."""

    recipes: list[RecipeResponse]
    total: int
    page: int
    page_size: int


# Recipe Import Schemas
class RecipeImportRequest(BaseModel):
    """Request to import a recipe from URL."""

    url: str
    household_id: UUID


class RecipeImportResponse(BaseModel):
    """Response from recipe import."""

    recipe: RecipeResponse
    confidence: Decimal
