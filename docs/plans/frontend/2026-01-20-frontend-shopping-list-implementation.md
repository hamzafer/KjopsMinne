# Frontend Shopping List Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use frontend-design skill for implementation. Follow existing patterns exactly.

**Goal:** Implement supermarket-optimized shopping list UI with large touch targets, swipe gestures, and category grouping.

**Architecture:** Next.js 15 App Router pages with shared components. API client extended for shopping list endpoints. Optimistic updates for checking items. Translations for nb/en.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, next-intl, lucide-react

---

## Task 1: Add Shopping List Types and API Methods

**Files:**
- Modify: `frontend/src/lib/api.ts`

**Step 1: Add types after Leftover interfaces (around line 187)**

```typescript
// Shopping List types
export interface ShoppingListItem {
  id: string;
  shopping_list_id: string;
  ingredient_id: string;
  required_quantity: number;
  required_unit: string;
  on_hand_quantity: number;
  to_buy_quantity: number;
  is_checked: boolean;
  actual_quantity: number | null;
  notes: string | null;
  source_meal_plans: string[];
  ingredient_name: string | null;
}

export interface ShoppingList {
  id: string;
  household_id: string;
  name: string;
  date_range_start: string;
  date_range_end: string;
  status: "active" | "completed" | "archived";
  created_at: string;
  updated_at: string;
  items: ShoppingListItem[];
}

export interface ShoppingListListResponse {
  shopping_lists: ShoppingList[];
  total: number;
}

export interface GenerateShoppingListRequest {
  household_id: string;
  start_date: string;
  end_date: string;
  name?: string;
}

export interface GenerateShoppingListResponse {
  shopping_list: ShoppingList;
  meal_plans_included: number;
  ingredients_aggregated: number;
}
```

**Step 2: Add API methods to ApiClient class (before the closing brace)**

