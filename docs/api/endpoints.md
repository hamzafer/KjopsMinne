# API Endpoint Reference

## Health Check

### `GET /health`

Check API health status.

**Response**: `200 OK`
```json
{
  "status": "ok"
}
```

---

## Receipts

### `POST /api/receipts/upload`

Upload a receipt image for OCR processing.

**Request**: `multipart/form-data`
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | Image file (JPG, PNG, WebP, HEIC) |

**Response**: `201 Created`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "merchant_name": "REMA 1000",
  "store_location": "Storgata 1, Oslo",
  "purchase_date": "2024-01-15T14:30:00",
  "total_amount": "259.80",
  "currency": "NOK",
  "payment_method": "Visa",
  "warranty_months": null,
  "return_window_days": null,
  "items": [
    {
      "id": "...",
      "raw_name": "TINE LETTMELK 1L",
      "canonical_name": "Tine Lettmelk",
      "quantity": 1.0,
      "unit": null,
      "unit_price": "18.90",
      "total_price": "18.90",
      "category": {
        "id": "...",
        "name": "Meieri",
        "icon": "milk",
        "color": "#E3F2FD"
      },
      "is_pant": false,
      "discount_amount": "0.00"
    }
  ],
  "created_at": "2024-01-15T14:35:00",
  "updated_at": "2024-01-15T14:35:00"
}
```

---

### `GET /api/receipts`

List all receipts, ordered by purchase date (newest first).

**Response**: `200 OK`
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "merchant_name": "REMA 1000",
    "store_location": "Storgata 1, Oslo",
    "purchase_date": "2024-01-15T14:30:00",
    "total_amount": "259.80",
    "currency": "NOK",
    "payment_method": "Visa",
    "item_count": 10,
    "created_at": "2024-01-15T14:35:00"
  }
]
```

---

### `GET /api/receipts/{id}`

Get a single receipt with all items.

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `id` | UUID | Receipt ID |

**Response**: `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "merchant_name": "REMA 1000",
  "store_location": "Storgata 1, Oslo",
  "purchase_date": "2024-01-15T14:30:00",
  "total_amount": "259.80",
  "currency": "NOK",
  "payment_method": "Visa",
  "warranty_months": null,
  "return_window_days": null,
  "raw_ocr": { /* OCR output */ },
  "items": [ /* array of items */ ],
  "created_at": "2024-01-15T14:35:00",
  "updated_at": "2024-01-15T14:35:00"
}
```

**Error**: `404 Not Found`
```json
{
  "detail": "Receipt not found"
}
```

---

### `DELETE /api/receipts/{id}`

Delete a receipt and all associated items.

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `id` | UUID | Receipt ID |

**Response**: `200 OK`
```json
{
  "message": "Receipt deleted"
}
```

---

## Categories

### `GET /api/categories`

List all item categories.

