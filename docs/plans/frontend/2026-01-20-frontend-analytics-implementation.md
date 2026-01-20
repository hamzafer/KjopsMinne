# Frontend Analytics Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use frontend-design skill for implementation. Follow existing patterns exactly.

**Goal:** Enhance analytics page with dashboard cards for cost-per-meal, waste tracking, spend trends, and restock predictions.

**Architecture:** Enhance existing `/analytics` page with expandable stat cards. Period selector for filtering. Parallel data fetching. Mobile-responsive grid.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, next-intl, lucide-react

---

## Task 1: Add Analytics Types and API Methods

**Files:**
- Modify: `frontend/src/lib/api.ts`

**Step 1: Add types after ShoppingList interfaces**

```typescript
// Extended Analytics types
export interface MealCostEntry {
  meal_plan_id: string;
  recipe_name: string;
  planned_date: string;
  servings: number;
  actual_cost: number;
  cost_per_serving: number;
}

export interface CostPerMealResponse {
  meals: MealCostEntry[];
  total_meals: number;
  total_cost: number;
  average_cost_per_meal: number;
  average_cost_per_serving: number;
  period_start: string | null;
  period_end: string | null;
}

export interface WasteEntry {
  date: string;
  ingredient_name: string | null;
  quantity: number;
  unit: string;
  reason: string;
  estimated_value: number | null;
}

export interface LeftoverWasteEntry {
  leftover_id: string;
  recipe_name: string;
  servings_wasted: number;
  created_at: string;
  discarded_at: string | null;
}

export interface WasteResponse {
  inventory_discards: WasteEntry[];
  leftover_discards: LeftoverWasteEntry[];
  total_inventory_waste_value: number;
  total_leftover_servings_wasted: number;
  period_start: string | null;
  period_end: string | null;
}

export interface SpendTrendPoint {
  period: string;
  total_spent: number;
  receipt_count: number;
  meal_count: number;
  meal_cost: number;
}

export interface SpendTrendResponse {
  trends: SpendTrendPoint[];
  granularity: "daily" | "weekly" | "monthly";
  period_start: string;
  period_end: string;
}

export interface RestockPrediction {
  ingredient_id: string;
  ingredient_name: string;
  current_quantity: number;
  unit: string;
  average_daily_usage: number;
  days_until_empty: number | null;
  predicted_runout_date: string | null;
  recommended_restock_date: string | null;
}

export interface RestockPredictionsResponse {
  predictions: RestockPrediction[];
  household_id: string;
  generated_at: string;
}
```

**Step 2: Add API methods to ApiClient class**

```typescript
  // Extended Analytics
  async getCostPerMeal(
    householdId: string,
    startDate?: string,
    endDate?: string
  ): Promise<CostPerMealResponse> {
    const params = new URLSearchParams();
    params.append("household_id", householdId);
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    return this.fetch(`/api/analytics/cost-per-meal?${params.toString()}`);
  }

  async getWasteAnalytics(
    householdId: string,
    startDate?: string,
    endDate?: string
  ): Promise<WasteResponse> {
    const params = new URLSearchParams();
    params.append("household_id", householdId);
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    return this.fetch(`/api/analytics/waste?${params.toString()}`);
  }

  async getSpendTrend(
    householdId: string,
    startDate: string,
    endDate: string,
    granularity: "daily" | "weekly" | "monthly" = "weekly"
  ): Promise<SpendTrendResponse> {
    const params = new URLSearchParams();
    params.append("household_id", householdId);
    params.append("start_date", startDate);
    params.append("end_date", endDate);
    params.append("granularity", granularity);
    return this.fetch(`/api/analytics/spend-trend?${params.toString()}`);
  }

  async getRestockPredictions(
    householdId: string
  ): Promise<RestockPredictionsResponse> {
    const params = new URLSearchParams();
    params.append("household_id", householdId);
    return this.fetch(`/api/analytics/restock-predictions?${params.toString()}`);
  }
```

**Step 3: Commit**

```bash
git add frontend/src/lib/api.ts
git commit -m "feat(frontend): add extended analytics types and API methods"
```

---

## Task 2: Add Norwegian Translations

