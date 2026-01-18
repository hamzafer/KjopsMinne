# 07: Norwegian OCR

> Specialized OCR strategy for Norwegian receipts with normalization and canonicalization.

## Status: In Progress

## One-liner

Accurate receipt text extraction optimized for Norwegian retail formats with intelligent item normalization.

## User Stories

### OCR Accuracy
- **As a user**, I want accurate text extraction so receipt data is reliable.
- **As a user**, I want Norwegian characters (æ, ø, å) recognized correctly.
- **As a user**, I want crumpled or faded receipts still readable.

### Item Recognition
- **As a user**, I want items parsed into name, quantity, and price so data is structured.
- **As a user**, I want discounts (RABATT) applied correctly to line items.
- **As a user**, I want deposits (PANT) tracked separately.

### Store Recognition
- **As a user**, I want the store name auto-detected so I don't enter it manually.
- **As a user**, I want store organization numbers captured for business receipts.
- **As a user**, I want store address extracted for location context.

## Technical Approach

### OCR Pipeline
```
Image → Preprocessing → OCR Engine → Post-processing → Parsing → Validation
         ↓                ↓               ↓              ↓
      Deskew          AWS Textract    Spellcheck     Receipt
      Contrast         or             Norwegian      Structure
      Binarize        Vision API      Dictionary
```

### OCR Provider Strategy
```python
class OCRService(Protocol):
    async def extract_text(self, image: bytes) -> str: ...

class TextractOCRService(OCRService):
    """Production: AWS Textract with table detection."""
    pass

class MockOCRService(OCRService):
    """Development: Returns fixture data for testing."""
    pass

class VisionOCRService(OCRService):
    """Alternative: Claude Vision API for complex receipts."""
    pass
```

### Receipt Structure Detection
```python
@dataclass
class ParsedReceipt:
    store_name: str
    store_address: Optional[str]
    org_number: Optional[str]
    date: date
    time: Optional[time]
    items: List[ParsedItem]
    subtotal: Optional[Decimal]
    discounts: List[Discount]
    total: Decimal
    payment_method: Optional[str]
    raw_text: str

@dataclass
class ParsedItem:
    name: str
    quantity: Decimal
    unit: Optional[str]  # "stk", "kg", "L"
    unit_price: Optional[Decimal]
    total_price: Decimal
    is_discount: bool
    is_deposit: bool
```

### Norwegian Text Normalization
```python
ABBREVIATION_MAP = {
    "TINE H-MLK": "Tine Helmelk",
    "LTT MLK": "Lettmelk",
    "KJØTTD": "Kjøttdeig",
    "KYLLINGF": "Kyllingfilet",
    "NORV": "Norvegia",
    "AGU": "Agurk",
    "TOM": "Tomat",
}

def normalize_item_name(raw_name: str) -> str:
    """Expand abbreviations and normalize case."""
    name = raw_name.upper()
    for abbrev, full in ABBREVIATION_MAP.items():
        name = name.replace(abbrev, full)
    return name.title()
```

### Price Line Parsing
```python
# Common patterns:
# "TINE MELK 1L         32,90"
# "KJØTTDEIG 400G   2   59,80"  (quantity × price)
# "RABATT               -5,00"
# "PANT 1 X 2,00         2,00"

PRICE_PATTERNS = [
    r"(?P<name>.+?)\s+(?P<qty>\d+)\s+(?P<price>\d+[,\.]\d{2})",
    r"(?P<name>.+?)\s+(?P<price>\d+[,\.]\d{2})",
    r"RABATT\s+(?P<discount>-?\d+[,\.]\d{2})",
    r"PANT\s+(?P<count>\d+)\s*[xX]\s*(?P<unit_price>\d+[,\.]\d{2})",
]
```

## Norway-Specific Considerations

### Receipt Formats by Chain

#### REMA 1000
```
REMA 1000
MAJORSTUA
ORG.NR: 947 942 527
---
TINE LETTMELK 1L              32,90
KJØTTDEIG 400G           2    59,80
RABATT KJØTTDEIG              -10,00
---
SUM                          82,70
```

#### Kiwi
```
KIWI 422 OSLO
---
FIRST PRICE BRØD               19,90
NORVEGIA 500G                  54,90
PANT 2 x 2,00                   4,00
---
Å BETALE                       78,80
```

#### Coop
```
COOP MEGA CITY SENTER
Medlemsnr: ****1234
---
PRIOR EPLER 1KG               29,90
  Coop pris:                  -5,00
GILDE PØLSER                  42,90
---
Total:                        67,80
```

### Character Handling
- **æ, ø, å**: Must preserve in item names
- **Ø vs 0**: Common OCR confusion
- **,** vs **.**: Norwegian uses comma for decimals

### Special Line Types
| Pattern | Meaning |
|---------|---------|
| RABATT | Discount (negative) |
| PANT | Bottle/can deposit |
| BONUS | Loyalty discount |
| TILBUD | Sale price |
| KAMPANJE | Campaign price |
| MEDLEM | Member price |

### Date Formats
- `dd.mm.yyyy` (standard)
- `dd.mm.yy` (abbreviated)
- `dd/mm/yyyy` (alternative)

## Dependencies

- AWS Textract or alternative OCR service
- Norwegian word dictionary for spellcheck
- Item canonicalization database

## Success Metrics

| Metric | Target |
|--------|--------|
| Character accuracy | > 98% |
| Item extraction accuracy | > 95% |
| Total amount accuracy | > 99% |
| Store detection accuracy | > 98% |
| Norwegian character accuracy | > 99% |

## Implementation Checklist

- [x] Abstract OCR service interface
- [x] Mock OCR service for development
- [x] Textract integration
- [x] Basic receipt parsing
- [x] Norwegian date format handling
- [x] PANT detection
- [x] RABATT handling
- [ ] Item name normalization
- [ ] Abbreviation expansion
- [ ] Store format templates
- [ ] OCR confidence scoring
- [ ] Fallback to manual entry
- [ ] Image preprocessing
- [ ] Multi-page receipt handling
