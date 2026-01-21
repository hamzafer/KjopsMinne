# Database Schema

PostgreSQL 16 with SQLAlchemy 2.0 async ORM.

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              households                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ id               UUID PRIMARY KEY                                            │
│ name             TEXT NOT NULL                                               │
│ created_at       TIMESTAMP DEFAULT NOW()                                     │
└──────────────────────────┬──────────────────────────────────────────────────┘
                           │
           ┌───────────────┼───────────────────────────────────┐
           │ 1:N           │ 1:N                               │ 1:N
           ▼               ▼                                   ▼
┌──────────────────┐ ┌──────────────────┐            ┌──────────────────┐
│      users       │ │     receipts     │            │     recipes      │
├──────────────────┤ ├──────────────────┤            ├──────────────────┤
│ id          UUID │ │ id          UUID │            │ id          UUID │
│ household_id UUID│ │ household_id UUID│            │ household_id UUID│
│ email       TEXT │ │ merchant    TEXT │            │ name        TEXT │
│ name        TEXT │ │ total      DEC   │            │ servings    INT  │
│ role        TEXT │ │ purchase_date TS │            │ instructions TEXT│
└──────────────────┘ └────────┬─────────┘            └────────┬─────────┘
                              │ 1:N                           │ 1:N
                              ▼                               ▼
                     ┌──────────────────┐            ┌──────────────────────┐
                     │      items       │            │  recipe_ingredients  │
                     ├──────────────────┤            ├──────────────────────┤
                     │ id          UUID │            │ id            UUID   │
                     │ receipt_id  UUID │            │ recipe_id     UUID   │
                     │ raw_name    TEXT │            │ ingredient_id UUID   │
                     │ total_price DEC  │            │ raw_text      TEXT   │
                     │ category_id UUID │◄──────┐    │ quantity      DEC    │
                     │ ingredient_id UUID│      │    │ unit          TEXT   │
                     └────────┬─────────┘      │    └──────────────────────┘
                              │ N:1            │
                              ▼                │
                     ┌──────────────────┐      │
                     │    categories    │      │
                     ├──────────────────┤      │
                     │ id          UUID │      │
                     │ name        TEXT │      │
                     │ icon        TEXT │      │
                     │ color       TEXT │      │
                     └──────────────────┘      │
                                               │
┌──────────────────────────────────────────────┼──────────────────────────────┐
│                           ingredients        │                               │
├──────────────────────────────────────────────┴──────────────────────────────┤
│ id               UUID PRIMARY KEY                                            │
│ name             TEXT NOT NULL                                               │
│ canonical_name   TEXT NOT NULL UNIQUE                                        │
│ default_unit     TEXT DEFAULT 'g'                                            │
│ aliases          JSONB DEFAULT '[]'                                          │
│ category_id      UUID REFERENCES categories(id)                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                          inventory_lots                                       │
├──────────────────────────────────────────────────────────────────────────────┤
│ id               UUID PRIMARY KEY                                             │
│ household_id     UUID REFERENCES households(id)                               │
│ ingredient_id    UUID REFERENCES ingredients(id)                              │
│ quantity         DECIMAL(10,3) NOT NULL                                       │
│ unit             TEXT NOT NULL (g, ml, pcs)                                   │
│ location         TEXT DEFAULT 'pantry' (pantry|fridge|freezer)               │
│ purchase_date    TIMESTAMP NOT NULL                                           │
│ expiry_date      TIMESTAMP                                                    │
│ unit_cost        DECIMAL(10,2) NOT NULL                                       │
│ total_cost       DECIMAL(10,2) NOT NULL                                       │
│ currency         TEXT DEFAULT 'NOK'                                           │
│ confidence       DECIMAL(3,2) DEFAULT 1.0                                     │
│ source_type      TEXT NOT NULL (receipt|manual|barcode)                       │
│ source_id        UUID                                                         │
└──────────────────────────┬───────────────────────────────────────────────────┘
                           │ 1:N
                           ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                          inventory_events                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│ id               UUID PRIMARY KEY                                             │
