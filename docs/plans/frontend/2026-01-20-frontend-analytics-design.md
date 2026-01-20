# Frontend Analytics Design

**Date:** 2026-01-20
**Phase:** 6 Frontend
**Goal:** Dashboard cards with key metrics and expandable details

## Overview

Enhance existing `/analytics` page with dashboard cards showing cost-per-meal, waste tracking, spend trends, and restock predictions. Mobile-friendly cards with tap-to-expand details.

## Dashboard Layout

```
┌─────────────────┐ ┌─────────────────┐
│  Cost Per Meal  │ │   Waste Score   │
│    kr 45.20     │ │    2 items      │
│   avg/serving   │ │   this month    │
└─────────────────┘ └─────────────────┘
┌─────────────────┐ ┌─────────────────┐
│  Spend Trend    │ │  Restock Soon   │
│   ↓ 12% vs      │ │   3 items       │
│   last week     │ │   running low   │
└─────────────────┘ └─────────────────┘
```

## Components

| Component | Purpose |
|-----------|---------|
| StatCard | Reusable card: title, value, subtitle, trend |
| CostPerMealCard | Avg cost, expandable meal list |
| WasteCard | Waste count/value, expandable details |
| SpendTrendCard | Trend direction, expandable breakdown |
| RestockCard | Low stock items, expandable predictions |

## Page Enhancement

Single page `/analytics` with:
- Period selector (This week / This month / Last 30 days)
- 2x2 card grid (responsive: stack on mobile)
- Tap card to expand details inline

## Detail Views (Expanded State)

### Cost Per Meal
- List of cooked meals with cost
- Columns: recipe name, servings, total cost, cost/serving
- Sortable by date or cost

### Waste
- Two tabs: "Inventory" | "Leftovers"
- Inventory: ingredient, quantity discarded, estimated value
- Leftovers: recipe, servings wasted, date

### Spend Trend
- Bar list showing periods
- Each row: period, receipt spend, meal cost
- Granularity toggle: Daily / Weekly / Monthly

### Restock Predictions
- Sorted by days until empty
- Columns: ingredient, current qty, runout date
- Color coding: red (<3d), yellow (3-7d), green (>7d)

## API Integration

```typescript
getCostPerMeal(householdId, startDate?, endDate?)
getWasteAnalytics(householdId, startDate?, endDate?)
getSpendTrend(householdId, startDate, endDate, granularity)
getRestockPredictions(householdId)
```

## Data Fetching

- Parallel fetch all 4 endpoints on page load
- Loading skeleton for each card
- Error state per card (don't fail entire page)
- Period change triggers refetch
