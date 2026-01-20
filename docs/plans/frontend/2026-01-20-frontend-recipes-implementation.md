# Frontend Recipes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use frontend-design skill for implementation. Follow existing patterns exactly.

**Goal:** Implement recipe management UI with library, import, create, edit, and detail pages.

**Architecture:** Next.js 15 App Router pages with shared components. API client extended for recipe endpoints. Translations for nb/en.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, next-intl, lucide-react

---

## Task 1: Add Recipe Types and API Methods

**Files:**
- Modify: `frontend/src/lib/api.ts`

**Step 1: Add types after existing interfaces (around line 70)**

```typescript
// Recipe types
export interface RecipeIngredient {
  id: string;
  ingredient_id: string | null;
  ingredient_name: string;
  quantity: number;
  unit: string;
  notes: string | null;
}

export interface Recipe {
  id: string;
  household_id: string;
  name: string;
  source_url: string | null;
  servings: number;
  prep_time_minutes: number | null;
  instructions: string;
  tags: string[];
  image_url: string | null;
  import_confidence: number | null;
  created_at: string;
  updated_at: string;
  ingredients: RecipeIngredient[];
}

export interface RecipeListResponse {
  recipes: Recipe[];
  total: number;
}

export interface RecipeCreate {
  household_id: string;
  name: string;
  source_url?: string | null;
  servings: number;
  prep_time_minutes?: number | null;
  instructions: string;
  tags?: string[];
  image_url?: string | null;
  ingredients: Omit<RecipeIngredient, 'id'>[];
}

export interface RecipeImportRequest {
  url: string;
  household_id: string;
}

export interface RecipeImportResponse {
  recipe: Omit<Recipe, 'id' | 'created_at' | 'updated_at'>;
  confidence: number;
  warnings: string[];
}
```

**Step 2: Add API methods to ApiClient class (before the closing brace)**

