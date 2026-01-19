# API Endpoint Reference

## Health Check

### `GET /health`

Check API health status.

**Response**: `200 OK`
```json
{
  "status": "ok"
}
```

---

## Receipts

### `POST /api/receipts/upload`

Upload a receipt image for OCR processing.

**Request**: `multipart/form-data`
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | Image file (JPG, PNG, WebP, HEIC) |

**Response**: `201 Created`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "merchant_name": "REMA 1000",
  "store_location": "Storgata 1, Oslo",
  "purchase_date": "2024-01-15T14:30:00",
  "total_amount": "259.80",
  "currency": "NOK",
  "payment_method": "Visa",
  "warranty_months": null,
  "return_window_days": null,
  "items": [
    {
      "id": "...",
      "raw_name": "TINE LETTMELK 1L",
      "canonical_name": "Tine Lettmelk",
      "quantity": 1.0,
      "unit": null,
      "unit_price": "18.90",
      "total_price": "18.90",
      "category": {
        "id": "...",
        "name": "Meieri",
        "icon": "milk",
        "color": "#E3F2FD"
      },
      "is_pant": false,
      "discount_amount": "0.00"
    }
  ],
  "created_at": "2024-01-15T14:35:00",
  "updated_at": "2024-01-15T14:35:00"
}
```

---

### `GET /api/receipts`

List all receipts, ordered by purchase date (newest first).

**Response**: `200 OK`
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "merchant_name": "REMA 1000",
    "store_location": "Storgata 1, Oslo",
    "purchase_date": "2024-01-15T14:30:00",
    "total_amount": "259.80",
    "currency": "NOK",
    "payment_method": "Visa",
    "item_count": 10,
    "created_at": "2024-01-15T14:35:00"
  }
]
```

---

### `GET /api/receipts/{id}`

Get a single receipt with all items.

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `id` | UUID | Receipt ID |

**Response**: `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "merchant_name": "REMA 1000",
  "store_location": "Storgata 1, Oslo",
  "purchase_date": "2024-01-15T14:30:00",
  "total_amount": "259.80",
  "currency": "NOK",
  "payment_method": "Visa",
  "warranty_months": null,
  "return_window_days": null,
  "raw_ocr": { /* OCR output */ },
  "items": [ /* array of items */ ],
  "created_at": "2024-01-15T14:35:00",
  "updated_at": "2024-01-15T14:35:00"
}
```

**Error**: `404 Not Found`
```json
{
  "detail": "Receipt not found"
}
```

---

### `DELETE /api/receipts/{id}`

Delete a receipt and all associated items.

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `id` | UUID | Receipt ID |

**Response**: `200 OK`
```json
{
  "message": "Receipt deleted"
}
```

---

## Categories

### `GET /api/categories`

List all item categories.

**Response**: `200 OK`
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Meieri",
    "icon": "milk",
    "color": "#E3F2FD"
  },
  {
    "id": "...",
    "name": "Kjøtt",
    "icon": "beef",
    "color": "#FFEBEE"
  }
]
```

**Categories**:
| Name | Norwegian | Icon | Description |
|------|-----------|------|-------------|
| Meieri | Dairy | milk | Milk, cheese, yogurt |
| Kjøtt | Meat | beef | Meat products |
| Fisk | Fish | fish | Fish and seafood |
| Brød | Bread | bread | Bread and bakery |
| Frukt | Fruit | apple | Fresh fruits |
| Grønnsaker | Vegetables | carrot | Fresh vegetables |
| Drikke | Beverages | glass | Drinks, juice, soda |
| Tørrvarer | Dry goods | wheat | Pasta, rice, cereals |
| Frossen | Frozen | snowflake | Frozen foods |
| Husholdning | Household | home | Cleaning, paper goods |
| Snacks | Snacks | cookie | Chips, candy, snacks |
| Pant | Deposits | recycle | Bottle/can deposits |

---

## Analytics

### `GET /api/analytics/summary`

Get overall spending summary.

**Response**: `200 OK`
```json
{
  "total_receipts": 25,
  "total_spent": "4523.50",
  "total_items": 187,
  "avg_receipt_amount": "180.94"
}
```

---

### `GET /api/analytics/by-category`

Get spending breakdown by category.

**Response**: `200 OK`
```json
[
  {
    "category_id": "550e8400-e29b-41d4-a716-446655440000",
    "category_name": "Meieri",
    "category_icon": "milk",
    "category_color": "#E3F2FD",
    "total_spent": "1245.60",
    "item_count": 45
  },
  {
    "category_id": "...",
    "category_name": "Kjøtt",
    "category_icon": "beef",
    "category_color": "#FFEBEE",
    "total_spent": "892.30",
    "item_count": 18
  }
]
```

---

## Data Types

### Receipt

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique identifier |
| `merchant_name` | string | Store name |
| `store_location` | string? | Store address |
| `purchase_date` | datetime | Purchase timestamp |
| `total_amount` | decimal | Total in NOK |
| `currency` | string | Always "NOK" |
| `payment_method` | string? | Visa, Vipps, etc. |
| `warranty_months` | int? | Warranty period |
| `return_window_days` | int? | Return period |
| `raw_ocr` | object? | Raw OCR output |
| `items` | Item[] | Line items |
| `created_at` | datetime | Created timestamp |
| `updated_at` | datetime | Updated timestamp |

### Item

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique identifier |
| `raw_name` | string | OCR-extracted name |
| `canonical_name` | string? | Normalized name |
| `quantity` | decimal? | Quantity (e.g., 2.5) |
| `unit` | string? | Unit (kg, stk, etc.) |
| `unit_price` | decimal? | Price per unit |
| `total_price` | decimal | Line total |
| `category` | Category? | Category object |
| `is_pant` | boolean | Is deposit item |
| `discount_amount` | decimal | Discount applied |

### Category

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique identifier |
| `name` | string | Category name |
| `icon` | string? | Icon identifier |
| `color` | string? | Hex color code |
