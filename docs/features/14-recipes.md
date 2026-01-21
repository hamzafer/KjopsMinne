# Feature 13: Recipe Management

**Status**: Implemented

## Overview

Recipe management allows users to import recipes from URLs using LLM parsing, create recipes manually, and manage their recipe collection. Recipes form the foundation of meal planning and shopping list generation.

## User Stories

### Import
- As a user, I want to paste a recipe URL and have it automatically parsed
- As a user, I want to see the import confidence so I can verify accuracy
- As a user, I want to edit imported recipes to fix parsing errors

### Creation
- As a user, I want to create recipes manually with ingredients and instructions
- As a user, I want to tag recipes for easy categorization
- As a user, I want to set prep and cook times

### Management
- As a user, I want to search my recipe collection
- As a user, I want to edit existing recipes
- As a user, I want to delete recipes I no longer need

## Data Model

### Recipe Table

```sql
CREATE TABLE recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID NOT NULL REFERENCES households(id),
    name TEXT NOT NULL,
    source_url TEXT,
    servings INTEGER NOT NULL DEFAULT 2,
    prep_time_minutes INTEGER,
    cook_time_minutes INTEGER,
    instructions TEXT NOT NULL,
    tags JSONB NOT NULL DEFAULT '[]',
    image_url TEXT,
    import_confidence DECIMAL(3,2),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### RecipeIngredient Table

```sql
CREATE TABLE recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES ingredients(id),
    raw_text TEXT NOT NULL,
    quantity DECIMAL(10,3),
    unit TEXT,
    notes TEXT
);
```

### Key Fields

| Field | Description |
|-------|-------------|
| `source_url` | Original URL if imported |
| `servings` | Default serving count |
| `import_confidence` | LLM parsing confidence (0.00-1.00) |
| `tags` | JSON array of tag strings |
| `raw_text` | Original ingredient text for display |
| `ingredient_id` | Link to ingredient for inventory matching |

## API Endpoints

### Import Recipe from URL

```http
POST /api/recipes/import
Content-Type: application/json

{
  "url": "https://www.matprat.no/oppskrifter/kylling-tikka-masala/",
  "household_id": "uuid"
}
```

**Response** (201 Created):
```json
{
  "recipe": {
    "id": "uuid",
    "name": "Kylling Tikka Masala",
    "source_url": "https://www.matprat.no/...",
    "servings": 4,
    "prep_time_minutes": 20,
    "cook_time_minutes": 30,
    "instructions": "1. Marinere kyllingen...",
    "tags": ["indisk", "kylling", "middag"],
    "image_url": "https://...",
    "import_confidence": "0.85",
    "ingredients": [
      {
        "id": "uuid",
        "raw_text": "400g kyllingbryst",
        "quantity": "400.000",
        "unit": "g",
        "ingredient_id": "uuid"
      }
    ]
  },
  "confidence": "0.85"
}
```

### Create Recipe Manually

```http
POST /api/recipes
Content-Type: application/json

{
  "household_id": "uuid",
  "name": "Pannekaker",
  "servings": 4,
  "prep_time_minutes": 10,
  "cook_time_minutes": 20,
  "instructions": "1. Bland mel og salt...",
  "tags": ["dessert", "frokost"],
  "ingredients": [
    {
      "raw_text": "3 dl hvetemel",
      "quantity": 300,
      "unit": "ml",
      "ingredient_id": "uuid"
    }
  ]
}
```

### List Recipes

```http
GET /api/recipes?household_id=uuid&search=kylling&page=1&page_size=20

Response:
{
  "recipes": [...],
  "total": 25,
  "page": 1,
  "page_size": 20
}
```

### Update Recipe

```http
PATCH /api/recipes/{id}
Content-Type: application/json

{
  "name": "Pannekaker med syltetøy",
  "tags": ["dessert", "frokost", "barna"]
}
```

## Recipe Import Flow

### 1. Fetch and Parse HTML

```python
async def import_recipe(url: str, household_id: UUID) -> RecipeImportResponse:
    # Fetch the webpage
    html = await fetch_url(url)

    # Look for structured data (JSON-LD, microdata)
    structured = extract_structured_data(html)

    # Extract text content for LLM
    text_content = extract_recipe_text(html)
