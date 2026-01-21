# Data Flow

## Receipt Upload Flow

```
User uploads image
        │
        ▼
┌───────────────────────────────────────────────────────────────────┐
│  POST /api/receipts/upload                                        │
│  (multipart/form-data)                                            │
└───────────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────────┐
│  upload.py                                                        │
│  - Validates file type (JPG, PNG, WebP, HEIC)                    │
│  - Saves image (future: S3)                                       │
│  - Calls OCR service                                              │
└───────────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────────┐
│  OCR Service (ocr.py)                                             │
│  ┌─────────────────────┐    ┌─────────────────────┐             │
│  │  MockOCRService     │ OR │  TextractOCRService │             │
│  │  (USE_MOCK_OCR=true)│    │  (USE_MOCK_OCR=false)│             │
│  │  Returns fixtures   │    │  Calls AWS Textract  │             │
│  └─────────────────────┘    └─────────────────────┘             │
└───────────────────────────────────────────────────────────────────┘
        │
        │ Raw OCR text/blocks
        ▼
┌───────────────────────────────────────────────────────────────────┐
│  parser.py                                                        │
│  - Extracts merchant name, date, total                           │
│  - Parses line items (name, quantity, price)                     │
│  - Norwegian normalization:                                       │
│    - Abbreviations (TINE LETTML → Tine Lettmelk)                │
│    - PANT handling (bottle deposits)                             │
│    - RABATT handling (discounts)                                 │
│    - Date formats (dd.mm.yyyy)                                   │
│  - Returns ParsedReceipt                                         │
└───────────────────────────────────────────────────────────────────┘
        │
        │ ParsedReceipt
        ▼
┌───────────────────────────────────────────────────────────────────┐
│  categorizer.py                                                   │
│  - Matches item names against CATEGORY_KEYWORDS                   │
│  - Keywords are Norwegian grocery terms                          │
│  - Returns category_id for each item                             │
│                                                                   │
│  Example mappings:                                                │
│  - "melk", "ost", "yoghurt" → Meieri                            │
│  - "kylling", "svin", "lam" → Kjøtt                             │
│  - "cola", "juice", "vann" → Drikke                              │
└───────────────────────────────────────────────────────────────────┘
        │
        │ Categorized items
        ▼
┌───────────────────────────────────────────────────────────────────┐
│  Database (SQLAlchemy async)                                      │
│  1. Create Receipt record                                         │
│  2. Create Item records (with category_id)                       │
│  3. Store raw_ocr as JSONB                                       │
│  4. Commit transaction                                           │
└───────────────────────────────────────────────────────────────────┘
        │
        │ Receipt with items
        ▼
┌───────────────────────────────────────────────────────────────────┐
│  Response: 201 Created                                            │
│  {                                                                │
│    "id": "uuid",                                                  │
│    "merchant_name": "REMA 1000",                                 │
│    "items": [...]                                                 │
│  }                                                                │
└───────────────────────────────────────────────────────────────────┘
```

## Recipe Import Flow

```
User provides recipe URL
        │
        ▼
┌───────────────────────────────────────────────────────────────────┐
│  POST /api/recipes/import                                         │
│  { "url": "https://matprat.no/...", "household_id": "..." }      │
└───────────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────────┐
│  RecipeImporter Service                                           │
│  1. Fetch HTML from URL                                          │
│  2. Parse HTML for recipe structured data                        │
│  3. Send to LLM for extraction:                                  │
│     - Recipe name, servings, times                               │
│     - Ingredients with quantities and units                      │
│     - Instructions                                               │
│     - Tags                                                       │
│  4. Match ingredients to existing ingredient records             │
│  5. Return confidence score                                      │
└───────────────────────────────────────────────────────────────────┘
        │
        │ Parsed recipe data
        ▼
┌───────────────────────────────────────────────────────────────────┐
│  Database                                                         │
│  1. Create Recipe record                                         │
│  2. Create RecipeIngredient records                              │
│     - Link to Ingredient if matched                              │
│     - Store raw_text for unmatched                               │
└───────────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────────┐
│  Response: 201 Created                                            │
│  {                                                                │
│    "recipe": { ... },                                            │
│    "confidence": 0.85                                            │
│  }                                                                │
└───────────────────────────────────────────────────────────────────┘
```

## Meal Plan → Shopping List Generation Flow

