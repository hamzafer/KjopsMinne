# Phase 3: Recipes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add recipe management with URL import using LLM extraction and ingredient matching.

**Architecture:** Recipe stores metadata and instructions. RecipeIngredient links recipes to canonical ingredients with quantities. RecipeImporter service fetches URLs, uses LLM to extract structured data, and matches ingredients.

**Tech Stack:** SQLAlchemy 2.0 async, FastAPI, Pydantic v2, PostgreSQL, Alembic, httpx for URL fetching, Anthropic Claude API for extraction

---

## Task 1: Create Recipe Model

**Files:**
- Modify: `backend/src/db/models.py`

**Step 1: Add Recipe model**

Add after the `InventoryEvent` class:

```python
class Recipe(Base):
    __tablename__ = "recipes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    household_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("households.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    source_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    servings: Mapped[int] = mapped_column(default=2)
    prep_time_minutes: Mapped[int | None] = mapped_column(nullable=True)
    cook_time_minutes: Mapped[int | None] = mapped_column(nullable=True)
    instructions: Mapped[str] = mapped_column(Text, nullable=False)
    tags: Mapped[list[str]] = mapped_column(JSONB, default=list)
    image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    import_confidence: Mapped[Decimal | None] = mapped_column(
        Numeric(3, 2), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=func.now(), onupdate=func.now(), nullable=False
    )

    household: Mapped["Household"] = relationship("Household")
    ingredients: Mapped[list["RecipeIngredient"]] = relationship(
        "RecipeIngredient", back_populates="recipe", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("idx_recipes_household", "household_id"),
        Index("idx_recipes_name", "name"),
    )
```

**Step 2: Commit**

```bash
git add backend/src/db/models.py
git commit -m "feat(models): add Recipe model"
```

---

## Task 2: Create RecipeIngredient Model

**Files:**
- Modify: `backend/src/db/models.py`

**Step 1: Add RecipeIngredient model**

Add after `Recipe` class:

```python
class RecipeIngredient(Base):
    __tablename__ = "recipe_ingredients"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    recipe_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False
    )
    ingredient_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ingredients.id"), nullable=True
    )
    raw_text: Mapped[str] = mapped_column(Text, nullable=False)  # Original text from recipe
    quantity: Mapped[Decimal | None] = mapped_column(Numeric(10, 3), nullable=True)
    unit: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)  # e.g., "finely chopped"

    recipe: Mapped["Recipe"] = relationship("Recipe", back_populates="ingredients")
    ingredient: Mapped["Ingredient | None"] = relationship("Ingredient")

    __table_args__ = (
        Index("idx_recipe_ingredients_recipe", "recipe_id"),
        Index("idx_recipe_ingredients_ingredient", "ingredient_id"),
    )
```

**Step 2: Commit**

```bash
git add backend/src/db/models.py
git commit -m "feat(models): add RecipeIngredient model"
```

---

## Task 3: Create Alembic Migration

**Files:**
- Create: `backend/alembic/versions/004_recipes.py`

**Step 1: Create migration file**

```python
"""Add recipe tables.

Revision ID: 004
Revises: 003
Create Date: 2026-01-20
"""
from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "004"
down_revision: str | None = "003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Create recipes table
    op.create_table(
        "recipes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "household_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("households.id"),
            nullable=False,
        ),
        sa.Column("name", sa.Text, nullable=False),
        sa.Column("source_url", sa.Text, nullable=True),
        sa.Column("servings", sa.Integer, server_default="2"),
        sa.Column("prep_time_minutes", sa.Integer, nullable=True),
        sa.Column("cook_time_minutes", sa.Integer, nullable=True),
        sa.Column("instructions", sa.Text, nullable=False),
        sa.Column("tags", postgresql.JSONB, server_default="[]"),
        sa.Column("image_url", sa.Text, nullable=True),
        sa.Column("import_confidence", sa.Numeric(3, 2), nullable=True),
        sa.Column(
            "created_at", sa.DateTime, server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime, server_default=sa.func.now(), nullable=False
        ),
    )

    # Create recipe_ingredients table
    op.create_table(
        "recipe_ingredients",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "recipe_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("recipes.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "ingredient_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("ingredients.id"),
            nullable=True,
        ),
        sa.Column("raw_text", sa.Text, nullable=False),
        sa.Column("quantity", sa.Numeric(10, 3), nullable=True),
        sa.Column("unit", sa.Text, nullable=True),
        sa.Column("notes", sa.Text, nullable=True),
    )

    # Create indexes
    op.create_index("idx_recipes_household", "recipes", ["household_id"])
    op.create_index("idx_recipes_name", "recipes", ["name"])
    op.create_index("idx_recipe_ingredients_recipe", "recipe_ingredients", ["recipe_id"])
    op.create_index(
        "idx_recipe_ingredients_ingredient", "recipe_ingredients", ["ingredient_id"]
    )


def downgrade() -> None:
    op.drop_index("idx_recipe_ingredients_ingredient", "recipe_ingredients")
    op.drop_index("idx_recipe_ingredients_recipe", "recipe_ingredients")
    op.drop_index("idx_recipes_name", "recipes")
    op.drop_index("idx_recipes_household", "recipes")
    op.drop_table("recipe_ingredients")
    op.drop_table("recipes")
```