│ lot_id           UUID REFERENCES inventory_lots(id)                           │
│ event_type       TEXT NOT NULL (add|consume|adjust|discard|transfer)          │
│ quantity_delta   DECIMAL(10,3) NOT NULL                                       │
│ unit             TEXT NOT NULL                                                │
│ reason           TEXT                                                         │
│ created_by       UUID REFERENCES users(id)                                    │
│ created_at       TIMESTAMP DEFAULT NOW()                                      │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                            meal_plans                                         │
├──────────────────────────────────────────────────────────────────────────────┤
│ id               UUID PRIMARY KEY                                             │
│ household_id     UUID REFERENCES households(id)                               │
│ recipe_id        UUID REFERENCES recipes(id)                                  │
│ planned_date     TIMESTAMP NOT NULL                                           │
│ meal_type        TEXT NOT NULL (breakfast|lunch|dinner|snack)                 │
│ servings         INT DEFAULT 2                                                │
│ status           TEXT DEFAULT 'planned' (planned|cooked|skipped)              │
│ is_leftover_source BOOLEAN DEFAULT FALSE                                      │
│ leftover_from_id UUID REFERENCES meal_plans(id)                               │
│ cooked_at        TIMESTAMP                                                    │
│ actual_cost      DECIMAL(10,2)                                                │
│ cost_per_serving DECIMAL(10,2)                                                │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                             leftovers                                         │
├──────────────────────────────────────────────────────────────────────────────┤
│ id               UUID PRIMARY KEY                                             │
│ household_id     UUID REFERENCES households(id)                               │
│ meal_plan_id     UUID REFERENCES meal_plans(id)                               │
│ recipe_id        UUID REFERENCES recipes(id)                                  │
│ remaining_servings INT NOT NULL                                               │
│ status           TEXT DEFAULT 'available' (available|consumed|discarded)      │
│ created_at       TIMESTAMP DEFAULT NOW()                                      │
│ expires_at       TIMESTAMP NOT NULL                                           │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                          shopping_lists                                       │
├──────────────────────────────────────────────────────────────────────────────┤
│ id               UUID PRIMARY KEY                                             │
│ household_id     UUID REFERENCES households(id)                               │
│ name             TEXT NOT NULL                                                │
│ date_range_start TIMESTAMP NOT NULL                                           │
│ date_range_end   TIMESTAMP NOT NULL                                           │
│ status           TEXT DEFAULT 'active' (active|completed|archived)            │
│ created_at       TIMESTAMP DEFAULT NOW()                                      │
│ updated_at       TIMESTAMP DEFAULT NOW()                                      │
└──────────────────────────┬───────────────────────────────────────────────────┘
                           │ 1:N
                           ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                       shopping_list_items                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│ id               UUID PRIMARY KEY                                             │
