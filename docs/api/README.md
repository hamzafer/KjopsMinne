# API Documentation

The Kvitteringshvelv API is a RESTful API built with FastAPI.

## Base URLs

| Environment | URL |
|-------------|-----|
| Production | https://kvitteringshvelv-api.onrender.com |
| Local | http://localhost:8000 |

## Interactive Documentation

- **Swagger UI**: [/docs](https://kvitteringshvelv-api.onrender.com/docs)
- **ReDoc**: [/redoc](https://kvitteringshvelv-api.onrender.com/redoc)
- **OpenAPI JSON**: [/openapi.json](https://kvitteringshvelv-api.onrender.com/openapi.json)

## Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/receipts/upload` | Upload receipt image |
| GET | `/api/receipts` | List all receipts |
| GET | `/api/receipts/{id}` | Get receipt details |
| DELETE | `/api/receipts/{id}` | Delete receipt |
| GET | `/api/categories` | List all categories |
| GET | `/api/analytics/summary` | Get spending summary |
| GET | `/api/analytics/by-category` | Get spending by category |

## Quick Examples

### Upload a Receipt

```bash
curl -X POST \
  -F "file=@receipt.jpg" \
  https://kvitteringshvelv-api.onrender.com/api/receipts/upload
```

### List Receipts

```bash
curl https://kvitteringshvelv-api.onrender.com/api/receipts
```

### Get Analytics

```bash
curl https://kvitteringshvelv-api.onrender.com/api/analytics/summary
```

## Detailed Reference

See [endpoints.md](./endpoints.md) for full request/response schemas.

## Authentication

Currently no authentication required. Future versions will add:
- BankID login
- JWT tokens
- API keys for integrations

## Error Handling

All errors return JSON with this structure:

```json
{
  "detail": "Error message here"
}
```

| Status Code | Meaning |
|-------------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request (invalid input) |
| 404 | Not found |
| 422 | Validation error |
| 500 | Server error |

## Rate Limits

No rate limits currently. Production will add:
- 100 requests/minute per IP
- 10 uploads/minute per IP