**Step 2: Run migration**

Run: `cd /Users/stan/dev/kvitteringshvelv/backend && uv run alembic upgrade head`

Expected: "Running upgrade 003 -> 004"

**Step 3: Commit**

```bash
git add backend/alembic/versions/004_recipes.py
git commit -m "feat(db): add recipes migration"
```

---

## Task 4: Create Recipe Pydantic Schemas

**Files:**
- Create: `backend/src/schemas/recipe.py`

**Step 1: Create schema file**

```python
# backend/src/schemas/recipe.py
"""Recipe Pydantic schemas."""
from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, HttpUrl


class RecipeIngredientCreate(BaseModel):
    """Create a recipe ingredient."""
    raw_text: str
    ingredient_id: UUID | None = None
    quantity: Decimal | None = None
    unit: str | None = None
    notes: str | None = None


class RecipeIngredientResponse(BaseModel):
    """Recipe ingredient response."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    recipe_id: UUID
    ingredient_id: UUID | None
    raw_text: str
    quantity: Decimal | None
    unit: str | None
    notes: str | None


class RecipeCreate(BaseModel):
    """Create a new recipe manually."""
    name: str = Field(..., min_length=1, max_length=200)
    source_url: str | None = None
    servings: int = Field(default=2, ge=1, le=100)
    prep_time_minutes: int | None = Field(default=None, ge=0)
    cook_time_minutes: int | None = Field(default=None, ge=0)
    instructions: str = Field(..., min_length=1)
    tags: list[str] = Field(default_factory=list)
    image_url: str | None = None
    ingredients: list[RecipeIngredientCreate] = Field(default_factory=list)


class RecipeUpdate(BaseModel):
    """Update a recipe."""
    name: str | None = Field(default=None, min_length=1, max_length=200)
    servings: int | None = Field(default=None, ge=1, le=100)
    prep_time_minutes: int | None = None
    cook_time_minutes: int | None = None
    instructions: str | None = None
    tags: list[str] | None = None
    image_url: str | None = None


class RecipeResponse(BaseModel):
    """Recipe response."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    household_id: UUID
    name: str
    source_url: str | None
    servings: int
    prep_time_minutes: int | None
    cook_time_minutes: int | None
    instructions: str
    tags: list[str]
    image_url: str | None
    import_confidence: Decimal | None
    created_at: datetime
    updated_at: datetime
    ingredients: list[RecipeIngredientResponse] = []


class RecipeImportRequest(BaseModel):
    """Request to import a recipe from URL."""
    url: str = Field(..., description="URL of the recipe page to import")


class RecipeImportResponse(BaseModel):
    """Response from recipe import (for review before saving)."""
    name: str
    source_url: str
    servings: int
    prep_time_minutes: int | None
    cook_time_minutes: int | None
    instructions: str
    tags: list[str]
    image_url: str | None
    import_confidence: Decimal
    ingredients: list[RecipeIngredientCreate]
```

**Step 2: Commit**

```bash
git add backend/src/schemas/recipe.py
git commit -m "feat(schemas): add recipe Pydantic schemas"
```

---

## Task 5: Create Recipe Importer Service

