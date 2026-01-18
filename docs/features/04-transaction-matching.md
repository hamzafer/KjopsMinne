# 04: Transaction Matching

> Automatically reconcile receipts with bank transactions for complete financial records.

## Status: Not Started

## One-liner

Intelligent matching of uploaded receipts to bank transactions, filling in item-level detail for card purchases.

## User Stories

### Automatic Matching
- **As a user**, I want receipts auto-matched to transactions so I don't do manual linking.
- **As a user**, I want to see match confidence so I can verify uncertain matches.
- **As a user**, I want unmatched transactions highlighted so I know what receipts are missing.

### Manual Reconciliation
- **As a user**, I want to manually link receipts to transactions when auto-match fails.
- **As a user**, I want to split transactions across multiple receipts so complex purchases are tracked.
- **As a user**, I want to unmatch incorrectly linked items so I can fix mistakes.

### Coverage Insights
- **As a user**, I want to see my "receipt coverage" percentage so I know how complete my records are.
- **As a user**, I want suggestions for missing receipts so I can improve coverage.
- **As a user**, I want to mark transactions as "no receipt expected" so cash/ATM withdrawals don't skew stats.

## Technical Approach

### Matching Algorithm
```
1. Exact match: Same amount, same date, same merchant
2. Fuzzy match: Same amount, ±1 day, similar merchant name
3. Amount cluster: Same date, amounts within 5% (for tip variance)
4. Manual queue: No confident match found
```

### Match Scoring
```python
def calculate_match_score(receipt: Receipt, transaction: BankTransaction) -> float:
    score = 0.0

    # Amount match (40% weight)
    if receipt.total == transaction.amount:
        score += 0.40
    elif abs(receipt.total - transaction.amount) / transaction.amount < 0.05:
        score += 0.30  # Within 5% (tips, rounding)

    # Date match (30% weight)
    date_diff = abs((receipt.date - transaction.date).days)
    if date_diff == 0:
        score += 0.30
    elif date_diff == 1:
        score += 0.20  # Settlement delay
    elif date_diff <= 3:
        score += 0.10

    # Merchant match (30% weight)
    merchant_similarity = fuzzy_match(receipt.store_name, transaction.merchant_name)
    score += 0.30 * merchant_similarity

    return score
```

### Data Model
```python
class TransactionMatch:
    id: UUID
    receipt_id: UUID
    transaction_id: UUID
    match_score: float
    match_type: str  # "auto", "manual"
    matched_at: datetime
    matched_by: Optional[UUID]  # User ID if manual

class UnmatchedTransaction:
    transaction_id: UUID
    receipt_expected: bool  # False for ATM, transfers, etc.
    suggested_receipts: List[UUID]
```

### Merchant Name Normalization
```python
MERCHANT_ALIASES = {
    "REMA 1000": ["REMA", "REMA1000", "REMA 1000 *"],
    "KIWI": ["KIWI MINIPRIS", "KIWI *"],
    "COOP": ["COOP PRIX", "COOP EXTRA", "COOP MEGA", "COOP OBS"],
    # ... more mappings
}
```

## Norway-Specific Considerations

### Transaction Description Parsing
- Format: `Varekjøp [MERCHANT] [LOCATION]`
- Vipps: `Vipps*[MERCHANT]`
- Card: `Visa/Mastercard [MERCHANT]`

### Settlement Timing
- Weekend purchases may settle Monday
- Holiday delays (17. mai, Christmas)
- Cross-midnight purchases

### Cash Transactions
- Identify ATM withdrawals (`Minibank`, `Kontantuttak`)
- Unreceipted by default, trackable if desired

### Common Merchant Variations
| Receipt | Bank Transaction |
|---------|-----------------|
| REMA 1000 Majorstuen | REMA 1000 OSLO |
| Kiwi 422 | KIWI MINIPRIS |
| Coop Mega | COOP MEGA AS |

## Dependencies

- [01-receipt-vault.md](./01-receipt-vault.md) - Receipt data
- [03-bank-integration.md](./03-bank-integration.md) - Transaction data

## Success Metrics

| Metric | Target |
|--------|--------|
| Auto-match rate | > 70% |
| Auto-match accuracy | > 95% |
| Time to match (p95) | < 1 second |
| Receipt coverage (matched/total) | Track |

## Implementation Checklist

- [ ] Match scoring algorithm
- [ ] Merchant name normalization
- [ ] Auto-matching pipeline
- [ ] Manual match UI
- [ ] Unmatched transaction queue
- [ ] Match review/correction
- [ ] Coverage dashboard
- [ ] Transaction split support
- [ ] "No receipt expected" marking
