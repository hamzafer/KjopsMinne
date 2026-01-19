# Kvitteringshvelv

Norwegian Receipt Vault with grocery intelligence for households.

## Live Demo

| Service | URL |
|---------|-----|
| Frontend | https://kjops-minne.vercel.app |
| Backend API | https://kvitteringshvelv-api.onrender.com |
| API Docs | https://kvitteringshvelv-api.onrender.com/docs |

## Quick Start

```bash
# Start all services with logs
make dev

# Or run in background
make up
```

Then open:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## Commands

### Docker

| Command | Description |
|---------|-------------|
| `make dev` | Start with logs + file watching (Ctrl+C stops all) |
| `make up` | Start in background |
| `make down` | Stop all services |
| `make logs` | Follow container logs |
| `make ps` | Show container status |
| `make restart` | Restart without rebuild |
| `make rebuild` | Force rebuild (no cache) |
| `make reset` | Nuclear: remove containers, volumes, images |
| `make clean` | Remove containers, volumes, node_modules, .venv |

### Container Access

| Command | Description |
|---------|-------------|
| `make shell-backend` | Bash into backend container |
| `make shell-db` | PostgreSQL shell |

### Database

```bash
# Run migrations
cd backend && uv run alembic upgrade head

# Seed categories
cd backend && uv run python -m src.db.seed
```

### Testing & Linting

| Command | Description |
|---------|-------------|
| `make test` | Run all tests |
| `make lint` | Lint backend and frontend |
| `make fmt` | Format code |
| `make install` | Install all dependencies |

### Local Development (without Docker)

```bash
# Backend
cd backend && uv run uvicorn src.main:app --reload

# Frontend
cd frontend && npm run dev
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, next-intl |
| Backend | FastAPI, Python 3.12+, Pydantic v2 |
| Database | PostgreSQL 16, SQLAlchemy 2.0 (async) |
| Migrations | Alembic |
| OCR | Mock (swappable to AWS Textract) |
| Containers | Docker, docker-compose |

## Project Structure

```
kvitteringshvelv/
├── Makefile              # All commands
├── docker-compose.yml    # Services: db, backend, frontend
├── backend/
│   ├── src/
│   │   ├── api/          # Route handlers
│   │   ├── services/     # OCR, parser, categorizer
│   │   └── db/           # Models, migrations
│   └── alembic/          # Migration versions
├── frontend/
│   └── src/
│       ├── app/[locale]/ # i18n routes (nb, en)
│       ├── components/   # React components
│       ├── messages/     # Translation files
│       └── lib/          # API client
└── docs/                 # Documentation
    ├── api/              # API reference
    ├── architecture/     # System design
    ├── deployment/       # Vercel, Render guides
    └── features/         # Feature specs
```

## Environment Variables

```bash
DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/kvitteringshvelv
USE_MOCK_OCR=true              # Set false for AWS Textract
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/receipts/upload` | Upload receipt image |
| GET | `/api/receipts` | List receipts |
| GET | `/api/receipts/{id}` | Get receipt details |
| DELETE | `/api/receipts/{id}` | Delete receipt |
| GET | `/api/categories` | List categories |
| GET | `/api/analytics/summary` | Spending summary |
| GET | `/api/analytics/by-category` | By category |

See [docs/api/](./docs/api/) for full reference.

## Categories

Norwegian grocery categories:

| Category | Norwegian | Icon |
|----------|-----------|------|
| Meieri | Dairy | 🥛 |
| Kjøtt | Meat | 🥩 |
| Fisk | Fish | 🐟 |
| Brød | Bread | 🍞 |
| Frukt | Fruit | 🍎 |
| Grønnsaker | Vegetables | 🥬 |
| Drikke | Beverages | 🥤 |
| Tørrvarer | Dry goods | 🌾 |
| Frossen | Frozen | ❄️ |
| Husholdning | Household | 🧹 |
| Snacks | Snacks | 🍿 |
| Pant | Deposits | ♻️ |

## Documentation

- [API Reference](./docs/api/)
- [Architecture](./docs/architecture/)
- [Deployment](./docs/deployment/)
- [Feature Specs](./docs/features/)

## License

MIT