**Files:**
- Create: `backend/src/services/recipe_importer.py`
- Create: `backend/tests/test_recipe_importer.py`

**Step 1: Write the failing test**

```python
# backend/tests/test_recipe_importer.py
"""Tests for recipe importer service."""
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.services.recipe_importer import RecipeImporter, ParsedIngredient


class TestParseIngredientLine:
    def setup_method(self):
        self.importer = RecipeImporter()

    def test_parse_simple_ingredient(self):
        """Parse a simple ingredient line."""
        result = self.importer.parse_ingredient_line("2 dl melk")
        assert result.quantity == Decimal("2")
        assert result.unit == "dl"
        assert result.name == "melk"

    def test_parse_ingredient_with_notes(self):
        """Parse ingredient with notes in parentheses."""
        result = self.importer.parse_ingredient_line("1 stk løk (finhakket)")
        assert result.quantity == Decimal("1")
        assert result.unit == "stk"
        assert result.name == "løk"
        assert result.notes == "finhakket"

    def test_parse_ingredient_fraction(self):
        """Parse ingredient with fraction."""
        result = self.importer.parse_ingredient_line("1/2 ts salt")
        assert result.quantity == Decimal("0.5")
        assert result.unit == "ts"
        assert result.name == "salt"

    def test_parse_ingredient_no_unit(self):
        """Parse ingredient without unit."""
        result = self.importer.parse_ingredient_line("3 egg")
        assert result.quantity == Decimal("3")
        assert result.unit is None
        assert result.name == "egg"

    def test_parse_ingredient_no_quantity(self):
        """Parse ingredient without quantity."""
        result = self.importer.parse_ingredient_line("salt og pepper")
        assert result.quantity is None
        assert result.unit is None
        assert result.name == "salt og pepper"
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/stan/dev/kvitteringshvelv/backend && uv run pytest tests/test_recipe_importer.py -v`

Expected: ModuleNotFoundError

**Step 3: Write minimal implementation**

```python
# backend/src/services/recipe_importer.py
"""Recipe import service for extracting recipes from URLs."""
import re
from dataclasses import dataclass
from decimal import Decimal


@dataclass
class ParsedIngredient:
    """Parsed ingredient from recipe text."""
    name: str
    quantity: Decimal | None = None
    unit: str | None = None
    notes: str | None = None


class RecipeImporter:
    """Service for importing recipes from URLs."""

    # Common Norwegian units
    UNITS = {"dl", "l", "ml", "g", "kg", "ss", "ts", "stk", "pk", "boks", "pose"}

    # Fraction mappings
    FRACTIONS = {
        "1/2": Decimal("0.5"),
        "1/3": Decimal("0.333"),
        "2/3": Decimal("0.667"),
        "1/4": Decimal("0.25"),
        "3/4": Decimal("0.75"),
        "1/8": Decimal("0.125"),
    }

    def parse_ingredient_line(self, line: str) -> ParsedIngredient:
        """
        Parse a single ingredient line into structured data.

        Examples:
            "2 dl melk" -> ParsedIngredient(name="melk", quantity=2, unit="dl")
            "1 stk løk (finhakket)" -> ParsedIngredient(name="løk", quantity=1, unit="stk", notes="finhakket")
        """
        line = line.strip()
        if not line:
            return ParsedIngredient(name="")

        # Extract notes in parentheses
        notes = None
        notes_match = re.search(r"\(([^)]+)\)", line)
        if notes_match:
            notes = notes_match.group(1)
            line = re.sub(r"\s*\([^)]+\)", "", line).strip()

        # Try to extract quantity and unit
        quantity = None
        unit = None

        # Match fraction at start
        for frac, value in self.FRACTIONS.items():
            if line.startswith(frac):
                quantity = value
                line = line[len(frac):].strip()
                break

        # Match number at start (if no fraction found)
        if quantity is None:
            num_match = re.match(r"^(\d+(?:[.,]\d+)?)", line)
            if num_match:
                quantity = Decimal(num_match.group(1).replace(",", "."))
                line = line[num_match.end():].strip()

        # Match unit
        words = line.split()
        if words and words[0].lower() in self.UNITS:
            unit = words[0].lower()
            line = " ".join(words[1:])

        # Remaining is the ingredient name
        name = line.strip()

        # Handle case where unit is actually the ingredient (e.g., "3 egg")
        if not name and unit:
            name = unit
            unit = None

        return ParsedIngredient(
            name=name,
            quantity=quantity,
            unit=unit,
            notes=notes,
        )
```

