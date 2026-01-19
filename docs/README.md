# Kvitteringshvelv Documentation

> "Receipt Vault" - Norwegian receipt digitization and grocery analytics platform.

## Quick Links

| Document | Description |
|----------|-------------|
| [CLAUDE.md](../CLAUDE.md) | Quick reference for Claude Code (commands, architecture) |
| [Implementation Plan](./IMPLEMENTATION_PLAN.md) | Original spec and database schema |
| [Build Log](./BUILD_LOG.md) | Development journal and decisions |

## Documentation Structure

```
docs/
├── README.md                 # This file - documentation index
├── IMPLEMENTATION_PLAN.md    # Original spec, schema, implementation checklist
├── BUILD_LOG.md              # Development journal
├── deployment/               # Deployment guides
│   ├── README.md            # Deployment overview
│   ├── vercel.md            # Vercel (frontend) setup
│   └── render.md            # Render (backend) setup
├── api/                      # API documentation
│   ├── README.md            # API overview
│   └── endpoints.md         # Endpoint reference
├── architecture/             # System architecture
│   ├── README.md            # Architecture overview
│   ├── data-flow.md         # Request/data flow diagrams
│   └── database.md          # Database schema details
└── features/                 # Feature specifications
    ├── README.md            # Feature roadmap
    ├── 01-receipt-vault.md  # Core receipt storage
    ├── 02-warranty-returns.md
    ├── 03-bank-integration.md
    ├── 04-transaction-matching.md
    ├── 05-grocery-intelligence.md
    ├── 06-household.md
    ├── 07-norwegian-ocr.md
    ├── 08-integrations.md
    ├── 09-auth-security.md
    ├── 10-business-mode.md
    └── 11-i18n.md           # Internationalization (nb/en)
```

## Getting Started

### For Development
See [CLAUDE.md](../CLAUDE.md) for:
- `make dev` to start all services
- Hot reload setup
- Test and lint commands

### For Deployment
See [deployment/](./deployment/README.md) for:
- Vercel frontend setup
- Render backend setup
- Environment variables

### For API Integration
See [api/](./api/README.md) for:
- Endpoint reference
- Request/response formats
- Authentication (future)

## Live Deployments

| Service | URL |
|---------|-----|
| Frontend | https://kjops-minne.vercel.app |
| Backend API | https://kvitteringshvelv-api.onrender.com |
| API Docs (OpenAPI) | https://kvitteringshvelv-api.onrender.com/docs |