**Files:**
- Modify: `frontend/src/messages/nb.json`

**Step 1: Add ExtendedAnalytics namespace after Shopping section**

```json
  "ExtendedAnalytics": {
    "costPerMeal": "Kostnad per måltid",
    "avgCostPerServing": "snitt per porsjon",
    "totalMeals": "måltider totalt",
    "waste": "Svinn",
    "itemsDiscarded": "varer kastet",
    "servingsWasted": "porsjoner kastet",
    "wasteValue": "Verdi av svinn",
    "spendTrend": "Forbrukstrend",
    "vsLastPeriod": "vs forrige periode",
    "up": "opp",
    "down": "ned",
    "restock": "Påfylling snart",
    "itemsLow": "varer går tom",
    "daysLeft": "dager igjen",
    "runningLow": "Går snart tom",
    "period": "Periode",
    "thisWeek": "Denne uken",
    "thisMonth": "Denne måneden",
    "last30Days": "Siste 30 dager",
    "noData": "Ingen data",
    "noDataMessage": "Ikke nok data for å vise denne analysen ennå.",
    "viewDetails": "Se detaljer",
    "hideDetails": "Skjul detaljer",
    "inventory": "Lagervarer",
    "leftovers": "Matrester",
    "daily": "Daglig",
    "weekly": "Ukentlig",
    "monthly": "Månedlig",
    "receipts": "Kvitteringer",
    "meals": "Måltider",
    "predictedRunout": "Forventet tom",
    "recommendedRestock": "Anbefalt påfylling"
  },
```

**Step 2: Commit**

```bash
git add frontend/src/messages/nb.json
git commit -m "feat(i18n): add Norwegian extended analytics translations"
```

---

## Task 3: Add English Translations

**Files:**
- Modify: `frontend/src/messages/en.json`

**Step 1: Add ExtendedAnalytics namespace after Shopping section**

```json
  "ExtendedAnalytics": {
    "costPerMeal": "Cost Per Meal",
    "avgCostPerServing": "avg per serving",
    "totalMeals": "meals total",
    "waste": "Waste",
    "itemsDiscarded": "items discarded",
    "servingsWasted": "servings wasted",
    "wasteValue": "Waste value",
    "spendTrend": "Spend Trend",
    "vsLastPeriod": "vs last period",
    "up": "up",
    "down": "down",
    "restock": "Restock Soon",
    "itemsLow": "items running low",
    "daysLeft": "days left",
    "runningLow": "Running low",
    "period": "Period",
    "thisWeek": "This week",
    "thisMonth": "This month",
    "last30Days": "Last 30 days",
    "noData": "No data",
    "noDataMessage": "Not enough data to show this analysis yet.",
    "viewDetails": "View details",
    "hideDetails": "Hide details",
    "inventory": "Inventory",
    "leftovers": "Leftovers",
    "daily": "Daily",
    "weekly": "Weekly",
    "monthly": "Monthly",
    "receipts": "Receipts",
    "meals": "Meals",
    "predictedRunout": "Predicted runout",
    "recommendedRestock": "Recommended restock"
  },
```

**Step 2: Commit**

```bash
git add frontend/src/messages/en.json
git commit -m "feat(i18n): add English extended analytics translations"
```

---

## Task 4: Create StatCard Component

**Files:**
- Create: `frontend/src/components/analytics/StatCard.tsx`

**Step 1: Create the component**

