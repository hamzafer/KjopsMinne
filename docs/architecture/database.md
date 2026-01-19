# Database Schema

PostgreSQL 16 with SQLAlchemy 2.0 async ORM.

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          receipts                                │
├─────────────────────────────────────────────────────────────────┤
│ id               UUID PRIMARY KEY                                │
│ merchant_name    TEXT NOT NULL                                   │
│ store_location   TEXT                                            │
│ purchase_date    TIMESTAMP NOT NULL                              │
│ total_amount     DECIMAL(10,2) NOT NULL                          │
│ currency         TEXT DEFAULT 'NOK'                              │
│ payment_method   TEXT                                            │
│ warranty_months  INT                                             │
│ return_window_days INT                                           │
│ image_path       TEXT                                            │
│ raw_ocr          JSONB                                           │
│ created_at       TIMESTAMP DEFAULT NOW()                         │
│ updated_at       TIMESTAMP DEFAULT NOW()                         │
└──────────────────────────┬──────────────────────────────────────┘
                           │ 1:N
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                           items                                  │
├─────────────────────────────────────────────────────────────────┤
│ id               UUID PRIMARY KEY                                │
│ receipt_id       UUID REFERENCES receipts(id) ON DELETE CASCADE  │
│ raw_name         TEXT NOT NULL                                   │
│ canonical_name   TEXT                                            │
│ quantity         DECIMAL(10,3)                                   │
│ unit             TEXT                                            │
│ unit_price       DECIMAL(10,2)                                   │
│ total_price      DECIMAL(10,2) NOT NULL                          │
│ category_id      UUID REFERENCES categories(id)                  │
│ is_pant          BOOLEAN DEFAULT FALSE                           │
│ discount_amount  DECIMAL(10,2) DEFAULT 0                         │
└──────────────────────────┬──────────────────────────────────────┘
                           │ N:1
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                        categories                                │
├─────────────────────────────────────────────────────────────────┤
│ id               UUID PRIMARY KEY                                │
│ name             TEXT NOT NULL UNIQUE                            │
│ icon             TEXT                                            │
│ color            TEXT                                            │
└─────────────────────────────────────────────────────────────────┘
```

## Tables

### receipts

Stores receipt metadata and OCR output.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key (gen_random_uuid) |
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

**Indexes**:
- `idx_items_receipt` on `receipt_id`
- `idx_items_category` on `category_id`

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
class Receipt(Base):
    __tablename__ = "receipts"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True)
    items: Mapped[list["Item"]] = relationship(back_populates="receipt")
    # ...

class Item(Base):
    __tablename__ = "items"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True)
    receipt: Mapped["Receipt"] = relationship(back_populates="items")
    category: Mapped["Category"] = relationship()
    # ...

class Category(Base):
    __tablename__ = "categories"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True)
    # ...
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
