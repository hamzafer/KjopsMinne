# 03: Bank Integration

> Connect to Norwegian banks via PSD2 for automatic transaction import.

## Status: Not Started

## One-liner

Secure bank connectivity using PSD2 Account Information Services to aggregate transactions from all Norwegian banks.

## User Stories

### Account Connection
- **As a user**, I want to connect my bank accounts so transactions are imported automatically.
- **As a user**, I want to see all my accounts in one place so I have a complete financial picture.
- **As a user**, I want to reconnect expired consents easily so my data stays current.

### Transaction Import
- **As a user**, I want daily transaction syncs so my data is always up to date.
- **As a user**, I want historical transactions imported so I can analyze past spending.
- **As a user**, I want to see pending transactions so I know what's coming.

### Account Management
- **As a user**, I want to disconnect banks anytime so I control my data.
- **As a user**, I want to see which banks are connected so I know my integration status.
- **As a user**, I want to exclude specific accounts so I only track what matters.

## Technical Approach

### PSD2 AIS Architecture
```
User → Kvitteringshvelv → Aggregator API → Bank APIs
                ↓
        Consent Management
                ↓
        Transaction Storage
```

### Aggregator Options
1. **Neonomics** - Norwegian-focused, good DNB/Nordea coverage
2. **Tink** - European scale, acquired by Visa
3. **Enable Banking** - Nordic focus, direct bank connections

### Data Model
```python
class BankConnection:
    id: UUID
    user_id: UUID
    provider: str  # "neonomics", "tink"
    consent_id: str
    consent_expires: datetime
    status: str  # "active", "expired", "revoked"

class BankAccount:
    id: UUID
    connection_id: UUID
    account_number_masked: str  # "****1234"
    account_type: str  # "checking", "savings", "credit"
    currency: str
    balance: Decimal
    balance_updated: datetime

class BankTransaction:
    id: UUID
    account_id: UUID
    transaction_id: str  # From bank
    date: date
    amount: Decimal
    currency: str
    description: str
    merchant_name: Optional[str]
    category: Optional[str]  # Bank's categorization
    status: str  # "pending", "booked"
```

### Consent Flow
1. User initiates connection
2. Redirect to bank for authentication (BankID)
3. User grants AIS consent (90-day max in PSD2)
4. Store consent token securely
5. Sync transactions on consent grant
6. Schedule daily syncs
7. Re-consent before expiry

### Sync Strategy
- Initial: Fetch 90 days history
- Ongoing: Daily incremental sync
- On-demand: User can trigger manual sync
- Background job with retry logic

## Norway-Specific Considerations

### Norwegian Banks
| Bank | PSD2 Status | API Quality |
|------|-------------|-------------|
| DNB | Available | Good |
| Nordea | Available | Good |
| SpareBank 1 | Available | Varies |
| Handelsbanken | Available | Basic |
| Sbanken | Available | Excellent |
| Danske Bank | Available | Good |

### BankID Integration
- All Norwegian banks require BankID for consent
- BankID on mobile preferred flow
- Session timeout considerations

### Transaction Descriptions
- Norwegian format: "Varekjøp REMA 1000 Oslo"
- Parse merchant names from descriptions
- Handle Vipps transaction format

### Regulatory Compliance
- PSD2 SCA requirements
- 90-day consent renewal
- GDPR data handling
- Finanstilsynet registration (if operating as AISP)

## Dependencies

- [09-auth-security.md](./09-auth-security.md) - BankID authentication
- PSD2 aggregator partnership
- Secure token storage

## Success Metrics

| Metric | Target |
|--------|--------|
| Bank connection success rate | > 95% |
| Consent renewal rate | > 80% |
| Transaction sync latency | < 1 hour |
| Coverage of Norwegian banks | > 90% |

## Implementation Checklist

- [ ] Aggregator selection and contract
- [ ] Consent flow implementation
- [ ] Transaction sync pipeline
- [ ] Account data model
- [ ] Consent renewal automation
- [ ] Error handling and retry logic
- [ ] Bank connection UI
- [ ] Transaction display
- [ ] Manual sync trigger
- [ ] Multi-bank support