**Step 4: Run test to verify it passes**

Run: `cd /Users/stan/dev/kvitteringshvelv/backend && uv run pytest tests/test_recipe_importer.py -v`

Expected: All 5 tests pass

**Step 5: Commit**

```bash
git add backend/src/services/recipe_importer.py backend/tests/test_recipe_importer.py
git commit -m "feat(services): add RecipeImporter with ingredient parsing"
```

---

## Task 6: Add LLM Recipe Extraction to Importer

**Files:**
- Modify: `backend/src/services/recipe_importer.py`
- Modify: `backend/src/config.py`

**Step 1: Add Anthropic API key to config**

Add to `backend/src/config.py`:

```python
anthropic_api_key: str = ""  # For recipe import
```

**Step 2: Add import_from_url method**

Add to RecipeImporter class:

```python
import httpx
from bs4 import BeautifulSoup
import anthropic
import json

async def fetch_url(self, url: str) -> str:
    """Fetch and clean HTML from URL."""
    async with httpx.AsyncClient() as client:
        response = await client.get(url, follow_redirects=True, timeout=30.0)
        response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")

    # Remove script and style elements
    for element in soup(["script", "style", "nav", "footer", "header"]):
        element.decompose()

    # Get text content
    text = soup.get_text(separator="\n", strip=True)

    # Limit to first 15000 chars to avoid token limits
    return text[:15000]

async def extract_with_llm(self, text: str, url: str) -> dict:
    """Use Claude to extract recipe data from text."""
    client = anthropic.Anthropic()

    prompt = f"""Extract the recipe from this text. Return a JSON object with these fields:
- name: recipe title (string)
- servings: number of servings (integer, default 2)
- prep_time_minutes: prep time in minutes (integer or null)
- cook_time_minutes: cooking time in minutes (integer or null)
- ingredients: array of ingredient strings exactly as written
- instructions: full cooking instructions (string, preserve formatting)
- tags: array of relevant tags like "vegetarian", "quick", "norwegian" (string array)
- image_url: URL of recipe image if found (string or null)

Text from {url}:

{text}

Return ONLY valid JSON, no other text."""

    message = client.messages.create(
        model="claude-3-haiku-20240307",
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}]
    )

    # Parse JSON from response
    response_text = message.content[0].text
    return json.loads(response_text)

async def import_from_url(self, url: str) -> dict:
    """
    Import a recipe from a URL.

    Returns a dict ready for RecipeImportResponse schema.
    """
    # Fetch and clean HTML
    text = await self.fetch_url(url)

    # Extract with LLM
    extracted = await self.extract_with_llm(text, url)

    # Parse ingredients
    parsed_ingredients = []
    for ing_text in extracted.get("ingredients", []):
        parsed = self.parse_ingredient_line(ing_text)
        parsed_ingredients.append({
            "raw_text": ing_text,
            "quantity": parsed.quantity,
            "unit": parsed.unit,
            "notes": parsed.notes,
            "ingredient_id": None,  # Will be matched later
        })

    return {
        "name": extracted.get("name", "Untitled Recipe"),
        "source_url": url,
        "servings": extracted.get("servings", 2),
        "prep_time_minutes": extracted.get("prep_time_minutes"),
        "cook_time_minutes": extracted.get("cook_time_minutes"),
        "instructions": extracted.get("instructions", ""),
        "tags": extracted.get("tags", []),
        "image_url": extracted.get("image_url"),
        "import_confidence": Decimal("0.85"),  # Default confidence
        "ingredients": parsed_ingredients,
    }
```

**Step 3: Add dependencies**

Run: `cd /Users/stan/dev/kvitteringshvelv/backend && uv add httpx beautifulsoup4 anthropic`

**Step 4: Commit**

```bash
git add backend/src/services/recipe_importer.py backend/src/config.py pyproject.toml uv.lock
git commit -m "feat(services): add LLM recipe extraction from URL"
```

---

## Task 7: Create Recipe API Routes - List and Get

**Files:**
- Create: `backend/src/api/recipes.py`

