# Frontend Recipes Feature Design

**Date:** 2026-01-20
**Status:** Approved
**Scope:** Full recipe management UI (library, import, create, edit, detail)

## Overview

Add recipe management pages to the frontend, following existing design patterns. This is the foundation for meal planning - users need recipes before they can plan meals.

## Page Structure

```
frontend/src/app/[locale]/recipes/
├── page.tsx              # Library - grid of cards with search/filter
├── [id]/page.tsx         # Detail view - full recipe with ingredients
├── [id]/edit/page.tsx    # Edit existing recipe
├── import/page.tsx       # URL import flow with preview/edit
└── new/page.tsx          # Manual creation form
```

**Routes:**
- `/recipes` - Main library with search box and tag filters
- `/recipes/import` - Paste URL → preview extracted data → edit → save
- `/recipes/new` - Empty form for manual entry
- `/recipes/[id]` - Read-only detail with "Edit" and "Plan Meal" buttons
- `/recipes/[id]/edit` - Same form as /new but pre-filled

**Navigation:** Add "Recipes" link to Navigation component between "Receipts" and "Analytics".

## Components

```
frontend/src/components/recipes/
├── RecipeCard.tsx        # Grid card: image, name, servings, tags, time
├── RecipeGrid.tsx        # Responsive grid wrapper with empty state
├── RecipeSearch.tsx      # Search input + tag filter chips
├── RecipeForm.tsx        # Shared form for create/edit
├── IngredientInput.tsx   # Single ingredient row: quantity, unit, name, notes
├── IngredientList.tsx    # List of IngredientInput with add/remove
├── ImportPreview.tsx     # Shows extracted recipe data with edit capability
└── RecipeDetail.tsx      # Full recipe view with ingredient table
```

**Key patterns:**
- `RecipeForm` reused by both `/new` and `/[id]/edit`
- `ImportPreview` wraps `RecipeForm` with "fetching" state and confidence indicators
- `RecipeCard` links to detail page, shows placeholder if no image
- All components use existing Tailwind classes and dark mode support via `cn()` utility

## API Integration

**Types:**
```typescript
interface Recipe {
  id: string;
  name: string;
  source_url: string | null;
  servings: number;
  prep_time_minutes: number | null;
  instructions: string;
  tags: string[];
  image_url: string | null;
  import_confidence: number | null;
  ingredients: RecipeIngredient[];
}

interface RecipeIngredient {
  id: string;
  ingredient_id: string | null;
  ingredient_name: string;
  quantity: number;
  unit: string;
  notes: string | null;
}
```

**API methods:**
- `api.getRecipes(search?, tags?, page?, pageSize?)` → Recipe[]
- `api.getRecipe(id)` → Recipe
- `api.createRecipe(data)` → Recipe
- `api.updateRecipe(id, data)` → Recipe
- `api.deleteRecipe(id)` → void
- `api.importRecipe(url)` → Recipe (preview, not saved)

**Data flow:**
1. **Library:** Fetch on mount + debounced search, client-side tag filtering
2. **Import:** POST URL → get preview → user edits → POST to create
3. **Detail:** Fetch by ID, cache in state
4. **Create/Edit:** Form state → validate → POST/PUT → redirect to detail

## Loading & Error States

**Loading:**
- `RecipeGrid`: Skeleton cards (3x2 grid) while fetching
- `RecipeDetail`: Skeleton with content placeholders
- `ImportPreview`: Spinner with "Importing from URL..." message

**Errors:**
- Failed fetch: Inline error with retry button
- Import failure: "Could not extract recipe" with manual create option
- Form validation: Inline field errors (name required, servings > 0)
- 404 recipe: Redirect to `/recipes` with toast

**Empty states:**
- No recipes: "No recipes yet" + prominent "Import Recipe" button
- No search results: "No recipes match" + clear filter link

**Optimistic updates:**
- Delete: Remove from grid immediately, rollback on failure
- No optimistic create/edit (wait for server confirmation)

## Translations

Add `Recipes` namespace to `messages/nb.json` and `messages/en.json`:
- Page titles, button labels, form fields
- Error messages, empty states
- Placeholder text

## Tech Stack

- Next.js 15 App Router
- Tailwind CSS with existing design tokens
- next-intl for i18n (nb/en)
- lucide-react for icons
- Existing `cn()` utility for dark mode