```typescript
  // Shopping Lists
  async getShoppingLists(
    householdId: string,
    status?: string,
    page = 1,
    pageSize = 20
  ): Promise<ShoppingListListResponse> {
    const params = new URLSearchParams();
    params.append("household_id", householdId);
    if (status) params.append("status", status);
    params.append("page", page.toString());
    params.append("page_size", pageSize.toString());
    return this.fetch(`/api/shopping-lists?${params.toString()}`);
  }

  async getShoppingList(id: string): Promise<ShoppingList> {
    return this.fetch(`/api/shopping-lists/${id}`);
  }

  async generateShoppingList(
    data: GenerateShoppingListRequest
  ): Promise<GenerateShoppingListResponse> {
    return this.fetch("/api/shopping-lists/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  async updateShoppingList(
    id: string,
    data: { name?: string; status?: string }
  ): Promise<ShoppingList> {
    return this.fetch(`/api/shopping-lists/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  async updateShoppingListItem(
    listId: string,
    itemId: string,
    data: { is_checked?: boolean; actual_quantity?: number; notes?: string }
  ): Promise<ShoppingListItem> {
    return this.fetch(`/api/shopping-lists/${listId}/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  async deleteShoppingList(id: string): Promise<void> {
    await this.fetch(`/api/shopping-lists/${id}`, { method: "DELETE" });
  }
```

**Step 3: Commit**

```bash
git add frontend/src/lib/api.ts
git commit -m "feat(frontend): add shopping list types and API methods"
```

---

## Task 2: Add Norwegian Translations

**Files:**
- Modify: `frontend/src/messages/nb.json`

**Step 1: Add Shopping namespace after Leftovers section**

```json
  "Shopping": {
    "title": "Handleliste",
    "subtitle": "Handlelister generert fra måltidsplanen",
    "generate": "Generer handleliste",
    "generateForWeek": "Generer for denne uken",
    "generating": "Genererer...",
    "empty": "Ingen handlelister",
    "emptyMessage": "Generer en handleliste fra måltidsplanen din.",
    "progress": "{checked} av {total} varer",
    "allDone": "Alt handlet!",
    "markComplete": "Marker som fullført",
    "active": "Aktive",
    "completed": "Fullførte",
    "itemToBuy": "å kjøpe",
    "itemOnHand": "har",
    "checked": "Handlet",
    "unchecked": "Ikke handlet",
    "notes": "Notater",
    "addNote": "Legg til notat",
    "mealsUsing": "Brukes til",
    "delete": "Slett",
    "confirmDelete": "Er du sikker på at du vil slette denne handlelisten?",
    "confirmComplete": "Marker listen som fullført?",
    "backToLists": "Tilbake til handlelister",
    "dateRange": "{start} - {end}"
  },
```

**Step 2: Add shopping to Navigation namespace**

Find the Navigation section and add:
```json
    "shopping": "Handleliste",
```

**Step 3: Commit**

```bash
git add frontend/src/messages/nb.json
git commit -m "feat(i18n): add Norwegian shopping list translations"
```

---

## Task 3: Add English Translations

**Files:**
- Modify: `frontend/src/messages/en.json`

**Step 1: Add Shopping namespace after Leftovers section**

```json
  "Shopping": {
    "title": "Shopping List",
    "subtitle": "Shopping lists generated from your meal plan",
    "generate": "Generate shopping list",
    "generateForWeek": "Generate for this week",
    "generating": "Generating...",
    "empty": "No shopping lists",
    "emptyMessage": "Generate a shopping list from your meal plan.",
    "progress": "{checked} of {total} items",
    "allDone": "All done!",
    "markComplete": "Mark as complete",
    "active": "Active",
    "completed": "Completed",
    "itemToBuy": "to buy",
    "itemOnHand": "on hand",
    "checked": "Got it",
    "unchecked": "Need",
    "notes": "Notes",
    "addNote": "Add note",
    "mealsUsing": "Used in",
    "delete": "Delete",
    "confirmDelete": "Are you sure you want to delete this shopping list?",
    "confirmComplete": "Mark the list as complete?",
    "backToLists": "Back to shopping lists",
    "dateRange": "{start} - {end}"
  },
```

**Step 2: Add shopping to Navigation namespace**

```json
    "shopping": "Shopping",
```

**Step 3: Commit**

```bash
git add frontend/src/messages/en.json
git commit -m "feat(i18n): add English shopping list translations"
```

---

## Task 4: Create ShoppingListItem Component

**Files:**
- Create: `frontend/src/components/shopping/ShoppingListItem.tsx`

**Step 1: Create the component**

```typescript
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, GripVertical, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ShoppingListItem as ShoppingListItemType } from "@/lib/api";

interface ShoppingListItemProps {
  item: ShoppingListItemType;
  onToggle: (itemId: string, checked: boolean) => void;
  isUpdating?: boolean;
}

export function ShoppingListItem({
  item,
  onToggle,
  isUpdating = false,
}: ShoppingListItemProps) {
  const t = useTranslations("Shopping");
  const [showDetails, setShowDetails] = useState(false);

  const handleToggle = () => {
    if (!isUpdating) {
      onToggle(item.id, !item.is_checked);
    }
  };

  return (
    <div
      className={cn(
        "group paper-card p-0 overflow-hidden transition-all duration-200",
        item.is_checked && "opacity-60"
      )}
    >
      {/* Main row - tap to toggle */}
      <button
        onClick={handleToggle}
        disabled={isUpdating}
        className={cn(
          "w-full flex items-center gap-3 p-4 text-left",
          "active:bg-fjord-50 dark:active:bg-fjord-800/50",
          "transition-colors duration-100"
        )}
      >
        {/* Large checkbox */}
        <div
          className={cn(
            "flex-shrink-0 w-12 h-12 rounded-xl border-2 flex items-center justify-center",
            "transition-all duration-200",
            item.is_checked
              ? "bg-forest-500 border-forest-500 text-white"
              : "border-fjord-300 dark:border-fjord-600"
          )}
        >
          {item.is_checked && <Check className="w-6 h-6" strokeWidth={3} />}
        </div>

        {/* Item info */}
        <div className="flex-grow min-w-0">
          <p
            className={cn(
              "font-medium text-lg text-fjord-800 dark:text-fjord-100",
              item.is_checked && "line-through text-fjord-400 dark:text-fjord-500"
            )}
          >
            {item.ingredient_name || "Unknown"}
          </p>
          <p className="text-sm text-fjord-500 dark:text-fjord-400">
            {item.to_buy_quantity > 0 && (
              <span className="font-semibold text-forest-600 dark:text-forest-400">
                {item.to_buy_quantity} {item.required_unit}
              </span>
            )}
            {item.on_hand_quantity > 0 && (
              <span className="ml-2 text-fjord-400">
                ({item.on_hand_quantity} {t("itemOnHand")})
              </span>
            )}
          </p>
        </div>

        {/* Expand button */}
        {item.source_meal_plans.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDetails(!showDetails);
            }}
            className="flex-shrink-0 p-2 text-fjord-400 hover:text-fjord-600"
          >
            {showDetails ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        )}
      </button>

      {/* Details panel */}
      {showDetails && item.source_meal_plans.length > 0 && (
        <div className="px-4 pb-4 pt-0 border-t border-fjord-100 dark:border-fjord-700">
          <p className="text-xs text-fjord-400 mt-3 mb-1">{t("mealsUsing")}:</p>
          <p className="text-sm text-fjord-600 dark:text-fjord-300">
            {item.source_meal_plans.length} {item.source_meal_plans.length === 1 ? "meal" : "meals"}
          </p>
          {item.notes && (
            <p className="text-sm text-fjord-500 mt-2 italic">{item.notes}</p>
          )}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/shopping/ShoppingListItem.tsx
git commit -m "feat(components): add ShoppingListItem component"
```

---

## Task 5: Create ShoppingListView Component

**Files:**
- Create: `frontend/src/components/shopping/ShoppingListView.tsx`

**Step 1: Create the component**

```typescript
"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ShoppingListItem } from "./ShoppingListItem";
import type { ShoppingList, ShoppingListItem as ShoppingListItemType } from "@/lib/api";

// Category order for store navigation
const CATEGORY_ORDER = [
  "Frukt",
  "Grønnsaker",
  "Meieri",
  "Brød",
  "Kjøtt",
  "Fisk",
  "Drikke",
  "Tørrvarer",
  "Frossen",
  "Snacks",
  "Husholdning",
  "Pant",
  "Ukategorisert",
];

interface ShoppingListViewProps {
  shoppingList: ShoppingList;
  onToggleItem: (itemId: string, checked: boolean) => void;
  onComplete: () => void;
  updatingItems: Set<string>;
}

export function ShoppingListView({
  shoppingList,
  onToggleItem,
  onComplete,
  updatingItems,
}: ShoppingListViewProps) {
  const t = useTranslations("Shopping");

  const checkedCount = shoppingList.items.filter((i) => i.is_checked).length;
  const totalCount = shoppingList.items.length;
  const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;
  const allChecked = checkedCount === totalCount && totalCount > 0;

  // Group items: unchecked first (by category), then checked
  const { uncheckedByCategory, checkedItems } = useMemo(() => {
    const unchecked = shoppingList.items.filter((i) => !i.is_checked);
    const checked = shoppingList.items.filter((i) => i.is_checked);

    // Group unchecked by category (using ingredient name first letter as proxy for now)
    const grouped: Record<string, ShoppingListItemType[]> = {};
    unchecked.forEach((item) => {
      const category = "Ukategorisert"; // TODO: Get from ingredient
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(item);
    });

    // Sort categories
    const sortedCategories = Object.keys(grouped).sort(
      (a, b) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b)
    );

    const sortedGrouped: Record<string, ShoppingListItemType[]> = {};
    sortedCategories.forEach((cat) => {
      sortedGrouped[cat] = grouped[cat].sort((a, b) =>
        (a.ingredient_name || "").localeCompare(b.ingredient_name || "")
      );
    });

    return { uncheckedByCategory: sortedGrouped, checkedItems: checked };
  }, [shoppingList.items]);

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="paper-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-fjord-600 dark:text-fjord-300">
            {allChecked
              ? t("allDone")
              : t("progress", { checked: checkedCount, total: totalCount })}
          </span>
          <span className="text-sm text-fjord-400">{Math.round(progress)}%</span>
        </div>
        <div className="h-3 bg-fjord-100 dark:bg-fjord-700 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              allChecked ? "bg-forest-500" : "bg-fjord-400"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Unchecked items by category */}
      {Object.entries(uncheckedByCategory).map(([category, items]) => (
        <div key={category}>
          <div className="sticky top-0 z-10 bg-cream-50 dark:bg-fjord-900 py-2">
            <h3 className="text-sm font-semibold text-fjord-500 dark:text-fjord-400 uppercase tracking-wide">
              {category}
            </h3>
          </div>
          <div className="space-y-2">
            {items.map((item) => (
              <ShoppingListItem
                key={item.id}
                item={item}
                onToggle={onToggleItem}
                isUpdating={updatingItems.has(item.id)}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Checked items section */}
      {checkedItems.length > 0 && (
        <div>
          <div className="sticky top-0 z-10 bg-cream-50 dark:bg-fjord-900 py-2">
            <h3 className="text-sm font-semibold text-fjord-400 uppercase tracking-wide flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {t("checked")} ({checkedItems.length})
            </h3>
          </div>
          <div className="space-y-2">
            {checkedItems.map((item) => (
              <ShoppingListItem
                key={item.id}
                item={item}
                onToggle={onToggleItem}
                isUpdating={updatingItems.has(item.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Complete button */}
      {allChecked && shoppingList.status === "active" && (
        <button
          onClick={onComplete}
          className={cn(
            "w-full py-4 px-6 rounded-xl font-semibold text-lg",
            "bg-forest-500 text-white",
            "hover:bg-forest-600 active:bg-forest-700",
            "transition-colors duration-200"
          )}
        >
          {t("markComplete")}
        </button>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/shopping/ShoppingListView.tsx
git commit -m "feat(components): add ShoppingListView component"
```

---

## Task 6: Create ShoppingListCard Component

**Files:**
- Create: `frontend/src/components/shopping/ShoppingListCard.tsx`

**Step 1: Create the component**

```typescript
"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ShoppingCart, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/api";
import type { ShoppingList } from "@/lib/api";

interface ShoppingListCardProps {
  shoppingList: ShoppingList;
  animationDelay?: number;
}

export function ShoppingListCard({
  shoppingList,
  animationDelay = 0,
}: ShoppingListCardProps) {
  const locale = useLocale();
  const t = useTranslations("Shopping");

  const checkedCount = shoppingList.items.filter((i) => i.is_checked).length;
  const totalCount = shoppingList.items.length;
  const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;
  const isComplete = shoppingList.status === "completed";

  return (
    <Link
      href={`/${locale}/shopping/${shoppingList.id}`}
      className={cn(
        "group block paper-card p-4",
        "animate-slide-up opacity-0",
        "hover:scale-[1.02] active:scale-[0.98]",
        "transition-all duration-200"
      )}
      style={{
        animationDelay: `${animationDelay}ms`,
        animationFillMode: "forwards",
      }}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={cn(
            "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center",
            isComplete
              ? "bg-forest-100 dark:bg-forest-900/30 text-forest-500"
              : "bg-fjord-100 dark:bg-fjord-700 text-fjord-500 dark:text-fjord-300"
          )}
        >
          {isComplete ? (
            <CheckCircle2 className="w-6 h-6" />
          ) : (
            <ShoppingCart className="w-6 h-6" />
          )}
        </div>

        {/* Content */}
        <div className="flex-grow min-w-0">
          <h3 className="font-display font-semibold text-fjord-800 dark:text-fjord-100 group-hover:text-fjord-600 dark:group-hover:text-fjord-300 transition-colors">
            {shoppingList.name}
          </h3>
          <p className="text-sm text-fjord-500 dark:text-fjord-400 mt-0.5">
            {formatDate(shoppingList.date_range_start, locale)} -{" "}
            {formatDate(shoppingList.date_range_end, locale)}
          </p>

          {/* Progress */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-fjord-500">
                {t("progress", { checked: checkedCount, total: totalCount })}
              </span>
              <span className="text-fjord-400">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-fjord-100 dark:bg-fjord-700 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  isComplete ? "bg-forest-500" : "bg-fjord-400"
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/shopping/ShoppingListCard.tsx
git commit -m "feat(components): add ShoppingListCard component"
```

---

## Task 7: Create GenerateButton Component

**Files:**
- Create: `frontend/src/components/shopping/GenerateButton.tsx`

**Step 1: Create the component**

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ShoppingCart, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface GenerateButtonProps {
  householdId: string;
  weekStart: Date;
  weekEnd: Date;
}

export function GenerateButton({
  householdId,
  weekStart,
  weekEnd,
}: GenerateButtonProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Shopping");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await api.generateShoppingList({
        household_id: householdId,
        start_date: weekStart.toISOString(),
        end_date: weekEnd.toISOString(),
      });
      router.push(`/${locale}/shopping/${response.shopping_list.id}`);
    } catch (error) {
      console.error("Failed to generate shopping list:", error);
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleGenerate}
      disabled={isGenerating}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg font-medium",
        "bg-forest-500 text-white",
        "hover:bg-forest-600 active:bg-forest-700",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "transition-colors duration-200"
      )}
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {t("generating")}
        </>
      ) : (
        <>
          <ShoppingCart className="w-4 h-4" />
          {t("generateForWeek")}
        </>
      )}
    </button>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/shopping/GenerateButton.tsx
