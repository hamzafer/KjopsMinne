# Analytics Dashboard

Visual spending analysis with charts and insights.

## Components

| Component | Chart Type | Data Source |
|-----------|------------|-------------|
| SummaryStats | Count-up numbers | `/api/analytics/summary` |
| CategoryCard | Donut chart | `/api/analytics/by-category` |
| SpendTrendCard | Area chart | `/api/analytics/spend-trend` |
| TopItemsCard | Horizontal bar | `/api/analytics/top-items` |
| StoreCard | Vertical bar | `/api/analytics/by-store` |
| CostPerMealCard | List | `/api/analytics/cost-per-meal` |
| WasteCard | List | `/api/analytics/waste` |
| RestockCard | List | `/api/analytics/restock-predictions` |

## Period Selection

Three time periods available:
- **This week** - Last 7 days
- **This month** - Current calendar month
- **Last 30 days** - Rolling 30-day window

## Store Colors

Norwegian grocery chains have brand colors:

| Store | Color |
|-------|-------|
| REMA 1000 | Orange |
| Kiwi | Green |
| Meny | Red |
| Coop | Green |
| Bunnpris | Blue |
| Other | Fjord blue |

## Files

```
frontend/src/components/analytics/
├── CategoryCard.tsx
├── CostPerMealCard.tsx
├── RestockCard.tsx
├── SpendTrendCard.tsx
├── StoreCard.tsx
├── SummaryStats.tsx
├── TopItemsCard.tsx
├── WasteCard.tsx
├── StatCard.tsx
└── index.ts
```

## Tech

- Recharts for all visualizations
- Fraunces display font for big numbers
- Staggered fade-in animations
- Dark mode support
