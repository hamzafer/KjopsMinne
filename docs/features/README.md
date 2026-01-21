# Kvitteringshvelv Feature Roadmap

> "Receipt Vault" - A comprehensive Norwegian receipt digitization and financial intelligence platform.

## Vision

Kvitteringshvelv transforms paper and digital receipts into actionable financial intelligence. By combining OCR, meal planning, and inventory tracking, we create a unified view of household spending with item-level granularity and cost-per-meal analytics.

## Feature Overview

| # | Feature | Description | Status |
|---|---------|-------------|--------|
| 01 | [Receipt Vault](./01-receipt-vault.md) | Core receipt storage, search, and export | In Progress |
| 02 | [Warranty & Returns](./02-warranty-returns.md) | Track warranties and return windows | Not Started |
| 03 | [Bank Integration](./03-bank-integration.md) | PSD2 AIS connectivity for transaction aggregation | Not Started |
| 04 | [Transaction Matching](./04-transaction-matching.md) | Reconcile receipts with bank transactions | Not Started |
| 05 | [Grocery Intelligence](./05-grocery-intelligence.md) | Item-level analytics, unit prices, trends | In Progress |
| 06 | [Household](./06-household.md) | Multi-user accounts, sharing, expense splits | Implemented |
| 07 | [Norwegian OCR](./07-norwegian-ocr.md) | OCR strategy with Norwegian normalization | In Progress |
| 08 | [Integrations](./08-integrations.md) | REMA API, Trumf, Coop, Vipps connections | Not Started |
| 09 | [Auth & Security](./09-auth-security.md) | BankID login, PSD2/SCA compliance | Not Started |
| 10 | [Business Mode](./10-business-mode.md) | ENK/SMB features, accounting export | Not Started |
| 11 | [Internationalization](./11-i18n.md) | Multi-language support (Norwegian, English) | Implemented |
| 12 | [Meal Planning](./12-meal-planning.md) | Weekly meal planning with recipes | Implemented |
| 13 | [Recipes](./13-recipes.md) | Recipe management with URL import | Implemented |
| 14 | [Shopping Lists](./14-shopping-lists.md) | Auto-generated shopping lists from meal plans | Implemented |
| 15 | [Inventory](./15-inventory.md) | Ingredient tracking with FIFO cost | Implemented |
| 16 | [Leftovers](./16-leftovers.md) | Leftover tracking and waste analytics | Implemented |

## Implementation Phases

### Phase 1: Foundation (Complete)
- Receipt upload and OCR processing
- Basic categorization and analytics
- Norwegian language support
- Household management

### Phase 2: Meal Planning (Complete)
- Recipe import from URLs (LLM parsing)
- Weekly meal planning
- Shopping list generation
- Inventory tracking with FIFO cost

### Phase 3: Intelligence (In Progress)
- Advanced grocery analytics
- Price tracking and trends
- Waste analytics
- Restock predictions

### Phase 4: Integration (Planned)
- Bank connectivity via PSD2
- Transaction matching
- Retail loyalty program APIs

### Phase 5: Business (Planned)
- Business accounting features
- Warranty tracking
- Multi-user roles

## Architecture Principles

1. **Norway-first**: NOK currency, nb-NO localization, Norwegian retail context
2. **Privacy by design**: Minimal data collection, local-first where possible
3. **Pluggable OCR**: Abstract OCR interface supporting multiple providers
4. **Async-native**: All database operations use async patterns
5. **Type-safe**: Full TypeScript frontend, typed Python backend
6. **FIFO cost tracking**: Accurate ingredient costs using oldest-first consumption

## Success Metrics

- Receipt processing accuracy > 95%
- Item categorization accuracy > 90%
- Recipe import success rate > 80%
- Inventory match rate > 85%
- User retention at 30 days > 40%
