# Frontend Meal Planning Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use frontend-design skill for implementation. Follow existing patterns exactly.

**Goal:** Implement meal planning calendar UI with cook actions and leftovers tracking.

**Architecture:** Next.js 15 App Router pages with shared components. API client extended for meal plan endpoints. Translations for nb/en.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, next-intl, lucide-react

---

## Task 1: Add MealPlan Types and API Methods

**Files:**
- Modify: `frontend/src/lib/api.ts`

**Step 1: Add types after Recipe interfaces**

```typescript
// MealPlan types
export interface MealPlan {
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
  created_at: string;
  updated_at: string;
  recipe: Recipe | null;
}

export interface MealPlanListResponse {
  meal_plans: MealPlan[];
  total: number;
}

export interface MealPlanCreate {
  household_id: string;
  recipe_id: string;
  planned_date: string;
  meal_type: "breakfast" | "lunch" | "dinner";
  servings: number;
  leftover_from_id?: string | null;
}

export interface CookRequest {
  actual_servings?: number;
  create_leftover: boolean;
  leftover_servings?: number;
}

export interface CookResponse {
  meal_plan: MealPlan;
  actual_cost: number;
  cost_per_serving: number;
  inventory_consumed: { lot_id: string; quantity: number; cost: number }[];
  leftover: Leftover | null;
}

export interface Leftover {
  id: string;
  household_id: string;
  meal_plan_id: string;
  recipe_id: string;
  remaining_servings: number;
  status: "available" | "consumed" | "discarded";
  expires_at: string;
  created_at: string;
}

export interface LeftoverListResponse {
  leftovers: Leftover[];
  total: number;
}
```

**Step 2: Add API methods to ApiClient class**