```
User requests shopping list for date range
        │
        ▼
┌───────────────────────────────────────────────────────────────────┐
│  POST /api/shopping-lists/generate                                │
│  {                                                                │
│    "household_id": "...",                                        │
│    "start_date": "2024-01-22",                                   │
│    "end_date": "2024-01-28",                                     │
│    "name": "Uke 4"                                               │
│  }                                                                │
└───────────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────────┐
│  Query MealPlans for date range                                   │
│  - Status = "planned"                                            │
│  - Load Recipe and RecipeIngredients                             │
└───────────────────────────────────────────────────────────────────┘
        │
        │ List of planned meals with ingredients
        ▼
┌───────────────────────────────────────────────────────────────────┐
│  ShoppingGenerator Service                                        │
│  1. Aggregate ingredients across all meals                       │
│     - Scale quantities by servings (meal vs recipe)              │
│     - Group by ingredient_id                                     │
│     - Sum quantities                                             │
│                                                                   │
│  Example:                                                         │
│    Meal 1 (4 servings): 400g chicken                            │
│    Meal 2 (2 servings): 200g chicken                            │
│    → Aggregated: 600g chicken                                    │
└───────────────────────────────────────────────────────────────────┘
        │
        │ Aggregated ingredient requirements
        ▼
┌───────────────────────────────────────────────────────────────────┐
│  Check Current Inventory                                          │
│  For each ingredient:                                            │
│  1. Query InventoryLots where quantity > 0                       │
│  2. Sum total on-hand quantity                                   │
│  3. Calculate to_buy = required - on_hand                        │
│                                                                   │
│  Example:                                                         │
│    Required: 600g chicken                                        │
│    On hand: 200g chicken                                         │
│    → To buy: 400g chicken                                        │
└───────────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────────┐
│  Create ShoppingList + ShoppingListItems                          │
│  - Link source_meal_plans for traceability                       │
│  - Store on_hand vs required for UI                              │
└───────────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────────┐
│  Response: 201 Created                                            │
│  {                                                                │
│    "shopping_list": { "items": [...] },                          │
│    "meal_plans_included": 7,                                     │
│    "ingredients_aggregated": 15                                  │
│  }                                                                │
└───────────────────────────────────────────────────────────────────┘
```

## Inventory Tracking Flow (FIFO)

```
Inventory Sources:
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  Receipt Upload  │  │  Manual Entry    │  │  Barcode Scan    │
│  (auto-match)    │  │  (user input)    │  │  (future)        │
└────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘
         │                     │                     │
         └──────────────┬──────┴─────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────────────────────────┐
│  Create InventoryLot                                              │
│  {                                                                │
│    ingredient_id, quantity, unit,                                │
│    location: "pantry" | "fridge" | "freezer",                    │
│    purchase_date,    ← Used for FIFO ordering                    │
│    expiry_date,                                                  │
│    unit_cost,        ← For cost tracking                         │
│    total_cost,                                                   │
│    source_type: "receipt" | "manual" | "barcode"                 │
│  }                                                                │
└───────────────────────────────────────────────────────────────────┘
        │
        │ Create "add" event
        ▼
┌───────────────────────────────────────────────────────────────────┐
│  InventoryEvent (audit log)                                       │
│  { event_type: "add", quantity_delta: +500, reason: "initial" }  │
└───────────────────────────────────────────────────────────────────┘

Consumption (cooking a meal):
┌───────────────────────────────────────────────────────────────────┐
│  POST /api/meal-plans/{id}/cook                                   │
│  { actual_servings: 4 }                                          │
└───────────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────────┐
│  MealPlanService.calculate_required_ingredients()                 │
│  - Get recipe ingredients                                        │
│  - Scale by servings (planned vs recipe default)                 │
└───────────────────────────────────────────────────────────────────┘
        │
        │ Required ingredients list
        ▼
┌───────────────────────────────────────────────────────────────────┐
│  FIFO Consumption                                                 │
│  For each ingredient:                                            │
│  1. Get lots ordered by purchase_date ASC (oldest first)         │
│  2. Consume from oldest lot until depleted or satisfied          │
│  3. Move to next lot if needed                                   │
│  4. Track cost from each lot consumed                            │
│                                                                   │
│  Example (need 600g chicken):                                    │
│    Lot A (2024-01-10): 200g @ 0.10/g → consume 200g = 20 NOK    │
│    Lot B (2024-01-15): 500g @ 0.12/g → consume 400g = 48 NOK    │
│    Total cost: 68 NOK                                            │
└───────────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────────┐
│  Create InventoryEvents for each consumption                      │
│  { event_type: "consume", quantity_delta: -200,                  │
│    reason: "cooked:meal_plan:UUID" }                             │
│                                                                   │
│  Update InventoryLot.quantity                                    │
│  Update MealPlan: actual_cost, cost_per_serving                  │
└───────────────────────────────────────────────────────────────────┘
```