```typescript
"use client";

import { useState, ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    direction: "up" | "down" | "neutral";
    value: string;
  };
  color?: "default" | "success" | "warning" | "danger";
  expandable?: boolean;
  children?: ReactNode;
  loading?: boolean;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = "default",
  expandable = false,
  children,
  loading = false,
}: StatCardProps) {
  const [expanded, setExpanded] = useState(false);

  const colorClasses = {
    default: "bg-fjord-100 dark:bg-fjord-700 text-fjord-500 dark:text-fjord-300",
    success: "bg-forest-100 dark:bg-forest-900/30 text-forest-500",
    warning: "bg-amber-100 dark:bg-amber-900/30 text-amber-500",
    danger: "bg-red-100 dark:bg-red-900/30 text-red-500",
  };

  const trendColors = {
    up: "text-forest-500",
    down: "text-red-500",
    neutral: "text-fjord-400",
  };

  if (loading) {
    return (
      <div className="paper-card p-4 animate-pulse">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-fjord-100 dark:bg-fjord-700" />
          <div className="flex-grow">
            <div className="h-4 w-20 bg-fjord-100 dark:bg-fjord-700 rounded mb-2" />
            <div className="h-8 w-16 bg-fjord-100 dark:bg-fjord-700 rounded mb-1" />
            <div className="h-3 w-24 bg-fjord-100 dark:bg-fjord-700 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="paper-card overflow-hidden">
      <button
        onClick={() => expandable && setExpanded(!expanded)}
        disabled={!expandable}
        className={cn(
          "w-full p-4 text-left",
          expandable && "hover:bg-fjord-50 dark:hover:bg-fjord-800/50 transition-colors"
        )}
      >
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div
            className={cn(
              "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center",
              colorClasses[color]
            )}
          >
            {icon}
          </div>

          {/* Content */}
          <div className="flex-grow min-w-0">
            <p className="text-sm font-medium text-fjord-500 dark:text-fjord-400">
              {title}
            </p>
            <p className="text-2xl font-bold text-fjord-800 dark:text-fjord-100 mt-0.5">
              {value}
            </p>
            {(subtitle || trend) && (
              <div className="flex items-center gap-2 mt-1">
                {subtitle && (
                  <span className="text-sm text-fjord-400">{subtitle}</span>
                )}
                {trend && (
                  <span
                    className={cn(
                      "text-sm font-medium flex items-center gap-0.5",
                      trendColors[trend.direction]
                    )}
                  >
                    {trend.direction === "up" && "↑"}
                    {trend.direction === "down" && "↓"}
                    {trend.value}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Expand indicator */}
          {expandable && (
            <div className="flex-shrink-0 text-fjord-400">
              {expanded ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </div>
          )}
        </div>
      </button>

      {/* Expandable content */}
      {expandable && expanded && children && (
        <div className="px-4 pb-4 pt-0 border-t border-fjord-100 dark:border-fjord-700">
          {children}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/analytics/StatCard.tsx
git commit -m "feat(components): add StatCard component"
```

---

## Task 5: Create CostPerMealCard Component

**Files:**
- Create: `frontend/src/components/analytics/CostPerMealCard.tsx`

**Step 1: Create the component**

```typescript
"use client";

import { useTranslations, useLocale } from "next-intl";
import { DollarSign } from "lucide-react";
import { StatCard } from "./StatCard";
import { formatNOK, formatDate } from "@/lib/api";
import type { CostPerMealResponse } from "@/lib/api";

interface CostPerMealCardProps {
  data: CostPerMealResponse | null;
  loading?: boolean;
}

export function CostPerMealCard({ data, loading }: CostPerMealCardProps) {
  const t = useTranslations("ExtendedAnalytics");
  const locale = useLocale();

  if (loading || !data) {
    return (
      <StatCard
        title={t("costPerMeal")}
        value="-"
        icon={<DollarSign className="w-6 h-6" />}
        loading={loading}
      />
    );
  }

  const hasData = data.total_meals > 0;

  return (
    <StatCard
      title={t("costPerMeal")}
      value={hasData ? `kr ${formatNOK(data.average_cost_per_serving, locale)}` : "-"}
      subtitle={hasData ? t("avgCostPerServing") : t("noData")}
      icon={<DollarSign className="w-6 h-6" />}
      expandable={hasData}
    >
      <div className="mt-4 space-y-2">
        <p className="text-xs text-fjord-400 uppercase tracking-wide">
          {data.total_meals} {t("totalMeals")}
        </p>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {data.meals.slice(0, 10).map((meal) => (
            <div
              key={meal.meal_plan_id}
              className="flex items-center justify-between py-2 border-b border-fjord-100 dark:border-fjord-700 last:border-0"
            >
              <div>
                <p className="text-sm font-medium text-fjord-700 dark:text-fjord-200">
                  {meal.recipe_name}
                </p>
                <p className="text-xs text-fjord-400">
                  {formatDate(meal.planned_date, locale)} · {meal.servings} porsjoner
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-fjord-800 dark:text-fjord-100">
                  kr {formatNOK(meal.actual_cost, locale)}
                </p>
                <p className="text-xs text-fjord-400">
                  kr {formatNOK(meal.cost_per_serving, locale)}/porsjon
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </StatCard>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/analytics/CostPerMealCard.tsx
git commit -m "feat(components): add CostPerMealCard component"
```