│ shopping_list_id UUID REFERENCES shopping_lists(id)                           │
│ ingredient_id    UUID REFERENCES ingredients(id)                              │
│ required_quantity DECIMAL(10,3) NOT NULL                                      │
│ required_unit    TEXT NOT NULL                                                │
│ on_hand_quantity DECIMAL(10,3) DEFAULT 0                                      │
│ to_buy_quantity  DECIMAL(10,3) NOT NULL                                       │
│ is_checked       BOOLEAN DEFAULT FALSE                                        │
│ actual_quantity  DECIMAL(10,3)                                                │
│ notes            TEXT                                                         │
│ source_meal_plans UUID[] DEFAULT '{}'                                         │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                         unit_conversions                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│ id               UUID PRIMARY KEY                                             │
│ from_unit        TEXT NOT NULL                                                │
│ to_unit          TEXT NOT NULL                                                │
│ factor           DECIMAL(10,6) NOT NULL                                       │
│ ingredient_id    UUID REFERENCES ingredients(id) -- NULL = generic conversion│
└──────────────────────────────────────────────────────────────────────────────┘
```

## Tables

### households

Stores household information for multi-user support.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key (gen_random_uuid) |
| `name` | TEXT | No | Household name |
| `created_at` | TIMESTAMP | No | Record creation time |

### users

Stores user accounts linked to households.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `email` | TEXT | No | Unique email address |
| `name` | TEXT | No | User's display name |
| `household_id` | UUID | No | FK to households |
| `role` | TEXT | No | "owner" or "member" |
| `created_at` | TIMESTAMP | No | Record creation time |

**Indexes**:
- `idx_users_household` on `household_id`

### receipts

Stores receipt metadata and OCR output.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key (gen_random_uuid) |
| `household_id` | UUID | Yes | FK to households |
| `inventory_status` | TEXT | No | pending/reviewed/skipped |
| `merchant_name` | TEXT | No | Store name (e.g., "REMA 1000") |
| `store_location` | TEXT | Yes | Store address |
| `purchase_date` | TIMESTAMP | No | When purchase was made |
| `total_amount` | DECIMAL(10,2) | No | Total in NOK |
| `currency` | TEXT | No | Always "NOK" |
| `payment_method` | TEXT | Yes | Visa, Vipps, etc. |
| `warranty_months` | INT | Yes | For warranty tracking |
| `return_window_days` | INT | Yes | For return tracking |
| `image_path` | TEXT | Yes | Path to receipt image |
| `raw_ocr` | JSONB | Yes | Raw OCR output for debugging |
| `created_at` | TIMESTAMP | No | Record creation time |
| `updated_at` | TIMESTAMP | No | Last update time |

**Indexes**:
- `idx_receipts_date` on `purchase_date DESC`

### items

Line items from receipts.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `receipt_id` | UUID | No | FK to receipts (CASCADE delete) |
| `raw_name` | TEXT | No | OCR-extracted name |
| `canonical_name` | TEXT | Yes | Normalized name |
| `quantity` | DECIMAL(10,3) | Yes | Item quantity |
| `unit` | TEXT | Yes | Unit (kg, stk, l) |
| `unit_price` | DECIMAL(10,2) | Yes | Price per unit |
| `total_price` | DECIMAL(10,2) | No | Line total |
| `category_id` | UUID | Yes | FK to categories |
| `is_pant` | BOOLEAN | No | Is bottle deposit |
| `discount_amount` | DECIMAL(10,2) | No | Discount applied |
| `ingredient_id` | UUID | Yes | FK to ingredients |
| `ingredient_confidence` | DECIMAL(3,2) | Yes | Match confidence 0.00-1.00 |
| `inventory_lot_id` | UUID | Yes | FK to created inventory lot |
| `skip_inventory` | BOOLEAN | No | Skip inventory tracking |

**Indexes**:
- `idx_items_receipt` on `receipt_id`
- `idx_items_category` on `category_id`
- `idx_items_ingredient` on `ingredient_id`

### categories

Predefined grocery categories.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `name` | TEXT | No | Unique category name |
| `icon` | TEXT | Yes | Icon identifier |
| `color` | TEXT | Yes | Hex color for UI |

**Seed data** (12 categories):

| Name | Norwegian | Icon | Color |
|------|-----------|------|-------|
| Meieri | Dairy | milk | #E3F2FD |
| Kjøtt | Meat | beef | #FFEBEE |
| Fisk | Fish | fish | #E0F7FA |
| Brød | Bread | bread | #FFF3E0 |
| Frukt | Fruit | apple | #F3E5F5 |
| Grønnsaker | Vegetables | carrot | #E8F5E9 |
| Drikke | Beverages | glass | #FCE4EC |
| Tørrvarer | Dry goods | wheat | #FFFDE7 |
| Frossen | Frozen | snowflake | #E8EAF6 |
| Husholdning | Household | home | #EFEBE9 |
| Snacks | Snacks | cookie | #FBE9E7 |
| Pant | Deposits | recycle | #E0F2F1 |

### ingredients

Master ingredient table for matching receipt items and recipe ingredients.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `name` | TEXT | No | Display name |
| `canonical_name` | TEXT | No | Unique lowercase name |
| `default_unit` | TEXT | No | Default unit (g, ml, pcs) |
| `aliases` | JSONB | No | Alternative names array |
| `category_id` | UUID | Yes | FK to categories |
| `created_at` | TIMESTAMP | No | Record creation time |

**Indexes**:
- `idx_ingredients_canonical` on `canonical_name`
- `idx_ingredients_category` on `category_id`

### unit_conversions

Unit conversion factors, optionally ingredient-specific.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `from_unit` | TEXT | No | Source unit |
| `to_unit` | TEXT | No | Target unit |
| `factor` | DECIMAL(10,6) | No | Multiplication factor |
| `ingredient_id` | UUID | Yes | FK to ingredients (NULL = generic) |

**Indexes**:
- `idx_unit_conversions_from` on `from_unit`
- `idx_unit_conversions_ingredient` on `ingredient_id`

### recipes

Stores recipes imported from URLs or created manually.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `household_id` | UUID | No | FK to households |
| `name` | TEXT | No | Recipe name |
| `source_url` | TEXT | Yes | Original recipe URL |
| `servings` | INT | No | Default servings (default: 2) |
| `prep_time_minutes` | INT | Yes | Preparation time |
| `cook_time_minutes` | INT | Yes | Cooking time |
| `instructions` | TEXT | No | Cooking instructions |
| `tags` | JSONB | No | Recipe tags array |
| `image_url` | TEXT | Yes | Recipe image URL |
| `import_confidence` | DECIMAL(3,2) | Yes | LLM parsing confidence |
| `created_at` | TIMESTAMP | No | Record creation time |
| `updated_at` | TIMESTAMP | No | Last update time |

**Indexes**:
- `idx_recipes_household` on `household_id`
- `idx_recipes_name` on `name`

### recipe_ingredients

Links recipes to ingredients with quantities.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `recipe_id` | UUID | No | FK to recipes (CASCADE delete) |
| `ingredient_id` | UUID | Yes | FK to ingredients |
| `raw_text` | TEXT | No | Original ingredient text |
| `quantity` | DECIMAL(10,3) | Yes | Parsed quantity |
| `unit` | TEXT | Yes | Parsed unit |
| `notes` | TEXT | Yes | Preparation notes (e.g., "finely chopped") |

**Indexes**:
- `idx_recipe_ingredients_recipe` on `recipe_id`
- `idx_recipe_ingredients_ingredient` on `ingredient_id`

### meal_plans

Planned meals linked to recipes.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `household_id` | UUID | No | FK to households |
| `recipe_id` | UUID | No | FK to recipes |
| `planned_date` | TIMESTAMP | No | Planned date/time |
| `meal_type` | TEXT | No | breakfast/lunch/dinner/snack |
| `servings` | INT | No | Planned servings (default: 2) |
| `status` | TEXT | No | planned/cooked/skipped |
| `is_leftover_source` | BOOLEAN | No | Has associated leftovers |
| `leftover_from_id` | UUID | Yes | FK to meal_plans (self-ref) |
| `cooked_at` | TIMESTAMP | Yes | Actual cooking time |
| `actual_cost` | DECIMAL(10,2) | Yes | Calculated total cost |
| `cost_per_serving` | DECIMAL(10,2) | Yes | Cost per serving |
| `created_at` | TIMESTAMP | No | Record creation time |
| `updated_at` | TIMESTAMP | No | Last update time |

**Indexes**:
- `idx_meal_plans_household` on `household_id`
- `idx_meal_plans_date` on `planned_date`
- `idx_meal_plans_recipe` on `recipe_id`

### leftovers

Tracks leftover portions from cooked meals.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `household_id` | UUID | No | FK to households |
| `meal_plan_id` | UUID | No | FK to meal_plans |
| `recipe_id` | UUID | No | FK to recipes |
| `remaining_servings` | INT | No | Servings remaining |
| `status` | TEXT | No | available/consumed/discarded |
| `created_at` | TIMESTAMP | No | Record creation time |
| `expires_at` | TIMESTAMP | No | Expiry date (3 days default) |

**Indexes**:
- `idx_leftovers_household` on `household_id`
- `idx_leftovers_status` on `status`
- `idx_leftovers_expires` on `expires_at`

### inventory_lots

Tracks individual inventory batches with cost and expiry.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `household_id` | UUID | No | FK to households |
| `ingredient_id` | UUID | No | FK to ingredients |
| `quantity` | DECIMAL(10,3) | No | Current quantity |
| `unit` | TEXT | No | Unit (g, ml, pcs) |
| `location` | TEXT | No | pantry/fridge/freezer |
| `purchase_date` | TIMESTAMP | No | Purchase date (FIFO ordering) |
| `expiry_date` | TIMESTAMP | Yes | Expiration date |
| `unit_cost` | DECIMAL(10,2) | No | Cost per unit |
| `total_cost` | DECIMAL(10,2) | No | Total cost paid |
| `currency` | TEXT | No | Currency (NOK) |
| `confidence` | DECIMAL(3,2) | No | Match confidence |
| `source_type` | TEXT | No | receipt/manual/barcode |
| `source_id` | UUID | Yes | Reference to source (e.g., receipt_id) |
| `created_at` | TIMESTAMP | No | Record creation time |
| `updated_at` | TIMESTAMP | No | Last update time |

**Indexes**:
- `idx_inventory_lots_household` on `household_id`
- `idx_inventory_lots_ingredient` on `ingredient_id`
- `idx_inventory_lots_location` on `location`
- `idx_inventory_lots_purchase_date` on `purchase_date`

### inventory_events

Audit log for all inventory changes (FIFO cost tracking).

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `lot_id` | UUID | No | FK to inventory_lots |
| `event_type` | TEXT | No | add/consume/adjust/discard/transfer |
| `quantity_delta` | DECIMAL(10,3) | No | Change amount (negative for consumption) |
| `unit` | TEXT | No | Unit |
| `reason` | TEXT | Yes | Event reason (e.g., "cooked:meal_plan:uuid") |
| `created_by` | UUID | Yes | FK to users |
| `created_at` | TIMESTAMP | No | Event timestamp |

**Indexes**:
- `idx_inventory_events_lot` on `lot_id`
- `idx_inventory_events_type` on `event_type`
- `idx_inventory_events_created` on `created_at`

### shopping_lists

Generated shopping lists from meal plans.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `household_id` | UUID | No | FK to households |
| `name` | TEXT | No | List name (e.g., "Uke 4") |
| `date_range_start` | TIMESTAMP | No | Period start |
| `date_range_end` | TIMESTAMP | No | Period end |
| `status` | TEXT | No | active/completed/archived |
| `created_at` | TIMESTAMP | No | Record creation time |
| `updated_at` | TIMESTAMP | No | Last update time |

**Indexes**:
- `idx_shopping_lists_household` on `household_id`
- `idx_shopping_lists_status` on `status`
- `idx_shopping_lists_date_range` on `date_range_start, date_range_end`

### shopping_list_items

Items in shopping lists with inventory comparison.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `shopping_list_id` | UUID | No | FK to shopping_lists |
| `ingredient_id` | UUID | No | FK to ingredients |
| `required_quantity` | DECIMAL(10,3) | No | Total needed for meals |
| `required_unit` | TEXT | No | Unit |
| `on_hand_quantity` | DECIMAL(10,3) | No | Already in inventory |
| `to_buy_quantity` | DECIMAL(10,3) | No | Amount to purchase |
| `is_checked` | BOOLEAN | No | Checked off |
| `actual_quantity` | DECIMAL(10,3) | Yes | Actually purchased |
| `notes` | TEXT | Yes | User notes |
| `source_meal_plans` | UUID[] | No | Contributing meal plan IDs |

**Indexes**:
- `idx_shopping_list_items_list` on `shopping_list_id`
- `idx_shopping_list_items_ingredient` on `ingredient_id`
- `idx_shopping_list_items_checked` on `is_checked`

## Migrations

Managed with Alembic in `backend/alembic/versions/`.

```bash
# Create new migration
cd backend && uv run alembic revision --autogenerate -m "description"