## Cost Calculation Flow

```
┌───────────────────────────────────────────────────────────────────┐
│  MealPlanService.calculate_cost_fifo()                            │
│                                                                   │
│  Input:                                                          │
│    - lots: [{ id, quantity, unit_cost, purchase_date }, ...]    │
│    - required_quantity: 600                                      │
│                                                                   │
│  Algorithm:                                                       │
│    total_cost = 0                                                │
│    remaining = required_quantity                                 │
│    consumed = []                                                 │
│                                                                   │
│    for lot in sorted(lots, by=purchase_date):                   │
│        if remaining <= 0: break                                  │
│        take = min(lot.quantity, remaining)                       │
│        cost = take * lot.unit_cost                               │
│        total_cost += cost                                        │
│        remaining -= take                                         │
│        consumed.append({ lot_id, quantity: take, cost })        │
│                                                                   │
│  Output:                                                          │
│    { total_cost: 68.00, consumed: [...] }                       │
└───────────────────────────────────────────────────────────────────┘
```

## Analytics Query Flow

```
User views Analytics page
        │
        ▼
┌───────────────────────────────────────────────────────────────────┐
│  Frontend: /analytics                                             │
│  - Calls api.getAnalyticsSummary()                               │
│  - Calls api.getAnalyticsByCategory()                            │
│  - Calls api.getCostPerMeal()                                    │
│  - Calls api.getWaste()                                          │
│  - Calls api.getSpendTrend()                                     │
│  - Calls api.getRestockPredictions()                             │
└───────────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────────┐
│  GET /api/analytics/summary                                       │
│  - Aggregates: COUNT(receipts), SUM(total), AVG(total)           │
│                                                                   │
│  GET /api/analytics/by-category                                   │
│  - Joins items → categories                                      │
│  - Groups by category_id                                          │
│  - Aggregates: SUM(total_price), COUNT(items)                    │
│                                                                   │
│  GET /api/analytics/cost-per-meal                                │
│  - Queries cooked MealPlans                                      │
│  - Returns actual_cost, cost_per_serving                         │
│                                                                   │
│  GET /api/analytics/waste                                        │
│  - Queries discard InventoryEvents                               │
│  - Queries discarded Leftovers                                   │
│  - Calculates total waste value                                  │
│                                                                   │
│  GET /api/analytics/restock-predictions                          │
│  - Analyzes consumption events (last 30 days)                    │
│  - Calculates average daily usage                                │
│  - Predicts runout dates                                         │
└───────────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────────┐
│  Frontend: Charts & Tables                                        │
│  - Bar chart: Spending by category                               │
│  - Line chart: Spending trends                                   │
│  - Table: Cost per meal breakdown                                │
│  - Alerts: Items running low                                     │
└───────────────────────────────────────────────────────────────────┘
```

## i18n Flow

```
User visits /                         User visits /en/analytics
        │                                      │
        ▼                                      ▼
┌─────────────────────┐             ┌─────────────────────┐
│  middleware.ts      │             │  middleware.ts      │
│  - No locale prefix │             │  - Has locale "en"  │
│  - Redirect → /nb   │             │  - Pass through     │
└─────────────────────┘             └─────────────────────┘
        │                                      │
        ▼                                      ▼
┌─────────────────────┐             ┌─────────────────────┐
│  /nb (default)      │             │  /en/analytics      │
│  - Load nb.json     │             │  - Load en.json     │
│  - Norwegian UI     │             │  - English UI       │
└─────────────────────┘             └─────────────────────┘
```

## File Locations

| Component | Location |
|-----------|----------|
| Upload endpoint | `backend/src/api/upload.py` |
| OCR protocol | `backend/src/services/ocr.py` |
| Mock OCR | `backend/src/services/mock_ocr.py` |
| Parser | `backend/src/services/parser.py` |
| Categorizer | `backend/src/services/categorizer.py` |
| Recipe importer | `backend/src/services/recipe_importer.py` |
| Shopping generator | `backend/src/services/shopping_generator.py` |
| Meal plan service | `backend/src/services/meal_plan_service.py` |
| Restock predictor | `backend/src/services/restock_predictor.py` |
| Database models | `backend/src/db/models.py` |
| API client | `frontend/src/lib/api.ts` |
| i18n middleware | `frontend/src/middleware.ts` |
| Translations | `frontend/src/messages/{nb,en}.json` |