---

## Task 6: Create WasteCard Component

**Files:**
- Create: `frontend/src/components/analytics/WasteCard.tsx`

**Step 1: Create the component**

```typescript
"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatCard } from "./StatCard";
import { formatNOK, formatDate } from "@/lib/api";
import type { WasteResponse } from "@/lib/api";

interface WasteCardProps {
  data: WasteResponse | null;
  loading?: boolean;
}

export function WasteCard({ data, loading }: WasteCardProps) {
  const t = useTranslations("ExtendedAnalytics");
  const locale = useLocale();
  const [tab, setTab] = useState<"inventory" | "leftovers">("inventory");

  if (loading || !data) {
    return (
      <StatCard
        title={t("waste")}
        value="-"
        icon={<Trash2 className="w-6 h-6" />}
        color="warning"
        loading={loading}
      />
    );
  }

  const totalItems =
    data.inventory_discards.length + data.leftover_discards.length;
  const hasData = totalItems > 0;

  return (
    <StatCard
      title={t("waste")}
      value={hasData ? `${totalItems}` : "-"}
      subtitle={
        hasData
          ? `${data.inventory_discards.length} ${t("itemsDiscarded")}`
          : t("noData")
      }
      icon={<Trash2 className="w-6 h-6" />}
      color={hasData ? "warning" : "default"}
      expandable={hasData}
    >
      <div className="mt-4">
        {/* Tabs */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setTab("inventory")}
            className={cn(
              "px-3 py-1.5 text-sm rounded-lg transition-colors",
              tab === "inventory"
                ? "bg-fjord-100 dark:bg-fjord-700 text-fjord-800 dark:text-fjord-100"
                : "text-fjord-500 hover:bg-fjord-50 dark:hover:bg-fjord-800"
            )}
          >
            {t("inventory")} ({data.inventory_discards.length})
          </button>
          <button
            onClick={() => setTab("leftovers")}
            className={cn(
              "px-3 py-1.5 text-sm rounded-lg transition-colors",
              tab === "leftovers"
                ? "bg-fjord-100 dark:bg-fjord-700 text-fjord-800 dark:text-fjord-100"
                : "text-fjord-500 hover:bg-fjord-50 dark:hover:bg-fjord-800"
            )}
          >
            {t("leftovers")} ({data.leftover_discards.length})
          </button>
        </div>

        {/* Content */}
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {tab === "inventory" &&
            data.inventory_discards.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 border-b border-fjord-100 dark:border-fjord-700 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-fjord-700 dark:text-fjord-200">
                    {item.ingredient_name || "Unknown"}
                  </p>
                  <p className="text-xs text-fjord-400">
                    {item.quantity} {item.unit} · {item.reason}
                  </p>
                </div>
                {item.estimated_value && (
                  <p className="text-sm text-amber-500">
                    kr {formatNOK(item.estimated_value, locale)}
                  </p>
                )}
              </div>
            ))}
          {tab === "leftovers" &&
            data.leftover_discards.map((item) => (
              <div
                key={item.leftover_id}
                className="flex items-center justify-between py-2 border-b border-fjord-100 dark:border-fjord-700 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-fjord-700 dark:text-fjord-200">
                    {item.recipe_name}
                  </p>
                  <p className="text-xs text-fjord-400">
                    {item.servings_wasted} {t("servingsWasted")}
                  </p>
                </div>
                <p className="text-xs text-fjord-400">
                  {formatDate(item.created_at, locale)}
                </p>
              </div>
            ))}
        </div>

        {/* Total value */}
        {data.total_inventory_waste_value > 0 && (
          <div className="mt-3 pt-3 border-t border-fjord-100 dark:border-fjord-700">
            <div className="flex justify-between text-sm">
              <span className="text-fjord-500">{t("wasteValue")}</span>
              <span className="font-semibold text-amber-500">
                kr {formatNOK(data.total_inventory_waste_value, locale)}
              </span>
            </div>
          </div>
        )}
      </div>
    </StatCard>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/analytics/WasteCard.tsx
git commit -m "feat(components): add WasteCard component"
```