```

### 2. LLM Extraction

```python
    # Send to LLM for parsing
    llm_response = await extract_recipe_with_llm(
        text_content,
        structured_data=structured,
        prompt=RECIPE_EXTRACTION_PROMPT
    )

    # Parse LLM response
    parsed = parse_llm_response(llm_response)
    # {
    #   "name": "...",
    #   "servings": 4,
    #   "prep_time": 20,
    #   "cook_time": 30,
    #   "ingredients": [...],
    #   "instructions": "...",
    #   "tags": [...],
    #   "confidence": 0.85
    # }
```

### 3. Ingredient Matching

```python
    # Match ingredients to database
    matched_ingredients = []
    for ing in parsed["ingredients"]:
        match = await match_ingredient(
            raw_text=ing["text"],
            parsed_name=ing.get("name"),
            household_id=household_id
        )
        matched_ingredients.append({
            "raw_text": ing["text"],
            "quantity": ing.get("quantity"),
            "unit": ing.get("unit"),
            "notes": ing.get("notes"),
            "ingredient_id": match.id if match else None,
            "match_confidence": match.confidence if match else None
        })
```

### 4. Save Recipe

```python
    # Create recipe record
    recipe = Recipe(
        household_id=household_id,
        name=parsed["name"],
        source_url=url,
        servings=parsed.get("servings", 2),
        prep_time_minutes=parsed.get("prep_time"),
        cook_time_minutes=parsed.get("cook_time"),
        instructions=parsed["instructions"],
        tags=parsed.get("tags", []),
        image_url=parsed.get("image_url"),
        import_confidence=parsed["confidence"]
    )

    # Create ingredient records
    for ing in matched_ingredients:
        recipe.ingredients.append(RecipeIngredient(**ing))

    return RecipeImportResponse(
        recipe=recipe,
        confidence=parsed["confidence"]
    )
```

## Ingredient Matching

### Matching Algorithm

1. **Exact match**: canonical_name matches
2. **Alias match**: ingredient appears in aliases
3. **Fuzzy match**: Levenshtein distance < threshold
4. **LLM match**: Use LLM for complex cases

### Example

```python
async def match_ingredient(raw_text: str, parsed_name: str | None) -> IngredientMatch | None:
    name = parsed_name or extract_ingredient_name(raw_text)
    canonical = normalize_name(name)  # "kyllingbryst" → "kyllingbryst"

    # Try exact match
    ingredient = await get_ingredient_by_canonical(canonical)
    if ingredient:
        return IngredientMatch(id=ingredient.id, confidence=1.0)

    # Try alias match
    ingredient = await get_ingredient_by_alias(canonical)
    if ingredient:
        return IngredientMatch(id=ingredient.id, confidence=0.95)

    # Try fuzzy match
    candidates = await fuzzy_search_ingredients(canonical, limit=5)
    if candidates and candidates[0].score > 0.85:
        return IngredientMatch(id=candidates[0].id, confidence=candidates[0].score)

    return None  # No match found
```

## Frontend Pages

### Recipe List (`/recipes`)

- Grid/list view toggle
- Search by name
- Filter by tags
- Import from URL button
- Add manually button

### Recipe Detail (`/recipes/{id}`)

- Recipe name, image, metadata
- Ingredients list with quantities
- Instructions (numbered steps)
- Tags
- Edit/Delete actions
- "Add to Meal Plan" button

### Import Dialog

- URL input field
- Import button with loading state
- Preview of parsed recipe
- Edit fields before save
- Confidence indicator

## Error Handling

| Scenario | Handling |
|----------|----------|
| Invalid URL | 400 error with message |
| Website blocked | Suggest manual entry |
| LLM parsing fails | Return partial with low confidence |
| No ingredients found | Warning, allow save anyway |
| Duplicate recipe | Warn but allow |

## LLM Prompt

```
Extract the recipe from this webpage content. Return JSON with:
- name: Recipe title
- servings: Number of servings (integer)
- prep_time: Preparation time in minutes
- cook_time: Cooking time in minutes
- ingredients: Array of {text, quantity, unit, name, notes}
- instructions: Full instructions as a string
- tags: Array of relevant tags (cuisine, diet, main ingredient)
- confidence: Your confidence in the extraction (0.0-1.0)

Focus on Norwegian recipes. Handle Norwegian units (dl, ss, ts, stk).
```

## Future Enhancements

- Recipe scaling (change servings, recalculate quantities)
- Nutrition information import
- Recipe photos upload
- Recipe sharing between households
- Recipe collections/folders
- Print-friendly view
- Cooking mode (step-by-step)
