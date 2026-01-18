# 06: Household

> Multi-user accounts with sharing, collaboration, and expense splitting.

## Status: Not Started

## One-liner

Collaborative household finance tracking with shared receipts, expense splits, and family budgeting.

## User Stories

### Household Setup
- **As a user**, I want to create a household so my family can share receipt data.
- **As a user**, I want to invite family members via email so they can join my household.
- **As a user**, I want different roles (admin, member) so I control who can manage settings.

### Shared Receipts
- **As a household member**, I want to see all household receipts so we have a complete picture.
- **As a user**, I want to mark receipts as personal or shared so privacy is maintained.
- **As a user**, I want to see who uploaded each receipt so I know the source.

### Expense Splitting
- **As a user**, I want to split receipts between household members so costs are fair.
- **As a user**, I want different split methods (equal, percentage, custom) so I have flexibility.
- **As a user**, I want to track who owes whom so settlements are clear.
- **As a user**, I want recurring split rules for regular expenses so setup is minimal.

### Shared Budgets
- **As a household**, we want category budgets so we manage spending together.
- **As a user**, I want to see household vs. personal spending separately.
- **As a household**, we want alerts when approaching budget limits.

### Shared Analytics
- **As a household**, we want combined spending analytics.
- **As a household**, we want to compare individual vs. household spending patterns.

## Technical Approach

### Data Model
```python
class Household:
    id: UUID
    name: str
    created_by: UUID
    created_at: datetime

class HouseholdMember:
    household_id: UUID
    user_id: UUID
    role: str  # "admin", "member"
    joined_at: datetime
    invited_by: UUID

class HouseholdInvite:
    id: UUID
    household_id: UUID
    email: str
    invited_by: UUID
    expires_at: datetime
    accepted: bool

class ReceiptShare:
    receipt_id: UUID
    household_id: UUID
    visibility: str  # "shared", "private"
    uploaded_by: UUID

class ExpenseSplit:
    id: UUID
    receipt_id: UUID
    household_id: UUID
    split_method: str  # "equal", "percentage", "custom"
    created_by: UUID

class ExpenseSplitShare:
    split_id: UUID
    user_id: UUID
    amount: Decimal
    percentage: Optional[Decimal]
    settled: bool
    settled_at: Optional[datetime]

class SplitRule:
    id: UUID
    household_id: UUID
    name: str
    conditions: dict  # Store, category, amount range triggers
    split_method: str
    shares: List[dict]  # User percentages
```

### Access Control
```python
def can_view_receipt(user: User, receipt: Receipt) -> bool:
    # Own receipt
    if receipt.user_id == user.id:
        return True

    # Shared in same household
    share = get_receipt_share(receipt.id)
    if share and share.visibility == "shared":
        return is_household_member(user.id, share.household_id)

    return False
```

### Settlement Tracking
```
1. Receipt split creates debt records
2. Users mark settlements manually
3. Optional: Vipps integration for actual transfers
4. Running balance between household members
```

## Norway-Specific Considerations

### Household Patterns
- **Samboere**: Unmarried cohabitants (common in Norway)
- **Familie**: Nuclear family with children
- **Kollektiv**: Shared housing with roommates
- Different expense expectations per type

### Common Split Scenarios
- Groceries: Equal split for shared household
- Personal items: Individual responsibility
- Utilities: Included in rent or split equally
- Subscriptions: Often one person pays, gets reimbursed

### Vipps Integration
- Vipps is ubiquitous for P2P payments in Norway
- Could enable "settle via Vipps" feature
- Request money for outstanding balances

### GDPR Considerations
- Household data shared among members
- Right to leave household and take personal data
- Clear consent for data sharing

## Dependencies

- [01-receipt-vault.md](./01-receipt-vault.md) - Receipt data
- [09-auth-security.md](./09-auth-security.md) - User authentication

## Success Metrics

| Metric | Target |
|--------|--------|
| Households with 2+ active members | Track adoption |
| Receipt share rate | > 50% of household receipts |
| Split usage rate | > 30% of shared receipts |
| Settlement completion rate | > 80% within 30 days |

## Implementation Checklist

- [ ] Household creation and management
- [ ] Member invitation system
- [ ] Role-based access control
- [ ] Receipt sharing visibility
- [ ] Expense split creation
- [ ] Split method options
- [ ] Balance tracking
- [ ] Settlement marking
- [ ] Split rules automation
- [ ] Household budgets
- [ ] Combined analytics view