# Apply migrations
cd backend && uv run alembic upgrade head

# Rollback one step
cd backend && uv run alembic downgrade -1
```

## SQLAlchemy Models

Located in `backend/src/db/models.py`:

```python
class Household(Base):
    __tablename__ = "households"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True)
    users: Mapped[list["User"]] = relationship(back_populates="household")
    receipts: Mapped[list["Receipt"]] = relationship(back_populates="household")

class User(Base):
    __tablename__ = "users"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True)
    household: Mapped["Household"] = relationship(back_populates="users")

class Ingredient(Base):
    __tablename__ = "ingredients"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True)
    aliases: Mapped[list[str]] = mapped_column(JSONB, default=list)

class Recipe(Base):
    __tablename__ = "recipes"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True)
    ingredients: Mapped[list["RecipeIngredient"]] = relationship(
        back_populates="recipe", cascade="all, delete-orphan"
    )

class MealPlan(Base):
    __tablename__ = "meal_plans"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True)
    recipe: Mapped["Recipe"] = relationship()
    leftover_from: Mapped["MealPlan | None"] = relationship(remote_side=[id])

class InventoryLot(Base):
    __tablename__ = "inventory_lots"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True)
    events: Mapped[list["InventoryEvent"]] = relationship(back_populates="lot")

class ShoppingList(Base):
    __tablename__ = "shopping_lists"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True)
    items: Mapped[list["ShoppingListItem"]] = relationship(
        back_populates="shopping_list", cascade="all, delete-orphan"
    )
```

## Connection

Async connection via asyncpg:

```python
# backend/src/db/engine.py
from sqlalchemy.ext.asyncio import create_async_engine

engine = create_async_engine(
    "postgresql+asyncpg://user:pass@host:5432/db",
    echo=False,
    pool_size=5,
)
```
