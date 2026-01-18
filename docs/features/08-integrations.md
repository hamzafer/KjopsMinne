# 08: Integrations

> Connect to Norwegian retail APIs for enhanced data and functionality.

## Status: Not Started

## One-liner

Native integrations with Norwegian grocery chains, loyalty programs, and payment providers for automatic receipt capture.

## User Stories

### Digital Receipts
- **As a user**, I want digital receipts from REMA auto-imported so I don't photograph paper.
- **As a user**, I want Coop digital receipts synced automatically.
- **As a user**, I want to connect my loyalty accounts once and get receipts forever.

### Loyalty Programs
- **As a user**, I want to see my Trumf points balance so I track rewards.
- **As a user**, I want to see my Coop membership savings.
- **As a user**, I want all loyalty data in one place.

### Price Data
- **As a user**, I want current prices from stores so I can compare before shopping.
- **As a user**, I want to see weekly tilbudsavis (flyers) for my regular stores.
- **As a user**, I want price drop alerts for items I buy regularly.

### Payment Integration
- **As a user**, I want Vipps receipts captured automatically.
- **As a user**, I want to pay household members via Vipps for expense splits.

## Technical Approach

### Integration Architecture
```
External APIs → Adapter Layer → Unified Data Model → Application

┌──────────────────────────────────────────────────────┐
│                   Integration Hub                     │
├──────────────┬───────────────┬───────────────────────┤
│  Receipt     │   Loyalty     │   Price               │
│  Providers   │   Programs    │   Data                │
├──────────────┼───────────────┼───────────────────────┤
│ • REMA ÆPP   │ • Trumf       │ • Prisjeger           │
│ • Coop App   │ • Coop        │ • Kassalapp           │
│ • Kiwi App   │ • SAS EuroB.  │ • Store APIs          │
│ • Vipps      │ • Circle K    │                       │
└──────────────┴───────────────┴───────────────────────┘
```

### Data Model
```python
class IntegrationConnection:
    id: UUID
    user_id: UUID
    provider: str  # "trumf", "coop", "rema"
    access_token: str  # Encrypted
    refresh_token: Optional[str]
    token_expires: datetime
    status: str  # "active", "expired", "revoked"
    last_sync: datetime

class DigitalReceipt:
    id: UUID
    connection_id: UUID
    external_id: str  # Provider's receipt ID
    store_name: str
    purchase_date: datetime
    total: Decimal
    items: List[dict]  # Provider's item format
    raw_data: dict  # Original API response
    imported_at: datetime
    receipt_id: Optional[UUID]  # Linked local receipt

class LoyaltyAccount:
    connection_id: UUID
    member_number: str
    points_balance: int
    tier: Optional[str]
    savings_ytd: Decimal
    last_updated: datetime
```

### Provider Implementations

#### Trumf (NorgesGruppen)
```python
class TrumfIntegration:
    """
    Covers: Kiwi, Meny, Spar, Joker, Narvesen
    API: OAuth 2.0 via NorgesGruppen ID
    Data: Receipts, points, personal offers
    """

    async def authenticate(self, username: str, password: str) -> Token:
        # Login to NorgesGruppen ID
        pass

    async def get_receipts(self, from_date: date) -> List[DigitalReceipt]:
        # Fetch purchase history
        pass

    async def get_points_balance(self) -> int:
        pass
```

#### Coop
```python
class CoopIntegration:
    """
    Covers: Coop Prix, Extra, Mega, Obs, Marked
    API: Coop Member API
    Data: Receipts, member savings, purchase history
    """

    async def authenticate(self, member_number: str, password: str) -> Token:
        pass

    async def get_receipts(self, from_date: date) -> List[DigitalReceipt]:
        pass

    async def get_savings(self) -> CoopSavings:
        pass
```

#### REMA 1000
```python
class RemaIntegration:
    """
    Covers: REMA 1000 (Æ app)
    API: ÆPP API (reverse-engineered)
    Data: Receipts, Æ savings, bonus
    """
    pass
```

### Sync Strategy
```
1. Initial sync: Import all historical receipts (up to provider limit)
2. Scheduled sync: Daily fetch of new receipts
3. On-demand: User can trigger manual sync
4. Deduplication: Match digital receipts with uploaded photos
```

## Norway-Specific Considerations

### Major Players

| Provider | Loyalty | Digital Receipts | API Status |
|----------|---------|------------------|------------|
| NorgesGruppen (Trumf) | Yes | Via app | Unofficial |
| Coop | Yes | Via app | Unofficial |
| REMA 1000 | Æ | Via Æ app | Unofficial |
| Bunnpris | No | No | N/A |
| Europris | No | No | N/A |

### Legal Considerations
- No official APIs; would use reverse-engineered endpoints
- Terms of Service compliance
- User credentials stored securely
- User consent for data access

### Price Comparison Services
- **Prisjeger**: Aggregated grocery prices
- **Kassalapp**: Receipt scanning and comparison
- **Matpriser.no**: Historical price tracking

### Vipps Integration
- Vipps eCom for payment receipts
- Vipps Login for authentication
- Vipps Request for household settlements

## Dependencies

- [01-receipt-vault.md](./01-receipt-vault.md) - Receipt storage
- [04-transaction-matching.md](./04-transaction-matching.md) - Match digital receipts
- [09-auth-security.md](./09-auth-security.md) - Secure credential storage

## Success Metrics

| Metric | Target |
|--------|--------|
| Integration connection rate | > 30% of users |
| Auto-import receipt rate | > 50% of purchases |
| Sync success rate | > 95% |
| Digital receipt coverage | > 60% of grocery spend |

## Implementation Checklist

- [ ] Integration framework architecture
- [ ] Trumf API integration
- [ ] Coop API integration
- [ ] REMA Æ integration
- [ ] Digital receipt import pipeline
- [ ] Deduplication with photo receipts
- [ ] Loyalty point tracking
- [ ] Price data aggregation
- [ ] Vipps receipt capture
- [ ] Sync scheduling and monitoring
- [ ] Error handling and retry
