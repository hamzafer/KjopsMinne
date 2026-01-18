# Implementation Plan

Original specification and implementation plan for Kvitteringshvelv.

## Database Schema

```sql
CREATE TABLE receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_name TEXT NOT NULL,
    store_location TEXT,
    purchase_date TIMESTAMP NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'NOK',
    payment_method TEXT,
    warranty_months INT,
    return_window_days INT,
    image_path TEXT,
    raw_ocr JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    icon TEXT,
    color TEXT
);

CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id UUID REFERENCES receipts(id) ON DELETE CASCADE,
    raw_name TEXT NOT NULL,
    canonical_name TEXT,
    quantity DECIMAL(10,3),
    unit TEXT,
    unit_price DECIMAL(10,2),
    total_price DECIMAL(10,2) NOT NULL,
    category_id UUID REFERENCES categories(id),
    is_pant BOOLEAN DEFAULT FALSE,
    discount_amount DECIMAL(10,2) DEFAULT 0
);

CREATE INDEX idx_receipts_date ON receipts(purchase_date DESC);
CREATE INDEX idx_items_receipt ON items(receipt_id);
CREATE INDEX idx_items_category ON items(category_id);
```

## Implementation Steps

### 1. Project Scaffolding ✅
- [x] Create directory structure
- [x] `mise.toml` with Python 3.12, Node 20
- [x] `Makefile` with dev, test, lint, migrate, up/down targets
- [x] `docker-compose.yml` with postgres, backend, frontend
- [x] `.env.example`

### 2. Backend Setup ✅
- [x] `pyproject.toml` with fastapi, uvicorn, sqlalchemy, alembic, pydantic
- [x] `uv lock && uv sync`
- [x] FastAPI app skeleton with health check
- [x] SQLAlchemy async engine + session factory
- [x] Alembic init + initial migration

### 3. Core API ✅
- [x] POST /api/receipts/upload (multipart/form-data)
- [x] GET /api/receipts
- [x] GET /api/receipts/{id}
- [x] DELETE /api/receipts/{id}
- [x] GET /api/analytics/summary
- [x] GET /api/analytics/by-category
- [x] GET /api/categories

### 4. OCR Service ✅
- [x] OCR protocol (ABC)
- [x] MockOCR implementation with Norwegian receipt fixtures
- [x] Parser: extract merchant, date, total, line items
- [x] Norwegian normalizer (abbreviations, pant, rabatt)
- [x] Auto-categorizer (keyword matching)

### 5. Frontend ✅
- [x] Next.js 15 + Tailwind + shadcn
- [x] API client (typed fetch wrapper)
- [x] Dashboard (recent receipts, month total)
- [x] Upload page (drag-drop, camera)
- [x] Receipt list + detail view
- [x] Analytics charts (Recharts)

### 6. Polish (Future)
- [ ] Warranty/return tracker
- [ ] Search by item name
- [ ] Unit price trends

## Makefile Targets

```makefile
dev     # Start docker-compose and show URLs
up      # docker-compose up -d
down    # docker-compose down
migrate # Run alembic upgrade head
seed    # Seed categories
test    # Run pytest and npm test
lint    # Run ruff and eslint
fmt     # Format with ruff and prettier
install # Install all dependencies
clean   # Remove volumes and node_modules
```

## Docker Compose Services

| Service | Image | Ports | Purpose |
|---------|-------|-------|---------|
| db | postgres:16-alpine | 5432 | PostgreSQL database |
| backend | ./backend | 8000 | FastAPI server |
| frontend | ./frontend | 3000 | Next.js dev server |

## Environment Variables

```bash
DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/kvitteringshvelv
USE_MOCK_OCR=true
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Verification Checklist

1. ✅ `make up` → all containers healthy
2. ✅ `curl http://localhost:8000/health` → `{"status": "ok"}`
3. ✅ Upload receipt image → mock OCR returns parsed data
4. ✅ View receipt in frontend → items displayed with categories
5. ✅ Analytics page → spending breakdown renders
