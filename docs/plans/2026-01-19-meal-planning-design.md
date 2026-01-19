# Meal Planning + Inventory + Spend Analytics Design

**Date:** 2026-01-19
**Status:** Approved
**Scope:** MVP as defined in product spec

## Overview

Transform kvitteringshvelv from a receipt vault into a full meal planning system with inventory tracking and spend analytics. Built on top of the existing receipt scanning infrastructure.

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Architecture | Extend in place | Leverage existing receipt parsing; "receipt-first" for Norway |
| Receipt → Inventory | Auto-add with review | Low friction, handles edge cases via review screen |
| Recipe import | URL import with LLM | Manual entry kills adoption; LLM handles Norwegian sites |
| Inventory model | Full spec (lots, audit trail, confidence) | Enables cost-per-meal and waste tracking |
| Shopping list | Unit-aware aggregation | Essential for usable lists; pack sizes are v2 |
| Household | From start, simple roles | Avoids painful migrations; covers couples/roommates |
| AI scope | Parsing + ingredient matching | Core loop requires matching; planning assistant is v2 |
| Offline | Online only | Significant complexity; Norway has good coverage |

---

## Data Model

### New Entities

#### Household
```
Household
├── id: UUID
├── name: string
├── created_at: timestamp
```

#### User (modified)
```
User
├── + household_id: FK → Household
├── + role: "owner" | "member"
```

#### Ingredient (canonical)
```
Ingredient
├── id: UUID
├── name: string (display name)
├── canonical_name: string (normalized)
├── default_unit: string (g, ml, pcs)
├── aliases: string[] (["tomat", "tomater", "tomatoes"])
├── category_id: FK → Category
├── created_at: timestamp
```

#### Recipe
```
Recipe
├── id: UUID
├── household_id: FK → Household
├── name: string
├── source_url: string (nullable)
├── servings: int (default 2)
├── prep_time_minutes: int (nullable)
├── instructions: text (markdown)
├── tags: string[]
├── image_url: string (nullable)
├── import_confidence: decimal (0.0-1.0)
├── created_at, updated_at: timestamp
```

#### RecipeIngredient
```
RecipeIngredient
├── id: UUID
├── recipe_id: FK → Recipe
├── ingredient_id: FK → Ingredient
├── quantity: decimal
├── unit: string
├── notes: string (nullable, e.g., "finely chopped")
```

#### InventoryLot
```
InventoryLot
├── id: UUID
├── household_id: FK → Household
├── ingredient_id: FK → Ingredient
├── quantity: decimal (current, computed from events)
├── unit: string (canonical: g, ml, pcs)
├── location: "pantry" | "fridge" | "freezer"
├── purchase_date: date
├── expiry_date: date (nullable)
├── unit_cost: decimal
├── total_cost: decimal
├── currency: string (default "NOK")
├── confidence: decimal (0.0-1.0)
├── source_type: "receipt" | "manual" | "barcode" | "adjustment"
├── source_id: UUID (nullable, receipt_item_id)
├── created_at, updated_at: timestamp
```

#### InventoryEvent
```
InventoryEvent
├── id: UUID
├── lot_id: FK → InventoryLot
├── event_type: "add" | "consume" | "adjust" | "discard" | "transfer"
├── quantity_delta: decimal (positive or negative)
├── unit: string
├── reason: string (e.g., "cooked:meal_plan_id", "manual", "expired")
├── created_by: FK → User
├── created_at: timestamp
```

#### MealPlan
```
MealPlan
├── id: UUID
├── household_id: FK → Household
├── recipe_id: FK → Recipe
├── planned_date: date
├── meal_type: "breakfast" | "lunch" | "dinner" | "snack"
├── servings: int (default 2)
├── status: "planned" | "cooked" | "skipped"
├── is_leftover_source: boolean
├── leftover_from_id: FK → MealPlan (nullable)
├── cooked_at: timestamp (nullable)
├── actual_cost: decimal (nullable, calculated after cooking)
├── cost_per_serving: decimal (nullable)
├── created_at, updated_at: timestamp
```

#### Leftover
```
Leftover
├── id: UUID
├── household_id: FK → Household
├── meal_plan_id: FK → MealPlan (source)
├── recipe_id: FK → Recipe
├── remaining_servings: int
├── created_at: timestamp
├── expires_at: timestamp
├── status: "available" | "consumed" | "discarded"
```

#### ShoppingList
```
ShoppingList
├── id: UUID
├── household_id: FK → Household
├── name: string
├── date_range_start: date
├── date_range_end: date
├── status: "active" | "completed" | "archived"
├── created_at, updated_at: timestamp
```

