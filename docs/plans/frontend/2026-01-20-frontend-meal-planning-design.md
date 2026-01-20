# Frontend Meal Planning Feature Design

**Date:** 2026-01-20
**Status:** Approved
**Scope:** Meal planning calendar UI with cook actions and leftovers tracking

## Overview

Add meal planning pages to the frontend. Users can plan meals on a weekly calendar, mark them as cooked (consuming inventory), and track leftovers.

## Page Structure

```
frontend/src/app/[locale]/plan/
├── page.tsx              # Weekly calendar with meal slots
└── add/page.tsx          # Add meal form (select recipe, date, servings)

frontend/src/app/[locale]/leftovers/
└── page.tsx              # List of leftovers with status actions
```

**Routes:**
- `/plan` - Weekly calendar showing 7 days, 3 meal slots each (breakfast, lunch, dinner)
- `/plan/add?date=YYYY-MM-DD&meal=lunch` - Add meal with optional pre-filled date/type
- `/leftovers` - Grid of leftover cards with consume/discard actions

**Navigation:** Add "Plan" link after "Recipes" and "Leftovers" after "Plan".

## Components

```
frontend/src/components/meal-plan/
├── WeeklyCalendar.tsx    # 7-column grid with date headers
├── DayColumn.tsx         # Single day with 3 meal slots
├── MealSlot.tsx          # Single meal slot (empty or with meal card)
├── MealCard.tsx          # Compact card showing recipe name, servings
├── MealDetail.tsx        # Expanded view with cook/skip actions
├── AddMealForm.tsx       # Form: recipe select, date, meal type, servings
├── LeftoverCard.tsx      # Card showing recipe, servings, expiry
└── LeftoverList.tsx      # Grid of leftover cards
```

**Key patterns:**
- `WeeklyCalendar` shows current week by default with prev/next navigation
- `MealSlot` is clickable - empty slots link to add page, filled slots expand detail
- `MealDetail` shows recipe info with "Cook" and "Skip" buttons
- `AddMealForm` has recipe search/select dropdown
- All components use existing Tailwind classes and dark mode

## API Integration

**Types:**
```typescript
interface MealPlan {
  id: string;
  household_id: string;
  recipe_id: string;
  planned_date: string;
  meal_type: "breakfast" | "lunch" | "dinner";
  servings: number;
  status: "planned" | "cooked" | "skipped";
  is_leftover_source: boolean;
  leftover_from_id: string | null;
  cooked_at: string | null;
  actual_cost: number | null;
  cost_per_serving: number | null;
  recipe: Recipe | null;
}

interface Leftover {
  id: string;
  household_id: string;
  meal_plan_id: string;
  recipe_id: string;
  remaining_servings: number;
  status: "available" | "consumed" | "discarded";
  expires_at: string;
  created_at: string;
}

interface CookRequest {
  actual_servings?: number;
  create_leftover: boolean;
  leftover_servings?: number;
}
```

**API methods:**
- `api.getMealPlans(householdId, startDate, endDate)` → MealPlan[]
- `api.createMealPlan(data)` → MealPlan
- `api.updateMealPlan(id, data)` → MealPlan
- `api.deleteMealPlan(id)` → void
- `api.cookMealPlan(id, data)` → CookResponse
- `api.getLeftovers(householdId, status?)` → Leftover[]
- `api.updateLeftover(id, data)` → Leftover

## Loading & Error States

**Loading:**
- `WeeklyCalendar`: Skeleton grid (7 columns × 3 rows)
- `LeftoverList`: Skeleton cards

**Errors:**
- Failed fetch: Inline error with retry button
- Cook failure: Toast with error message

**Empty states:**
- No meals this week: "No meals planned" + "Plan a meal" button
- No leftovers: "No leftovers" + explanatory text

## Translations

Add `MealPlan` and `Leftovers` namespaces to messages files:
- Page titles, button labels, meal types
- Status labels, empty states, error messages
- Cook dialog labels

## Tech Stack

- Next.js 15 App Router
- Tailwind CSS with existing design tokens
- next-intl for i18n (nb/en)
- lucide-react for icons
- Existing `cn()` utility for dark mode