```typescript
  // Recipes
  async getRecipes(
    householdId: string,
    search?: string,
    tags?: string[],
    page = 1,
    pageSize = 20
  ): Promise<RecipeListResponse> {
    const params = new URLSearchParams();
    params.append("household_id", householdId);
    if (search) params.append("search", search);
    if (tags?.length) tags.forEach(t => params.append("tags", t));
    params.append("page", page.toString());
    params.append("page_size", pageSize.toString());
    return this.fetch(`/api/recipes?${params.toString()}`);
  }

  async getRecipe(id: string): Promise<Recipe> {
    return this.fetch(`/api/recipes/${id}`);
  }

  async createRecipe(data: RecipeCreate): Promise<Recipe> {
    return this.fetch("/api/recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  async updateRecipe(id: string, data: Partial<RecipeCreate>): Promise<Recipe> {
    return this.fetch(`/api/recipes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  async deleteRecipe(id: string): Promise<void> {
    await this.fetch(`/api/recipes/${id}`, { method: "DELETE" });
  }

  async importRecipe(data: RecipeImportRequest): Promise<RecipeImportResponse> {
    return this.fetch("/api/recipes/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }
```

**Step 3: Commit**

```bash
git add frontend/src/lib/api.ts
git commit -m "feat(frontend): add recipe types and API methods"
```

---

## Task 2: Add Norwegian Translations

**Files:**
- Modify: `frontend/src/messages/nb.json`

**Step 1: Add Recipes namespace after Analytics section**

```json
  "Recipes": {
    "title": "Oppskrifter",
    "subtitle": "Din oppskriftssamling",
    "search": "Søk etter oppskrift...",
    "import": "Importer",
    "newRecipe": "Ny oppskrift",
    "servings": "porsjoner",
    "prepTime": "min",
    "ingredients": "Ingredienser",
    "instructions": "Fremgangsmåte",
    "edit": "Rediger",
    "delete": "Slett",
    "planMeal": "Planlegg måltid",
    "confirmDelete": "Er du sikker på at du vil slette denne oppskriften?",
    "noRecipes": "Ingen oppskrifter ennå",
    "noRecipesMessage": "Importer din første oppskrift fra en nettside eller lag en manuelt.",
    "noResults": "Ingen oppskrifter matcher søket",
    "importTitle": "Importer oppskrift",
    "importSubtitle": "Lim inn en URL til en oppskrift, så henter vi ingredienser og fremgangsmåte automatisk.",
    "importPlaceholder": "https://matoppskrift.no/...",
    "importButton": "Hent oppskrift",
    "importing": "Henter oppskrift...",
    "importFailed": "Kunne ikke hente oppskrift fra denne URLen",
    "importFailedMessage": "Prøv en annen URL eller lag oppskriften manuelt.",
    "createManually": "Lag manuelt",
    "importedFrom": "Importert fra",
    "confidence": "Sikkerhet",
    "reviewAndSave": "Gjennomgå og lagre",
    "newTitle": "Ny oppskrift",
    "editTitle": "Rediger oppskrift",
    "nameLabel": "Navn",
    "namePlaceholder": "F.eks. Kjøttkaker i brun saus",
    "servingsLabel": "Antall porsjoner",
    "prepTimeLabel": "Tilberedningstid (minutter)",
    "prepTimePlaceholder": "Valgfritt",
    "tagsLabel": "Tagger",
    "tagsPlaceholder": "F.eks. middag, norsk, enkel",
    "instructionsLabel": "Fremgangsmåte",
    "instructionsPlaceholder": "Skriv fremgangsmåten her...",
    "addIngredient": "Legg til ingrediens",
    "ingredientName": "Ingrediens",
    "quantity": "Mengde",
    "unit": "Enhet",
    "notes": "Notater",
    "save": "Lagre",
    "saving": "Lagrer...",
    "cancel": "Avbryt",
    "saved": "Oppskrift lagret!",
    "backToRecipes": "Tilbake til oppskrifter"
  },
```

**Step 2: Add recipes to Navigation namespace**

```json
  "Navigation": {
    "dashboard": "Oversikt",
    "upload": "Last opp",
    "receipts": "Kvitteringer",
    "recipes": "Oppskrifter",
    "analytics": "Analyse",
    "appName": "Kvitteringshvelv"
  },
```

**Step 3: Commit**

```bash
git add frontend/src/messages/nb.json
git commit -m "feat(i18n): add Norwegian recipe translations"
```

---

## Task 3: Add English Translations

**Files:**
- Modify: `frontend/src/messages/en.json`

**Step 1: Add Recipes namespace**

```json
  "Recipes": {
    "title": "Recipes",
    "subtitle": "Your recipe collection",
    "search": "Search recipes...",
    "import": "Import",
    "newRecipe": "New Recipe",
    "servings": "servings",
    "prepTime": "min",
    "ingredients": "Ingredients",
    "instructions": "Instructions",
    "edit": "Edit",
    "delete": "Delete",
    "planMeal": "Plan Meal",
    "confirmDelete": "Are you sure you want to delete this recipe?",
    "noRecipes": "No recipes yet",
    "noRecipesMessage": "Import your first recipe from a website or create one manually.",
    "noResults": "No recipes match your search",
    "importTitle": "Import Recipe",
    "importSubtitle": "Paste a recipe URL and we'll automatically extract the ingredients and instructions.",
    "importPlaceholder": "https://recipe-site.com/...",
    "importButton": "Fetch Recipe",
    "importing": "Fetching recipe...",
    "importFailed": "Could not fetch recipe from this URL",
    "importFailedMessage": "Try a different URL or create the recipe manually.",
    "createManually": "Create Manually",
    "importedFrom": "Imported from",
    "confidence": "Confidence",
    "reviewAndSave": "Review and Save",
    "newTitle": "New Recipe",
    "editTitle": "Edit Recipe",
    "nameLabel": "Name",
    "namePlaceholder": "e.g. Spaghetti Bolognese",
    "servingsLabel": "Servings",
    "prepTimeLabel": "Prep Time (minutes)",
    "prepTimePlaceholder": "Optional",
    "tagsLabel": "Tags",
    "tagsPlaceholder": "e.g. dinner, italian, easy",
    "instructionsLabel": "Instructions",
    "instructionsPlaceholder": "Write the instructions here...",
    "addIngredient": "Add Ingredient",
    "ingredientName": "Ingredient",
    "quantity": "Quantity",
    "unit": "Unit",
    "notes": "Notes",
    "save": "Save",
    "saving": "Saving...",
    "cancel": "Cancel",
    "saved": "Recipe saved!",
    "backToRecipes": "Back to recipes"
  },
```

**Step 2: Add recipes to Navigation namespace**

```json
  "Navigation": {
    "dashboard": "Dashboard",
    "upload": "Upload",
    "receipts": "Receipts",
    "recipes": "Recipes",
    "analytics": "Analytics",
    "appName": "Receipt Vault"
  },
```

**Step 3: Commit**

```bash
git add frontend/src/messages/en.json
git commit -m "feat(i18n): add English recipe translations"
```

---

## Task 4: Update Navigation Component

**Files:**
- Modify: `frontend/src/components/Navigation.tsx`

**Step 1: Add ChefHat icon to imports (line 7)**

```typescript
import {
  LayoutDashboard,
  Upload,
  Receipt,
  BarChart3,
  Vault,
  ChefHat
} from "lucide-react";
```

**Step 2: Add recipes item to navItems array (after receipts, before analytics)**

```typescript
  const navItems = [
    { href: `/${locale}`, label: t("dashboard"), icon: LayoutDashboard },
    { href: `/${locale}/upload`, label: t("upload"), icon: Upload },
    { href: `/${locale}/receipts`, label: t("receipts"), icon: Receipt },
    { href: `/${locale}/recipes`, label: t("recipes"), icon: ChefHat },
    { href: `/${locale}/analytics`, label: t("analytics"), icon: BarChart3 },
  ];
```

**Step 3: Commit**

```bash
git add frontend/src/components/Navigation.tsx
git commit -m "feat(nav): add recipes link to navigation"
```

---

## Task 5: Create RecipeCard Component

**Files:**
- Create: `frontend/src/components/recipes/RecipeCard.tsx`

**Step 1: Create the component**

```typescript
"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Clock, Users, ChefHat } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Recipe } from "@/lib/api";

interface RecipeCardProps {
  recipe: Recipe;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const locale = useLocale();
  const t = useTranslations("Recipes");

  return (
    <Link
      href={`/${locale}/recipes/${recipe.id}`}
      className={cn(
        "group block bg-white dark:bg-fjord-800/50 rounded-2xl",
        "border border-fjord-100 dark:border-fjord-700/50",
        "hover:shadow-lg hover:border-fjord-200 dark:hover:border-fjord-600",
        "transition-all duration-200"
      )}
    >
      {/* Image or Placeholder */}
      <div className="aspect-[4/3] rounded-t-2xl bg-fjord-100 dark:bg-fjord-700/50 overflow-hidden">
        {recipe.image_url ? (
          <img
            src={recipe.image_url}
            alt={recipe.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ChefHat className="w-12 h-12 text-fjord-300 dark:text-fjord-600" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-fjord-800 dark:text-fjord-100 group-hover:text-fjord-600 dark:group-hover:text-fjord-300 transition-colors line-clamp-2">
          {recipe.name}
        </h3>

        <div className="mt-2 flex items-center gap-4 text-sm text-fjord-500 dark:text-fjord-400">
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {recipe.servings} {t("servings")}
          </span>
          {recipe.prep_time_minutes && (
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {recipe.prep_time_minutes} {t("prepTime")}
            </span>
          )}
        </div>

        {recipe.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {recipe.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs rounded-full bg-fjord-100 dark:bg-fjord-700 text-fjord-600 dark:text-fjord-300"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
```

**Step 2: Commit**

```bash
mkdir -p frontend/src/components/recipes
git add frontend/src/components/recipes/RecipeCard.tsx
git commit -m "feat(components): add RecipeCard component"
```

---

## Task 6: Create RecipeGrid Component

**Files:**
- Create: `frontend/src/components/recipes/RecipeGrid.tsx`

**Step 1: Create the component**

```typescript
"use client";

import { useTranslations } from "next-intl";
import { ChefHat, Plus } from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { RecipeCard } from "./RecipeCard";
import type { Recipe } from "@/lib/api";
import { cn } from "@/lib/utils";

interface RecipeGridProps {
  recipes: Recipe[];
  loading?: boolean;
}

export function RecipeGrid({ recipes, loading }: RecipeGridProps) {
  const t = useTranslations("Recipes");
  const tEmpty = useTranslations("EmptyState");
  const locale = useLocale();

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-fjord-800/50 rounded-2xl border border-fjord-100 dark:border-fjord-700/50 overflow-hidden animate-pulse"
          >
            <div className="aspect-[4/3] bg-fjord-100 dark:bg-fjord-700/50" />
            <div className="p-4 space-y-3">
              <div className="h-5 bg-fjord-100 dark:bg-fjord-700 rounded w-3/4" />
              <div className="h-4 bg-fjord-100 dark:bg-fjord-700 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-fjord-100 dark:bg-fjord-800 flex items-center justify-center">
          <ChefHat className="w-8 h-8 text-fjord-400 dark:text-fjord-500" />
        </div>
        <h3 className="text-lg font-semibold text-fjord-700 dark:text-fjord-200">
          {t("noRecipes")}
        </h3>
        <p className="mt-1 text-fjord-500 dark:text-fjord-400 max-w-sm mx-auto">
          {t("noRecipesMessage")}
        </p>
        <Link
          href={`/${locale}/recipes/import`}
          className={cn(
            "mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl",
            "bg-fjord-500 text-white font-medium",
            "hover:bg-fjord-600 transition-colors"
          )}
        >
          <Plus className="w-4 h-4" />
          {t("import")}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {recipes.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} />
      ))}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/recipes/RecipeGrid.tsx
git commit -m "feat(components): add RecipeGrid component"
```

---

## Task 7: Create RecipeSearch Component

**Files:**
- Create: `frontend/src/components/recipes/RecipeSearch.tsx`

**Step 1: Create the component**

```typescript
"use client";

import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface RecipeSearchProps {
  value: string;
  onChange: (value: string) => void;
  tags: string[];
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
}

export function RecipeSearch({
  value,
  onChange,
  tags,
  selectedTags,
  onTagToggle,
}: RecipeSearchProps) {
  const t = useTranslations("Recipes");

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-fjord-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("search")}
          className={cn(
            "w-full pl-12 pr-10 py-3 rounded-xl",
            "bg-white dark:bg-fjord-800/50",
            "border border-fjord-200 dark:border-fjord-700",
            "text-fjord-800 dark:text-fjord-100",
            "placeholder:text-fjord-400 dark:placeholder:text-fjord-500",
            "focus:outline-none focus:ring-2 focus:ring-fjord-500/50",
            "transition-all"
          )}
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-fjord-100 dark:hover:bg-fjord-700 transition-colors"
          >
            <X className="w-4 h-4 text-fjord-400" />
          </button>
        )}
      </div>

      {/* Tag Filters */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => onTagToggle(tag)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                selectedTags.includes(tag)
                  ? "bg-fjord-500 text-white"
                  : "bg-fjord-100 dark:bg-fjord-800 text-fjord-600 dark:text-fjord-300 hover:bg-fjord-200 dark:hover:bg-fjord-700"
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/recipes/RecipeSearch.tsx
git commit -m "feat(components): add RecipeSearch component"
```

---

## Task 8: Create IngredientInput Component

**Files:**
- Create: `frontend/src/components/recipes/IngredientInput.tsx`

**Step 1: Create the component**

```typescript
"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface IngredientInputProps {
  ingredient: {
    ingredient_name: string;
    quantity: number;
    unit: string;
    notes: string | null;
  };
  onChange: (ingredient: IngredientInputProps["ingredient"]) => void;
  onRemove: () => void;
}

const UNITS = ["g", "kg", "ml", "dl", "l", "stk", "ss", "ts", "kopp"];

export function IngredientInput({
  ingredient,
  onChange,
  onRemove,
}: IngredientInputProps) {
  const t = useTranslations("Recipes");

  const inputClasses = cn(
    "px-3 py-2 rounded-lg",
    "bg-white dark:bg-fjord-800",
    "border border-fjord-200 dark:border-fjord-700",
    "text-fjord-800 dark:text-fjord-100",
    "placeholder:text-fjord-400",
    "focus:outline-none focus:ring-2 focus:ring-fjord-500/50",
    "transition-all"
  );

  return (
    <div className="flex gap-2 items-start">
      <input
        type="number"
        value={ingredient.quantity || ""}
        onChange={(e) =>
          onChange({ ...ingredient, quantity: parseFloat(e.target.value) || 0 })
        }
        placeholder={t("quantity")}
        className={cn(inputClasses, "w-20")}
        min="0"
        step="0.1"
      />

      <select
        value={ingredient.unit}
        onChange={(e) => onChange({ ...ingredient, unit: e.target.value })}
        className={cn(inputClasses, "w-24")}
      >
        {UNITS.map((unit) => (
          <option key={unit} value={unit}>
            {unit}
          </option>
        ))}
      </select>

      <input
        type="text"
        value={ingredient.ingredient_name}
        onChange={(e) =>
          onChange({ ...ingredient, ingredient_name: e.target.value })
        }
        placeholder={t("ingredientName")}
        className={cn(inputClasses, "flex-1")}
      />

      <input
        type="text"
        value={ingredient.notes || ""}
        onChange={(e) =>
          onChange({ ...ingredient, notes: e.target.value || null })
        }
        placeholder={t("notes")}
        className={cn(inputClasses, "w-32")}
      />

      <button
        type="button"
        onClick={onRemove}
        className="p-2 text-fjord-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/recipes/IngredientInput.tsx
git commit -m "feat(components): add IngredientInput component"
```

---

## Task 9: Create IngredientList Component

**Files:**
- Create: `frontend/src/components/recipes/IngredientList.tsx`

**Step 1: Create the component**

```typescript
"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { IngredientInput } from "./IngredientInput";
import { cn } from "@/lib/utils";

interface Ingredient {
  ingredient_name: string;
  quantity: number;
  unit: string;
  notes: string | null;
}

interface IngredientListProps {
  ingredients: Ingredient[];
  onChange: (ingredients: Ingredient[]) => void;
}

export function IngredientList({ ingredients, onChange }: IngredientListProps) {
  const t = useTranslations("Recipes");

  const handleAdd = () => {
    onChange([
      ...ingredients,
      { ingredient_name: "", quantity: 0, unit: "g", notes: null },
    ]);
  };

  const handleChange = (index: number, ingredient: Ingredient) => {
    const updated = [...ingredients];
    updated[index] = ingredient;
    onChange(updated);
  };

  const handleRemove = (index: number) => {
    onChange(ingredients.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-fjord-700 dark:text-fjord-200">
        {t("ingredients")}
      </label>

      <div className="space-y-2">
        {ingredients.map((ingredient, index) => (
          <IngredientInput
            key={index}
            ingredient={ingredient}
            onChange={(ing) => handleChange(index, ing)}
            onRemove={() => handleRemove(index)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={handleAdd}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg",
          "text-fjord-600 dark:text-fjord-300",
          "hover:bg-fjord-100 dark:hover:bg-fjord-800",
          "transition-colors"
        )}
      >
        <Plus className="w-4 h-4" />
        {t("addIngredient")}
      </button>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/recipes/IngredientList.tsx
git commit -m "feat(components): add IngredientList component"
```

---

## Task 10: Create RecipeForm Component

**Files:**
- Create: `frontend/src/components/recipes/RecipeForm.tsx`

**Step 1: Create the component**

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { IngredientList } from "./IngredientList";
import { api, type Recipe, type RecipeCreate } from "@/lib/api";
import { cn } from "@/lib/utils";

interface RecipeFormProps {
  recipe?: Recipe;
  defaultValues?: Partial<RecipeCreate>;
  householdId: string;
}

export function RecipeForm({ recipe, defaultValues, householdId }: RecipeFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Recipes");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(recipe?.name ?? defaultValues?.name ?? "");
  const [servings, setServings] = useState(recipe?.servings ?? defaultValues?.servings ?? 2);
  const [prepTime, setPrepTime] = useState<number | "">(
    recipe?.prep_time_minutes ?? defaultValues?.prep_time_minutes ?? ""
  );
  const [tags, setTags] = useState(
    (recipe?.tags ?? defaultValues?.tags ?? []).join(", ")
  );
  const [instructions, setInstructions] = useState(
    recipe?.instructions ?? defaultValues?.instructions ?? ""
  );
  const [ingredients, setIngredients] = useState(
    recipe?.ingredients.map((i) => ({
      ingredient_name: i.ingredient_name,
      quantity: i.quantity,
      unit: i.unit,
      notes: i.notes,
    })) ??
      defaultValues?.ingredients?.map((i) => ({
        ingredient_name: i.ingredient_name,
        quantity: i.quantity,
        unit: i.unit,
        notes: i.notes,
      })) ?? [{ ingredient_name: "", quantity: 0, unit: "g", notes: null }]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const data: RecipeCreate = {
        household_id: householdId,
        name,
        servings,
        prep_time_minutes: prepTime || null,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        instructions,
        ingredients: ingredients
          .filter((i) => i.ingredient_name.trim())
          .map((i) => ({
            ingredient_id: null,
            ingredient_name: i.ingredient_name,
            quantity: i.quantity,
            unit: i.unit,
            notes: i.notes,
          })),
        source_url: recipe?.source_url ?? defaultValues?.source_url,
        image_url: recipe?.image_url ?? defaultValues?.image_url,
      };

      if (recipe) {
        await api.updateRecipe(recipe.id, data);
      } else {
        await api.createRecipe(data);
      }

      router.push(`/${locale}/recipes`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const inputClasses = cn(
    "w-full px-4 py-3 rounded-xl",
    "bg-white dark:bg-fjord-800/50",
    "border border-fjord-200 dark:border-fjord-700",
    "text-fjord-800 dark:text-fjord-100",
    "placeholder:text-fjord-400",
    "focus:outline-none focus:ring-2 focus:ring-fjord-500/50",
    "transition-all"
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-fjord-700 dark:text-fjord-200 mb-2">
          {t("nameLabel")} *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("namePlaceholder")}
          className={inputClasses}
          required
        />
      </div>

      {/* Servings & Prep Time */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-fjord-700 dark:text-fjord-200 mb-2">
            {t("servingsLabel")} *
          </label>
          <input
            type="number"
            value={servings}
            onChange={(e) => setServings(parseInt(e.target.value) || 1)}
            className={inputClasses}
            min="1"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-fjord-700 dark:text-fjord-200 mb-2">
            {t("prepTimeLabel")}
          </label>
          <input
            type="number"
            value={prepTime}
            onChange={(e) => setPrepTime(e.target.value ? parseInt(e.target.value) : "")}
            placeholder={t("prepTimePlaceholder")}
            className={inputClasses}
            min="1"
          />
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-fjord-700 dark:text-fjord-200 mb-2">
          {t("tagsLabel")}
        </label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder={t("tagsPlaceholder")}
          className={inputClasses}
        />
      </div>

      {/* Ingredients */}
      <IngredientList ingredients={ingredients} onChange={setIngredients} />

      {/* Instructions */}
      <div>
        <label className="block text-sm font-medium text-fjord-700 dark:text-fjord-200 mb-2">
          {t("instructionsLabel")}
        </label>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder={t("instructionsPlaceholder")}
          className={cn(inputClasses, "min-h-[200px] resize-y")}
          rows={8}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className={cn(
            "px-5 py-2.5 rounded-xl font-medium",
            "text-fjord-600 dark:text-fjord-300",
            "hover:bg-fjord-100 dark:hover:bg-fjord-800",
            "transition-colors"
          )}
        >
          {t("cancel")}
        </button>
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className={cn(
            "px-5 py-2.5 rounded-xl font-medium",
            "bg-fjord-500 text-white",
            "hover:bg-fjord-600 disabled:opacity-50",
            "transition-colors flex items-center gap-2"
          )}
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? t("saving") : t("save")}
        </button>
      </div>
    </form>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/recipes/RecipeForm.tsx
git commit -m "feat(components): add RecipeForm component"
```

---

## Task 11: Create Recipes Library Page

**Files:**
- Create: `frontend/src/app/[locale]/recipes/page.tsx`

**Step 1: Create the page**

```typescript
"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Download } from "lucide-react";
import { api, type Recipe } from "@/lib/api";
import { RecipeGrid } from "@/components/recipes/RecipeGrid";
import { RecipeSearch } from "@/components/recipes/RecipeSearch";
import { cn } from "@/lib/utils";

// TODO: Get from user context
const HOUSEHOLD_ID = "00000000-0000-0000-0000-000000000001";

export default function RecipesPage() {
  const locale = useLocale();
  const t = useTranslations("Recipes");

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    async function loadRecipes() {
      try {
        const response = await api.getRecipes(HOUSEHOLD_ID);
        setRecipes(response.recipes);
      } catch (error) {
        console.error("Failed to load recipes:", error);
      } finally {
        setLoading(false);
      }
    }
    loadRecipes();
  }, []);

  // Extract unique tags from recipes
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    recipes.forEach((r) => r.tags.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [recipes]);

  // Filter recipes
  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      const matchesSearch =
        !search ||
        recipe.name.toLowerCase().includes(search.toLowerCase()) ||
        recipe.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));

      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.some((tag) => recipe.tags.includes(tag));

      return matchesSearch && matchesTags;
    });
  }, [recipes, search, selectedTags]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-display font-semibold text-fjord-800 dark:text-fjord-100">
            {t("title")}
          </h1>
          <p className="mt-1 text-fjord-500 dark:text-fjord-400">
            {t("subtitle")}
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/${locale}/recipes/import`}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium",
              "bg-fjord-100 dark:bg-fjord-800 text-fjord-700 dark:text-fjord-200",
              "hover:bg-fjord-200 dark:hover:bg-fjord-700 transition-colors"
            )}
          >
            <Download className="w-4 h-4" />
            {t("import")}
          </Link>
          <Link
            href={`/${locale}/recipes/new`}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium",
              "bg-fjord-500 text-white",
              "hover:bg-fjord-600 transition-colors"
            )}
          >
            <Plus className="w-4 h-4" />
            {t("newRecipe")}
          </Link>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="mb-8">
        <RecipeSearch
          value={search}
          onChange={setSearch}
          tags={allTags}
          selectedTags={selectedTags}
          onTagToggle={handleTagToggle}
        />
      </div>

      {/* Grid */}
      <RecipeGrid
        recipes={filteredRecipes}
        loading={loading}
      />

      {/* No results message */}
      {!loading && recipes.length > 0 && filteredRecipes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-fjord-500 dark:text-fjord-400">{t("noResults")}</p>
          <button
            onClick={() => {
              setSearch("");
              setSelectedTags([]);
            }}
            className="mt-2 text-fjord-600 dark:text-fjord-300 hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
mkdir -p frontend/src/app/\[locale\]/recipes
git add frontend/src/app/\[locale\]/recipes/page.tsx
git commit -m "feat(pages): add recipes library page"
```

---

## Task 12: Create Recipe Import Page

**Files:**
- Create: `frontend/src/app/[locale]/recipes/import/page.tsx`

**Step 1: Create the page**

```typescript
"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, Loader2, AlertCircle, Link as LinkIcon } from "lucide-react";
import { api, type RecipeImportResponse } from "@/lib/api";
import { RecipeForm } from "@/components/recipes/RecipeForm";
import { cn } from "@/lib/utils";

// TODO: Get from user context
const HOUSEHOLD_ID = "00000000-0000-0000-0000-000000000001";

export default function ImportRecipePage() {
  const locale = useLocale();
  const t = useTranslations("Recipes");

  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<RecipeImportResponse | null>(null);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const result = await api.importRecipe({ url, household_id: HOUSEHOLD_ID });
      setImportResult(result);
    } catch (err) {
      setError(t("importFailed"));
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = cn(
    "flex-1 px-4 py-3 rounded-xl",
    "bg-white dark:bg-fjord-800/50",
    "border border-fjord-200 dark:border-fjord-700",
    "text-fjord-800 dark:text-fjord-100",
    "placeholder:text-fjord-400",
    "focus:outline-none focus:ring-2 focus:ring-fjord-500/50",
    "transition-all"
  );

  // Show form if we have import result
  if (importResult) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/${locale}/recipes`}
            className="inline-flex items-center gap-2 text-fjord-500 hover:text-fjord-700 dark:hover:text-fjord-300 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("backToRecipes")}
          </Link>

          <h1 className="text-2xl font-display font-semibold text-fjord-800 dark:text-fjord-100">
            {t("reviewAndSave")}
          </h1>

          {importResult.recipe.source_url && (
            <p className="mt-2 text-sm text-fjord-500 dark:text-fjord-400 flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              {t("importedFrom")}: {new URL(importResult.recipe.source_url).hostname}
            </p>
          )}

          {importResult.confidence < 0.8 && (
            <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                {t("confidence")}: {Math.round(importResult.confidence * 100)}% - Please review carefully
              </span>
            </div>
          )}
        </div>

        {/* Form with imported data */}
        <RecipeForm
          householdId={HOUSEHOLD_ID}
          defaultValues={{
            name: importResult.recipe.name,
            servings: importResult.recipe.servings,
            prep_time_minutes: importResult.recipe.prep_time_minutes,
            instructions: importResult.recipe.instructions,
            tags: importResult.recipe.tags,
            source_url: importResult.recipe.source_url,
            image_url: importResult.recipe.image_url,
            ingredients: importResult.recipe.ingredients.map((i) => ({
              ingredient_id: i.ingredient_id,
              ingredient_name: i.ingredient_name,
              quantity: i.quantity,
              unit: i.unit,
              notes: i.notes,
            })),
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/${locale}/recipes`}
          className="inline-flex items-center gap-2 text-fjord-500 hover:text-fjord-700 dark:hover:text-fjord-300 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("backToRecipes")}
        </Link>

        <h1 className="text-2xl font-display font-semibold text-fjord-800 dark:text-fjord-100">
          {t("importTitle")}
        </h1>
        <p className="mt-2 text-fjord-500 dark:text-fjord-400">
          {t("importSubtitle")}
        </p>
      </div>

      {/* Import Form */}
      <form onSubmit={handleImport} className="space-y-6">
        <div className="flex gap-3">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={t("importPlaceholder")}
            className={inputClasses}
            required
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className={cn(
              "px-5 py-3 rounded-xl font-medium",
              "bg-fjord-500 text-white",
              "hover:bg-fjord-600 disabled:opacity-50",
              "transition-colors flex items-center gap-2 shrink-0"
            )}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? t("importing") : t("importButton")}
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
            <p className="font-medium">{error}</p>
            <p className="mt-1 text-sm">{t("importFailedMessage")}</p>
            <Link
              href={`/${locale}/recipes/new`}
              className="mt-3 inline-block text-sm font-medium hover:underline"
            >
              {t("createManually")} →
            </Link>
          </div>
        )}
      </form>
    </div>
  );
}
```

**Step 2: Commit**

```bash
mkdir -p frontend/src/app/\[locale\]/recipes/import
git add frontend/src/app/\[locale\]/recipes/import/page.tsx
git commit -m "feat(pages): add recipe import page"
```

---

## Task 13: Create New Recipe Page

**Files:**
- Create: `frontend/src/app/[locale]/recipes/new/page.tsx`

**Step 1: Create the page**

```typescript
"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { RecipeForm } from "@/components/recipes/RecipeForm";

// TODO: Get from user context
const HOUSEHOLD_ID = "00000000-0000-0000-0000-000000000001";

export default function NewRecipePage() {
  const locale = useLocale();
  const t = useTranslations("Recipes");

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/${locale}/recipes`}
          className="inline-flex items-center gap-2 text-fjord-500 hover:text-fjord-700 dark:hover:text-fjord-300 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("backToRecipes")}
        </Link>

        <h1 className="text-2xl font-display font-semibold text-fjord-800 dark:text-fjord-100">
          {t("newTitle")}
        </h1>
      </div>

      {/* Form */}
      <RecipeForm householdId={HOUSEHOLD_ID} />
    </div>
  );
}
```

**Step 2: Commit**

```bash
mkdir -p frontend/src/app/\[locale\]/recipes/new
git add frontend/src/app/\[locale\]/recipes/new/page.tsx
git commit -m "feat(pages): add new recipe page"
```

---

## Task 14: Create Recipe Detail Page

**Files:**
- Create: `frontend/src/app/[locale]/recipes/[id]/page.tsx`

**Step 1: Create the page**

```typescript
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowLeft,
  Clock,
  Users,
  Pencil,
  Trash2,
  Calendar,
  ExternalLink,
  ChefHat,
} from "lucide-react";
import { api, type Recipe } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Recipes");

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function loadRecipe() {
      try {
        const data = await api.getRecipe(params.id as string);
        setRecipe(data);
      } catch (error) {
        console.error("Failed to load recipe:", error);
        router.push(`/${locale}/recipes`);
      } finally {
        setLoading(false);
      }
    }
    loadRecipe();
  }, [params.id, locale, router]);

  const handleDelete = async () => {
    if (!recipe || !confirm(t("confirmDelete"))) return;

    setDeleting(true);
    try {
      await api.deleteRecipe(recipe.id);
      router.push(`/${locale}/recipes`);
    } catch (error) {
      console.error("Failed to delete:", error);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8 animate-pulse">
        <div className="h-6 w-32 bg-fjord-100 dark:bg-fjord-800 rounded mb-4" />
        <div className="h-10 w-64 bg-fjord-100 dark:bg-fjord-800 rounded mb-6" />
        <div className="aspect-video bg-fjord-100 dark:bg-fjord-800 rounded-2xl mb-8" />
        <div className="space-y-4">
          <div className="h-4 bg-fjord-100 dark:bg-fjord-800 rounded w-full" />
          <div className="h-4 bg-fjord-100 dark:bg-fjord-800 rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (!recipe) return null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Back Link */}
      <Link
        href={`/${locale}/recipes`}
        className="inline-flex items-center gap-2 text-fjord-500 hover:text-fjord-700 dark:hover:text-fjord-300 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("backToRecipes")}
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-display font-semibold text-fjord-800 dark:text-fjord-100">
            {recipe.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-fjord-500 dark:text-fjord-400">
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              {recipe.servings} {t("servings")}
            </span>
            {recipe.prep_time_minutes && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {recipe.prep_time_minutes} {t("prepTime")}
              </span>
            )}
            {recipe.source_url && (
              <a
                href={recipe.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-fjord-600 dark:hover:text-fjord-300"
              >
                <ExternalLink className="w-4 h-4" />
                {new URL(recipe.source_url).hostname}
              </a>
            )}
          </div>

          {recipe.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {recipe.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 text-sm rounded-full bg-fjord-100 dark:bg-fjord-800 text-fjord-600 dark:text-fjord-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => {/* TODO: Plan meal */}}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl font-medium",
              "bg-fjord-500 text-white",
              "hover:bg-fjord-600 transition-colors"
            )}
          >
            <Calendar className="w-4 h-4" />
            {t("planMeal")}
          </button>
          <Link
            href={`/${locale}/recipes/${recipe.id}/edit`}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl font-medium",
              "bg-fjord-100 dark:bg-fjord-800 text-fjord-700 dark:text-fjord-200",
              "hover:bg-fjord-200 dark:hover:bg-fjord-700 transition-colors"
            )}
          >
            <Pencil className="w-4 h-4" />
            {t("edit")}
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl font-medium",
              "text-red-600 dark:text-red-400",
              "hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            )}
          >
            <Trash2 className="w-4 h-4" />
            {t("delete")}
          </button>
        </div>
      </div>

      {/* Image */}
      {recipe.image_url ? (
        <img
          src={recipe.image_url}
          alt={recipe.name}
          className="w-full aspect-video object-cover rounded-2xl mb-8"
        />
      ) : (
        <div className="w-full aspect-video bg-fjord-100 dark:bg-fjord-800 rounded-2xl mb-8 flex items-center justify-center">
          <ChefHat className="w-16 h-16 text-fjord-300 dark:text-fjord-600" />
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        {/* Ingredients */}
        <div className="md:col-span-1">
          <h2 className="text-lg font-semibold text-fjord-800 dark:text-fjord-100 mb-4">
            {t("ingredients")}
          </h2>
          <ul className="space-y-2">
            {recipe.ingredients.map((ing, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-fjord-600 dark:text-fjord-300"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-fjord-400 mt-2 shrink-0" />
                <span>
                  {ing.quantity} {ing.unit} {ing.ingredient_name}
                  {ing.notes && (
                    <span className="text-fjord-400 dark:text-fjord-500">
                      {" "}({ing.notes})
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Instructions */}
        <div className="md:col-span-2">
          <h2 className="text-lg font-semibold text-fjord-800 dark:text-fjord-100 mb-4">
            {t("instructions")}
          </h2>
          <div className="prose prose-fjord dark:prose-invert max-w-none">
            {recipe.instructions.split("\n").map((paragraph, i) => (
              <p key={i} className="text-fjord-600 dark:text-fjord-300">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
mkdir -p frontend/src/app/\[locale\]/recipes/\[id\]
git add frontend/src/app/\[locale\]/recipes/\[id\]/page.tsx
git commit -m "feat(pages): add recipe detail page"
```

---

## Task 15: Create Recipe Edit Page

**Files:**
- Create: `frontend/src/app/[locale]/recipes/[id]/edit/page.tsx`

**Step 1: Create the page**

```typescript
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { api, type Recipe } from "@/lib/api";
import { RecipeForm } from "@/components/recipes/RecipeForm";

export default function EditRecipePage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Recipes");

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecipe() {
      try {
        const data = await api.getRecipe(params.id as string);
        setRecipe(data);
      } catch (error) {
        console.error("Failed to load recipe:", error);
        router.push(`/${locale}/recipes`);
      } finally {
        setLoading(false);
      }
    }
    loadRecipe();
  }, [params.id, locale, router]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8 animate-pulse">
        <div className="h-6 w-32 bg-fjord-100 dark:bg-fjord-800 rounded mb-4" />
        <div className="h-10 w-48 bg-fjord-100 dark:bg-fjord-800 rounded mb-8" />
        <div className="space-y-6">
          <div className="h-12 bg-fjord-100 dark:bg-fjord-800 rounded-xl" />
          <div className="h-12 bg-fjord-100 dark:bg-fjord-800 rounded-xl" />
          <div className="h-32 bg-fjord-100 dark:bg-fjord-800 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!recipe) return null;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/${locale}/recipes/${recipe.id}`}
          className="inline-flex items-center gap-2 text-fjord-500 hover:text-fjord-700 dark:hover:text-fjord-300 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("backToRecipes")}
        </Link>

        <h1 className="text-2xl font-display font-semibold text-fjord-800 dark:text-fjord-100">
          {t("editTitle")}
        </h1>
      </div>

      {/* Form */}
      <RecipeForm recipe={recipe} householdId={recipe.household_id} />
    </div>
  );
}
```

**Step 2: Commit**

```bash
mkdir -p frontend/src/app/\[locale\]/recipes/\[id\]/edit
git add frontend/src/app/\[locale\]/recipes/\[id\]/edit/page.tsx
git commit -m "feat(pages): add recipe edit page"
```

---

## Task 16: Create Component Index

**Files:**
- Create: `frontend/src/components/recipes/index.ts`

**Step 1: Create the index file**

```typescript
export { RecipeCard } from "./RecipeCard";
export { RecipeGrid } from "./RecipeGrid";
export { RecipeSearch } from "./RecipeSearch";
export { RecipeForm } from "./RecipeForm";
export { IngredientInput } from "./IngredientInput";
export { IngredientList } from "./IngredientList";
```

**Step 2: Commit**

```bash
git add frontend/src/components/recipes/index.ts
git commit -m "feat(components): add recipe components index"
```

---

## Task 17: Test Frontend Build

**Step 1: Run build to check for errors**

```bash
cd frontend && npm run build
```

**Expected:** Build completes without errors.

**Step 2: If errors, fix and re-run**

**Step 3: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix(frontend): resolve build issues"
```

---

## Summary

The plan creates:
- 6 new components in `frontend/src/components/recipes/`
- 5 new pages in `frontend/src/app/[locale]/recipes/`
- API client extensions with recipe types and methods
- Norwegian and English translations
- Navigation update with Recipes link

All components follow existing patterns (Tailwind, dark mode, lucide icons, next-intl).
