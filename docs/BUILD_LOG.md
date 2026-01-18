# Build Log

Development journal documenting the implementation of Kvitteringshvelv.

**Date**: January 18, 2026
**AI Assistant**: Claude Opus 4.5
**Session Duration**: ~1 hour

---

## Session Summary

Built a complete full-stack Norwegian receipt vault application from scratch, including:
- FastAPI backend with async SQLAlchemy
- Next.js 15 frontend with Nordic design aesthetic
- PostgreSQL database with Alembic migrations
- Docker Compose orchestration
- Mock OCR service with realistic Norwegian fixtures

---

## Key Decisions

### 1. Async Everything
Used SQLAlchemy 2.0 with asyncpg for fully async database operations. This required careful handling in Alembic migrations.

### 2. Mock OCR with Real Data
Instead of placeholder data, created realistic Norwegian receipt fixtures from actual stores (REMA 1000, KIWI, MENY, COOP) with:
- Norwegian product names
- Pant (bottle deposit) handling
- Rabatt (discount) line items
- Realistic prices in NOK

### 3. Frontend Design: "Nordic Paper Journal"
Chose a distinctive Scandinavian aesthetic instead of generic dashboard UI:
- **Typography**: Fraunces serif for headings, DM Sans for body
- **Colors**: Warm cream (#FAF9F6), fjord blue (#2D4A5E), forest green (#3D5A47)
- **Effects**: Paper texture overlay, soft shadows, staggered animations
- **Feel**: Like a beautifully designed financial journal

### 4. Category-Based Intelligence
12 Norwegian grocery categories with keyword-based auto-categorization:
- Meieri (dairy), Kjøtt (meat), Fisk (fish), Brød (bread)
- Frukt (fruit), Grønnsaker (vegetables), Drikke (drinks)
- Tørrvarer (dry goods), Frossen (frozen), Husholdning (household)
- Snacks, Pant (deposits)

---

## Issues Encountered & Solutions

### Issue 1: Hatchling Build Error
**Problem**: `uv sync` failed with "Unable to determine which files to ship inside the wheel"

**Solution**: Added hatch build configuration to pyproject.toml:
```toml
[tool.hatch.build.targets.wheel]
packages = ["src"]
```

### Issue 2: Alembic psycopg2 Missing
**Problem**: Alembic migration failed with `ModuleNotFoundError: No module named 'psycopg2'`

**Cause**: The env.py was stripping `+asyncpg` from the URL but then using `async_engine_from_config` which still expected an async driver.

**Solution**: Rewrote env.py to use `create_async_engine` directly with the full asyncpg URL:
```python
connectable = create_async_engine(
    settings.database_url,  # Keep +asyncpg
    poolclass=pool.NullPool,
)
```

### Issue 3: Frontend Docker Build - Missing /app/public
**Problem**: Docker build failed at `COPY --from=builder /app/public ./public`

**Solution**: Added `RUN mkdir -p public` in the builder stage before npm build.

### Issue 4: Frontend Container - "next: not found"
**Problem**: Volume mount was overriding node_modules

**Solution**: Removed volume mounts from frontend service in docker-compose.yml for production builds. For development, run frontend locally with `npm run dev`.

### Issue 5: Docker Desktop Integrity Warning
**Problem**: "compose-bridge incorrectly symlinked" warning

**Solution**: This was a false positive. Docker was working correctly - dismissed the warning and continued.

---

## Final Verification Results

### API Health Check
```bash
$ curl http://localhost:8000/health
{"status": "ok"}
```

### Categories Loaded
```bash
$ curl http://localhost:8000/api/categories | jq length
12
```

### Receipt Upload Test
```bash
$ curl -X POST -F "file=@test.png" http://localhost:8000/api/receipts/upload
```

**Result**: Mock OCR returned REMA 1000 receipt with 10 items properly categorized.

### Analytics Working
```json
{
  "total_receipts": 1,
  "total_spent": "259.80",
  "total_items": 10,
  "avg_receipt_amount": "259.80"
}
```

### Category Breakdown
| Category | Spent | Items |
|----------|-------|-------|
| Meieri 🥛 | 154.70 kr | 4 |
| Kjøtt 🥩 | 49.90 kr | 1 |
| Drikke 🥤 | 29.90 kr | 1 |
| Frukt 🍎 | 24.90 kr | 1 |
| Brød 🍞 | 15.90 kr | 1 |
| Pant ♻️ | 4.50 kr | 2 |

---

## Services Running

```
NAME                         IMAGE                      STATUS         PORTS
kvitteringshvelv-db-1        postgres:16-alpine         Up (healthy)   :5432
kvitteringshvelv-backend-1   kvitteringshvelv-backend   Up             :8000
kvitteringshvelv-frontend-1  kvitteringshvelv-frontend  Up             :3000
```

---

## Files Created

### Backend (17 files)
- `pyproject.toml`, `Dockerfile`, `alembic.ini`
- `alembic/env.py`, `alembic/script.py.mako`, `alembic/versions/001_initial.py`
- `src/main.py`, `src/config.py`
- `src/db/engine.py`, `src/db/models.py`, `src/db/session.py`, `src/db/seed.py`
- `src/api/deps.py`, `src/api/receipts.py`, `src/api/upload.py`, `src/api/analytics.py`, `src/api/categories.py`
- `src/services/ocr.py`, `src/services/mock_ocr.py`, `src/services/textract_ocr.py`, `src/services/parser.py`, `src/services/categorizer.py`
- `src/schemas/receipt.py`, `src/schemas/item.py`

### Frontend (11 files)
- `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`, `Dockerfile`
- `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`
- `src/app/upload/page.tsx`, `src/app/receipts/page.tsx`, `src/app/receipts/[id]/page.tsx`, `src/app/analytics/page.tsx`
- `src/components/Navigation.tsx`
- `src/lib/api.ts`, `src/lib/utils.ts`

### Root (5 files)
- `Makefile`, `mise.toml`, `docker-compose.yml`, `.env.example`, `.gitignore`

---

## Next Steps (Future Work)

1. **Real OCR Integration**: Swap MockOCR for AWS Textract
2. **User Authentication**: Add user accounts and receipt ownership
3. **Receipt Image Storage**: S3 or similar for production
4. **Price Trend Analysis**: Track unit prices over time
5. **Warranty Tracking**: Alert for expiring warranties
6. **Search**: Full-text search across items
7. **Export**: CSV/PDF export of receipts and analytics
