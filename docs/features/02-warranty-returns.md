# 02: Warranty & Returns

> Track product warranties and return windows to never miss a deadline.

## Status: Not Started

## One-liner

Automatic warranty tracking and return window alerts for all purchased items.

## User Stories

### Warranty Tracking
- **As a user**, I want to see which items are still under warranty so I can get repairs or replacements.
- **As a user**, I want warranty expiration alerts so I'm reminded before coverage ends.
- **As a user**, I want to store warranty documents so I have proof when making claims.
- **As a user**, I want to mark items as "claimed" so I track warranty usage.

### Return Windows
- **As a user**, I want to see items within their return window so I can return unwanted purchases.
- **As a user**, I want return deadline reminders so I don't miss the window.
- **As a user**, I want to know store-specific return policies so I understand my options.

### Product Lifecycle
- **As a user**, I want to track high-value purchases so I can monitor their warranty status.
- **As a user**, I want to link receipts to product serial numbers so warranty claims are easy.
- **As a user**, I want to record repair history so I have a complete product timeline.

## Technical Approach

### Data Model Extensions
```python
class Product:
    id: UUID
    name: str
    serial_number: Optional[str]
    purchase_receipt_id: UUID
    warranty_months: int
    warranty_expires: date
    return_window_days: int
    return_deadline: date

class WarrantyDocument:
    id: UUID
    product_id: UUID
    document_url: str
    document_type: str  # "warranty_card", "extended_warranty", "insurance"

class WarrantyClaim:
    id: UUID
    product_id: UUID
    claim_date: date
    description: str
    status: str  # "pending", "approved", "denied", "completed"
```

### Warranty Detection
1. Parse receipt items for electronics, appliances, furniture
2. Apply default warranty periods by category:
   - Electronics: 24 months (Norwegian Consumer Purchase Act)
   - Appliances: 24-60 months (varies by retailer)
   - Clothing: 24 months

### Notification System
- Email/push notifications at: 30 days, 7 days, 1 day before expiry
- Weekly digest of upcoming expirations
- Return window alerts (typically 14-30 days)

## Norway-Specific Considerations

### Legal Framework
- **Forbrukerkjøpsloven**: 5-year complaint right for durable goods
- **Angrerettloven**: 14-day withdrawal right for online purchases
- **Reklamasjonsrett**: 2-year minimum warranty on consumer goods

### Retailer Policies
| Retailer | Return Window | Extended Warranty |
|----------|---------------|-------------------|
| Elkjøp | 60 days | Available |
| Power | 60 days | Available |
| XXL | 100 days | - |
| IKEA | 365 days | - |
| Clas Ohlson | 90 days | - |

### Serialized Products
- Parse serial numbers from receipts where printed
- Integration with Elkjøp/Power for product registration

## Dependencies

- [01-receipt-vault.md](./01-receipt-vault.md) - Receipt storage and item extraction
- Push notification service
- Email delivery service

## Success Metrics

| Metric | Target |
|--------|--------|
| Warranty items tracked | > 80% of eligible |
| Alert delivery rate | > 99% |
| User action on alerts | > 30% |
| Successful claims via app | Track |

## Implementation Checklist

- [ ] Product entity and associations
- [ ] Warranty period detection by category
- [ ] Return window calculation
- [ ] Expiration notification system
- [ ] Warranty document upload
- [ ] Claim tracking
- [ ] Retailer policy database
- [ ] Serial number extraction