#### ShoppingListItem
```
ShoppingListItem
├── id: UUID
├── shopping_list_id: FK → ShoppingList
├── ingredient_id: FK → Ingredient
├── required_quantity: decimal
├── required_unit: string (canonical)
├── on_hand_quantity: decimal (snapshot)
├── to_buy_quantity: decimal
├── is_checked: boolean
├── actual_quantity: decimal (nullable)
├── notes: string (nullable)
├── source_meal_plans: UUID[]
```

#### UnitConversion
```
UnitConversion
├── id: UUID
├── from_unit: string
├── to_unit: string
├── factor: decimal
├── ingredient_id: FK → Ingredient (nullable, for ingredient-specific conversions)
```

### Modified Existing Entities

#### Receipt (extended)
```
Receipt
├── + household_id: FK → Household
├── + inventory_status: "pending" | "reviewed" | "skipped"
```

#### Item (receipt line, extended)
```
Item
├── + ingredient_id: FK → Ingredient (nullable)
├── + ingredient_confidence: decimal (0.0-1.0)
├── + inventory_lot_id: FK → InventoryLot (nullable)
├── + skip_inventory: boolean
```

---

## Core Flows

### Receipt → Inventory Flow

1. **OCR + Parse** (existing)
2. **Ingredient Mapping** (new):
   - Exact/fuzzy match against `Ingredient.aliases`
   - LLM fallback for Norwegian normalization
   - Store `ingredient_id` and `ingredient_confidence`
3. **Review Screen**:
   - Show items with suggested mappings
   - Flag low-confidence (< 0.7) for manual review
   - User sets location, expiry, or skips
4. **Inventory Creation**:
   - Create `InventoryLot` + initial `InventoryEvent`
   - Link `Item.inventory_lot_id`

### Recipe Import Flow

1. User pastes URL
2. Server fetches and cleans HTML
3. LLM extracts: name, servings, ingredients, instructions
4. Match ingredients to canonical `Ingredient` table
5. User reviews and edits before save
6. Create `Recipe` + `RecipeIngredients`

### Shopping List Generation Flow

1. User selects date range
2. Find all `MealPlans` in range (status: planned)
3. For each: multiply `RecipeIngredients` by servings ratio
4. Aggregate by ingredient, convert to canonical units
5. Query current inventory per ingredient
6. Calculate `to_buy = max(0, required - on_hand)`
7. Create `ShoppingList` + `ShoppingListItems`

### Cook Flow

1. User opens planned meal, clicks "Cook"
2. Show required ingredients × servings
3. Show inventory consumption preview (FIFO lots)
4. User confirms or adjusts actual usage
5. Create `InventoryEvents` (consume)
6. Update `MealPlan.status = "cooked"`
7. Calculate and store `actual_cost`, `cost_per_serving`
8. If `is_leftover_source`: create `Leftover`

### Cost Calculation (FIFO)

When consuming ingredients:
1. Order lots by `purchase_date` ASC
2. Consume from oldest first
3. Record: `consumed_qty × lot.unit_cost`
4. Sum all ingredient costs = meal cost

---

## API Structure

### New Endpoints

```
# Households
POST   /api/households
GET    /api/households/current
POST   /api/households/invite

# Ingredients
GET    /api/ingredients                    # List with search
POST   /api/ingredients                    # Create canonical
GET    /api/ingredients/{id}
PUT    /api/ingredients/{id}

# Recipes
POST   /api/recipes/import                 # URL import
POST   /api/recipes                        # Manual create
GET    /api/recipes                        # List (search, tags)
GET    /api/recipes/{id}
PUT    /api/recipes/{id}
DELETE /api/recipes/{id}

# Inventory
GET    /api/inventory                      # Aggregated view
GET    /api/inventory/lots                 # All lots
POST   /api/inventory/lots                 # Manual add
GET    /api/inventory/lots/{id}
PUT    /api/inventory/lots/{id}
POST   /api/inventory/lots/{id}/consume
POST   /api/inventory/lots/{id}/discard
POST   /api/inventory/lots/{id}/transfer

# Meal Plans
GET    /api/meal-plans                     # Calendar range
POST   /api/meal-plans
GET    /api/meal-plans/{id}
PUT    /api/meal-plans/{id}
DELETE /api/meal-plans/{id}
POST   /api/meal-plans/{id}/cook

# Shopping Lists
POST   /api/shopping-lists/generate
GET    /api/shopping-lists
GET    /api/shopping-lists/{id}
PUT    /api/shopping-lists/{id}
PUT    /api/shopping-lists/{id}/items/{item_id}

# Extended Analytics
GET    /api/analytics/cost-per-meal
GET    /api/analytics/waste
GET    /api/analytics/spend-trend
GET    /api/analytics/restock-predictions
```

