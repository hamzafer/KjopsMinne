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

The API provides 50+ endpoints across 11 resource groups:

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |

### Receipts (5 endpoints)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/receipts/upload` | Upload receipt image |
| GET | `/api/receipts` | List all receipts |
| GET | `/api/receipts/{id}` | Get receipt details |
| DELETE | `/api/receipts/{id}` | Delete receipt |

### Categories (1 endpoint)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | List all categories |

### Households (4 endpoints)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/households` | Create household |
| GET | `/api/households/{id}` | Get household |
| POST | `/api/households/{id}/members` | Add member |
| GET | `/api/users/{id}` | Get user |

### Ingredients (5 endpoints)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ingredients` | List ingredients |
| GET | `/api/ingredients/{id}` | Get ingredient |
| POST | `/api/ingredients` | Create ingredient |
| PUT | `/api/ingredients/{id}` | Update ingredient |
| DELETE | `/api/ingredients/{id}` | Delete ingredient |

### Recipes (6 endpoints)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/recipes/import` | Import from URL |
| GET | `/api/recipes` | List recipes |
| GET | `/api/recipes/{id}` | Get recipe |
| POST | `/api/recipes` | Create recipe |
| PATCH | `/api/recipes/{id}` | Update recipe |
| DELETE | `/api/recipes/{id}` | Delete recipe |

### Meal Plans (6 endpoints)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/meal-plans` | Create meal plan |
| GET | `/api/meal-plans` | List meal plans |
| GET | `/api/meal-plans/{id}` | Get meal plan |
| PATCH | `/api/meal-plans/{id}` | Update meal plan |
| DELETE | `/api/meal-plans/{id}` | Delete meal plan |
| POST | `/api/meal-plans/{id}/cook` | Mark as cooked |

### Leftovers (2 endpoints)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leftovers` | List leftovers |
| PATCH | `/api/leftovers/{id}` | Update leftover |

### Inventory (9 endpoints)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inventory` | Aggregated inventory |
| GET | `/api/inventory/lots` | List inventory lots |
| GET | `/api/inventory/lots/{id}` | Get inventory lot |
| POST | `/api/inventory/lots` | Create inventory lot |
| PUT | `/api/inventory/lots/{id}` | Update inventory lot |
| POST | `/api/inventory/lots/{id}/consume` | Consume from lot |
| POST | `/api/inventory/lots/{id}/discard` | Discard lot |
| POST | `/api/inventory/lots/{id}/transfer` | Transfer lot location |
| GET | `/api/inventory/lots/{id}/events` | Get lot events |

### Shopping Lists (6 endpoints)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/shopping-lists/generate` | Generate from meal plans |
| GET | `/api/shopping-lists` | List shopping lists |
| GET | `/api/shopping-lists/{id}` | Get shopping list |
| PATCH | `/api/shopping-lists/{id}` | Update shopping list |
| PATCH | `/api/shopping-lists/{id}/items/{item_id}` | Update item |
| DELETE | `/api/shopping-lists/{id}` | Delete shopping list |

### Analytics (6 endpoints)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/summary` | Spending summary |
| GET | `/api/analytics/by-category` | Spending by category |
| GET | `/api/analytics/cost-per-meal` | Meal cost analytics |
| GET | `/api/analytics/waste` | Waste analytics |
| GET | `/api/analytics/spend-trend` | Spending trends |
| GET | `/api/analytics/restock-predictions` | Restock predictions |

### Admin (1 endpoint)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/seed-demo` | Seed demo data |

## Quick Examples

### Upload a Receipt

```bash
curl -X POST \
  -F "file=@receipt.jpg" \
  https://kvitteringshvelv-api.onrender.com/api/receipts/upload
```

### List Recipes

```bash
curl "https://kvitteringshvelv-api.onrender.com/api/recipes?household_id=UUID"
```

### Generate Shopping List

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"household_id":"UUID","start_date":"2024-01-22","end_date":"2024-01-28"}' \
  https://kvitteringshvelv-api.onrender.com/api/shopping-lists/generate
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

Admin endpoints require `X-Admin-Key` header.

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
| 204 | No Content |
| 400 | Bad request (invalid input) |
| 403 | Forbidden (admin endpoints) |
| 404 | Not found |
| 422 | Validation error |
| 500 | Server error |

## Rate Limits

No rate limits currently. Production will add:
- 100 requests/minute per IP
- 10 uploads/minute per IP
