# Feature 15: Inventory Management

**Status**: Implemented

## Overview

Inventory management tracks ingredient quantities across storage locations (pantry, fridge, freezer) using a lot-based system with FIFO (First-In-First-Out) cost tracking. Each purchase creates a "lot" with its own purchase date and cost, enabling accurate cost-per-meal calculations.

## User Stories

### Tracking
- As a user, I want to see all ingredients I have at home
- As a user, I want to track where items are stored (pantry, fridge, freezer)
- As a user, I want to see expiry dates for perishable items
- As a user, I want to know the cost of my inventory

### Management
- As a user, I want to add items manually to my inventory
- As a user, I want to move items between locations
- As a user, I want to discard expired or spoiled items
- As a user, I want to see the history of changes to a lot

### Consumption
- As a user, I want cooking to automatically consume inventory
- As a user, I want to manually adjust quantities

## Data Model

### InventoryLot Table

```sql
CREATE TABLE inventory_lots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID NOT NULL REFERENCES households(id),
    ingredient_id UUID NOT NULL REFERENCES ingredients(id),
    quantity DECIMAL(10,3) NOT NULL,
    unit TEXT NOT NULL,
    location TEXT NOT NULL DEFAULT 'pantry' CHECK (location IN ('pantry', 'fridge', 'freezer')),
    purchase_date TIMESTAMP NOT NULL,
    expiry_date TIMESTAMP,
    unit_cost DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'NOK',
    confidence DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    source_type TEXT NOT NULL CHECK (source_type IN ('receipt', 'manual', 'barcode')),
    source_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### InventoryEvent Table

```sql
CREATE TABLE inventory_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id UUID NOT NULL REFERENCES inventory_lots(id),
    event_type TEXT NOT NULL CHECK (event_type IN ('add', 'consume', 'adjust', 'discard', 'transfer')),
    quantity_delta DECIMAL(10,3) NOT NULL,
    unit TEXT NOT NULL,
    reason TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### Key Fields

| Field | Description |
|-------|-------------|
| `lot` | Individual purchase batch with unique cost |
| `unit_cost` | Cost per unit (e.g., 0.12 NOK/g) |
| `source_type` | How the lot was created (receipt, manual, barcode) |
| `event_type` | Type of change (add, consume, adjust, discard, transfer) |
| `quantity_delta` | Change amount (positive for add, negative for consume) |

## API Endpoints

### Aggregated Inventory View

```http
GET /api/inventory?household_id=uuid&location=fridge

Response:
[
  {
    "ingredient_id": "uuid",
    "ingredient_name": "Melk",
    "canonical_name": "melk",
    "total_quantity": "2000.000",
    "unit": "ml",
    "lot_count": 2,
    "locations": ["fridge"],
    "earliest_expiry": "2024-01-22T00:00:00"
  }
]
```

### List Lots

```http
GET /api/inventory/lots?household_id=uuid&ingredient_id=uuid

Response:
[
  {
    "id": "uuid",
    "ingredient_id": "uuid",
    "quantity": "1000.000",
    "unit": "ml",
    "location": "fridge",
    "purchase_date": "2024-01-15",
    "expiry_date": "2024-01-22",
    "unit_cost": "0.024",
    "total_cost": "23.90"
  }
]
```

### Create Lot Manually

```http
POST /api/inventory/lots?household_id=uuid
Content-Type: application/json

{
  "ingredient_id": "uuid",
  "quantity": "500.000",
  "unit": "g",
  "location": "pantry",
  "purchase_date": "2024-01-15",
  "expiry_date": "2024-06-15",
  "unit_cost": "0.05",
  "total_cost": "25.00",
  "source_type": "manual"
}
```

### Consume from Lot

```http
POST /api/inventory/lots/{lot_id}/consume
Content-Type: application/json

{
  "quantity": "200.000",
  "reason": "used for cooking"
}
```

**Response**:
```json
{
  "id": "uuid",
  "quantity": "300.000",
  "..."
}
```

### Discard Lot

```http
POST /api/inventory/lots/{lot_id}/discard
Content-Type: application/json

{
  "reason": "expired"
}
```

### Transfer Location

```http
POST /api/inventory/lots/{lot_id}/transfer
Content-Type: application/json

{
  "location": "freezer"
}
```

### Get Lot Events