---

## Task 7: Create SpendTrendCard Component

**Files:**
- Create: `frontend/src/components/analytics/SpendTrendCard.tsx`

**Step 1: Create the component**

```typescript
"use client";

import { useTranslations, useLocale } from "next-intl";
import { TrendingUp, TrendingDown } from "lucide-react";
import { StatCard } from "./StatCard";
import { formatNOK } from "@/lib/api";
import type { SpendTrendResponse } from "@/lib/api";

interface SpendTrendCardProps {
  data: SpendTrendResponse | null;
  loading?: boolean;
}

export function SpendTrendCard({ data, loading }: SpendTrendCardProps) {
  const t = useTranslations("ExtendedAnalytics");
  const locale = useLocale();

  if (loading || !data) {
    return (
      <StatCard
        title={t("spendTrend")}
        value="-"
        icon={<TrendingUp className="w-6 h-6" />}
        loading={loading}
      />
    );
  }

  const hasData = data.trends.length > 1;

  // Calculate trend
  let trendDirection: "up" | "down" | "neutral" = "neutral";
  let trendPercent = "0%";

  if (hasData && data.trends.length >= 2) {
    const current = data.trends[data.trends.length - 1].total_spent;
    const previous = data.trends[data.trends.length - 2].total_spent;
    if (previous > 0) {
      const change = ((current - previous) / previous) * 100;
      trendDirection = change > 0 ? "up" : change < 0 ? "down" : "neutral";
      trendPercent = `${Math.abs(change).toFixed(0)}%`;
    }
  }

  const latestSpend = hasData
    ? data.trends[data.trends.length - 1].total_spent
    : 0;

  return (
    <StatCard
      title={t("spendTrend")}
      value={hasData ? `kr ${formatNOK(latestSpend, locale)}` : "-"}
      subtitle={hasData ? t("vsLastPeriod") : t("noData")}
      icon={
        trendDirection === "down" ? (
          <TrendingDown className="w-6 h-6" />
        ) : (
          <TrendingUp className="w-6 h-6" />
        )
      }
      trend={
        hasData
          ? {
              direction: trendDirection,
              value: `${trendPercent} ${trendDirection === "up" ? t("up") : t("down")}`,
            }
          : undefined
      }
      color={trendDirection === "down" ? "success" : "default"}
      expandable={hasData}
    >
      <div className="mt-4">
        <p className="text-xs text-fjord-400 uppercase tracking-wide mb-3">
          {data.granularity === "daily" && t("daily")}
          {data.granularity === "weekly" && t("weekly")}
          {data.granularity === "monthly" && t("monthly")}
        </p>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {data.trends.map((point) => (
            <div
              key={point.period}
              className="flex items-center justify-between py-2 border-b border-fjord-100 dark:border-fjord-700 last:border-0"
            >
              <div>
                <p className="text-sm font-medium text-fjord-700 dark:text-fjord-200">
                  {point.period}
                </p>
                <p className="text-xs text-fjord-400">
                  {point.receipt_count} {t("receipts")} · {point.meal_count}{" "}
                  {t("meals")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-fjord-800 dark:text-fjord-100">
                  kr {formatNOK(point.total_spent, locale)}
                </p>
                {point.meal_cost > 0 && (
                  <p className="text-xs text-fjord-400">
                    +kr {formatNOK(point.meal_cost, locale)} måltider
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </StatCard>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/analytics/SpendTrendCard.tsx
git commit -m "feat(components): add SpendTrendCard component"
```

---

## Task 8: Create RestockCard Component

**Files:**
- Create: `frontend/src/components/analytics/RestockCard.tsx`

**Step 1: Create the component**

