# Data Flow

## Receipt Upload Flow

```
User uploads image
        │
        ▼
┌───────────────────────────────────────────────────────────────────┐
│  POST /api/receipts/upload                                        │
│  (multipart/form-data)                                            │
└───────────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────────┐
│  upload.py                                                        │
│  - Validates file type (JPG, PNG, WebP, HEIC)                    │
│  - Saves image (future: S3)                                       │
│  - Calls OCR service                                              │
└───────────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────────┐
│  OCR Service (ocr.py)                                             │
│  ┌─────────────────────┐    ┌─────────────────────┐             │
│  │  MockOCRService     │ OR │  TextractOCRService │             │
│  │  (USE_MOCK_OCR=true)│    │  (USE_MOCK_OCR=false)│             │
│  │  Returns fixtures   │    │  Calls AWS Textract  │             │
│  └─────────────────────┘    └─────────────────────┘             │
└───────────────────────────────────────────────────────────────────┘
        │
        │ Raw OCR text/blocks
        ▼
┌───────────────────────────────────────────────────────────────────┐
│  parser.py                                                        │
│  - Extracts merchant name, date, total                           │
│  - Parses line items (name, quantity, price)                     │
│  - Norwegian normalization:                                       │
│    - Abbreviations (TINE LETTML → Tine Lettmelk)                │
│    - PANT handling (bottle deposits)                             │
│    - RABATT handling (discounts)                                 │
│    - Date formats (dd.mm.yyyy)                                   │
│  - Returns ParsedReceipt                                         │
└───────────────────────────────────────────────────────────────────┘
        │
        │ ParsedReceipt
        ▼
┌───────────────────────────────────────────────────────────────────┐
│  categorizer.py                                                   │
│  - Matches item names against CATEGORY_KEYWORDS                   │
│  - Keywords are Norwegian grocery terms                          │
│  - Returns category_id for each item                             │
│                                                                   │
│  Example mappings:                                                │
│  - "melk", "ost", "yoghurt" → Meieri                            │
│  - "kylling", "svin", "lam" → Kjøtt                             │
│  - "cola", "juice", "vann" → Drikke                              │
└───────────────────────────────────────────────────────────────────┘
        │
        │ Categorized items
        ▼
┌───────────────────────────────────────────────────────────────────┐
│  Database (SQLAlchemy async)                                      │
│  1. Create Receipt record                                         │
│  2. Create Item records (with category_id)                       │
│  3. Store raw_ocr as JSONB                                       │
│  4. Commit transaction                                           │
└───────────────────────────────────────────────────────────────────┘
        │
        │ Receipt with items
        ▼
┌───────────────────────────────────────────────────────────────────┐
│  Response: 201 Created                                            │
│  {                                                                │
│    "id": "uuid",                                                  │
│    "merchant_name": "REMA 1000",                                 │
│    "items": [...]                                                 │
│  }                                                                │
└───────────────────────────────────────────────────────────────────┘
```

## Analytics Query Flow

```
User views Analytics page
        │
        ▼
┌───────────────────────────────────────────────────────────────────┐
│  Frontend: /analytics                                             │
│  - Calls api.getAnalyticsSummary()                               │
│  - Calls api.getAnalyticsByCategory()                            │
└───────────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────────┐
│  GET /api/analytics/summary                                       │
│  - Aggregates: COUNT(receipts), SUM(total), AVG(total)           │
│                                                                   │
│  GET /api/analytics/by-category                                   │
│  - Joins items → categories                                      │
│  - Groups by category_id                                          │
│  - Aggregates: SUM(total_price), COUNT(items)                    │
└───────────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────────┐
│  Frontend: Recharts                                               │
│  - Bar chart: Spending by category                               │
│  - Pie chart: Category distribution                              │
│  - Table: Detailed breakdown                                      │
└───────────────────────────────────────────────────────────────────┘
```

## i18n Flow

```
User visits /                         User visits /en/analytics
        │                                      │
        ▼                                      ▼
┌─────────────────────┐             ┌─────────────────────┐
│  middleware.ts      │             │  middleware.ts      │
│  - No locale prefix │             │  - Has locale "en"  │
│  - Redirect → /nb   │             │  - Pass through     │
└─────────────────────┘             └─────────────────────┘
        │                                      │
        ▼                                      ▼
┌─────────────────────┐             ┌─────────────────────┐
│  /nb (default)      │             │  /en/analytics      │
│  - Load nb.json     │             │  - Load en.json     │
│  - Norwegian UI     │             │  - English UI       │
└─────────────────────┘             └─────────────────────┘
```

## File Locations

| Component | Location |
|-----------|----------|
| Upload endpoint | `backend/src/api/upload.py` |
| OCR protocol | `backend/src/services/ocr.py` |
| Mock OCR | `backend/src/services/mock_ocr.py` |
| Parser | `backend/src/services/parser.py` |
| Categorizer | `backend/src/services/categorizer.py` |
| Database models | `backend/src/db/models.py` |
| API client | `frontend/src/lib/api.ts` |
| i18n middleware | `frontend/src/middleware.ts` |
| Translations | `frontend/src/messages/{nb,en}.json` |
