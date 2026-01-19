# Render Deployment (Backend)

## Overview

The FastAPI backend and PostgreSQL database are deployed to Render with automatic deployments on push to `main`.

**Live URL**: https://kvitteringshvelv-api.onrender.com

## Services

### 1. PostgreSQL Database

| Setting | Value |
|---------|-------|
| Name | `kvitteringshvelv-db` |
| Plan | Free |
| Region | Frankfurt (EU) |

### 2. Web Service (Backend)

| Setting | Value |
|---------|-------|
| Name | `kvitteringshvelv-api` |
| Environment | Docker |
| Root Directory | `backend` |
| Plan | Free |
| Region | Frankfurt (EU) |

## Initial Setup

### 1. Create PostgreSQL Database

1. Go to Render Dashboard → New → PostgreSQL
2. Name: `kvitteringshvelv-db`
3. Region: Frankfurt (or closest)
4. Plan: Free
5. Copy the **Internal Database URL**

### 2. Create Web Service

1. Go to Render Dashboard → New → Web Service
2. Connect GitHub repository
3. Configure:
   - Name: `kvitteringshvelv-api`
   - Root Directory: `backend`
   - Environment: Docker
   - Plan: Free

### 3. Environment Variables

Add in Render Dashboard → Environment:

```bash
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/dbname
USE_MOCK_OCR=true
```

**Note**: Replace the database URL with your Internal Database URL, but change `postgresql://` to `postgresql+asyncpg://`.

### 4. Build & Deploy Settings

The `backend/Dockerfile` handles the build:

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN pip install uv && uv sync --frozen
COPY . .
CMD ["uv", "run", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Database Migrations

Migrations run automatically on container start. To run manually:

```bash
# SSH into Render shell or run locally with prod DATABASE_URL
uv run alembic upgrade head
```

## Health Check

Render uses the `/health` endpoint:

```bash
curl https://kvitteringshvelv-api.onrender.com/health
# {"status": "ok"}
```

## API Documentation

OpenAPI docs are available at:
- Swagger UI: https://kvitteringshvelv-api.onrender.com/docs
- ReDoc: https://kvitteringshvelv-api.onrender.com/redoc

## Cold Starts

Render free tier spins down after 15 minutes of inactivity. First request takes ~30 seconds to cold start.

**Mitigation options**:
1. Upgrade to paid plan ($7/month)
2. Use a cron service to ping `/health` every 10 minutes
3. Accept cold starts (current approach)

## Troubleshooting

### Container Fails to Start

1. Check Render logs for errors
2. Verify `DATABASE_URL` is correct and uses `+asyncpg`
3. Ensure database is running

### Database Connection Issues

1. Verify using **Internal** Database URL (not External)
2. Check URL has `+asyncpg` driver
3. Verify database is in same region as web service

### CORS Errors

Backend allows all origins in development. For production, update `src/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://kjops-minne.vercel.app"],
    # ...
)
```

## Useful Commands

```bash
# View logs
render logs --tail

# Restart service
render deploy --clear-cache
```