```typescript
"use client";

import { useTranslations, useLocale } from "next-intl";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatCard } from "./StatCard";
import { formatDate } from "@/lib/api";
import type { RestockPredictionsResponse } from "@/lib/api";

interface RestockCardProps {
  data: RestockPredictionsResponse | null;
  loading?: boolean;
}

export function RestockCard({ data, loading }: RestockCardProps) {
  const t = useTranslations("ExtendedAnalytics");
  const locale = useLocale();

  if (loading || !data) {
    return (
      <StatCard
        title={t("restock")}
        value="-"
        icon={<AlertTriangle className="w-6 h-6" />}
        loading={loading}
      />
    );
  }

  // Filter to items that need restocking soon (within 7 days)
  const urgentItems = data.predictions.filter(
    (p) => p.days_until_empty !== null && p.days_until_empty <= 7
  );

  const hasData = urgentItems.length > 0;

  const getUrgencyColor = (days: number | null) => {
    if (days === null) return "text-fjord-400";
    if (days <= 3) return "text-red-500";
    if (days <= 7) return "text-amber-500";
    return "text-forest-500";
  };

  const getUrgencyBg = (days: number | null) => {
    if (days === null) return "bg-fjord-100 dark:bg-fjord-700";
    if (days <= 3) return "bg-red-100 dark:bg-red-900/30";
    if (days <= 7) return "bg-amber-100 dark:bg-amber-900/30";
    return "bg-forest-100 dark:bg-forest-900/30";
  };

  return (
    <StatCard
      title={t("restock")}
      value={hasData ? `${urgentItems.length}` : "-"}
      subtitle={hasData ? t("itemsLow") : t("noData")}
      icon={<AlertTriangle className="w-6 h-6" />}
      color={urgentItems.some((i) => (i.days_until_empty ?? 999) <= 3) ? "danger" : hasData ? "warning" : "default"}
      expandable={data.predictions.length > 0}
    >
      <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
        {data.predictions.slice(0, 10).map((item) => (
          <div
            key={item.ingredient_id}
            className="flex items-center justify-between py-2 border-b border-fjord-100 dark:border-fjord-700 last:border-0"
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  item.days_until_empty !== null && item.days_until_empty <= 3
                    ? "bg-red-500"
                    : item.days_until_empty !== null && item.days_until_empty <= 7
                    ? "bg-amber-500"
                    : "bg-forest-500"
                )}
              />
              <div>
                <p className="text-sm font-medium text-fjord-700 dark:text-fjord-200">
                  {item.ingredient_name}
                </p>
                <p className="text-xs text-fjord-400">
                  {item.current_quantity} {item.unit}
                </p>
              </div>
            </div>
            <div className="text-right">
              {item.days_until_empty !== null ? (
                <>
                  <p className={cn("text-sm font-semibold", getUrgencyColor(item.days_until_empty))}>
                    {item.days_until_empty} {t("daysLeft")}
                  </p>
                  {item.recommended_restock_date && (
                    <p className="text-xs text-fjord-400">
                      {t("recommendedRestock")}: {formatDate(item.recommended_restock_date, locale)}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-xs text-fjord-400">-</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </StatCard>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/analytics/RestockCard.tsx
git commit -m "feat(components): add RestockCard component"
```

---

## Task 9: Create Component Index

**Files:**
- Create: `frontend/src/components/analytics/index.ts`

**Step 1: Create barrel export**

```typescript
export { StatCard } from "./StatCard";
export { CostPerMealCard } from "./CostPerMealCard";
export { WasteCard } from "./WasteCard";
export { SpendTrendCard } from "./SpendTrendCard";
export { RestockCard } from "./RestockCard";
```

**Step 2: Commit**

```bash
git add frontend/src/components/analytics/index.ts
git commit -m "feat(components): add analytics components index"
```

---

## Task 10: Update Analytics Page

**Files:**
- Modify: `frontend/src/app/[locale]/analytics/page.tsx`

**Step 1: Rewrite the analytics page with new dashboard**

