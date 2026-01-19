# Architecture Overview

Kvitteringshvelv is a full-stack application with a clear separation between frontend and backend.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          Users                                   │
│                    (Web Browser / Mobile)                        │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Vercel CDN / Edge                             │
│                   (Global Distribution)                          │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Frontend (Next.js 15)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  App Router  │  │   next-intl  │  │     Recharts         │  │
│  │  [locale]/   │  │   (nb/en)    │  │   (Analytics)        │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  API Client  │  │  Components  │  │     Tailwind CSS     │  │
│  │  (lib/api)   │  │  (shadcn)    │  │   (Nordic theme)     │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────┬───────────────────────────────────────┘
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Backend (FastAPI)                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  REST API    │  │  OCR Service │  │     Parser           │  │
│  │  (Pydantic)  │  │  (Mock/AWS)  │  │   (Norwegian)        │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  SQLAlchemy  │  │  Categorizer │  │     Alembic          │  │
│  │  (Async)     │  │  (Keywords)  │  │   (Migrations)       │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────┬───────────────────────────────────────┘
                          │ asyncpg
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                   PostgreSQL 16                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   receipts   │  │    items     │  │     categories       │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| Next.js 15 | React framework with App Router |
| TypeScript | Type safety |
| Tailwind CSS | Utility-first styling |
| shadcn/ui | Component library |
| next-intl | Internationalization (nb/en) |
| Recharts | Analytics visualizations |

### Backend
| Technology | Purpose |
|------------|---------|
| FastAPI | Async Python web framework |
| SQLAlchemy 2.0 | Async ORM |
| Alembic | Database migrations |
| Pydantic | Data validation |
| asyncpg | Async PostgreSQL driver |
| uv | Fast Python package manager |

### Infrastructure
| Service | Platform | Purpose |
|---------|----------|---------|
| Frontend | Vercel | Hosting, CDN, edge |
| Backend | Render | Docker container hosting |
| Database | Render | Managed PostgreSQL |

## Design Principles

1. **Norway-first**: NOK currency, nb-NO locale, Norwegian retail context
2. **Async-native**: All I/O operations are async
3. **Type-safe**: Full TypeScript frontend, typed Python backend
4. **Pluggable OCR**: Abstract interface for swapping providers
5. **Privacy by design**: Minimal data collection

## Related Docs

- [Data Flow](./data-flow.md) - How receipts are processed
- [Database Schema](./database.md) - Tables and relationships
