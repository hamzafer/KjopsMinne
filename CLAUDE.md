# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kvitteringshvelv ("Receipt Vault") is a Norwegian receipt digitization and grocery analytics application. Users upload receipt images, which are processed via OCR to extract items, auto-categorize them into Norwegian grocery categories, and provide spending analytics.

## Commands

```bash
# Start all services (postgres, backend, frontend)
make dev           # Runs docker-compose up -d, shows URLs

# Run migrations and seed data
cd backend && uv run alembic upgrade head
cd backend && uv run python -m src.db.seed

# Run tests
cd backend && uv run pytest
cd frontend && npm test

# Lint and format
cd backend && uv run ruff check .
cd backend && uv run ruff format .
cd frontend && npm run lint
cd frontend && npm run format

# Local development (outside Docker)
cd backend && uv run uvicorn src.main:app --reload
cd frontend && npm run dev
```

## Development Workflow

Use these skills when developing new features:

| Task Type | Skill | When to Use |
|-----------|-------|-------------|
| New feature | `brainstorming` | Before writing any code - clarify requirements |
| Implementation | `writing-plans` | After brainstorming, before coding |
| Frontend work | `frontend-design` | UI components, pages, styling |
| Bug fixing | `systematic-debugging` | Before proposing fixes |
| Testing | `test-driven-development` | Write tests before implementation |
| Finishing | `verification-before-completion` | Before claiming work is done |
| Code review | `requesting-code-review` | After completing features |
| Git workflow | `using-git-worktrees` | Isolate feature work from main |
| Complex tasks | `dispatching-parallel-agents` | 2+ independent subtasks |

**Key rule**: When in doubt, invoke the skill. Skills provide structure that prevents wasted effort.

## Architecture

### Data Flow: Receipt Upload
1. `POST /api/receipts/upload` receives image → `upload.py`
2. OCRService (`mock_ocr.py` or `textract_ocr.py`) extracts text
3. `parser.py` converts OCR output → `ParsedReceipt` with Norwegian name normalization
4. `categorizer.py` matches items to categories via keyword lookup
5. Receipt + Items saved to PostgreSQL with category associations

### Backend Structure (`backend/src/`)
- **api/deps.py**: FastAPI dependency injection for `DbSession` and `OCRServiceDep`
- **services/ocr.py**: Abstract `OCRService` protocol - swap implementations via `USE_MOCK_OCR` env var
- **services/parser.py**: Norwegian receipt parsing (handles PANT/deposits, RABATT/discounts, date formats, abbreviations)
- **services/categorizer.py**: `CATEGORY_KEYWORDS` dict maps Norwegian grocery terms → 12 categories
- **db/models.py**: SQLAlchemy 2.0 async models (Receipt, Item, Category) with UUID primary keys

### Frontend Structure (`frontend/src/`)
- **lib/api.ts**: Typed API client with `Receipt`, `Item`, `Category` interfaces
- **app/**: Next.js 15 App Router pages (dashboard, upload, receipts, analytics)
- Uses Recharts for analytics visualizations

### Key Patterns
- All database operations are async (SQLAlchemy + asyncpg)
- Alembic migrations in `backend/alembic/versions/`
- OCR is pluggable: `MockOCRService` returns fixture data, `TextractOCRService` for production
- Norwegian-first: NOK currency, nb-NO date formatting, Norwegian category names

## Environment Variables

```bash
DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/kvitteringshvelv
USE_MOCK_OCR=true              # Set false to use AWS Textract
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Norwegian Domain Context

- **Pant**: Bottle/can deposit (handled as special item type)
- **Rabatt**: Discount (negative price line items)
- **Categories**: Meieri (dairy), Kjøtt (meat), Fisk (fish), Brød (bread), Frukt (fruit), Grønnsaker (vegetables), Drikke (beverages), Tørrvarer (dry goods), Frossen (frozen), Husholdning (household), Snacks, Pant
