# Kvitteringshvelv 🧾

Norwegian Receipt Vault with grocery intelligence for households.

## Overview

Kvitteringshvelv ("Receipt Vault" in Norwegian) is a full-stack application for digitizing, storing, and analyzing grocery receipts. Upload a receipt image, and the system extracts items, categorizes them, and provides spending analytics.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python 3.12+, Pydantic v2 |
| Database | PostgreSQL 16, SQLAlchemy 2.0 (async) |
| Migrations | Alembic |
| OCR | Mock (swappable to AWS Textract) |
| Containers | Docker, docker-compose |
| Package Mgmt | uv (Python), npm (Node) |

## Project Structure

```
kvitteringshvelv/
├── Makefile              # Task runner
├── mise.toml             # Tool versions
├── docker-compose.yml    # Services: db, backend, frontend
├── .env.example
│
├── backend/
│   ├── pyproject.toml
│   ├── alembic/          # Database migrations
│   └── src/
│       ├── main.py       # FastAPI app
│       ├── config.py     # Settings
│       ├── db/           # Models, engine, session
│       ├── api/          # Route handlers
│       ├── services/     # OCR, parser, categorizer
│       └── schemas/      # Pydantic models
│
└── frontend/
    ├── package.json
    └── src/
        ├── app/          # Next.js pages
        ├── components/   # React components
        └── lib/          # API client, utilities
```

## Quick Start

```bash
# Start all services
docker-compose up -d

# Run database migrations
docker-compose exec backend uv run alembic upgrade head

# Seed categories
docker-compose exec backend uv run python -m src.db.seed

# Access the app
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/receipts/upload` | Upload receipt image |
| GET | `/api/receipts` | List all receipts |
| GET | `/api/receipts/{id}` | Get receipt details |
| DELETE | `/api/receipts/{id}` | Delete a receipt |
| GET | `/api/categories` | List categories |
| GET | `/api/analytics/summary` | Spending summary |
| GET | `/api/analytics/by-category` | Spending by category |

## Categories

Norwegian grocery categories with emoji icons:

| Category | Icon | Description |
|----------|------|-------------|
| Meieri | 🥛 | Dairy products |
| Kjøtt | 🥩 | Meat |
| Fisk | 🐟 | Fish & seafood |
| Brød | 🍞 | Bread & bakery |
| Frukt | 🍎 | Fruits |
| Grønnsaker | 🥬 | Vegetables |
| Drikke | 🥤 | Beverages |
| Tørrvarer | 🌾 | Dry goods |
| Frossen | ❄️ | Frozen foods |
| Husholdning | 🧹 | Household items |
| Snacks | 🍿 | Snacks & candy |
| Pant | ♻️ | Bottle deposits |

## Development

```bash
# Install dependencies locally
cd backend && uv sync
cd frontend && npm install

# Run backend locally
cd backend && uv run uvicorn src.main:app --reload

# Run frontend locally
cd frontend && npm run dev

# Run tests
make test

# Format code
make fmt

# Lint code
make lint
```

## Frontend Design

The UI follows a **Nordic Paper Journal** aesthetic:
- Typography: Fraunces (display) + DM Sans (body)
- Colors: Warm cream background, fjord blue accents, forest green for success
- Effects: Paper textures, soft shadows, staggered animations

## License

MIT