**Step 1: Create recipe router with list and get endpoints**

```python
# backend/src/api/recipes.py
"""Recipe management API routes."""
import uuid

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from src.api.deps import DbSession
from src.db.models import Household, Ingredient, Recipe, RecipeIngredient
from src.schemas.recipe import (
    RecipeCreate,
    RecipeImportRequest,
    RecipeImportResponse,
    RecipeResponse,
    RecipeUpdate,
)
from src.services.recipe_importer import RecipeImporter

router = APIRouter()


@router.get("/recipes", response_model=list[RecipeResponse])
async def list_recipes(
    db: DbSession,
    household_id: uuid.UUID = Query(..., description="Household ID"),
    search: str | None = Query(None, description="Search by name"),
    tags: list[str] | None = Query(None, description="Filter by tags"),
    skip: int = 0,
    limit: int = 50,
):
    """List all recipes for a household."""
    query = (
        select(Recipe)
        .options(selectinload(Recipe.ingredients))
        .where(Recipe.household_id == household_id)
    )

    if search:
        query = query.where(Recipe.name.ilike(f"%{search}%"))

    if tags:
        # Filter recipes that have ALL specified tags
        for tag in tags:
            query = query.where(Recipe.tags.contains([tag]))

    query = query.order_by(Recipe.name).offset(skip).limit(limit)

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/recipes/{recipe_id}", response_model=RecipeResponse)
async def get_recipe(recipe_id: uuid.UUID, db: DbSession):
    """Get a specific recipe."""
    result = await db.execute(
        select(Recipe)
        .options(selectinload(Recipe.ingredients))
        .where(Recipe.id == recipe_id)
    )
    recipe = result.scalar_one_or_none()

    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    return recipe
```

**Step 2: Commit**

```bash
git add backend/src/api/recipes.py
git commit -m "feat(api): add recipe list and get endpoints"
```

---

## Task 8: Add Recipe Create Endpoint

**Files:**
- Modify: `backend/src/api/recipes.py`

**Step 1: Add create endpoint**

Add after the get endpoint:

```python
@router.post("/recipes", response_model=RecipeResponse)
async def create_recipe(
    data: RecipeCreate,
    household_id: uuid.UUID = Query(..., description="Household ID"),
    db: DbSession = None,
):
    """Create a new recipe manually."""
    # Verify household exists
    result = await db.execute(
        select(Household).where(Household.id == household_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Household not found")

    # Create recipe
    recipe = Recipe(
        id=uuid.uuid4(),
        household_id=household_id,
        name=data.name,
        source_url=data.source_url,
        servings=data.servings,
        prep_time_minutes=data.prep_time_minutes,
        cook_time_minutes=data.cook_time_minutes,
        instructions=data.instructions,
        tags=data.tags,
        image_url=data.image_url,
    )
    db.add(recipe)

    # Create recipe ingredients
    for ing_data in data.ingredients:
        ingredient = RecipeIngredient(
            id=uuid.uuid4(),
            recipe_id=recipe.id,
            ingredient_id=ing_data.ingredient_id,
            raw_text=ing_data.raw_text,
            quantity=ing_data.quantity,
            unit=ing_data.unit,
            notes=ing_data.notes,
        )
        db.add(ingredient)

    await db.flush()

    # Reload with ingredients
    result = await db.execute(
        select(Recipe)
        .options(selectinload(Recipe.ingredients))
        .where(Recipe.id == recipe.id)
    )
    return result.scalar_one()
```

**Step 2: Commit**

```bash
git add backend/src/api/recipes.py
git commit -m "feat(api): add recipe create endpoint"
```

---

## Task 9: Add Recipe Update Endpoint

**Files:**
- Modify: `backend/src/api/recipes.py`

**Step 1: Add update endpoint**

Add after create endpoint:

