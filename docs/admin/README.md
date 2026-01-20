# Admin API

Protected administrative endpoints for database management.

## Overview

The admin API provides endpoints for managing the application in production. All endpoints require authentication via an API key.

## Authentication

All admin endpoints require the `X-Admin-Key` header with a valid API key.

```bash
curl -X POST https://api.example.com/api/admin/seed-demo \
  -H "X-Admin-Key: your-secret-key"
```

### Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 403 | Invalid API key |
| 422 | Missing X-Admin-Key header |
| 503 | Admin API disabled (ADMIN_API_KEY not set) |

## Configuration

### Environment Variable

Set `ADMIN_API_KEY` to enable the admin API:

```bash
# Generate a secure key (32+ characters)
openssl rand -base64 32

# Set in environment
ADMIN_API_KEY=your-generated-key
```

### Render Setup

1. Go to your Render dashboard
2. Select the backend service
3. Navigate to **Environment** tab
4. Add new environment variable:
   - Key: `ADMIN_API_KEY`
   - Value: (your secure random string)
5. Click **Save Changes**
6. Service will redeploy automatically

### Security Notes

- Use a strong, random key (32+ characters recommended)
- Never commit the key to version control
- Rotate keys periodically
- The API is disabled by default when `ADMIN_API_KEY` is empty

## Endpoints

### POST /api/admin/seed-demo

Seed the database with demo data for testing and demonstrations.

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `clear_first` | boolean | `true` | Clear existing demo data before seeding |

#### Examples

```bash
# Seed with default options (clears existing demo data first)
curl -X POST https://kvitteringshvelv-api.onrender.com/api/admin/seed-demo \
  -H "X-Admin-Key: your-secret-key"

# Seed without clearing (adds to existing data)
curl -X POST "https://kvitteringshvelv-api.onrender.com/api/admin/seed-demo?clear_first=false" \
  -H "X-Admin-Key: your-secret-key"
```

#### Response

```json
{
  "status": "ok",
  "message": "Demo data seeded"
}
```

#### What Gets Seeded

The demo data includes:

| Data Type | Count | Description |
|-----------|-------|-------------|
| Household | 1 | "Demo Husstand" |
| Users | 2 | Ola and Kari Nordmann |
| Receipts | 9 | From various Norwegian stores (REMA, KIWI, MENY, COOP) |
| Inventory Lots | ~30 | Fridge, pantry, and freezer items |
| Recipes | 6 | Norwegian dishes with images |
| Meal Plans | 17 | 2 weeks of planned meals |
| Leftovers | 2-3 | From recently cooked meals |
| Shopping List | 1 | Active list with items |

Demo household ID: `00000000-0000-0000-0000-000000000001`

## Local Development

For local testing, set the environment variable:

```bash
# In docker-compose, set via environment
ADMIN_API_KEY=test123 docker compose up -d backend

# Or add to .env file
echo "ADMIN_API_KEY=test123" >> .env
```

Then test:

```bash
# Should fail (no key)
curl -X POST http://localhost:8000/api/admin/seed-demo

# Should fail (wrong key)
curl -X POST http://localhost:8000/api/admin/seed-demo -H "X-Admin-Key: wrong"

# Should succeed
curl -X POST http://localhost:8000/api/admin/seed-demo -H "X-Admin-Key: test123"
```

## Files

| File | Description |
|------|-------------|
| `backend/src/api/admin.py` | Admin router and endpoints |
| `backend/src/api/deps.py` | `verify_admin_key` dependency |
| `backend/src/config.py` | `admin_api_key` setting |
| `backend/src/db/seed_demo_data.py` | Demo data generation |
| `backend/tests/test_admin.py` | Tests for admin endpoints |
