# 05: Grocery Intelligence

> Item-level analytics revealing spending patterns, unit prices, and trends.

## Status: In Progress

## One-liner

Deep grocery analytics transforming receipt line items into actionable insights about spending, pricing, and consumption patterns.

## User Stories

### Price Tracking
- **As a user**, I want to see price history for items so I know if I'm getting a good deal.
- **As a user**, I want unit price comparisons so I can compare different package sizes.
- **As a user**, I want price alerts when items I buy regularly go on sale.
- **As a user**, I want to see which store has the best price for items I buy often.

### Spending Analytics
- **As a user**, I want spending by category over time so I see where my money goes.
- **As a user**, I want to compare spending month-over-month so I track budget progress.
- **As a user**, I want to identify my most purchased items so I understand my habits.
- **As a user**, I want seasonal spending patterns so I can anticipate expenses.

### Consumption Insights
- **As a user**, I want to estimate when I'll run out of regular items so I can plan shopping.
- **As a user**, I want to see my purchase frequency for staples so I understand usage.
- **As a user**, I want shopping trip analysis so I optimize store visits.

### Recommendations
- **As a user**, I want suggestions for cheaper alternatives so I can save money.
- **As a user**, I want to know if buying in bulk would save money based on my consumption.
- **As a user**, I want optimal shopping lists based on my patterns.

## Technical Approach

### Unit Price Calculation
```python
def calculate_unit_price(item: Item) -> Optional[UnitPrice]:
    # Parse quantity from item name
    # Examples: "Melk 1L", "Brød 750g", "Egg 12stk"

    quantity, unit = parse_quantity(item.name)
    if quantity and unit:
        return UnitPrice(
            price_per_unit=item.total_price / quantity,
            unit=normalize_unit(unit),  # Convert to base units
            quantity=quantity
        )
    return None

def normalize_unit(unit: str) -> str:
    """Convert to base SI units for comparison."""
    conversions = {
        "kg": ("g", 1000),
        "l": ("ml", 1000),
        "dl": ("ml", 100),
        # ...
    }
```

### Data Model
```python
class ItemPrice:
    item_canonical_name: str
    store_name: str
    price: Decimal
    unit_price: Optional[Decimal]
    unit: Optional[str]
    observed_date: date
    receipt_id: UUID

class PurchasePattern:
    user_id: UUID
    item_canonical_name: str
    avg_purchase_frequency_days: float
    avg_quantity_per_purchase: float
    preferred_store: str
    last_purchased: date
    predicted_next_purchase: date

class SpendingAggregate:
    user_id: UUID
    period: str  # "2024-01", "2024-W15", "2024"
    category_id: UUID
    total_spent: Decimal
    item_count: int
    receipt_count: int
```

### Analytics Pipeline
```
Receipt Items → Canonicalization → Unit Price Extraction → Price History
                     ↓
            Pattern Detection → Purchase Predictions
                     ↓
            Aggregation → Dashboard Metrics
```

### Item Canonicalization
```python
# Map variations to canonical names
"TINE LETTMELK 1L" → "Tine Lettmelk 1L"
"TINE LETT MELK" → "Tine Lettmelk 1L"
"Q-MELK LETT 1L" → "Q-Meieriene Lettmelk 1L"
```

## Norway-Specific Considerations

### Norwegian Grocery Landscape
| Chain | Format | Price Position |
|-------|--------|----------------|
| REMA 1000 | Discount | Low |
| Kiwi | Discount | Low |
| Extra | Discount | Low |
| Prix | Discount | Low |
| Meny | Full-service | Premium |
| Coop Mega | Full-service | Medium |
| Coop Obs | Hypermarket | Medium |

### Category System
```python
NORWEGIAN_CATEGORIES = {
    "Meieri": ["melk", "ost", "yoghurt", "smør", "rømme", "fløte"],
    "Kjøtt": ["kjøttdeig", "kylling", "svin", "biff", "pølse", "bacon"],
    "Fisk": ["laks", "torsk", "sei", "reker", "fiskekaker"],
    "Brød": ["brød", "rundstykker", "baguett", "knekkebrød"],
    "Frukt": ["eple", "banan", "appelsin", "druer", "jordbær"],
    "Grønnsaker": ["tomat", "agurk", "paprika", "løk", "gulrot"],
    "Drikke": ["brus", "juice", "vann", "øl", "vin"],
    "Tørrvarer": ["pasta", "ris", "mel", "sukker", "havregryn"],
    "Frossen": ["pizza", "fiskepinner", "is", "grønnsaker"],
    "Husholdning": ["tørkepapir", "oppvaskmiddel", "vaskemiddel"],
    "Snacks": ["chips", "sjokolade", "godteri", "nøtter"],
    "Pant": ["pant"],
}
```

### Price Comparison Challenges
- Same product, different names across chains
- Package size variations (1L vs 1.5L)
- Bonus/loyalty price vs. regular price
- Regional price differences

### Common Quantity Formats
- Weight: `500g`, `1kg`, `750g`
- Volume: `1L`, `1,5L`, `33cl`, `0,5L`
- Count: `6stk`, `12pk`, `4x125g`

## Dependencies

- [01-receipt-vault.md](./01-receipt-vault.md) - Item data source
- [07-norwegian-ocr.md](./07-norwegian-ocr.md) - Accurate item extraction

## Success Metrics

| Metric | Target |
|--------|--------|
| Unit price extraction rate | > 60% |
| Item canonicalization accuracy | > 85% |
| Category assignment accuracy | > 90% |
| Price alert relevance | > 70% click-through |

## Implementation Checklist

- [x] Basic category assignment
- [x] Spending by category view
- [ ] Unit price calculation
- [ ] Item canonicalization
- [ ] Price history tracking
- [ ] Cross-store price comparison
- [ ] Purchase pattern detection
- [ ] Consumption predictions
- [ ] Price alerts
- [ ] Shopping recommendations