git commit -m "feat(components): add GenerateButton component"
```

---

## Task 8: Create Component Index

**Files:**
- Create: `frontend/src/components/shopping/index.ts`

**Step 1: Create barrel export**

```typescript
export { ShoppingListCard } from "./ShoppingListCard";
export { ShoppingListItem } from "./ShoppingListItem";
export { ShoppingListView } from "./ShoppingListView";
export { GenerateButton } from "./GenerateButton";
```

**Step 2: Commit**

```bash
git add frontend/src/components/shopping/index.ts
git commit -m "feat(components): add shopping components index"
```

---

## Task 9: Create Shopping Lists Page

**Files:**
- Create: `frontend/src/app/[locale]/shopping/page.tsx`

**Step 1: Create the page**

```typescript
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { ShoppingCart } from "lucide-react";
import { api } from "@/lib/api";
import { ShoppingListCard } from "@/components/shopping";

// TODO: Get from auth context
const DEMO_HOUSEHOLD_ID = "00000000-0000-0000-0000-000000000001";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: "Shopping" });
  return { title: t("title") };
}

export default async function ShoppingListsPage() {
  const t = useTranslations("Shopping");

  let activeResponse;
  let completedResponse;

  try {
    [activeResponse, completedResponse] = await Promise.all([
      api.getShoppingLists(DEMO_HOUSEHOLD_ID, "active"),
      api.getShoppingLists(DEMO_HOUSEHOLD_ID, "completed", 1, 10),
    ]);
  } catch (error) {
    activeResponse = { shopping_lists: [], total: 0 };
    completedResponse = { shopping_lists: [], total: 0 };
  }

  const hasLists =
    activeResponse.shopping_lists.length > 0 ||
    completedResponse.shopping_lists.length > 0;

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="font-display text-3xl font-bold text-fjord-800 dark:text-fjord-100">
            {t("title")}
          </h1>
          <p className="mt-1 text-fjord-500 dark:text-fjord-400">
            {t("subtitle")}
          </p>
        </header>

        {!hasLists ? (
          /* Empty state */
          <div className="paper-card p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-fjord-100 dark:bg-fjord-700 flex items-center justify-center">
              <ShoppingCart className="w-8 h-8 text-fjord-400" />
            </div>
            <h2 className="text-xl font-semibold text-fjord-700 dark:text-fjord-200 mb-2">
              {t("empty")}
            </h2>
            <p className="text-fjord-500 dark:text-fjord-400">
              {t("emptyMessage")}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Active lists */}
            {activeResponse.shopping_lists.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-fjord-500 uppercase tracking-wide mb-3">
                  {t("active")}
                </h2>
                <div className="space-y-3">
                  {activeResponse.shopping_lists.map((list, index) => (
                    <ShoppingListCard
                      key={list.id}
                      shoppingList={list}
                      animationDelay={index * 50}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Completed lists */}
            {completedResponse.shopping_lists.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-fjord-500 uppercase tracking-wide mb-3">
                  {t("completed")}
                </h2>
                <div className="space-y-3">
                  {completedResponse.shopping_lists.map((list, index) => (
                    <ShoppingListCard
                      key={list.id}
                      shoppingList={list}
                      animationDelay={index * 50}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/app/[locale]/shopping/page.tsx
git commit -m "feat(pages): add shopping lists page"
```

---

## Task 10: Create Shopping List Detail Page

**Files:**
- Create: `frontend/src/app/[locale]/shopping/[id]/page.tsx`

**Step 1: Create the page**

```typescript
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { api, formatDate } from "@/lib/api";
import type { ShoppingList } from "@/lib/api";
import { ShoppingListView } from "@/components/shopping";

interface ShoppingListDetailPageProps {
  params: { id: string };
}

export default function ShoppingListDetailPage({
  params,
}: ShoppingListDetailPageProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Shopping");

  const [shoppingList, setShoppingList] = useState<ShoppingList | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchList = async () => {
      try {
        const list = await api.getShoppingList(params.id);
        setShoppingList(list);
      } catch (error) {
        console.error("Failed to fetch shopping list:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchList();
  }, [params.id]);

  const handleToggleItem = useCallback(
    async (itemId: string, checked: boolean) => {
      if (!shoppingList) return;

      // Optimistic update
      setUpdatingItems((prev) => new Set(prev).add(itemId));
      setShoppingList((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((item) =>
            item.id === itemId ? { ...item, is_checked: checked } : item
          ),
        };
      });

      try {
        await api.updateShoppingListItem(shoppingList.id, itemId, {
          is_checked: checked,
        });
      } catch (error) {
        // Revert on error
        setShoppingList((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            items: prev.items.map((item) =>
              item.id === itemId ? { ...item, is_checked: !checked } : item
            ),
          };
        });
        console.error("Failed to update item:", error);
      } finally {
        setUpdatingItems((prev) => {
          const next = new Set(prev);
          next.delete(itemId);
          return next;
        });
      }
    },
    [shoppingList]
  );

  const handleComplete = useCallback(async () => {
    if (!shoppingList || !confirm(t("confirmComplete"))) return;

    try {
      await api.updateShoppingList(shoppingList.id, { status: "completed" });
      router.push(`/${locale}/shopping`);
    } catch (error) {
      console.error("Failed to complete list:", error);
    }
  }, [shoppingList, router, locale, t]);

  const handleDelete = useCallback(async () => {
    if (!shoppingList || !confirm(t("confirmDelete"))) return;

    try {
      await api.deleteShoppingList(shoppingList.id);
      router.push(`/${locale}/shopping`);
    } catch (error) {
      console.error("Failed to delete list:", error);
    }
  }, [shoppingList, router, locale, t]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-fjord-200 border-t-fjord-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!shoppingList) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-fjord-500">Shopping list not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-fjord-900">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Link
              href={`/${locale}/shopping`}
              className="flex items-center gap-2 text-fjord-500 hover:text-fjord-700 dark:hover:text-fjord-300 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm">{t("backToLists")}</span>
            </Link>
            <button
              onClick={handleDelete}
              className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
          <h1 className="font-display text-2xl font-bold text-fjord-800 dark:text-fjord-100">
            {shoppingList.name}
          </h1>
          <p className="text-sm text-fjord-500 dark:text-fjord-400 mt-1">
            {formatDate(shoppingList.date_range_start, locale)} -{" "}
            {formatDate(shoppingList.date_range_end, locale)}
          </p>
        </header>

        {/* Shopping list view */}
        <ShoppingListView
          shoppingList={shoppingList}
          onToggleItem={handleToggleItem}
          onComplete={handleComplete}
          updatingItems={updatingItems}
        />
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/app/[locale]/shopping/[id]/page.tsx
git commit -m "feat(pages): add shopping list detail page"
```

---

## Task 11: Add Generate Button to Meal Plan Page

**Files:**
- Modify: `frontend/src/app/[locale]/plan/page.tsx`

**Step 1: Import GenerateButton**

Add at top with other imports:
```typescript
import { GenerateButton } from "@/components/shopping";
```

**Step 2: Add button to header**

Find the header section and add the GenerateButton after the week navigation:

```typescript
{/* Add after week navigation controls */}
<GenerateButton
  householdId={DEMO_HOUSEHOLD_ID}
  weekStart={weekStart}
  weekEnd={weekEnd}
/>
```

**Step 3: Commit**

```bash
git add frontend/src/app/[locale]/plan/page.tsx
git commit -m "feat(pages): add generate shopping list button to meal plan"
```

---

## Task 12: Update Navigation

**Files:**
- Modify: `frontend/src/components/Navigation.tsx`

**Step 1: Add shopping link**

Find the navigation links array and add shopping:
```typescript
{ href: `/${locale}/shopping`, label: t("shopping"), icon: ShoppingCart },
```

**Step 2: Import ShoppingCart icon**

Add to lucide-react imports:
```typescript
import { ..., ShoppingCart } from "lucide-react";
```

**Step 3: Commit**

```bash
git add frontend/src/components/Navigation.tsx
git commit -m "feat(nav): add shopping link to navigation"
```

---

## Task 13: Run Linting and Type Check

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

## Task 14: Test Manually

**Step 1: Start the development server**

```bash
make dev
```

**Step 2: Test the flow**

1. Navigate to `/plan` - verify generate button appears
2. Click generate - verify list is created and redirects
3. Navigate to `/shopping` - verify list appears
4. Click on list - verify detail page loads
5. Check/uncheck items - verify optimistic updates work
6. Complete list - verify status changes

---

## Summary

Phase 5 Frontend adds shopping list capabilities:

| Component | Purpose |
|-----------|---------|
| ShoppingListCard | List preview with progress |
| ShoppingListItem | Swipe-friendly item row |
| ShoppingListView | Category-grouped list view |
| GenerateButton | Generate from meal plan |

| Page | Route |
|------|-------|
| Shopping Lists | `/shopping` |
| Shopping Detail | `/shopping/[id]` |

Key features:
- Large touch targets (48px checkboxes)
- Optimistic updates for instant feedback
- Category grouping for store navigation
- Progress tracking with completion flow