**Response**: `200 OK`
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Meieri",
    "icon": "milk",
    "color": "#E3F2FD"
  },
  {
    "id": "...",
    "name": "Kjøtt",
    "icon": "beef",
    "color": "#FFEBEE"
  }
]
```

**Categories**:
| Name | Norwegian | Icon | Description |
|------|-----------|------|-------------|
| Meieri | Dairy | milk | Milk, cheese, yogurt |
| Kjøtt | Meat | beef | Meat products |
| Fisk | Fish | fish | Fish and seafood |
| Brød | Bread | bread | Bread and bakery |
| Frukt | Fruit | apple | Fresh fruits |
| Grønnsaker | Vegetables | carrot | Fresh vegetables |
| Drikke | Beverages | glass | Drinks, juice, soda |
| Tørrvarer | Dry goods | wheat | Pasta, rice, cereals |
| Frossen | Frozen | snowflake | Frozen foods |
| Husholdning | Household | home | Cleaning, paper goods |
| Snacks | Snacks | cookie | Chips, candy, snacks |
| Pant | Deposits | recycle | Bottle/can deposits |

---

## Households

### `POST /api/households`

Create a new household with an owner.

**Request**:
```json
{
  "household": {
    "name": "Familie Hansen"
  },
  "owner": {
    "email": "ola@example.com",
    "name": "Ola Nordmann"
  }
}
```

**Response**: `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Familie Hansen",
  "created_at": "2024-01-15T14:00:00",
  "users": [
    {
      "id": "...",
      "email": "ola@example.com",
      "name": "Ola Nordmann",
      "role": "owner",
      "created_at": "2024-01-15T14:00:00"
    }
  ]
}
```

---

### `GET /api/households/{household_id}`

Get a household with its users.

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `household_id` | UUID | Household ID |

**Response**: `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Familie Hansen",
  "created_at": "2024-01-15T14:00:00",
  "users": [...]
}
```

---

### `POST /api/households/{household_id}/members`

Add a member to a household.

**Request**:
```json
{
  "email": "kari@example.com",
  "name": "Kari Nordmann"
}
```

**Response**: `200 OK`
```json
{
  "id": "...",
  "email": "kari@example.com",
  "name": "Kari Nordmann",
  "household_id": "550e8400-e29b-41d4-a716-446655440000",
  "role": "member",
  "created_at": "2024-01-15T14:05:00"
}
```

---

### `GET /api/users/{user_id}`

Get a user by ID.

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `user_id` | UUID | User ID |

**Response**: `200 OK`
```json
{
  "id": "...",
  "email": "ola@example.com",
  "name": "Ola Nordmann",
  "household_id": "550e8400-e29b-41d4-a716-446655440000",
  "role": "owner",
  "created_at": "2024-01-15T14:00:00"
}
```

---

## Ingredients

### `GET /api/ingredients`

List all ingredients with optional filtering.

**Query Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `search` | string | Search by name or alias |
| `category_id` | UUID | Filter by category |
| `skip` | int | Pagination offset (default: 0) |
| `limit` | int | Pagination limit (default: 50) |

**Response**: `200 OK`
```json
[
  {
    "id": "...",
    "name": "Melk",
    "canonical_name": "melk",
    "default_unit": "ml",
    "aliases": ["lettmelk", "helmelk"],
    "category": {
      "id": "...",
      "name": "Meieri",
      "icon": "milk",
      "color": "#E3F2FD"
    },
    "created_at": "2024-01-01T00:00:00"
  }
]
```

---

### `GET /api/ingredients/{ingredient_id}`

Get an ingredient by ID.

**Response**: `200 OK`
```json
{
  "id": "...",
  "name": "Melk",
  "canonical_name": "melk",
  "default_unit": "ml",
  "aliases": ["lettmelk", "helmelk"],
  "category": {...},
  "created_at": "2024-01-01T00:00:00"
}
```

---

### `POST /api/ingredients`

Create a new ingredient.

**Request**:
```json
{
  "name": "Egg",
  "canonical_name": "egg",
  "default_unit": "pcs",
  "aliases": ["eggehvite", "eggeplomme"],
  "category_id": "..."
}
```

**Response**: `200 OK`
```json
{
  "id": "...",
  "name": "Egg",
  "canonical_name": "egg",
  "default_unit": "pcs",
  "aliases": ["eggehvite", "eggeplomme"],
  "category": {...},
  "created_at": "2024-01-15T14:00:00"
}
```

---

### `PUT /api/ingredients/{ingredient_id}`

Update an ingredient.

**Request**:
```json
{
  "name": "Egg",
  "aliases": ["eggehvite", "eggeplomme", "hønsegg"]
}
```

**Response**: `200 OK`
```json
{
  "id": "...",
  "name": "Egg",
  "canonical_name": "egg",
  "default_unit": "pcs",
  "aliases": ["eggehvite", "eggeplomme", "hønsegg"],
  "category": {...},
  "created_at": "2024-01-01T00:00:00"
}
```

---

### `DELETE /api/ingredients/{ingredient_id}`

Delete an ingredient.

**Response**: `200 OK`
```json
{
  "message": "Ingredient deleted"
}
```

---

## Recipes

### `POST /api/recipes/import`

Import a recipe from a URL using LLM parsing.

**Request**:
```json
{
  "url": "https://www.matprat.no/oppskrifter/kylling-tikka-masala/",
  "household_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response**: `201 Created`
```json
{
  "recipe": {
    "id": "...",
    "household_id": "...",
    "name": "Kylling Tikka Masala",
    "source_url": "https://www.matprat.no/oppskrifter/kylling-tikka-masala/",
    "servings": 4,
    "prep_time_minutes": 20,
    "cook_time_minutes": 30,
    "instructions": "1. Marinere kyllingen...",
    "tags": ["indisk", "kylling", "middag"],
    "image_url": "...",
    "import_confidence": "0.85",
    "ingredients": [...],
    "created_at": "2024-01-15T14:00:00",
    "updated_at": "2024-01-15T14:00:00"
  },
  "confidence": "0.85"
}
```

---

### `GET /api/recipes`

List recipes for a household.

**Query Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `household_id` | UUID | Yes | Household ID |
| `page` | int | No | Page number (default: 1) |
| `page_size` | int | No | Results per page (default: 20, max: 100) |
| `search` | string | No | Search by recipe name |

**Response**: `200 OK`
```json
{
  "recipes": [...],
  "total": 25,
  "page": 1,
  "page_size": 20
}
```

---

### `GET /api/recipes/{recipe_id}`

Get a recipe by ID.

**Response**: `200 OK`
```json
{
  "id": "...",
  "household_id": "...",
  "name": "Kylling Tikka Masala",
  "source_url": "...",
  "servings": 4,
  "prep_time_minutes": 20,
  "cook_time_minutes": 30,
  "instructions": "...",
  "tags": ["indisk", "kylling"],
  "image_url": "...",
  "ingredients": [
    {
      "id": "...",
      "raw_text": "400g kyllingbryst",
      "quantity": "400.000",
      "unit": "g",
      "notes": null,
      "ingredient_id": "..."
    }
  ],
  "created_at": "2024-01-15T14:00:00",
  "updated_at": "2024-01-15T14:00:00"
}
```

---

### `POST /api/recipes`

Create a new recipe with ingredients.

**Request**:
```json
{
  "household_id": "...",
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
      "ingredient_id": "..."
    }
  ]
}
```

**Response**: `201 Created`

---

### `PATCH /api/recipes/{recipe_id}`

Update a recipe.

**Request**:
```json
{
  "name": "Pannekaker med syltetøy",
  "tags": ["dessert", "frokost", "barna"]
}
```

**Response**: `200 OK`

---

### `DELETE /api/recipes/{recipe_id}`

Delete a recipe.

**Response**: `204 No Content`

---

## Meal Plans

### `POST /api/meal-plans`

Create a new meal plan.

**Request**:
```json
{
  "household_id": "...",
  "recipe_id": "...",
  "planned_date": "2024-01-20T18:00:00",
  "meal_type": "dinner",
  "servings": 4,
  "is_leftover_source": false,
  "leftover_from_id": null
}
```

**Response**: `201 Created`
```json
{
  "id": "...",
  "household_id": "...",
  "recipe_id": "...",
  "planned_date": "2024-01-20T18:00:00",
  "meal_type": "dinner",
  "servings": 4,
  "status": "planned",
  "is_leftover_source": false,
  "leftover_from_id": null,
  "cooked_at": null,
  "actual_cost": null,
  "cost_per_serving": null,
  "recipe": {...},
  "created_at": "2024-01-15T14:00:00",
  "updated_at": "2024-01-15T14:00:00"
}
```

---

### `GET /api/meal-plans`

List meal plans for a household with optional date filtering.

**Query Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `household_id` | UUID | Yes | Household ID |
| `start_date` | datetime | No | Filter from date |
| `end_date` | datetime | No | Filter to date |
| `status` | string | No | Filter by status (planned/cooked/skipped) |
| `page` | int | No | Page number (default: 1) |
| `page_size` | int | No | Results per page (default: 20) |

**Response**: `200 OK`
```json
{
  "meal_plans": [...],
  "total": 15
}
```

---

### `GET /api/meal-plans/{meal_plan_id}`

Get a meal plan by ID.

**Response**: `200 OK`
```json
{
  "id": "...",
  "household_id": "...",
  "recipe_id": "...",
  "planned_date": "2024-01-20T18:00:00",
  "meal_type": "dinner",
  "servings": 4,
  "status": "planned",
  "recipe": {...}
}
```

---

### `PATCH /api/meal-plans/{meal_plan_id}`

Update a meal plan.

**Request**:
```json
{
  "planned_date": "2024-01-21T18:00:00",
  "servings": 6
}
```

**Response**: `200 OK`

---

### `DELETE /api/meal-plans/{meal_plan_id}`

Delete a meal plan.

**Response**: `204 No Content`

---

### `POST /api/meal-plans/{meal_plan_id}/cook`

Mark a meal as cooked, consume inventory (FIFO), and optionally create leftovers.

**Request**:
```json
{
  "actual_servings": 4,
  "create_leftover": true,
  "leftover_servings": 2
}
```

**Response**: `200 OK`
```json
{
  "meal_plan": {
    "id": "...",
    "status": "cooked",
    "cooked_at": "2024-01-20T18:30:00",
    "actual_cost": "125.50",
    "cost_per_serving": "31.38",
    "is_leftover_source": true,
    "recipe": {...}
  },
  "actual_cost": "125.50",
  "cost_per_serving": "31.38",
  "inventory_consumed": [
    {
      "lot_id": "...",
      "quantity": 400.0,
      "cost": 85.00
    }
  ],
  "leftover": {
    "id": "...",
    "remaining_servings": 2,
    "status": "available",
    "expires_at": "2024-01-23T18:30:00"
  }
}
```

---

## Leftovers

### `GET /api/leftovers`

List leftovers for a household.

**Query Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `household_id` | UUID | Yes | Household ID |
| `status` | string | No | Filter by status (available/consumed/discarded) |
| `page` | int | No | Page number (default: 1) |
| `page_size` | int | No | Results per page (default: 20) |

**Response**: `200 OK`
```json
{
  "leftovers": [
    {
      "id": "...",
      "household_id": "...",
      "meal_plan_id": "...",
      "recipe_id": "...",
      "remaining_servings": 2,
      "status": "available",
      "created_at": "2024-01-20T18:30:00",
      "expires_at": "2024-01-23T18:30:00"
    }
  ],
  "total": 3
}
```

---

### `PATCH /api/leftovers/{leftover_id}`

Update leftover status (consumed/discarded).

**Request**:
```json
{
  "status": "consumed",
  "remaining_servings": 0
}
```

**Response**: `200 OK`
```json
{
  "id": "...",
  "status": "consumed",
  "remaining_servings": 0,
  "expires_at": "2024-01-23T18:30:00"
}
```

---

## Inventory

### `GET /api/inventory`

Get aggregated inventory view by ingredient.

**Query Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `household_id` | UUID | Yes | Household ID |
| `location` | string | No | Filter by location (pantry/fridge/freezer) |

**Response**: `200 OK`
```json
[
  {
    "ingredient_id": "...",
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

---

### `GET /api/inventory/lots`

List all inventory lots for a household.

**Query Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `household_id` | UUID | Yes | Household ID |
| `ingredient_id` | UUID | No | Filter by ingredient |
| `location` | string | No | Filter by location |
| `skip` | int | No | Pagination offset (default: 0) |
| `limit` | int | No | Pagination limit (default: 50) |

**Response**: `200 OK`
```json
[
  {
    "id": "...",
    "household_id": "...",
    "ingredient_id": "...",
    "quantity": "1000.000",
    "unit": "ml",
    "location": "fridge",
    "purchase_date": "2024-01-15T00:00:00",
    "expiry_date": "2024-01-22T00:00:00",
    "unit_cost": "0.02",
    "total_cost": "23.90",
    "currency": "NOK",
    "confidence": "0.95",
    "source_type": "receipt",
    "source_id": "...",
    "ingredient": {...},
    "created_at": "2024-01-15T14:00:00",
    "updated_at": "2024-01-15T14:00:00"
  }
]
```

---

### `GET /api/inventory/lots/{lot_id}`

Get a specific inventory lot.

**Response**: `200 OK`

---

### `POST /api/inventory/lots`

Create a new inventory lot manually.

**Query Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `household_id` | UUID | Yes | Household ID |

**Request**:
```json
{
  "ingredient_id": "...",
  "quantity": "500.000",
  "unit": "g",
  "location": "pantry",
  "purchase_date": "2024-01-15T00:00:00",
  "expiry_date": "2024-06-15T00:00:00",
  "unit_cost": "0.05",
  "total_cost": "25.00",
  "currency": "NOK",
  "confidence": "1.00",
  "source_type": "manual"
}
```

**Response**: `200 OK`

---

### `PUT /api/inventory/lots/{lot_id}`

Update an inventory lot (location, expiry only).

**Request**:
```json
{
  "location": "freezer",
  "expiry_date": "2024-12-15T00:00:00"
}
```

**Response**: `200 OK`

---

### `POST /api/inventory/lots/{lot_id}/consume`

Consume quantity from an inventory lot.

**Request**:
```json
{
  "quantity": "200.000",
  "reason": "used for cooking"
}
```

**Response**: `200 OK`
```json
{
  "id": "...",
  "quantity": "300.000",
  "...": "..."
}
```

**Error**: `400 Bad Request`
```json
{
  "detail": "Insufficient quantity. Available: 100.000, requested: 200.000"
}
```

---

### `POST /api/inventory/lots/{lot_id}/discard`

Discard entire inventory lot (expired, spoiled, etc).

**Request**:
```json
{
  "reason": "expired"
}
```

**Response**: `200 OK`
```json
{
  "id": "...",
  "quantity": "0.000",
  "...": "..."
}
```

---

### `POST /api/inventory/lots/{lot_id}/transfer`

Transfer inventory lot to a different location.

**Request**:
```json
{
  "location": "freezer"
}
```

**Response**: `200 OK`

**Error**: `400 Bad Request`
```json
{
  "detail": "Invalid location. Must be one of: ['pantry', 'fridge', 'freezer']"
}
```

---

### `GET /api/inventory/lots/{lot_id}/events`

Get event history for an inventory lot.

**Query Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `skip` | int | Pagination offset (default: 0) |
| `limit` | int | Pagination limit (default: 50) |

**Response**: `200 OK`
```json
[
  {
    "id": "...",
    "lot_id": "...",
    "event_type": "consume",
    "quantity_delta": "-200.000",
    "unit": "g",
    "reason": "cooked:meal_plan:...",
    "created_by": null,
    "created_at": "2024-01-20T18:30:00"
  },
  {
    "id": "...",
    "lot_id": "...",
    "event_type": "add",
    "quantity_delta": "500.000",
    "unit": "g",
    "reason": "initial",
    "created_by": null,
    "created_at": "2024-01-15T14:00:00"
  }
]
```

---

## Shopping Lists

### `POST /api/shopping-lists/generate`

Generate a shopping list from planned meals.

**Request**:
```json
{
  "household_id": "...",
  "start_date": "2024-01-22T00:00:00",
  "end_date": "2024-01-28T23:59:59",
  "name": "Uke 4"
}
```

**Response**: `201 Created`
```json
{
  "shopping_list": {
    "id": "...",
    "household_id": "...",
    "name": "Uke 4",
    "date_range_start": "2024-01-22T00:00:00",
    "date_range_end": "2024-01-28T23:59:59",
    "status": "active",
    "items": [
      {
        "id": "...",
        "ingredient_id": "...",
        "ingredient_name": "Kyllingbryst",
        "required_quantity": "800.000",
        "required_unit": "g",
        "on_hand_quantity": "200.000",
        "to_buy_quantity": "600.000",
        "is_checked": false,
        "actual_quantity": null,
        "notes": null,
        "source_meal_plans": ["...", "..."]
      }
    ],
    "created_at": "2024-01-21T10:00:00",
    "updated_at": "2024-01-21T10:00:00"
  },
  "meal_plans_included": 7,
  "ingredients_aggregated": 15
}
```

---

### `GET /api/shopping-lists`

List shopping lists for a household.

**Query Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `household_id` | UUID | Yes | Household ID |
| `status` | string | No | Filter by status (active/completed/archived) |
| `page` | int | No | Page number (default: 1) |
| `page_size` | int | No | Results per page (default: 20) |

**Response**: `200 OK`
```json
{
  "shopping_lists": [...],
  "total": 5
}
```

---

### `GET /api/shopping-lists/{shopping_list_id}`

Get a shopping list by ID.

**Response**: `200 OK`

---

### `PATCH /api/shopping-lists/{shopping_list_id}`

Update a shopping list.

**Request**:
```json
{
  "name": "Uke 4 - Oppdatert",
  "status": "completed"
}
```

**Response**: `200 OK`

---

### `PATCH /api/shopping-lists/{shopping_list_id}/items/{item_id}`

Update a shopping list item (check off, add notes, set actual quantity).

**Request**:
```json
{
  "is_checked": true,
  "actual_quantity": "650.000",
  "notes": "Kun 650g tilgjengelig"
}
```

**Response**: `200 OK`
```json
{
  "id": "...",
  "ingredient_id": "...",
  "ingredient_name": "Kyllingbryst",
  "required_quantity": "600.000",
  "required_unit": "g",
  "on_hand_quantity": "200.000",
  "to_buy_quantity": "600.000",
  "is_checked": true,
  "actual_quantity": "650.000",
  "notes": "Kun 650g tilgjengelig",
  "source_meal_plans": [...]
}
```

---

### `DELETE /api/shopping-lists/{shopping_list_id}`

Delete a shopping list and all its items.

**Response**: `204 No Content`

---

## Admin

### `POST /api/admin/seed-demo`

Seed database with demo data. Requires `X-Admin-Key` header.

**Headers**:
| Name | Value |
|------|-------|
| `X-Admin-Key` | Admin API key |

**Query Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `clear_first` | bool | Clear existing data first (default: true) |

**Response**: `200 OK`
```json
{
  "status": "ok",
  "message": "Demo data seeded"
}
```

**Error**: `403 Forbidden`
```json
{
  "detail": "Invalid admin key"
}
```

---

## Analytics

### `GET /api/analytics/summary`

Get overall spending summary.

**Query Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `start_date` | datetime | Filter from date |
| `end_date` | datetime | Filter to date |

**Response**: `200 OK`
```json
{
  "total_receipts": 25,
  "total_spent": "4523.50",
  "total_items": 187,
  "avg_receipt_amount": "180.94",
  "period_start": "2024-01-01T00:00:00",
  "period_end": "2024-01-15T23:59:59"
}
```

---

### `GET /api/analytics/by-category`

Get spending breakdown by category.

**Query Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `start_date` | datetime | Filter from date |
| `end_date` | datetime | Filter to date |

**Response**: `200 OK`
```json
{
  "categories": [
    {
      "category_name": "Meieri",
      "category_color": "#E3F2FD",
      "total_spent": "1245.60",
      "item_count": 45
    },
    {
      "category_name": "Kjøtt",
      "category_color": "#FFEBEE",
      "total_spent": "892.30",
      "item_count": 18
    }
  ],
  "uncategorized_total": "125.00",
  "uncategorized_count": 5
}
```

---

### `GET /api/analytics/cost-per-meal`

Get cost analytics for cooked meals.

**Query Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `household_id` | UUID | Yes | Household ID |
| `start_date` | datetime | No | Filter from date |
| `end_date` | datetime | No | Filter to date |

**Response**: `200 OK`
```json
{
  "meals": [
    {
      "meal_plan_id": "...",
      "recipe_name": "Kylling Tikka Masala",
      "planned_date": "2024-01-20T18:00:00",
      "servings": 4,
      "actual_cost": "125.50",
      "cost_per_serving": "31.38"
    }
  ],
  "total_meals": 10,
  "total_cost": "1255.00",
  "average_cost_per_meal": "125.50",
  "average_cost_per_serving": "31.38",
  "period_start": "2024-01-01T00:00:00",
  "period_end": "2024-01-20T23:59:59"
}
```

---

### `GET /api/analytics/waste`

Get waste analytics including discarded inventory and leftovers.

**Query Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `household_id` | UUID | Yes | Household ID |
| `start_date` | datetime | No | Filter from date |
| `end_date` | datetime | No | Filter to date |

**Response**: `200 OK`
```json
{
  "inventory_discards": [
    {
      "date": "2024-01-18T10:00:00",
      "ingredient_name": "Melk",
      "quantity": "500.000",
      "unit": "ml",
      "reason": "expired",
      "estimated_value": "12.50"
    }
  ],
  "leftover_discards": [
    {
      "leftover_id": "...",
      "recipe_name": "Pasta Bolognese",
      "servings_wasted": 2,
      "created_at": "2024-01-15T18:30:00",
      "discarded_at": null
    }
  ],
  "total_inventory_waste_value": "45.50",
  "total_leftover_servings_wasted": 4,
  "period_start": "2024-01-01T00:00:00",
  "period_end": "2024-01-20T23:59:59"
}
```

---

### `GET /api/analytics/spend-trend`

Get spending trends over time.

**Query Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `household_id` | UUID | Yes | Household ID |
| `start_date` | datetime | Yes | Start of period |
| `end_date` | datetime | Yes | End of period |
| `granularity` | string | No | daily/weekly/monthly (default: weekly) |

**Response**: `200 OK`
```json
{
  "trends": [
    {
      "period": "2024-W01",
      "total_spent": "850.00",
      "receipt_count": 3,
      "meal_count": 5,
      "meal_cost": "425.00"
    },
    {
      "period": "2024-W02",
      "total_spent": "720.00",
      "receipt_count": 2,
      "meal_count": 7,
      "meal_cost": "560.00"
    }
  ],
  "granularity": "weekly",
  "period_start": "2024-01-01T00:00:00",
  "period_end": "2024-01-31T23:59:59"
}
```

---

### `GET /api/analytics/restock-predictions`

Get restock predictions for inventory items based on consumption patterns.

**Query Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `household_id` | UUID | Yes | Household ID |

**Response**: `200 OK`
```json
{
  "predictions": [
    {
      "ingredient_id": "...",
      "ingredient_name": "Melk",
      "current_quantity": "1500.000",
      "unit": "ml",
      "average_daily_usage": "250.000",
      "days_until_empty": 6,
      "predicted_runout_date": "2024-01-26T00:00:00",
      "recommended_restock_date": "2024-01-24T00:00:00"
    },
    {
      "ingredient_id": "...",
      "ingredient_name": "Smør",
      "current_quantity": "200.000",
      "unit": "g",
      "average_daily_usage": "15.000",
      "days_until_empty": 13,
      "predicted_runout_date": "2024-02-02T00:00:00",
      "recommended_restock_date": "2024-01-31T00:00:00"
    }
  ],
  "household_id": "...",
  "generated_at": "2024-01-20T10:00:00"
}
```

---

## Data Types

### Receipt

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique identifier |
| `household_id` | UUID | Household reference |
| `merchant_name` | string | Store name |
| `store_location` | string? | Store address |
| `purchase_date` | datetime | Purchase timestamp |
| `total_amount` | decimal | Total in NOK |
| `currency` | string | Always "NOK" |
| `payment_method` | string? | Visa, Vipps, etc. |
| `warranty_months` | int? | Warranty period |
| `return_window_days` | int? | Return period |
| `inventory_status` | string | pending/reviewed/skipped |
| `image_path` | string? | Path to receipt image |
| `raw_ocr` | object? | Raw OCR output |
| `items` | Item[] | Line items |
| `created_at` | datetime | Created timestamp |
| `updated_at` | datetime | Updated timestamp |

### Item

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique identifier |
| `raw_name` | string | OCR-extracted name |
| `canonical_name` | string? | Normalized name |
| `quantity` | decimal? | Quantity (e.g., 2.5) |
| `unit` | string? | Unit (kg, stk, etc.) |
| `unit_price` | decimal? | Price per unit |
| `total_price` | decimal | Line total |
| `category` | Category? | Category object |
| `is_pant` | boolean | Is deposit item |
| `discount_amount` | decimal | Discount applied |
| `ingredient_id` | UUID? | Matched ingredient |
| `ingredient_confidence` | decimal? | Match confidence 0.00-1.00 |
| `inventory_lot_id` | UUID? | Created inventory lot |
| `skip_inventory` | boolean | Skip inventory tracking |

### Category

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique identifier |
| `name` | string | Category name |
| `icon` | string? | Icon identifier |
| `color` | string? | Hex color code |

### Household

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique identifier |
| `name` | string | Household name |
| `created_at` | datetime | Created timestamp |
| `users` | User[] | Household members |

### User

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique identifier |
| `email` | string | Unique email |
| `name` | string | Display name |
| `household_id` | UUID | Household reference |
| `role` | string | owner/member |
| `created_at` | datetime | Created timestamp |

### Ingredient

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique identifier |
| `name` | string | Display name |
| `canonical_name` | string | Unique canonical name |
| `default_unit` | string | Default unit (g, ml, pcs) |
| `aliases` | string[] | Alternative names |
| `category_id` | UUID? | Category reference |
| `created_at` | datetime | Created timestamp |

### Recipe

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique identifier |
| `household_id` | UUID | Household reference |
| `name` | string | Recipe name |
| `source_url` | string? | Source URL |
| `servings` | int | Number of servings |
| `prep_time_minutes` | int? | Preparation time |
| `cook_time_minutes` | int? | Cooking time |
| `instructions` | string | Cooking instructions |
| `tags` | string[] | Recipe tags |
| `image_url` | string? | Image URL |
| `import_confidence` | decimal? | Import confidence |
| `ingredients` | RecipeIngredient[] | Ingredients |
| `created_at` | datetime | Created timestamp |
| `updated_at` | datetime | Updated timestamp |

### MealPlan

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique identifier |
| `household_id` | UUID | Household reference |
| `recipe_id` | UUID | Recipe reference |
| `planned_date` | datetime | Planned date/time |
| `meal_type` | string | breakfast/lunch/dinner/snack |
| `servings` | int | Planned servings |
| `status` | string | planned/cooked/skipped |
| `is_leftover_source` | boolean | Has leftovers |
| `leftover_from_id` | UUID? | Original meal if using leftovers |
| `cooked_at` | datetime? | When cooked |
| `actual_cost` | decimal? | Total cost |
| `cost_per_serving` | decimal? | Cost per serving |
| `created_at` | datetime | Created timestamp |
| `updated_at` | datetime | Updated timestamp |

### Leftover

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique identifier |
| `household_id` | UUID | Household reference |
| `meal_plan_id` | UUID | Source meal plan |
| `recipe_id` | UUID | Recipe reference |
| `remaining_servings` | int | Servings left |
| `status` | string | available/consumed/discarded |
| `created_at` | datetime | Created timestamp |
| `expires_at` | datetime | Expiry date (3 days default) |

### InventoryLot

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique identifier |
| `household_id` | UUID | Household reference |
| `ingredient_id` | UUID | Ingredient reference |
| `quantity` | decimal | Current quantity |
| `unit` | string | Unit (g, ml, pcs) |
| `location` | string | pantry/fridge/freezer |
| `purchase_date` | datetime | Purchase date |
| `expiry_date` | datetime? | Expiry date |
| `unit_cost` | decimal | Cost per unit |
| `total_cost` | decimal | Total cost |
| `currency` | string | Currency (NOK) |
| `confidence` | decimal | Match confidence |
| `source_type` | string | receipt/manual/barcode |
| `source_id` | UUID? | Source reference |
| `created_at` | datetime | Created timestamp |
| `updated_at` | datetime | Updated timestamp |

### ShoppingList

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique identifier |
| `household_id` | UUID | Household reference |
| `name` | string | List name |
| `date_range_start` | datetime | Period start |
| `date_range_end` | datetime | Period end |
| `status` | string | active/completed/archived |
| `items` | ShoppingListItem[] | Items |
| `created_at` | datetime | Created timestamp |
| `updated_at` | datetime | Updated timestamp |

### ShoppingListItem

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique identifier |
| `shopping_list_id` | UUID | Shopping list reference |
| `ingredient_id` | UUID | Ingredient reference |
| `required_quantity` | decimal | Required amount |
| `required_unit` | string | Unit |
| `on_hand_quantity` | decimal | Already have |
| `to_buy_quantity` | decimal | Need to buy |
| `is_checked` | boolean | Checked off |
| `actual_quantity` | decimal? | Actual purchased |
| `notes` | string? | Notes |
| `source_meal_plans` | UUID[] | Contributing meal plans |
