# Vercel Deployment (Frontend)

## Overview

The Next.js frontend is deployed to Vercel with automatic deployments on push to `main`.

**Live URL**: https://kjops-minne.vercel.app

## Initial Setup

### 1. Connect Repository

1. Go to [vercel.com](https://vercel.com)
2. Import the GitHub repository
3. Select `frontend` as the root directory
4. Framework preset: Next.js (auto-detected)

### 2. Configure Build Settings

| Setting | Value |
|---------|-------|
| Framework Preset | Next.js |
| Root Directory | `frontend` |
| Build Command | `npm run build` |
| Output Directory | `.next` |
| Install Command | `npm install` |

### 3. Environment Variables

Add in Vercel Dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_API_URL=https://kvitteringshvelv-api.onrender.com
```

## Project Structure

```
frontend/
├── src/
│   ├── app/[locale]/     # i18n routes
│   ├── components/       # React components
│   ├── lib/              # API client, utilities
│   ├── i18n/             # next-intl config
│   └── messages/         # Translation files (nb.json, en.json)
├── public/               # Static assets
├── next.config.ts        # Next.js configuration
└── package.json
```

## i18n Routes

The app uses `next-intl` for internationalization:

- `/nb` - Norwegian (default)
- `/en` - English
- `/` - Redirects to `/nb`

## Deployment Triggers

- **Production**: Push to `main` branch
- **Preview**: Push to any other branch or open PR

## Troubleshooting

### Build Fails

Check the Vercel build logs. Common issues:

1. **Missing env vars**: Ensure `NEXT_PUBLIC_API_URL` is set
2. **Type errors**: Run `npm run build` locally first
3. **Dependency issues**: Delete `node_modules` and `package-lock.json`, reinstall

### API Connection Issues

1. Verify `NEXT_PUBLIC_API_URL` is correct
2. Check if Render backend is running
3. Verify CORS is configured in backend

## Useful Commands

```bash
# Preview production build locally
cd frontend
npm run build
npm run start

# Check for type errors
npm run lint
```
