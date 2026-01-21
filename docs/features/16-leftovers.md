# Feature 16: Leftover Tracking

**Status**: Implemented

## Overview

Leftover tracking records extra servings from cooked meals, allowing users to plan future meals using leftovers and track food waste when leftovers expire or are discarded.

## User Stories

### Creation
- As a user, I want to save leftover servings when I cook more than needed
- As a user, I want to know when leftovers will expire

### Usage
- As a user, I want to plan a meal using leftovers instead of cooking fresh
- As a user, I want to mark leftovers as consumed when I eat them

### Tracking
- As a user, I want to mark leftovers as discarded when they spoil
- As a user, I want to see waste analytics from discarded leftovers

## Data Model

### Leftover Table

```sql
CREATE TABLE leftovers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID NOT NULL REFERENCES households(id),
    meal_plan_id UUID NOT NULL REFERENCES meal_plans(id),
    recipe_id UUID NOT NULL REFERENCES recipes(id),
    remaining_servings INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'consumed', 'discarded')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL
);
```

### Key Fields

| Field | Description |
|-------|-------------|
| `meal_plan_id` | The cooking event that created these leftovers |
| `recipe_id` | For display and planning (denormalized for convenience) |
| `remaining_servings` | How many servings left |
| `status` | available, consumed, discarded |
| `expires_at` | Default: created_at + 3 days |

## API Endpoints

### List Leftovers

```http
GET /api/leftovers?household_id=uuid&status=available

Response:
{
  "leftovers": [
    {
      "id": "uuid",
      "household_id": "uuid",
      "meal_plan_id": "uuid",
      "recipe_id": "uuid",
      "remaining_servings": 2,
      "status": "available",
      "created_at": "2024-01-20T18:30:00",
      "expires_at": "2024-01-23T18:30:00",
      "recipe": {
        "id": "uuid",
        "name": "Kylling Tikka Masala"
      }
    }
  ],
  "total": 3
}
```

### Update Leftover

```http
PATCH /api/leftovers/{id}
Content-Type: application/json

{
  "status": "consumed",
  "remaining_servings": 0
}
```

**Or mark as discarded**:
```json
{
  "status": "discarded"
}
```

## Leftover Lifecycle

```
Cook Meal (4 servings, save 2 as leftover)
        │
        ▼
┌───────────────────────────────────────┐
│  Leftover Created                      │
│  status: "available"                   │
│  remaining_servings: 2                 │
│  expires_at: now + 3 days              │
└───────────────────────────────────────┘
        │
        ├─────────────────┐
        ▼                 ▼
┌─────────────────┐  ┌─────────────────┐
│  Partially Ate  │  │  Plan as Meal   │
│  remaining: 1   │  │  (leftover_from)│
└─────────────────┘  └─────────────────┘
        │                 │
        ├─────────────────┤
        ▼                 ▼
┌─────────────────┐  ┌─────────────────┐
│  Fully Consumed │  │  Expired/Spoiled│
│  status:consumed│  │  status:discarded│
└─────────────────┘  └─────────────────┘
```

## Creating Leftovers (from Cooking)

When marking a meal as cooked with leftovers:

```python
async def cook_meal_with_leftover(
    meal_plan_id: UUID,
    actual_servings: int,
    create_leftover: bool,
    leftover_servings: int
) -> CookResponse:

    meal_plan = await get_meal_plan(meal_plan_id)

    # ... consume inventory, calculate cost ...

    leftover = None
    if create_leftover and leftover_servings > 0:
        meal_plan.is_leftover_source = True

        leftover = Leftover(
            household_id=meal_plan.household_id,
            meal_plan_id=meal_plan.id,
            recipe_id=meal_plan.recipe_id,
            remaining_servings=leftover_servings,
            status="available",
            expires_at=datetime.now() + timedelta(days=3)
        )
        db.add(leftover)

    return CookResponse(
        meal_plan=meal_plan,
        leftover=leftover,
        # ...
    )
```

## Planning with Leftovers

Users can plan a meal that uses leftovers instead of cooking:

```http
POST /api/meal-plans
Content-Type: application/json

{
  "household_id": "uuid",
  "recipe_id": "uuid",
  "planned_date": "2024-01-22T12:00:00",
  "meal_type": "lunch",
  "servings": 2,
  "leftover_from_id": "meal_plan_uuid_that_created_leftover"
}
```

When this "leftover meal" is marked as cooked:
- No inventory is consumed (already counted in original cooking)
- No cost is added (cost was in original meal)
- Leftover servings are decremented

## Frontend Pages

### Leftovers List (`/leftovers`)

- Shows available leftovers
- Expiry indicator (days remaining)
- Quick actions: use, consume, discard
- Filter by status

### Leftover Card

```
┌─────────────────────────────────────┐
│  🍛 Kylling Tikka Masala            │
│  2 porsjoner • Utløper om 2 dager   │
│                                     │
│  [Planlegg måltid] [Spist] [Kastet] │
└─────────────────────────────────────┘
```

### Add to Meal Plan Flow

1. Click "Planlegg måltid" on leftover
2. Select date and meal type
3. Meal plan created with `leftover_from_id` set
4. Shows in calendar with leftover indicator

## Waste Analytics

Discarded leftovers contribute to waste analytics:

```http
GET /api/analytics/waste?household_id=uuid

Response:
{
  "leftover_discards": [
    {
      "leftover_id": "uuid",
      "recipe_name": "Pasta Bolognese",
      "servings_wasted": 2,
      "created_at": "2024-01-15T18:30:00"
    }
  ],
  "total_leftover_servings_wasted": 4
}
```

## Expiry Handling

### Default Expiry

- Standard: 3 days from cooking
- Configurable per recipe (future)
- Visual indicators:
  - Green: 2+ days remaining
  - Yellow: 1 day remaining
  - Red: Expires today/overdue

### Expiry Notifications (Future)

- Daily reminder of expiring leftovers
- Suggest using in today's meal plan
- Auto-discard option after X days overdue

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Partial consumption | Update remaining_servings, keep status |
| Over-consume | Allow, log warning |
| Already expired when discarding | Still record for analytics |
| Delete original meal plan | Keep leftover record (orphaned but valid) |
| Edit leftover servings up | Allow (found more in fridge) |

## Integration Points

### Meal Plans
- Leftovers created from cooked meals
- Future meals can use leftovers
- `is_leftover_source` flag on meal plan
- `leftover_from_id` links to original

### Analytics
- Waste tracking for discarded leftovers
- Food waste reduction insights

### Notifications (Future)
- Expiry warnings
- Suggest using leftovers

## Future Enhancements

- Configurable expiry per recipe category
- Photo of leftover
- Portions tracking (what container is it in?)
- Leftover history per recipe
- Combine multiple leftover portions
- Share leftovers with family notification
- Integration with smart fridge (far future)
