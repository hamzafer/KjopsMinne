# 01: Receipt Vault

> Core receipt storage, search, and export functionality.

## Status: In Progress

## One-liner

A searchable, exportable archive of all receipts with full-text search and flexible organization.

## User Stories

### Upload & Storage
- **As a user**, I want to upload receipt photos from my phone so I can digitize paper receipts instantly.
- **As a user**, I want to email receipts to a personal address so digital receipts are automatically captured.
- **As a user**, I want duplicate detection so I don't accidentally store the same receipt twice.

### Search & Browse
- **As a user**, I want to search receipts by store name so I can find all purchases from a specific retailer.
- **As a user**, I want to search by date range so I can review spending for a specific period.
- **As a user**, I want to search by item name so I can find when I last bought something.
- **As a user**, I want to filter by category so I can see all grocery vs. household purchases.

### Organization
- **As a user**, I want to tag receipts so I can organize them by project or purpose.
- **As a user**, I want to mark receipts as business expenses so I can separate personal and work spending.
- **As a user**, I want to add notes to receipts so I can remember context about purchases.

### Export & Sharing
- **As a user**, I want to export receipts as PDF so I can submit expense reports.
- **As a user**, I want to export spending summaries so I can share them with my accountant.
- **As a user**, I want to download original receipt images so I have backup copies.

## Technical Approach

### Upload Pipeline
```
Image → Validation → Storage (S3/local) → OCR Queue → Processing → Database
```

### Data Model
- `Receipt`: id, store_name, total, date, currency, image_url, ocr_text, user_id
- `Item`: id, receipt_id, name, quantity, unit_price, total_price, category_id
- `Tag`: id, name, user_id
- `ReceiptTag`: receipt_id, tag_id

### Search Implementation
- PostgreSQL full-text search on store_name, item names, and notes
- Trigram similarity for fuzzy matching Norwegian terms
- Date range queries with index optimization

### Storage Strategy
- Original images stored in S3 with lifecycle policies
- Thumbnails generated on upload for fast browsing
- Metadata stored in PostgreSQL for querying

## Norway-Specific Considerations

- **Store name normalization**: Handle variations (REMA 1000 vs. Rema1000)
- **Date formats**: Parse dd.mm.yyyy (Norwegian standard)
- **Currency**: Always NOK, handle øre (1/100) correctly
- **Org numbers**: Extract and validate Norwegian organization numbers

## Dependencies

- [07-norwegian-ocr.md](./07-norwegian-ocr.md) - Receipt text extraction
- AWS S3 or compatible storage for images

## Success Metrics

| Metric | Target |
|--------|--------|
| Receipt upload success rate | > 99% |
| Search response time (p95) | < 200ms |
| OCR processing time (p95) | < 5s |
| Storage cost per receipt | < 0.01 NOK |

## Implementation Checklist

- [x] Basic receipt upload endpoint
- [x] Image storage to filesystem
- [x] OCR integration (mock + Textract)
- [x] Item extraction and storage
- [x] Basic receipt listing
- [ ] Full-text search
- [ ] Tag support
- [ ] PDF export
- [ ] Email ingestion
- [ ] Duplicate detection
