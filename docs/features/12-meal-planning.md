# Feature 12: Meal Planning

**Status**: Implemented

## Overview

Meal planning allows households to plan their weekly meals by scheduling recipes for specific dates and meal types. This enables automatic shopping list generation and cost tracking when meals are cooked.

## User Stories

### Planning
- As a user, I want to add a recipe to my meal plan for a specific date so I can plan my week
- As a user, I want to assign meal types (breakfast, lunch, dinner, snack) so I know when to cook
- As a user, I want to adjust servings per meal so I can cook for the right number of people
- As a user, I want to view my meal plan as a weekly calendar

### Cooking
- As a user, I want to mark a meal as cooked so the system tracks inventory consumption
- As a user, I want to see the actual cost of a meal based on ingredients used
- As a user, I want to save leftovers when I cook more than needed

### Flexibility
- As a user, I want to reschedule a meal to a different date
- As a user, I want to skip a planned meal without losing the plan
- As a user, I want to plan a meal using leftovers from a previous cooking session

## Data Model

### MealPlan Table

```sql
CREATE TABLE meal_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID NOT NULL REFERENCES households(id),
    recipe_id UUID NOT NULL REFERENCES recipes(id),
    planned_date TIMESTAMP NOT NULL,
    meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    servings INTEGER NOT NULL DEFAULT 2,
    status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'cooked', 'skipped')),
    is_leftover_source BOOLEAN NOT NULL DEFAULT FALSE,
    leftover_from_id UUID REFERENCES meal_plans(id),
    cooked_at TIMESTAMP,
    actual_cost DECIMAL(10,2),
    cost_per_serving DECIMAL(10,2),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### Key Fields

| Field | Description |
|-------|-------------|
| `meal_type` | breakfast, lunch, dinner, snack |
| `servings` | Number of servings planned (can differ from recipe default) |
| `status` | planned, cooked, skipped |
| `is_leftover_source` | True if this meal created leftovers |
| `leftover_from_id` | If using leftovers, points to the original meal |
| `actual_cost` | Calculated when cooked (FIFO from inventory) |
| `cost_per_serving` | actual_cost / servings |

## API Endpoints

### Create Meal Plan

```http
POST /api/meal-plans
Content-Type: application/json

{
  "household_id": "uuid",
  "recipe_id": "uuid",
  "planned_date": "2024-01-20T18:00:00",
  "meal_type": "dinner",
  "servings": 4
}
```

### List Meal Plans

```http
GET /api/meal-plans?household_id=uuid&start_date=2024-01-20&end_date=2024-01-27

Response:
{
  "meal_plans": [
    {
      "id": "uuid",
      "planned_date": "2024-01-20T18:00:00",
      "meal_type": "dinner",
      "servings": 4,
      "status": "planned",
      "recipe": {
        "id": "uuid",
        "name": "Kylling Tikka Masala",
        "image_url": "..."
      }
    }
  ],
  "total": 7
}
```

### Mark as Cooked

```http
POST /api/meal-plans/{id}/cook
Content-Type: application/json

{
  "actual_servings": 4,
  "create_leftover": true,
  "leftover_servings": 2
}
```

**Response**:
```json
{
  "meal_plan": {
    "id": "uuid",
    "status": "cooked",
    "cooked_at": "2024-01-20T18:30:00",
    "actual_cost": "125.50",
    "cost_per_serving": "31.38",
    "is_leftover_source": true
  },
  "actual_cost": "125.50",
  "cost_per_serving": "31.38",
  "inventory_consumed": [
    {"lot_id": "uuid", "quantity": 400, "cost": 85.00}
  ],
  "leftover": {
    "id": "uuid",
    "remaining_servings": 2,
    "expires_at": "2024-01-23T18:30:00"
  }
}
```

## Frontend Pages

### Meal Plan Calendar (`/meal-plans`)

- Weekly calendar view with day columns
- Each day shows meals by type (breakfast, lunch, dinner)
- Drag-and-drop to reschedule meals
- Click to open meal details
- Quick actions: cook, skip, edit

### Add Meal Dialog

- Recipe picker with search
- Date picker
- Meal type selector
- Servings input
- Option to use from leftovers

### Cook Meal Dialog

- Shows required ingredients
- Confirms actual servings
- Option to save leftovers
- Shows calculated cost

## Business Logic

### Cost Calculation (FIFO)

When a meal is cooked:
1. Get recipe ingredients scaled by servings
2. For each ingredient, consume from inventory using FIFO (oldest lots first)
3. Sum costs from all consumed lots
4. Calculate cost_per_serving = total_cost / servings

### Inventory Consumption

```python
async def cook_meal(meal_plan_id, actual_servings, create_leftover, leftover_servings):
    # Load meal plan with recipe ingredients
    meal_plan = await get_meal_plan_with_recipe(meal_plan_id)

    # Calculate required quantities
    scale_factor = actual_servings / meal_plan.recipe.servings
    requirements = []
    for ri in meal_plan.recipe.ingredients:
        if ri.ingredient_id and ri.quantity:
            requirements.append({
                "ingredient_id": ri.ingredient_id,
                "quantity": ri.quantity * scale_factor,
                "unit": ri.unit
            })

    # Consume from inventory (FIFO)
    total_cost = Decimal("0")
    consumed = []
    for req in requirements:
        lots = await get_lots_fifo(household_id, req["ingredient_id"])
        remaining = req["quantity"]
        for lot in lots:
            if remaining <= 0:
                break
            take = min(lot.quantity, remaining)
            cost = take * lot.unit_cost
            total_cost += cost
            remaining -= take
            consumed.append({"lot_id": lot.id, "quantity": take, "cost": cost})
            await consume_from_lot(lot.id, take, f"cooked:meal_plan:{meal_plan_id}")

    # Update meal plan
    meal_plan.status = "cooked"
    meal_plan.cooked_at = datetime.now()
    meal_plan.actual_cost = total_cost
    meal_plan.cost_per_serving = total_cost / actual_servings

    # Create leftover if requested
    leftover = None
    if create_leftover and leftover_servings > 0:
        meal_plan.is_leftover_source = True
        leftover = await create_leftover_record(
            household_id=meal_plan.household_id,
            meal_plan_id=meal_plan.id,
            recipe_id=meal_plan.recipe_id,
            remaining_servings=leftover_servings
        )

    return {
        "meal_plan": meal_plan,
        "actual_cost": total_cost,
        "cost_per_serving": meal_plan.cost_per_serving,
        "inventory_consumed": consumed,
        "leftover": leftover
    }
```

## Integration Points

### Recipe System
- Meal plans reference recipes
- Ingredients come from recipe_ingredients

### Inventory System
- Cooking consumes inventory (FIFO)
- Cost calculated from lot unit_cost

### Shopping List System
- Shopping lists generated from planned meals
- Uses meal_plan servings to scale ingredients

### Leftover System
- Cooked meals can create leftovers
- Future meals can be planned from leftovers

### Analytics System
- Cost per meal tracking
- Cost trends over time

## Edge Cases

1. **Insufficient Inventory**: Allow cooking even without full inventory (cost calculation partial)
2. **Deleted Recipe**: Keep meal plan but show "Recipe deleted"
3. **Rescheduled Past Date**: Keep as planned, allow manual status change
4. **Leftover Expiry**: Warn when planning with soon-to-expire leftovers

## Future Enhancements

- Meal plan templates (weekly rotation)
- Nutrition tracking per meal
- Multi-week planning view
- AI meal suggestions based on inventory
- Shopping trip optimization
