# CLAUDE.md

Instructions for Claude Code when working with this repository.

> **Commands & Setup**: See [README.md](./README.md)
> **Detailed Docs**: See [docs/](./docs/)

## Quick Reference

```bash
make dev     # Start with logs (Ctrl+C stops all)
make rebuild # Force rebuild without cache
make reset   # Nuclear: remove everything
```

## Development Workflow

Use these skills when developing:

| Task | Skill |
|------|-------|
| New feature | `brainstorming` → `writing-plans` |
| Frontend UI | `frontend-design` |
| Bug fixing | `systematic-debugging` |
| Testing | `test-driven-development` |
| Before commit | `verification-before-completion` |
| Code review | `requesting-code-review` |
| Parallel work | `dispatching-parallel-agents` |

**Rule**: When in doubt, invoke the skill.

## Architecture

See [docs/architecture/](./docs/architecture/) for details.

### Data Flow: Receipt Upload
1. `POST /api/receipts/upload` → `upload.py`
2. OCR Service extracts text (mock or Textract)
3. `parser.py` → Norwegian normalization (PANT, RABATT, abbreviations)
4. `categorizer.py` → keyword-based category matching
5. Save to PostgreSQL

### Key Files

| Area | Files |
|------|-------|
| API routes | `backend/src/api/*.py` |
| OCR/parsing | `backend/src/services/` |
| DB models | `backend/src/db/models.py` |
| Frontend API | `frontend/src/lib/api.ts` |
| i18n | `frontend/src/messages/{nb,en}.json` |
| Routes | `frontend/src/app/[locale]/` |

### Key Patterns
- Async everywhere (SQLAlchemy + asyncpg)
- OCR is pluggable via `USE_MOCK_OCR` env var
- next-intl for i18n with `nb` (default) and `en` locales

## Norwegian Domain Context

| Term | Meaning |
|------|---------|
| Pant | Bottle/can deposit |
| Rabatt | Discount |
| Meieri | Dairy |
| Kjøtt | Meat |
| Tørrvarer | Dry goods |
| Husholdning | Household |

12 categories total - see [README.md](./README.md#categories).