```typescript
  // Meal Plans
  async getMealPlans(
    householdId: string,
    startDate?: string,
    endDate?: string,
    status?: string
  ): Promise<MealPlanListResponse> {
    const params = new URLSearchParams();
    params.append("household_id", householdId);
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    if (status) params.append("status", status);
    return this.fetch(`/api/meal-plans?${params.toString()}`);
  }

  async getMealPlan(id: string): Promise<MealPlan> {
    return this.fetch(`/api/meal-plans/${id}`);
  }

  async createMealPlan(data: MealPlanCreate): Promise<MealPlan> {
    return this.fetch("/api/meal-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  async updateMealPlan(
    id: string,
    data: Partial<MealPlanCreate> & { status?: string }
  ): Promise<MealPlan> {
    return this.fetch(`/api/meal-plans/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  async deleteMealPlan(id: string): Promise<void> {
    await this.fetch(`/api/meal-plans/${id}`, { method: "DELETE" });
  }

  async cookMealPlan(id: string, data: CookRequest): Promise<CookResponse> {
    return this.fetch(`/api/meal-plans/${id}/cook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  // Leftovers
  async getLeftovers(
    householdId: string,
    status?: string
  ): Promise<LeftoverListResponse> {
    const params = new URLSearchParams();
    params.append("household_id", householdId);
    if (status) params.append("status", status);
    return this.fetch(`/api/leftovers?${params.toString()}`);
  }

  async updateLeftover(
    id: string,
    data: { status?: string; remaining_servings?: number }
  ): Promise<Leftover> {
    return this.fetch(`/api/leftovers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }
```

**Step 3: Commit**

```bash
git add frontend/src/lib/api.ts
git commit -m "feat(frontend): add meal plan and leftover types and API methods"
```

---

## Task 2: Add Norwegian Translations

**Files:**
- Modify: `frontend/src/messages/nb.json`

**Step 1: Add to Navigation namespace**

```json
  "Navigation": {
    "dashboard": "Oversikt",
    "upload": "Last opp",
    "receipts": "Kvitteringer",
    "recipes": "Oppskrifter",
    "plan": "Måltidsplan",
    "leftovers": "Rester",
    "analytics": "Analyse",
    "appName": "Kvitteringshvelv"
  },
```

**Step 2: Add MealPlan namespace after Recipes**

```json
  "MealPlan": {
    "title": "Måltidsplan",
    "subtitle": "Planlegg ukens måltider",
    "thisWeek": "Denne uken",
    "prevWeek": "Forrige uke",
    "nextWeek": "Neste uke",
    "today": "I dag",
    "breakfast": "Frokost",
    "lunch": "Lunsj",
    "dinner": "Middag",
    "servings": "porsjoner",
    "addMeal": "Legg til måltid",
    "noMeals": "Ingen måltider planlagt",
    "noMealsMessage": "Klikk på et tomt felt for å planlegge et måltid.",
    "planned": "Planlagt",
    "cooked": "Laget",
    "skipped": "Hoppet over",
    "cook": "Marker som laget",
    "skip": "Hopp over",
    "delete": "Slett",
    "confirmDelete": "Er du sikker på at du vil slette dette måltid?",
    "addTitle": "Legg til måltid",
    "selectRecipe": "Velg oppskrift",
    "searchRecipes": "Søk etter oppskrift...",
    "noRecipesFound": "Ingen oppskrifter funnet",
    "date": "Dato",
    "mealType": "Måltidstype",
    "save": "Lagre",
    "cancel": "Avbryt",
    "cookTitle": "Marker som laget",
    "actualServings": "Faktiske porsjoner",
    "createLeftover": "Lagre rester",
    "leftoverServings": "Antall porsjoner igjen",
    "cookConfirm": "Bekreft",
    "costCalculated": "Beregnet kostnad"
  },
```

**Step 3: Add Leftovers namespace**

```json
  "Leftovers": {
    "title": "Rester",
    "subtitle": "Hold oversikt over matrester",
    "noLeftovers": "Ingen rester",
    "noLeftoversMessage": "Når du lager mat med rester, vil de vises her.",
    "servingsLeft": "porsjoner igjen",
    "expiresIn": "Utgår om",
    "expired": "Utgått",
    "days": "dager",
    "available": "Tilgjengelig",
    "consumed": "Spist",
    "discarded": "Kastet",
    "markConsumed": "Marker som spist",
    "markDiscarded": "Marker som kastet",
    "filterAll": "Alle",
    "filterAvailable": "Tilgjengelige"
  },
```

**Step 4: Commit**

```bash
git add frontend/src/messages/nb.json
git commit -m "feat(i18n): add Norwegian meal plan and leftovers translations"
```

---

## Task 3: Add English Translations

**Files:**
- Modify: `frontend/src/messages/en.json`

**Step 1: Add to Navigation namespace**

```json
  "Navigation": {
    "dashboard": "Dashboard",
    "upload": "Upload",
    "receipts": "Receipts",
    "recipes": "Recipes",
    "plan": "Meal Plan",
    "leftovers": "Leftovers",
    "analytics": "Analytics",
    "appName": "Receipt Vault"
  },
```

**Step 2: Add MealPlan namespace**

```json
  "MealPlan": {
    "title": "Meal Plan",
    "subtitle": "Plan your weekly meals",
    "thisWeek": "This week",
    "prevWeek": "Previous week",
    "nextWeek": "Next week",
    "today": "Today",
    "breakfast": "Breakfast",
    "lunch": "Lunch",
    "dinner": "Dinner",
    "servings": "servings",
    "addMeal": "Add meal",
    "noMeals": "No meals planned",
    "noMealsMessage": "Click on an empty slot to plan a meal.",
    "planned": "Planned",
    "cooked": "Cooked",
    "skipped": "Skipped",
    "cook": "Mark as cooked",
    "skip": "Skip",
    "delete": "Delete",
    "confirmDelete": "Are you sure you want to delete this meal?",
    "addTitle": "Add Meal",
    "selectRecipe": "Select recipe",
    "searchRecipes": "Search recipes...",
    "noRecipesFound": "No recipes found",
    "date": "Date",
    "mealType": "Meal type",
    "save": "Save",
    "cancel": "Cancel",
    "cookTitle": "Mark as Cooked",
    "actualServings": "Actual servings",
    "createLeftover": "Save leftovers",
    "leftoverServings": "Servings remaining",
    "cookConfirm": "Confirm",
    "costCalculated": "Calculated cost"
  },
```

**Step 3: Add Leftovers namespace**

```json
  "Leftovers": {
    "title": "Leftovers",
    "subtitle": "Track your food leftovers",
    "noLeftovers": "No leftovers",
    "noLeftoversMessage": "When you cook meals with leftovers, they will appear here.",
    "servingsLeft": "servings left",
    "expiresIn": "Expires in",
    "expired": "Expired",
    "days": "days",
    "available": "Available",
    "consumed": "Consumed",
    "discarded": "Discarded",
    "markConsumed": "Mark as consumed",
    "markDiscarded": "Mark as discarded",
    "filterAll": "All",
    "filterAvailable": "Available"
  },
```

**Step 4: Commit**

```bash
git add frontend/src/messages/en.json
git commit -m "feat(i18n): add English meal plan and leftovers translations"
```

---

## Task 4: Update Navigation Component

**Files:**
- Modify: `frontend/src/components/Navigation.tsx`

**Step 1: Add icons to imports**

```typescript
import {
  LayoutDashboard,
  Upload,
  Receipt,
  BarChart3,
  Vault,
  ChefHat,
  CalendarDays,
  Soup
} from "lucide-react";
```

**Step 2: Update navItems array**

```typescript
  const navItems = [
    { href: `/${locale}`, label: t("dashboard"), icon: LayoutDashboard },
    { href: `/${locale}/upload`, label: t("upload"), icon: Upload },
    { href: `/${locale}/receipts`, label: t("receipts"), icon: Receipt },
    { href: `/${locale}/recipes`, label: t("recipes"), icon: ChefHat },
    { href: `/${locale}/plan`, label: t("plan"), icon: CalendarDays },
    { href: `/${locale}/leftovers`, label: t("leftovers"), icon: Soup },
    { href: `/${locale}/analytics`, label: t("analytics"), icon: BarChart3 },
  ];
```

**Step 3: Commit**

```bash
git add frontend/src/components/Navigation.tsx
git commit -m "feat(nav): add meal plan and leftovers links to navigation"
```

---

## Task 5: Create MealCard Component

**Files:**
- Create: `frontend/src/components/meal-plan/MealCard.tsx`

**Step 1: Create the component**

```typescript
"use client";

import { useTranslations } from "next-intl";
import { Users, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MealPlan } from "@/lib/api";

interface MealCardProps {
  meal: MealPlan;
  onClick?: () => void;
}

export function MealCard({ meal, onClick }: MealCardProps) {
  const t = useTranslations("MealPlan");

  const statusColors = {
    planned: "border-fjord-200 dark:border-fjord-700",
    cooked: "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20",
    skipped: "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 opacity-60",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-3 rounded-xl border-2 transition-all",
        "hover:shadow-md hover:scale-[1.02]",
        statusColors[meal.status]
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-medium text-sm text-fjord-800 dark:text-fjord-100 line-clamp-2">
          {meal.recipe?.name || "Unknown recipe"}
        </h4>
        {meal.status === "cooked" && (
          <Check className="w-4 h-4 text-green-500 shrink-0" />
        )}
        {meal.status === "skipped" && (
          <X className="w-4 h-4 text-gray-400 shrink-0" />
        )}
      </div>

      <div className="mt-1 flex items-center gap-2 text-xs text-fjord-500 dark:text-fjord-400">
        <Users className="w-3 h-3" />
        <span>{meal.servings} {t("servings")}</span>
      </div>

      {meal.status === "cooked" && meal.cost_per_serving && (
        <div className="mt-1 text-xs text-green-600 dark:text-green-400">
          {meal.cost_per_serving.toFixed(2)} kr/porsjon
        </div>
      )}
    </button>
  );
}
```

**Step 2: Commit**

```bash
mkdir -p frontend/src/components/meal-plan
git add frontend/src/components/meal-plan/MealCard.tsx
git commit -m "feat(components): add MealCard component"
```

---

## Task 6: Create MealSlot Component

**Files:**
- Create: `frontend/src/components/meal-plan/MealSlot.tsx`

**Step 1: Create the component**

```typescript
"use client";

import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { MealCard } from "./MealCard";
import { cn } from "@/lib/utils";
import type { MealPlan } from "@/lib/api";

interface MealSlotProps {
  mealType: "breakfast" | "lunch" | "dinner";
  meal?: MealPlan;
  onAddClick?: () => void;
  onMealClick?: (meal: MealPlan) => void;
}

export function MealSlot({ mealType, meal, onAddClick, onMealClick }: MealSlotProps) {
  const t = useTranslations("MealPlan");

  if (meal) {
    return <MealCard meal={meal} onClick={() => onMealClick?.(meal)} />;
  }

  return (
    <button
      onClick={onAddClick}
      className={cn(
        "w-full h-20 rounded-xl border-2 border-dashed",
        "border-fjord-200 dark:border-fjord-700",
        "hover:border-fjord-400 dark:hover:border-fjord-500",
        "hover:bg-fjord-50 dark:hover:bg-fjord-800/30",
        "flex items-center justify-center gap-2",
        "text-fjord-400 dark:text-fjord-500 text-sm",
        "transition-all"
      )}
    >
      <Plus className="w-4 h-4" />
      <span>{t(mealType)}</span>
    </button>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/meal-plan/MealSlot.tsx
git commit -m "feat(components): add MealSlot component"
```

---

## Task 7: Create DayColumn Component

**Files:**
- Create: `frontend/src/components/meal-plan/DayColumn.tsx`

**Step 1: Create the component**

```typescript
"use client";

import { useTranslations } from "next-intl";
import { MealSlot } from "./MealSlot";
import { cn } from "@/lib/utils";
import type { MealPlan } from "@/lib/api";

interface DayColumnProps {
  date: Date;
  meals: MealPlan[];
  isToday?: boolean;
  onAddMeal: (date: Date, mealType: "breakfast" | "lunch" | "dinner") => void;
  onMealClick: (meal: MealPlan) => void;
  locale: string;
}

export function DayColumn({
  date,
  meals,
  isToday,
  onAddMeal,
  onMealClick,
  locale,
}: DayColumnProps) {
  const t = useTranslations("MealPlan");

  const dayName = date.toLocaleDateString(locale === "en" ? "en-GB" : "nb-NO", {
    weekday: "short",
  });
  const dayNumber = date.getDate();

  const getMealForType = (type: "breakfast" | "lunch" | "dinner") =>
    meals.find((m) => m.meal_type === type);

  return (
    <div
      className={cn(
        "flex flex-col min-w-[140px]",
        isToday && "bg-fjord-50/50 dark:bg-fjord-800/30 rounded-xl"
      )}
    >
      {/* Header */}
      <div className={cn(
        "text-center py-3 border-b border-fjord-100 dark:border-fjord-700",
        isToday && "bg-fjord-500 text-white rounded-t-xl"
      )}>
        <div className={cn(
          "text-xs uppercase tracking-wide",
          isToday ? "text-fjord-100" : "text-fjord-500 dark:text-fjord-400"
        )}>
          {dayName}
        </div>
        <div className={cn(
          "text-lg font-semibold",
          isToday ? "text-white" : "text-fjord-800 dark:text-fjord-100"
        )}>
          {dayNumber}
        </div>
        {isToday && (
          <div className="text-xs text-fjord-200">{t("today")}</div>
        )}
      </div>

      {/* Meal Slots */}
      <div className="flex-1 p-2 space-y-2">
        <MealSlot
          mealType="breakfast"
          meal={getMealForType("breakfast")}
          onAddClick={() => onAddMeal(date, "breakfast")}
          onMealClick={onMealClick}
        />
        <MealSlot
          mealType="lunch"
          meal={getMealForType("lunch")}
          onAddClick={() => onAddMeal(date, "lunch")}
          onMealClick={onMealClick}
        />
        <MealSlot
          mealType="dinner"
          meal={getMealForType("dinner")}
          onAddClick={() => onAddMeal(date, "dinner")}
          onMealClick={onMealClick}
        />
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/meal-plan/DayColumn.tsx
git commit -m "feat(components): add DayColumn component"
```

---

## Task 8: Create WeeklyCalendar Component

**Files:**
- Create: `frontend/src/components/meal-plan/WeeklyCalendar.tsx`

**Step 1: Create the component**

```typescript
"use client";

import { useTranslations, useLocale } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayColumn } from "./DayColumn";
import { cn } from "@/lib/utils";
import type { MealPlan } from "@/lib/api";

interface WeeklyCalendarProps {
  weekStart: Date;
  meals: MealPlan[];
  loading?: boolean;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onAddMeal: (date: Date, mealType: "breakfast" | "lunch" | "dinner") => void;
  onMealClick: (meal: MealPlan) => void;
}

export function WeeklyCalendar({
  weekStart,
  meals,
  loading,
  onPrevWeek,
  onNextWeek,
  onAddMeal,
  onMealClick,
}: WeeklyCalendarProps) {
  const t = useTranslations("MealPlan");
  const locale = useLocale();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    return date;
  });

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const formatWeekRange = () => {
    const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    const localeCode = locale === "en" ? "en-GB" : "nb-NO";
    return `${weekStart.toLocaleDateString(localeCode, opts)} - ${weekEnd.toLocaleDateString(localeCode, opts)}`;
  };

  const getMealsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return meals.filter((m) => m.planned_date.startsWith(dateStr));
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="flex justify-between items-center mb-4">
          <div className="h-8 w-32 bg-fjord-100 dark:bg-fjord-800 rounded" />
          <div className="h-8 w-48 bg-fjord-100 dark:bg-fjord-800 rounded" />
          <div className="h-8 w-32 bg-fjord-100 dark:bg-fjord-800 rounded" />
        </div>
        <div className="grid grid-cols-7 gap-2">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-16 bg-fjord-100 dark:bg-fjord-800 rounded-xl" />
              <div className="h-20 bg-fjord-100 dark:bg-fjord-800 rounded-xl" />
              <div className="h-20 bg-fjord-100 dark:bg-fjord-800 rounded-xl" />
              <div className="h-20 bg-fjord-100 dark:bg-fjord-800 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Week Navigation */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={onPrevWeek}
          className={cn(
            "flex items-center gap-1 px-3 py-2 rounded-lg",
            "text-fjord-600 dark:text-fjord-300",
            "hover:bg-fjord-100 dark:hover:bg-fjord-800",
            "transition-colors"
          )}
        >
          <ChevronLeft className="w-4 h-4" />
          {t("prevWeek")}
        </button>

        <h2 className="text-lg font-semibold text-fjord-800 dark:text-fjord-100">
          {formatWeekRange()}
        </h2>

        <button
          onClick={onNextWeek}
          className={cn(
            "flex items-center gap-1 px-3 py-2 rounded-lg",
            "text-fjord-600 dark:text-fjord-300",
            "hover:bg-fjord-100 dark:hover:bg-fjord-800",
            "transition-colors"
          )}
        >
          {t("nextWeek")}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2 overflow-x-auto">
        {days.map((date) => (
          <DayColumn
            key={date.toISOString()}
            date={date}
            meals={getMealsForDate(date)}
            isToday={date.getTime() === today.getTime()}
            onAddMeal={onAddMeal}
            onMealClick={onMealClick}
            locale={locale}
          />
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/meal-plan/WeeklyCalendar.tsx
git commit -m "feat(components): add WeeklyCalendar component"
```

---

## Task 9: Create MealDetail Component

**Files:**
- Create: `frontend/src/components/meal-plan/MealDetail.tsx`

**Step 1: Create the component**

```typescript
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { X, Users, Clock, Trash2, ChefHat } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MealPlan } from "@/lib/api";

interface MealDetailProps {
  meal: MealPlan;
  onClose: () => void;
  onCook: (data: { actual_servings?: number; create_leftover: boolean; leftover_servings?: number }) => void;
  onSkip: () => void;
  onDelete: () => void;
  cooking?: boolean;
}

export function MealDetail({
  meal,
  onClose,
  onCook,
  onSkip,
  onDelete,
  cooking,
}: MealDetailProps) {
  const t = useTranslations("MealPlan");

  const [showCookForm, setShowCookForm] = useState(false);
  const [actualServings, setActualServings] = useState(meal.servings);
  const [createLeftover, setCreateLeftover] = useState(false);
  const [leftoverServings, setLeftoverServings] = useState(0);

  const handleCook = () => {
    onCook({
      actual_servings: actualServings,
      create_leftover: createLeftover,
      leftover_servings: createLeftover ? leftoverServings : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-fjord-900 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-fjord-100 dark:border-fjord-700">
          <h3 className="text-lg font-semibold text-fjord-800 dark:text-fjord-100">
            {meal.recipe?.name || "Unknown"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-fjord-100 dark:hover:bg-fjord-800"
          >
            <X className="w-5 h-5 text-fjord-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Status Badge */}
          <div className={cn(
            "inline-flex px-3 py-1 rounded-full text-sm font-medium",
            meal.status === "planned" && "bg-fjord-100 text-fjord-700 dark:bg-fjord-800 dark:text-fjord-200",
            meal.status === "cooked" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
            meal.status === "skipped" && "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
          )}>
            {t(meal.status)}
          </div>

          {/* Info */}
          <div className="flex items-center gap-4 text-sm text-fjord-600 dark:text-fjord-300">
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {meal.servings} {t("servings")}
            </span>
            {meal.recipe?.prep_time_minutes && (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {meal.recipe.prep_time_minutes} min
              </span>
            )}
          </div>

          {/* Cook Form */}
          {meal.status === "planned" && showCookForm && (
            <div className="p-4 bg-fjord-50 dark:bg-fjord-800/50 rounded-xl space-y-4">
              <h4 className="font-medium text-fjord-700 dark:text-fjord-200">
                {t("cookTitle")}
              </h4>

              <div>
                <label className="block text-sm text-fjord-600 dark:text-fjord-300 mb-1">
                  {t("actualServings")}
                </label>
                <input
                  type="number"
                  value={actualServings}
                  onChange={(e) => setActualServings(parseInt(e.target.value) || 1)}
                  min="1"
                  className={cn(
                    "w-full px-3 py-2 rounded-lg",
                    "bg-white dark:bg-fjord-900",
                    "border border-fjord-200 dark:border-fjord-700",
                    "text-fjord-800 dark:text-fjord-100"
                  )}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="createLeftover"
                  checked={createLeftover}
                  onChange={(e) => setCreateLeftover(e.target.checked)}
                  className="rounded border-fjord-300"
                />
                <label htmlFor="createLeftover" className="text-sm text-fjord-600 dark:text-fjord-300">
                  {t("createLeftover")}
                </label>
              </div>

              {createLeftover && (
                <div>
                  <label className="block text-sm text-fjord-600 dark:text-fjord-300 mb-1">
                    {t("leftoverServings")}
                  </label>
                  <input
                    type="number"
                    value={leftoverServings}
                    onChange={(e) => setLeftoverServings(parseInt(e.target.value) || 0)}
                    min="0"
                    max={actualServings - 1}
                    className={cn(
                      "w-full px-3 py-2 rounded-lg",
                      "bg-white dark:bg-fjord-900",
                      "border border-fjord-200 dark:border-fjord-700",
                      "text-fjord-800 dark:text-fjord-100"
                    )}
                  />
                </div>
              )}

              <button
                onClick={handleCook}
                disabled={cooking}
                className={cn(
                  "w-full py-2 rounded-lg font-medium",
                  "bg-green-500 text-white",
                  "hover:bg-green-600 disabled:opacity-50",
                  "transition-colors"
                )}
              >
                {cooking ? "..." : t("cookConfirm")}
              </button>
            </div>
          )}

          {/* Cooked Info */}
          {meal.status === "cooked" && meal.actual_cost && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <div className="text-sm text-green-700 dark:text-green-400">
                {t("costCalculated")}: {meal.actual_cost.toFixed(2)} kr
              </div>
              <div className="text-xs text-green-600 dark:text-green-500 mt-1">
                {meal.cost_per_serving?.toFixed(2)} kr/porsjon
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {meal.status === "planned" && (
          <div className="p-4 border-t border-fjord-100 dark:border-fjord-700 flex gap-2">
            {!showCookForm && (
              <>
                <button
                  onClick={() => setShowCookForm(true)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium",
                    "bg-green-500 text-white",
                    "hover:bg-green-600 transition-colors"
                  )}
                >
                  <ChefHat className="w-4 h-4" />
                  {t("cook")}
                </button>
                <button
                  onClick={onSkip}
                  className={cn(
                    "px-4 py-2 rounded-lg font-medium",
                    "bg-fjord-100 dark:bg-fjord-800 text-fjord-600 dark:text-fjord-300",
                    "hover:bg-fjord-200 dark:hover:bg-fjord-700 transition-colors"
                  )}
                >
                  {t("skip")}
                </button>
              </>
            )}
            <button
              onClick={onDelete}
              className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/meal-plan/MealDetail.tsx
git commit -m "feat(components): add MealDetail component"
```

---

## Task 10: Create AddMealForm Component

**Files:**
- Create: `frontend/src/components/meal-plan/AddMealForm.tsx`

**Step 1: Create the component**

```typescript
"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Search, Loader2 } from "lucide-react";
import { api, type Recipe } from "@/lib/api";
import { cn } from "@/lib/utils";

interface AddMealFormProps {
  householdId: string;
  defaultDate?: string;
  defaultMealType?: "breakfast" | "lunch" | "dinner";
  onSubmit: (data: {
    recipe_id: string;
    planned_date: string;
    meal_type: "breakfast" | "lunch" | "dinner";
    servings: number;
  }) => void;
  onCancel: () => void;
  saving?: boolean;
}

export function AddMealForm({
  householdId,
  defaultDate,
  defaultMealType,
  onSubmit,
  onCancel,
  saving,
}: AddMealFormProps) {
  const t = useTranslations("MealPlan");

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [date, setDate] = useState(defaultDate || new Date().toISOString().split("T")[0]);
  const [mealType, setMealType] = useState<"breakfast" | "lunch" | "dinner">(defaultMealType || "dinner");
  const [servings, setServings] = useState(2);

  useEffect(() => {
    async function loadRecipes() {
      try {
        const response = await api.getRecipes(householdId);
        setRecipes(response.recipes);
      } catch (error) {
        console.error("Failed to load recipes:", error);
      } finally {
        setLoading(false);
      }
    }
    loadRecipes();
  }, [householdId]);

  const filteredRecipes = recipes.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecipe) return;

    onSubmit({
      recipe_id: selectedRecipe.id,
      planned_date: new Date(date).toISOString(),
      meal_type: mealType,
      servings,
    });
  };

  const inputClasses = cn(
    "w-full px-4 py-3 rounded-xl",
    "bg-white dark:bg-fjord-800/50",
    "border border-fjord-200 dark:border-fjord-700",
    "text-fjord-800 dark:text-fjord-100",
    "focus:outline-none focus:ring-2 focus:ring-fjord-500/50"
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Recipe Search */}
      <div>
        <label className="block text-sm font-medium text-fjord-700 dark:text-fjord-200 mb-2">
          {t("selectRecipe")} *
        </label>

        {!selectedRecipe ? (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-fjord-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("searchRecipes")}
                className={cn(inputClasses, "pl-10")}
              />
            </div>

            <div className="max-h-48 overflow-y-auto rounded-xl border border-fjord-200 dark:border-fjord-700">
              {loading ? (
                <div className="p-4 text-center text-fjord-500">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                </div>
              ) : filteredRecipes.length === 0 ? (
                <div className="p-4 text-center text-fjord-500">
                  {t("noRecipesFound")}
                </div>
              ) : (
                filteredRecipes.map((recipe) => (
                  <button
                    key={recipe.id}
                    type="button"
                    onClick={() => {
                      setSelectedRecipe(recipe);
                      setServings(recipe.servings);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-3",
                      "hover:bg-fjord-50 dark:hover:bg-fjord-800",
                      "border-b border-fjord-100 dark:border-fjord-700 last:border-b-0",
                      "text-fjord-700 dark:text-fjord-200"
                    )}
                  >
                    {recipe.name}
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 rounded-xl bg-fjord-50 dark:bg-fjord-800">
            <span className="font-medium text-fjord-700 dark:text-fjord-200">
              {selectedRecipe.name}
            </span>
            <button
              type="button"
              onClick={() => setSelectedRecipe(null)}
              className="text-sm text-fjord-500 hover:text-fjord-700"
            >
              Change
            </button>
          </div>
        )}
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-fjord-700 dark:text-fjord-200 mb-2">
          {t("date")} *
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={inputClasses}
          required
        />
      </div>

      {/* Meal Type */}
      <div>
        <label className="block text-sm font-medium text-fjord-700 dark:text-fjord-200 mb-2">
          {t("mealType")} *
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(["breakfast", "lunch", "dinner"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setMealType(type)}
              className={cn(
                "py-2 rounded-lg font-medium transition-colors",
                mealType === type
                  ? "bg-fjord-500 text-white"
                  : "bg-fjord-100 dark:bg-fjord-800 text-fjord-600 dark:text-fjord-300 hover:bg-fjord-200 dark:hover:bg-fjord-700"
              )}
            >
              {t(type)}
            </button>
          ))}
        </div>
      </div>

      {/* Servings */}
      <div>
        <label className="block text-sm font-medium text-fjord-700 dark:text-fjord-200 mb-2">
          {t("servings")}
        </label>
        <input
          type="number"
          value={servings}
          onChange={(e) => setServings(parseInt(e.target.value) || 1)}
          min="1"
          className={inputClasses}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className={cn(
            "px-5 py-2.5 rounded-xl font-medium",
            "text-fjord-600 dark:text-fjord-300",
            "hover:bg-fjord-100 dark:hover:bg-fjord-800"
          )}
        >
          {t("cancel")}
        </button>
        <button
          type="submit"
          disabled={saving || !selectedRecipe}
          className={cn(
            "px-5 py-2.5 rounded-xl font-medium",
            "bg-fjord-500 text-white",
            "hover:bg-fjord-600 disabled:opacity-50",
            "flex items-center gap-2"
          )}
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {t("save")}
        </button>
      </div>
    </form>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/meal-plan/AddMealForm.tsx
git commit -m "feat(components): add AddMealForm component"
```

---

## Task 11: Create LeftoverCard Component

**Files:**
- Create: `frontend/src/components/meal-plan/LeftoverCard.tsx`

**Step 1: Create the component**

```typescript
"use client";

import { useTranslations } from "next-intl";
import { Clock, Utensils, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Leftover } from "@/lib/api";

interface LeftoverCardProps {
  leftover: Leftover;
  recipeName: string;
  onMarkConsumed: () => void;
  onMarkDiscarded: () => void;
}

export function LeftoverCard({
  leftover,
  recipeName,
  onMarkConsumed,
  onMarkDiscarded,
}: LeftoverCardProps) {
  const t = useTranslations("Leftovers");

  const expiresAt = new Date(leftover.expires_at);
  const now = new Date();
  const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isExpired = daysUntilExpiry < 0;
  const isExpiringSoon = daysUntilExpiry <= 2 && daysUntilExpiry >= 0;

  const statusColors = {
    available: isExpired
      ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20"
      : isExpiringSoon
      ? "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20"
      : "border-fjord-200 dark:border-fjord-700",
    consumed: "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 opacity-60",
    discarded: "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 opacity-60",
  };

  return (
    <div
      className={cn(
        "p-4 rounded-xl border-2 transition-all",
        statusColors[leftover.status]
      )}
    >
      <h4 className="font-medium text-fjord-800 dark:text-fjord-100">
        {recipeName}
      </h4>

      <div className="mt-2 flex items-center gap-4 text-sm text-fjord-600 dark:text-fjord-300">
        <span className="flex items-center gap-1">
          <Utensils className="w-4 h-4" />
          {leftover.remaining_servings} {t("servingsLeft")}
        </span>
      </div>

      {leftover.status === "available" && (
        <div className={cn(
          "mt-2 text-sm flex items-center gap-1",
          isExpired ? "text-red-600 dark:text-red-400" :
          isExpiringSoon ? "text-amber-600 dark:text-amber-400" :
          "text-fjord-500 dark:text-fjord-400"
        )}>
          <Clock className="w-4 h-4" />
          {isExpired
            ? t("expired")
            : `${t("expiresIn")} ${daysUntilExpiry} ${t("days")}`}
        </div>
      )}

      {leftover.status === "available" && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={onMarkConsumed}
            className={cn(
              "flex-1 py-2 rounded-lg text-sm font-medium",
              "bg-green-500 text-white",
              "hover:bg-green-600 transition-colors"
            )}
          >
            {t("markConsumed")}
          </button>
          <button
            onClick={onMarkDiscarded}
            className={cn(
              "p-2 rounded-lg",
              "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20",
              "transition-colors"
            )}
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      )}

      {leftover.status !== "available" && (
        <div className={cn(
          "mt-2 text-sm font-medium",
          leftover.status === "consumed" ? "text-green-600 dark:text-green-400" : "text-gray-500"
        )}>
          {t(leftover.status)}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/meal-plan/LeftoverCard.tsx
git commit -m "feat(components): add LeftoverCard component"
```

---

## Task 12: Create Component Index

**Files:**
- Create: `frontend/src/components/meal-plan/index.ts`

**Step 1: Create the index file**

```typescript
export { MealCard } from "./MealCard";
export { MealSlot } from "./MealSlot";
export { DayColumn } from "./DayColumn";
export { WeeklyCalendar } from "./WeeklyCalendar";
export { MealDetail } from "./MealDetail";
export { AddMealForm } from "./AddMealForm";
export { LeftoverCard } from "./LeftoverCard";
```

**Step 2: Commit**

```bash
git add frontend/src/components/meal-plan/index.ts
git commit -m "feat(components): add meal-plan components index"
```

---

## Task 13: Create Meal Plan Page

**Files:**
- Create: `frontend/src/app/[locale]/plan/page.tsx`

**Step 1: Create the page**

```typescript
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { api, type MealPlan } from "@/lib/api";
import { WeeklyCalendar } from "@/components/meal-plan/WeeklyCalendar";
import { MealDetail } from "@/components/meal-plan/MealDetail";
import { cn } from "@/lib/utils";

// TODO: Get from user context
const HOUSEHOLD_ID = "00000000-0000-0000-0000-000000000001";

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function MealPlanPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("MealPlan");

  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [meals, setMeals] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeal, setSelectedMeal] = useState<MealPlan | null>(null);
  const [cooking, setCooking] = useState(false);

  const loadMeals = useCallback(async () => {
    setLoading(true);
    try {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const response = await api.getMealPlans(
        HOUSEHOLD_ID,
        weekStart.toISOString(),
        weekEnd.toISOString()
      );
      setMeals(response.meal_plans);
    } catch (error) {
      console.error("Failed to load meals:", error);
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => {
    loadMeals();
  }, [loadMeals]);

  const handlePrevWeek = () => {
    const newStart = new Date(weekStart);
    newStart.setDate(newStart.getDate() - 7);
    setWeekStart(newStart);
  };

  const handleNextWeek = () => {
    const newStart = new Date(weekStart);
    newStart.setDate(newStart.getDate() + 7);
    setWeekStart(newStart);
  };

  const handleAddMeal = (date: Date, mealType: "breakfast" | "lunch" | "dinner") => {
    const dateStr = date.toISOString().split("T")[0];
    router.push(`/${locale}/plan/add?date=${dateStr}&meal=${mealType}`);
  };

  const handleCook = async (data: { actual_servings?: number; create_leftover: boolean; leftover_servings?: number }) => {
    if (!selectedMeal) return;

    setCooking(true);
    try {
      await api.cookMealPlan(selectedMeal.id, data);
      await loadMeals();
      setSelectedMeal(null);
    } catch (error) {
      console.error("Failed to cook meal:", error);
    } finally {
      setCooking(false);
    }
  };

  const handleSkip = async () => {
    if (!selectedMeal) return;

    try {
      await api.updateMealPlan(selectedMeal.id, { status: "skipped" });
      await loadMeals();
      setSelectedMeal(null);
    } catch (error) {
      console.error("Failed to skip meal:", error);
    }
  };

  const handleDelete = async () => {
    if (!selectedMeal || !confirm(t("confirmDelete"))) return;

    try {
      await api.deleteMealPlan(selectedMeal.id);
      await loadMeals();
      setSelectedMeal(null);
    } catch (error) {
      console.error("Failed to delete meal:", error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
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

        <button
          onClick={() => router.push(`/${locale}/plan/add`)}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium",
            "bg-fjord-500 text-white",
            "hover:bg-fjord-600 transition-colors"
          )}
        >
          <Plus className="w-4 h-4" />
          {t("addMeal")}
        </button>
      </div>

      {/* Calendar */}
      <WeeklyCalendar
        weekStart={weekStart}
        meals={meals}
        loading={loading}
        onPrevWeek={handlePrevWeek}
        onNextWeek={handleNextWeek}
        onAddMeal={handleAddMeal}
        onMealClick={setSelectedMeal}
      />

      {/* Meal Detail Modal */}
      {selectedMeal && (
        <MealDetail
          meal={selectedMeal}
          onClose={() => setSelectedMeal(null)}
          onCook={handleCook}
          onSkip={handleSkip}
          onDelete={handleDelete}
          cooking={cooking}
        />
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
mkdir -p "frontend/src/app/[locale]/plan"
git add "frontend/src/app/[locale]/plan/page.tsx"
git commit -m "feat(pages): add meal plan page"
```

---

## Task 14: Create Add Meal Page

**Files:**
- Create: `frontend/src/app/[locale]/plan/add/page.tsx`

**Step 1: Create the page**

```typescript
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/api";
import { AddMealForm } from "@/components/meal-plan/AddMealForm";

// TODO: Get from user context
const HOUSEHOLD_ID = "00000000-0000-0000-0000-000000000001";

export default function AddMealPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("MealPlan");
  const searchParams = useSearchParams();

  const defaultDate = searchParams.get("date") || undefined;
  const defaultMealType = searchParams.get("meal") as "breakfast" | "lunch" | "dinner" | undefined;

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (data: {
    recipe_id: string;
    planned_date: string;
    meal_type: "breakfast" | "lunch" | "dinner";
    servings: number;
  }) => {
    setSaving(true);
    try {
      await api.createMealPlan({
        household_id: HOUSEHOLD_ID,
        ...data,
      });
      router.push(`/${locale}/plan`);
    } catch (error) {
      console.error("Failed to create meal:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/${locale}/plan`}
          className="inline-flex items-center gap-2 text-fjord-500 hover:text-fjord-700 dark:hover:text-fjord-300 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("title")}
        </Link>

        <h1 className="text-2xl font-display font-semibold text-fjord-800 dark:text-fjord-100">
          {t("addTitle")}
        </h1>
      </div>

      {/* Form */}
      <AddMealForm
        householdId={HOUSEHOLD_ID}
        defaultDate={defaultDate}
        defaultMealType={defaultMealType}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        saving={saving}
      />
    </div>
  );
}
```

**Step 2: Commit**

```bash
mkdir -p "frontend/src/app/[locale]/plan/add"
git add "frontend/src/app/[locale]/plan/add/page.tsx"
git commit -m "feat(pages): add meal plan add page"
```

---

## Task 15: Create Leftovers Page

**Files:**
- Create: `frontend/src/app/[locale]/leftovers/page.tsx`

**Step 1: Create the page**

```typescript
"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Soup } from "lucide-react";
import { api, type Leftover, type Recipe } from "@/lib/api";
import { LeftoverCard } from "@/components/meal-plan/LeftoverCard";
import { cn } from "@/lib/utils";

// TODO: Get from user context
const HOUSEHOLD_ID = "00000000-0000-0000-0000-000000000001";

export default function LeftoversPage() {
  const t = useTranslations("Leftovers");

  const [leftovers, setLeftovers] = useState<Leftover[]>([]);
  const [recipes, setRecipes] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "available">("available");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [leftoverResponse, recipeResponse] = await Promise.all([
        api.getLeftovers(HOUSEHOLD_ID, filter === "available" ? "available" : undefined),
        api.getRecipes(HOUSEHOLD_ID),
      ]);

      setLeftovers(leftoverResponse.leftovers);

      const recipeMap = new Map<string, string>();
      recipeResponse.recipes.forEach((r: Recipe) => recipeMap.set(r.id, r.name));
      setRecipes(recipeMap);
    } catch (error) {
      console.error("Failed to load leftovers:", error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleMarkConsumed = async (id: string) => {
    try {
      await api.updateLeftover(id, { status: "consumed" });
      await loadData();
    } catch (error) {
      console.error("Failed to mark as consumed:", error);
    }
  };

  const handleMarkDiscarded = async (id: string) => {
    try {
      await api.updateLeftover(id, { status: "discarded" });
      await loadData();
    } catch (error) {
      console.error("Failed to mark as discarded:", error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
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

        {/* Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("available")}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-colors",
              filter === "available"
                ? "bg-fjord-500 text-white"
                : "bg-fjord-100 dark:bg-fjord-800 text-fjord-600 dark:text-fjord-300"
            )}
          >
            {t("filterAvailable")}
          </button>
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-colors",
              filter === "all"
                ? "bg-fjord-500 text-white"
                : "bg-fjord-100 dark:bg-fjord-800 text-fjord-600 dark:text-fjord-300"
            )}
          >
            {t("filterAll")}
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-40 bg-fjord-100 dark:bg-fjord-800 rounded-xl animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && leftovers.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-fjord-100 dark:bg-fjord-800 flex items-center justify-center">
            <Soup className="w-8 h-8 text-fjord-400 dark:text-fjord-500" />
          </div>
          <h3 className="text-lg font-semibold text-fjord-700 dark:text-fjord-200">
            {t("noLeftovers")}
          </h3>
          <p className="mt-1 text-fjord-500 dark:text-fjord-400 max-w-sm mx-auto">
            {t("noLeftoversMessage")}
          </p>
        </div>
      )}

      {/* Grid */}
      {!loading && leftovers.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {leftovers.map((leftover) => (
            <LeftoverCard
              key={leftover.id}
              leftover={leftover}
              recipeName={recipes.get(leftover.recipe_id) || "Unknown"}
              onMarkConsumed={() => handleMarkConsumed(leftover.id)}
              onMarkDiscarded={() => handleMarkDiscarded(leftover.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
mkdir -p "frontend/src/app/[locale]/leftovers"
git add "frontend/src/app/[locale]/leftovers/page.tsx"
git commit -m "feat(pages): add leftovers page"
```

---

## Task 16: Test Frontend Build

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
- 7 new components in `frontend/src/components/meal-plan/`
- 3 new pages in `frontend/src/app/[locale]/`
- API client extensions with meal plan and leftover types and methods
- Norwegian and English translations
- Navigation update with Plan and Leftovers links

All components follow existing patterns (Tailwind, dark mode, lucide icons, next-intl).