---

## Frontend Structure

### New Pages

```
frontend/src/app/[locale]/
├── recipes/
│   ├── page.tsx                # Library with search/filter
│   ├── [id]/page.tsx           # Detail view
│   ├── import/page.tsx         # URL import
│   └── new/page.tsx            # Manual creation
├── plan/
│   └── page.tsx                # Weekly calendar
├── inventory/
│   └── page.tsx                # Pantry view
├── shopping/
│   └── page.tsx                # Shopping list
└── settings/
    └── page.tsx                # Household management
```

### New Components

```
components/
├── recipes/
│   ├── RecipeCard.tsx
│   ├── RecipeForm.tsx
│   ├── IngredientInput.tsx
│   └── ImportReview.tsx
├── plan/
│   ├── WeekCalendar.tsx
│   ├── MealSlot.tsx
│   └── CookModal.tsx
├── inventory/
│   ├── InventoryGrid.tsx
│   ├── LotCard.tsx
│   └── AddStockModal.tsx
├── shopping/
│   ├── ShoppingListView.tsx
│   └── ShoppingItem.tsx
└── receipt/
    └── InventoryReviewModal.tsx
```

---

## Backend Services

### New Services

```
backend/src/services/
├── ingredient_matcher.py      # Raw name → canonical ingredient
├── recipe_importer.py         # URL → structured recipe
├── shopping_generator.py      # Meal plans → shopping list
├── unit_converter.py          # Canonical unit conversion
├── cost_calculator.py         # FIFO cost allocation
├── restock_predictor.py       # Runout predictions
```

### ingredient_matcher.py

```python
class IngredientMatcher:
    async def match(self, raw_name: str) -> MatchResult:
        # 1. Exact match on canonical_name
        # 2. Fuzzy match on aliases (Levenshtein distance)
        # 3. LLM fallback for Norwegian normalization
        return MatchResult(ingredient_id, confidence, method)
```

### unit_converter.py

```python
class UnitConverter:
    def to_canonical(self, qty: Decimal, unit: str) -> tuple[Decimal, str]:
        # Standard conversions:
        # "cup" → "ml" (×240)
        # "tbsp" → "ml" (×15)
        # "tsp" → "ml" (×5)
        # "oz" → "g" (×28.35)
        # "stk" → "pcs" (×1)
        # "dl" → "ml" (×100)
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Database migrations: Household, Ingredient, Receipt/Item extensions
- [ ] Household API + context
- [ ] Ingredient table with Norwegian seed data
- [ ] Unit conversion table and service
- [ ] Extend receipt upload: ingredient mapping + review screen

### Phase 2: Inventory (Week 3)
- [ ] InventoryLot and InventoryEvent models
- [ ] Inventory API (CRUD, consume, discard, transfer)
- [ ] Inventory UI: location tabs, lot cards
- [ ] Receipt review → inventory lot creation

### Phase 3: Recipes (Week 4)
- [ ] Recipe and RecipeIngredient models
- [ ] Recipe import service (LLM)
- [ ] Recipe API (CRUD, import)
- [ ] Recipe UI: library, detail, import, manual creation

### Phase 4: Meal Planning (Week 5)
- [ ] MealPlan and Leftover models
- [ ] Meal plan API (CRUD, cook)
- [ ] Calendar UI with drag-drop
- [ ] Cook flow with inventory consumption

### Phase 5: Shopping List (Week 6)
- [ ] ShoppingList models
- [ ] Generation service
- [ ] Shopping list API
- [ ] Shopping UI with "already have" section

### Phase 6: Analytics & Polish (Week 7)
- [ ] Cost-per-meal calculation
- [ ] Waste tracking
- [ ] Restock predictions
- [ ] Extended analytics UI
- [ ] Testing and fixes

---

## Acceptance Criteria

1. **Shopping list accuracy:** Planning 7 dinners for 2 produces correct aggregated list with normalized units
2. **Inventory decrement:** Cooking a meal decrements inventory and creates leftovers if enabled
3. **Receipt integration:** Scanning a receipt adds items to inventory with review for low-confidence items
4. **Restock alerts:** "Need to buy" triggers when item is below required quantity for planned meals
5. **Spend accuracy:** Monthly spend matches sum of receipts within acceptable OCR error margin

---

## Future Scope (v2)

- Pack size suggestions
- Store grouping in shopping list
- Planning assistant ("plan under X NOK")
- Anomaly detection in spend
- Offline support (PWA)
- Owner/editor/viewer roles
- "Who consumed what" tracking
- Barcode scanning for inventory
- E-receipt email import