```http
GET /api/inventory/lots/{lot_id}/events

Response:
[
  {
    "id": "uuid",
    "event_type": "consume",
    "quantity_delta": "-200.000",
    "reason": "cooked:meal_plan:uuid",
    "created_at": "2024-01-20T18:30:00"
  },
  {
    "id": "uuid",
    "event_type": "add",
    "quantity_delta": "500.000",
    "reason": "initial",
    "created_at": "2024-01-15T14:00:00"
  }
]
```

## FIFO Cost Tracking

### Concept

When consuming ingredients, the system uses FIFO (First-In-First-Out) ordering based on `purchase_date`. This ensures:
1. Oldest items are used first (realistic inventory rotation)
2. Accurate cost tracking per meal

### Example

```
Inventory: Chicken breast
- Lot A (Jan 10): 200g @ 0.10 NOK/g = 20 NOK
- Lot B (Jan 15): 500g @ 0.12 NOK/g = 60 NOK

Cooking needs: 600g chicken

FIFO consumption:
1. Lot A: 200g @ 0.10 = 20 NOK (lot depleted)
2. Lot B: 400g @ 0.12 = 48 NOK (100g remaining)

Total cost: 68 NOK for 600g = 0.113 NOK/g average
```

### Implementation

```python
async def consume_fifo(
    household_id: UUID,
    ingredient_id: UUID,
    required_quantity: Decimal,
    reason: str
) -> list[ConsumedLot]:
    """Consume from inventory using FIFO ordering."""

    # Get lots ordered by purchase date (oldest first)
    lots = await get_lots_by_ingredient(
        household_id=household_id,
        ingredient_id=ingredient_id,
        order_by="purchase_date ASC"
    )

    consumed = []
    remaining = required_quantity

    for lot in lots:
        if remaining <= 0:
            break

        if lot.quantity <= 0:
            continue

        # Take as much as we can from this lot
        take = min(lot.quantity, remaining)
        cost = take * lot.unit_cost

        # Update lot quantity
        lot.quantity -= take

        # Create consume event
        await create_event(
            lot_id=lot.id,
            event_type="consume",
            quantity_delta=-take,
            unit=lot.unit,
            reason=reason
        )

        consumed.append(ConsumedLot(
            lot_id=lot.id,
            quantity=take,
            cost=cost
        ))

        remaining -= take

    return consumed
```

## Inventory Sources

### 1. Receipt Upload (Automatic)

When a receipt is processed:
1. Items are matched to ingredients
2. Lots created with cost from receipt
3. User can review and confirm

### 2. Manual Entry

User adds items directly:
- Specify ingredient, quantity, cost
- Set location and expiry
- Optional: link to receipt item later

### 3. Barcode Scan (Future)

Scan product barcode:
- Look up in product database
- Match to ingredient
- Set default quantity and cost

## Frontend Pages

### Inventory Overview (`/inventory`)

- Aggregated view by ingredient
- Filter by location
- Sort by expiry (soonest first), quantity, name
- Quick action: add manual item

### Ingredient Detail (`/inventory/{ingredient_id}`)

- All lots for this ingredient
- Location breakdown
- Expiry timeline
- Event history
- Quick actions: consume, discard, transfer

### Add Item Dialog

- Ingredient picker (search/create)
- Quantity and unit input
- Location selector
- Purchase date picker
- Cost input (total or per unit)
- Optional expiry date

## Event Types

| Type | Delta | Description |
|------|-------|-------------|
| `add` | + | Initial lot creation |
| `consume` | - | Used for cooking |
| `adjust` | +/- | Manual correction |
| `discard` | - | Expired/spoiled (sets to 0) |
| `transfer` | 0 | Location change only |

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Insufficient inventory | Allow cooking, log partial consumption |
| Different units | Convert using unit_conversions table |
| Negative quantity | Prevent, return error |
| Lot fully consumed | Keep record with quantity=0 |
| Unknown ingredient | Prompt to create ingredient first |

## Integration Points

### Receipts
- Automatic lot creation from receipt items
- Link via `source_type='receipt'` and `source_id`

### Meal Planning
- Cooking consumes inventory via FIFO
- Cost calculation for meals

### Shopping Lists
- Current inventory compared to meal requirements
- Determines what to buy

### Analytics
- Waste tracking (discard events)
- Cost trends
- Restock predictions

## Future Enhancements

- Barcode scanning for adding items
- Receipt OCR → inventory matching UI
- Expiry notifications
- Smart location suggestions
- Inventory value dashboard
- Multi-unit support per lot
- Batch operations (consume/discard multiple)
