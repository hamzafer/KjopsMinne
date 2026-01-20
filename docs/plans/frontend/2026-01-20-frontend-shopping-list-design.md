# Frontend Shopping List Design

**Date:** 2026-01-20
**Phase:** 5 Frontend
**Goal:** Supermarket-optimized shopping list UI

## Overview

Shopping list frontend focused on in-store use with large touch targets, swipe gestures, and offline support. Lists are generated from the meal plan page for simplicity.

## User Flow

1. User views weekly meal plan at `/plan`
2. Clicks "Generate Shopping List" button
3. System generates list from planned meals, checking inventory
4. User navigates to `/shopping/[id]` for supermarket mode
5. User checks items while shopping (tap or swipe)
6. Marks list complete when done

## Components

| Component | Purpose |
|-----------|---------|
| ShoppingListCard | Preview card: name, date range, progress |
| ShoppingListItem | Row with large checkbox, ingredient, quantity |
| ShoppingListView | Main view grouped by category |
| GenerateButton | Button on meal plan page |

## Pages

- `/shopping` - List of shopping lists (active first)
- `/shopping/[id]` - Supermarket mode view

## Supermarket Mode UX

- **Large touch targets:** 48px+ checkboxes
- **Swipe right:** Check item off
- **Category grouping:** Matches store layout (Meieri, Kjøtt, etc.)
- **Auto-sort:** Unchecked first, checked move to bottom
- **Progress bar:** Shows X of Y items completed
- **Sticky headers:** Category dividers pin while scrolling

## Item Display

```
┌─────────────────────────────────────┐
│ [✓]  Melk                    2 liter│
│ [ ]  Smør                    250 g  │
│ [ ]  Ost, hvit              400 g  │
└─────────────────────────────────────┘
```

## Interactions

- Tap row → toggle checkbox
- Swipe right → check item
- Long press → show details (meals needing this, notes)
- Pull down → refresh from server

## Offline Support

- Cache active list in localStorage
- Queue check/uncheck operations
- Sync when back online
- Optimistic UI updates

## API Integration

```typescript
getShoppingLists(householdId, status?)
getShoppingList(id)
generateShoppingList(householdId, startDate, endDate, name?)
updateShoppingList(id, { name?, status? })
updateShoppingListItem(listId, itemId, { is_checked?, notes? })
deleteShoppingList(id)
```

## Completion Flow

1. All items checked → prompt "Mark as Complete?"
2. User confirms → status changes to "completed"
3. List moves to completed section on `/shopping`
