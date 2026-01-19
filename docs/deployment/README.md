# Deployment Guide

Kvitteringshvelv uses a split deployment architecture:
- **Frontend**: Vercel (Next.js)
- **Backend**: Render (FastAPI)
- **Database**: Render PostgreSQL

## Live URLs

| Service | URL | Platform |
|---------|-----|----------|
| Frontend | https://kjops-minne.vercel.app | Vercel |
| Backend API | https://kvitteringshvelv-api.onrender.com | Render |
| API Docs | https://kvitteringshvelv-api.onrender.com/docs | Render |

## Deployment Guides

- [Vercel Setup](./vercel.md) - Frontend deployment
- [Render Setup](./render.md) - Backend and database deployment

## Environment Variables

### Frontend (Vercel)

| Variable | Value | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://kvitteringshvelv-api.onrender.com` | Backend API URL |

### Backend (Render)

| Variable | Value | Description |
|----------|-------|-------------|
| `DATABASE_URL` | `postgresql+asyncpg://...` | PostgreSQL connection string |
| `USE_MOCK_OCR` | `true` | Use mock OCR (set `false` for AWS Textract) |
| `AWS_ACCESS_KEY_ID` | - | Required if `USE_MOCK_OCR=false` |
| `AWS_SECRET_ACCESS_KEY` | - | Required if `USE_MOCK_OCR=false` |
| `AWS_REGION` | `eu-north-1` | AWS region for Textract |

## Deployment Flow

```
git push origin main
        │
        ├─────────────────────────────────────┐
        ▼                                     ▼
   Vercel (auto)                        Render (auto)
   - Builds Next.js                     - Builds Docker image
   - Deploys to CDN                     - Runs migrations
   - ~30s deploy                        - Deploys container
                                        - ~2-3 min deploy
```

## Notes

- **Cold starts**: Render free tier has ~30s cold start on first request
- **Auto-deploy**: Both platforms auto-deploy on push to `main`
- **Preview deployments**: Vercel creates preview URLs for PRs