```python
@router.put("/recipes/{recipe_id}", response_model=RecipeResponse)
async def update_recipe(
    recipe_id: uuid.UUID,
    data: RecipeUpdate,
    db: DbSession,
):
    """Update a recipe."""
    result = await db.execute(
        select(Recipe).where(Recipe.id == recipe_id)
    )
    recipe = result.scalar_one_or_none()

    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    # Update fields if provided
    if data.name is not None:
        recipe.name = data.name
    if data.servings is not None:
        recipe.servings = data.servings
    if data.prep_time_minutes is not None:
        recipe.prep_time_minutes = data.prep_time_minutes
    if data.cook_time_minutes is not None:
        recipe.cook_time_minutes = data.cook_time_minutes
    if data.instructions is not None:
        recipe.instructions = data.instructions
    if data.tags is not None:
        recipe.tags = data.tags
    if data.image_url is not None:
        recipe.image_url = data.image_url

    await db.flush()

    # Reload with ingredients
    result = await db.execute(
        select(Recipe)
        .options(selectinload(Recipe.ingredients))
        .where(Recipe.id == recipe.id)
    )
    return result.scalar_one()
```

**Step 2: Commit**

```bash
git add backend/src/api/recipes.py
git commit -m "feat(api): add recipe update endpoint"
```

---

## Task 10: Add Recipe Delete Endpoint

**Files:**
- Modify: `backend/src/api/recipes.py`

**Step 1: Add delete endpoint**

Add after update endpoint:

```python
@router.delete("/recipes/{recipe_id}")
async def delete_recipe(recipe_id: uuid.UUID, db: DbSession):
    """Delete a recipe."""
    result = await db.execute(
        select(Recipe).where(Recipe.id == recipe_id)
    )
    recipe = result.scalar_one_or_none()

    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    await db.delete(recipe)
    return {"message": "Recipe deleted"}
```

**Step 2: Commit**

```bash
git add backend/src/api/recipes.py
git commit -m "feat(api): add recipe delete endpoint"
```

---

## Task 11: Add Recipe Import Endpoint

**Files:**
- Modify: `backend/src/api/recipes.py`

**Step 1: Add import endpoint**

Add after delete endpoint:

```python
@router.post("/recipes/import", response_model=RecipeImportResponse)
async def import_recipe(data: RecipeImportRequest):
    """
    Import a recipe from URL.

    Returns extracted data for user review before saving.
    Use POST /recipes to save after review.
    """
    importer = RecipeImporter()

    try:
        result = await importer.import_from_url(data.url)
        return RecipeImportResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to import recipe: {str(e)}"
        )
```

**Step 2: Commit**

```bash
git add backend/src/api/recipes.py
git commit -m "feat(api): add recipe import endpoint"
```

---

## Task 12: Register Recipe Router

**Files:**
- Modify: `backend/src/main.py`

**Step 1: Add recipe router import and registration**

In imports section, add `recipes` to the import:

```python
from src.api import analytics, categories, households, ingredients, inventory, recipes, receipts, upload
```

In router registration section, add:

```python
app.include_router(recipes.router, prefix="/api", tags=["recipes"])
```

**Step 2: Verify API starts**

Run: `curl -s http://localhost:8000/docs | grep -o "recipes" | head -1`

Expected: "recipes"

**Step 3: Commit**

```bash
git add backend/src/main.py
git commit -m "feat(api): register recipes router"
```

---

## Task 13: Run All Tests

**Files:** None (verification only)

**Step 1: Run all backend tests**

Run: `cd /Users/stan/dev/kvitteringshvelv/backend && uv run pytest -v`

Expected: All tests pass (22 existing + 5 new recipe importer tests)

**Step 2: Run linting**

Run: `cd /Users/stan/dev/kvitteringshvelv && make lint`

Expected: No errors

---

## Summary

**Phase 3 Complete!** You now have:

1. **Database models**: Recipe and RecipeIngredient with proper relationships
2. **Migration 004**: Creates both tables with indexes
3. **Schemas**: Pydantic schemas for all recipe operations including import
4. **RecipeImporter service**:
   - Parses Norwegian ingredient lines
   - Fetches and cleans HTML from URLs
   - Uses Claude to extract structured recipe data
5. **API endpoints**:
   - `GET /api/recipes` - List with search and tag filters
   - `GET /api/recipes/{id}` - Get recipe with ingredients
   - `POST /api/recipes` - Manual create
   - `PUT /api/recipes/{id}` - Update
   - `DELETE /api/recipes/{id}` - Delete
   - `POST /api/recipes/import` - Import from URL (returns data for review)

**Next: Phase 4 (Meal Planning)** will add meal plan scheduling and cooking flow.
