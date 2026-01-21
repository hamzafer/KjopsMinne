# Feature 14: Shopping Lists

**Status**: Implemented

## Overview

Shopping lists are automatically generated from planned meals, comparing required ingredients against current inventory to show only what needs to be purchased. Lists can be used during shopping with check-off functionality.

## User Stories

### Generation
- As a user, I want to generate a shopping list for a date range from my meal plans
- As a user, I want to see what I already have vs what I need to buy
- As a user, I want ingredients from multiple meals aggregated together

### Shopping
- As a user, I want to check off items as I shop
- As a user, I want to record actual quantities purchased
- As a user, I want to add notes to items (substitutions, preferences)

### Management
- As a user, I want to view past shopping lists
- As a user, I want to mark lists as completed or archive them
- As a user, I want to delete old lists

## Data Model

### ShoppingList Table

```sql
CREATE TABLE shopping_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID NOT NULL REFERENCES households(id),
    name TEXT NOT NULL,
    date_range_start TIMESTAMP NOT NULL,
    date_range_end TIMESTAMP NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### ShoppingListItem Table

```sql
CREATE TABLE shopping_list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shopping_list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES ingredients(id),
    required_quantity DECIMAL(10,3) NOT NULL,
    required_unit TEXT NOT NULL,
    on_hand_quantity DECIMAL(10,3) NOT NULL DEFAULT 0,
    to_buy_quantity DECIMAL(10,3) NOT NULL,
    is_checked BOOLEAN NOT NULL DEFAULT FALSE,
    actual_quantity DECIMAL(10,3),
    notes TEXT,
    source_meal_plans UUID[] NOT NULL DEFAULT '{}'
);
```

### Key Fields

| Field | Description |
|-------|-------------|
| `required_quantity` | Total needed for all meals |
| `on_hand_quantity` | Current inventory at generation time |
| `to_buy_quantity` | required - on_hand (what to purchase) |
| `is_checked` | Checked off during shopping |
| `actual_quantity` | What was actually purchased |
| `source_meal_plans` | Array of meal_plan IDs that need this ingredient |

## API Endpoints

### Generate Shopping List

```http
POST /api/shopping-lists/generate
Content-Type: application/json

{
  "household_id": "uuid",
  "start_date": "2024-01-22T00:00:00",
  "end_date": "2024-01-28T23:59:59",
  "name": "Uke 4"
}
```

**Response** (201 Created):
```json
{
  "shopping_list": {
    "id": "uuid",
    "household_id": "uuid",
    "name": "Uke 4",
    "date_range_start": "2024-01-22T00:00:00",
    "date_range_end": "2024-01-28T23:59:59",
    "status": "active",
    "items": [
      {
        "id": "uuid",
        "ingredient_id": "uuid",
        "ingredient_name": "Kyllingbryst",
        "required_quantity": "800.000",
        "required_unit": "g",
        "on_hand_quantity": "200.000",
        "to_buy_quantity": "600.000",
        "is_checked": false,
        "source_meal_plans": ["uuid1", "uuid2"]
      }
    ]
  },
  "meal_plans_included": 7,
  "ingredients_aggregated": 15
}
```

### List Shopping Lists

```http
GET /api/shopping-lists?household_id=uuid&status=active

Response:
{
  "shopping_lists": [...],
  "total": 5
}
```

### Update Item (Check off)

```http
PATCH /api/shopping-lists/{list_id}/items/{item_id}
Content-Type: application/json

{
  "is_checked": true,
  "actual_quantity": "650.000",
  "notes": "Kun 650g tilgjengelig"
}
```

### Update List Status

```http
PATCH /api/shopping-lists/{id}
Content-Type: application/json

{
  "status": "completed"
}
```

## Generation Algorithm

### 1. Get Planned Meals

```python
async def generate_shopping_list(
    household_id: UUID,
    start_date: datetime,
    end_date: datetime,
    name: str | None
) -> GenerateShoppingListResponse:

    # Get planned meals in date range
    meal_plans = await get_meal_plans(
        household_id=household_id,
        start_date=start_date,
        end_date=end_date,
        status="planned"
    )
```

### 2. Aggregate Ingredients

```python
    # Aggregate ingredients across all meals
    aggregated = {}  # ingredient_id -> {quantity, unit, source_meal_plans}

    for meal in meal_plans:
        scale = meal.servings / meal.recipe.servings

        for ri in meal.recipe.ingredients:
            if not ri.ingredient_id or not ri.quantity:
                continue

            ingredient_id = ri.ingredient_id
            scaled_qty = ri.quantity * scale

            if ingredient_id in aggregated:
                aggregated[ingredient_id]["quantity"] += scaled_qty
                aggregated[ingredient_id]["source_meal_plans"].append(meal.id)
            else:
                aggregated[ingredient_id] = {
                    "quantity": scaled_qty,
                    "unit": ri.unit,
                    "source_meal_plans": [meal.id]
                }
```

### 3. Check Inventory

```python
    # For each ingredient, check current inventory
    items = []
    for ingredient_id, data in aggregated.items():
        # Sum available inventory
        on_hand = await get_inventory_quantity(
            household_id=household_id,
            ingredient_id=ingredient_id
        )

        # Calculate how much to buy
        to_buy = max(data["quantity"] - on_hand, 0)

        items.append(ShoppingListItem(
            ingredient_id=ingredient_id,
            required_quantity=data["quantity"],
            required_unit=data["unit"],
            on_hand_quantity=on_hand,
            to_buy_quantity=to_buy,
            source_meal_plans=data["source_meal_plans"]
        ))
```

### 4. Create Shopping List

```python
    # Generate name if not provided
    if not name:
        name = generate_list_name(start_date, end_date)
        # e.g., "Uke 4" or "22-28 Jan"

    # Create the shopping list
    shopping_list = ShoppingList(
        household_id=household_id,
        name=name,
        date_range_start=start_date,
        date_range_end=end_date,
        items=items
    )

    return GenerateShoppingListResponse(
        shopping_list=shopping_list,
        meal_plans_included=len(meal_plans),
        ingredients_aggregated=len(aggregated)
    )
```

## Frontend Pages

### Shopping Lists (`/shopping`)

- List of active/completed/archived lists
- Create new list button
- Date range picker for generation
- Status filter tabs

### Shopping List Detail (`/shopping/{id}`)

- List name and date range
- Items grouped by category (optional)
- Checkboxes for each item
- Shows: required, on hand, to buy
- Notes input per item
- Mark as completed button

### Shopping Mode (Mobile Optimized)

- Large checkboxes for easy tapping
- Swipe to check off
- Sort by store aisle (future)
- Running total of checked items

## Item Display Format

```
[ ] Kyllingbryst
    Trenger: 800g | Har: 200g | Kjøp: 600g
    Fra: Tikka Masala, Kyllingsuppe
```

## Edge Cases

| Scenario | Handling |
|----------|----------|
| No planned meals | Return empty list with warning |
| Ingredient without inventory | Show full required as to_buy |
| Unmapped recipe ingredients | Skip (can't track) |
| Zero to_buy | Include with to_buy=0 (informational) |
| Different units | Convert if possible, else show both |

## Integration Points

### Meal Plans
- Source of required ingredients
- Links to meals that need each item

### Inventory
- Current stock checked at generation
- Updated when items are purchased (future)

### Ingredients
- Names and units for display
- Category for grouping (future)

## Future Enhancements

- Add items manually (not from meals)
- Price tracking and budget estimation
- Store integration for prices
- Barcode scanning to check off
- Smart reordering suggestions
- Share list with family members
- Print-friendly format
- Voice assistant integration ("Add milk")
