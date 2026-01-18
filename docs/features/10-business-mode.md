# 10: Business Mode

> ENK/SMB features with accounting export, tax compliance, and document retention.

## Status: Not Started

## One-liner

Professional expense tracking for Norwegian sole proprietors and small businesses with accounting system integration.

## User Stories

### Business Profiles
- **As a business owner**, I want a separate business profile so personal and business expenses are distinct.
- **As an ENK owner**, I want my organization number linked for compliance.
- **As a business**, I want multiple users with different roles (owner, accountant, employee).

### Expense Tracking
- **As a business user**, I want to categorize expenses for tax purposes.
- **As a business user**, I want to mark expenses as deductible or non-deductible.
- **As a business user**, I want to track MVA (VAT) for each expense.
- **As a business user**, I want to attach receipts to accounting entries.

### Reporting
- **As a business user**, I want expense reports by category for accounting.
- **As a business user**, I want MVA reports for skattemelding.
- **As a business user**, I want annual summaries for næringsoppgave.

### Accounting Integration
- **As a business user**, I want to export to Fiken so my accountant gets structured data.
- **As a business user**, I want to export to Tripletex for larger businesses.
- **As a business user**, I want SAF-T export for tax authorities.

### Compliance
- **As a business**, I want 5-year receipt retention per Norwegian law.
- **As a business**, I want audit-ready documentation.
- **As a business**, I want to prove expense legitimacy with metadata.

## Technical Approach

### Data Model
```python
class BusinessProfile:
    id: UUID
    user_id: UUID  # Owner
    name: str
    org_number: str  # Norwegian organization number
    business_type: str  # "ENK", "AS", "ANS", "DA"
    address: str
    created_at: datetime

class BusinessMember:
    business_id: UUID
    user_id: UUID
    role: str  # "owner", "admin", "accountant", "employee"
    can_approve_expenses: bool
    expense_limit: Optional[Decimal]

class BusinessExpense:
    id: UUID
    business_id: UUID
    receipt_id: UUID
    category: str  # Norwegian expense category (see below)
    subcategory: Optional[str]
    description: str
    amount_excl_mva: Decimal
    mva_amount: Decimal
    mva_rate: Decimal  # 0, 0.12, 0.15, 0.25
    is_deductible: bool
    deduction_percentage: Decimal  # 100% or partial
    created_by: UUID
    approved_by: Optional[UUID]
    approved_at: Optional[datetime]
    accounting_exported: bool
    export_reference: Optional[str]

class MVAReport:
    id: UUID
    business_id: UUID
    period: str  # "2024-T1" (termin)
    start_date: date
    end_date: date
    purchases_high: Decimal  # 25% MVA
    purchases_medium: Decimal  # 15% MVA
    purchases_low: Decimal  # 12% MVA
    purchases_exempt: Decimal  # 0% MVA
    total_mva_deductible: Decimal
    generated_at: datetime
```

### Norwegian Expense Categories
```python
BUSINESS_EXPENSE_CATEGORIES = {
    "6000": {
        "name": "Varekostnad",
        "description": "Cost of goods sold",
        "examples": ["Inventory", "Raw materials"]
    },
    "6300": {
        "name": "Leie lokaler",
        "description": "Rent",
        "mva_deductible": True
    },
    "6400": {
        "name": "Leie maskiner",
        "description": "Equipment lease",
        "mva_deductible": True
    },
    "6540": {
        "name": "Inventar",
        "description": "Office furniture",
        "mva_deductible": True
    },
    "6700": {
        "name": "Revisor, regnskap",
        "description": "Accounting services",
        "mva_deductible": True
    },
    "6800": {
        "name": "Kontorrekvisita",
        "description": "Office supplies",
        "mva_deductible": True
    },
    "6900": {
        "name": "Telefon, porto",
        "description": "Communication",
        "mva_deductible": True
    },
    "7100": {
        "name": "Bilkostnader",
        "description": "Vehicle expenses",
        "mva_deductible": "partial",
        "deduction_rules": "50% if mixed use"
    },
    "7140": {
        "name": "Reisekostnad",
        "description": "Travel expenses",
        "mva_deductible": True
    },
    "7350": {
        "name": "Representasjon",
        "description": "Entertainment",
        "mva_deductible": False,
        "notes": "Not deductible in Norway"
    },
    "7700": {
        "name": "Annen kostnad",
        "description": "Other expenses",
        "mva_deductible": True
    }
}
```

### Accounting Export Formats

#### Fiken API
```python
class FikenExporter:
    """Export to Fiken accounting system."""

    async def export_expense(self, expense: BusinessExpense) -> str:
        return await self.fiken_api.create_purchase(
            lines=[{
                "account": expense.category,
                "amount": expense.amount_excl_mva,
                "vatType": self._map_mva_rate(expense.mva_rate),
            }],
            payment_account="1920",  # Bank
            attachments=[expense.receipt.image_url]
        )
```

#### SAF-T Export
```python
class SAFTExporter:
    """
    Standard Audit File - Tax (Norwegian format).
    Required format for tax authority submissions.
    """

    def generate_saft_xml(self, business: BusinessProfile, year: int) -> str:
        # Generate compliant SAF-T XML
        pass
```

### Retention Policy
```python
class RetentionManager:
    """Ensure 5-year retention per Norwegian Bokføringsloven."""

    RETENTION_YEARS = 5

    async def check_deletable(self, receipt: Receipt) -> bool:
        if receipt.business_expense:
            years_old = (date.today() - receipt.date).days / 365
            return years_old > self.RETENTION_YEARS
        return True  # Personal receipts can be deleted anytime
```

## Norway-Specific Considerations

### Business Types
| Type | Description | Accounting Requirements |
|------|-------------|------------------------|
| ENK | Sole proprietor | Simplified bookkeeping OK |
| AS | Limited company | Full accounting required |
| ANS/DA | Partnership | Full accounting required |

### MVA (VAT) Rates
| Rate | Category |
|------|----------|
| 25% | Standard rate |
| 15% | Food and beverages |
| 12% | Transport, cinema, hotels |
| 0% | Exempt (healthcare, education) |

### Key Compliance
- **Bokføringsloven**: 5-year retention
- **Skattemelding**: Annual tax return
- **Næringsoppgave**: Business income statement
- **MVA-melding**: VAT return (2-monthly or annual)
- **A-melding**: Payroll reporting (monthly)

### Altinn Integration
- Altinn is the government portal for business reporting
- Could integrate for direct submission
- Requires business authentication (Altinn/ID-porten)

## Dependencies

- [01-receipt-vault.md](./01-receipt-vault.md) - Receipt storage
- [09-auth-security.md](./09-auth-security.md) - Business user auth
- Accounting system APIs (Fiken, Tripletex)

## Success Metrics

| Metric | Target |
|--------|--------|
| Business profile creation | Track adoption |
| Expense categorization accuracy | > 90% |
| MVA calculation accuracy | 100% |
| Export success rate | > 99% |
| Retention compliance | 100% |

## Implementation Checklist

- [ ] Business profile creation
- [ ] Organization number validation
- [ ] Multi-user business access
- [ ] Expense categorization system
- [ ] MVA tracking and calculation
- [ ] Deductibility rules engine
- [ ] Expense approval workflow
- [ ] Fiken export integration
- [ ] Tripletex export integration
- [ ] SAF-T export
- [ ] MVA period reports
- [ ] Annual summary reports
- [ ] 5-year retention enforcement
- [ ] Audit trail logging