```typescript
"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import {
  api,
  CostPerMealResponse,
  WasteResponse,
  SpendTrendResponse,
  RestockPredictionsResponse,
} from "@/lib/api";
import {
  CostPerMealCard,
  WasteCard,
  SpendTrendCard,
  RestockCard,
} from "@/components/analytics";

// TODO: Get from auth context
const DEMO_HOUSEHOLD_ID = "00000000-0000-0000-0000-000000000001";

type Period = "week" | "month" | "30days";

export default function AnalyticsPage() {
  const t = useTranslations("ExtendedAnalytics");
  const locale = useLocale();

  const [period, setPeriod] = useState<Period>("month");
  const [loading, setLoading] = useState(true);

  const [costData, setCostData] = useState<CostPerMealResponse | null>(null);
  const [wasteData, setWasteData] = useState<WasteResponse | null>(null);
  const [trendData, setTrendData] = useState<SpendTrendResponse | null>(null);
  const [restockData, setRestockData] = useState<RestockPredictionsResponse | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const now = new Date();
      let startDate: Date;
      let endDate = now;

      switch (period) {
        case "week":
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          break;
        case "month":
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
          break;
        case "30days":
        default:
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 30);
          break;
      }

      const startStr = startDate.toISOString();
      const endStr = endDate.toISOString();

      try {
        const [cost, waste, trend, restock] = await Promise.all([
          api.getCostPerMeal(DEMO_HOUSEHOLD_ID, startStr, endStr).catch(() => null),
          api.getWasteAnalytics(DEMO_HOUSEHOLD_ID, startStr, endStr).catch(() => null),
          api.getSpendTrend(DEMO_HOUSEHOLD_ID, startStr, endStr, "weekly").catch(() => null),
          api.getRestockPredictions(DEMO_HOUSEHOLD_ID).catch(() => null),
        ]);

        setCostData(cost);
        setWasteData(waste);
        setTrendData(trend);
        setRestockData(restock);
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]);

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="font-display text-3xl font-bold text-fjord-800 dark:text-fjord-100">
            {t("costPerMeal").split(" ")[0]} & Analyse
          </h1>

          {/* Period selector */}
          <div className="flex gap-2 mt-4">
            {(["week", "month", "30days"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                  period === p
                    ? "bg-fjord-800 dark:bg-fjord-100 text-white dark:text-fjord-900"
                    : "bg-fjord-100 dark:bg-fjord-700 text-fjord-600 dark:text-fjord-300 hover:bg-fjord-200 dark:hover:bg-fjord-600"
                )}
              >
                {p === "week" && t("thisWeek")}
                {p === "month" && t("thisMonth")}
                {p === "30days" && t("last30Days")}
              </button>
            ))}
          </div>
        </header>

        {/* Dashboard grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CostPerMealCard data={costData} loading={loading} />
          <WasteCard data={wasteData} loading={loading} />
          <SpendTrendCard data={trendData} loading={loading} />
          <RestockCard data={restockData} loading={loading} />
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/app/[locale]/analytics/page.tsx
git commit -m "feat(pages): enhance analytics page with dashboard cards"
```

---

## Task 11: Run Linting and Type Check

**Step 1: Run linting**

```bash
cd frontend && npm run lint
```

**Step 2: Run type check**

```bash
cd frontend && npm run type-check
```

**Step 3: Fix any errors**

---

## Task 12: Test Manually

**Step 1: Start the development server**

```bash
make dev
```

**Step 2: Test the dashboard**

1. Navigate to `/analytics`
2. Verify all 4 cards load
3. Test period selector (week/month/30 days)
4. Expand each card and verify details show
5. Test loading states
6. Test with no data scenarios

---

## Summary

Phase 6 Frontend enhances analytics:

| Component | Purpose |
|-----------|---------|
| StatCard | Reusable card with trend indicator |
| CostPerMealCard | Cost analysis expandable |
| WasteCard | Waste tracking with tabs |
| SpendTrendCard | Trend with period breakdown |
| RestockCard | Restock predictions with urgency |

| Enhancement | Description |
|-------------|-------------|
| Period selector | Filter by week/month/30 days |
| Parallel fetch | Load all 4 endpoints together |
| Expandable cards | Tap for details |
| Color coding | Urgency indicators |

Key features:
- Mobile-responsive 2x2 grid
- Loading skeletons per card
- Error handling per endpoint
- Smooth animations
