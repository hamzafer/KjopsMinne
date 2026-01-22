"use client";

import { ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { GenerateButton } from "@/components/shopping/GenerateButton";
import { ShoppingListCard } from "@/components/shopping/ShoppingListCard";
import { api, type ShoppingList } from "@/lib/api";
import { cn } from "@/lib/utils";

// TODO: Get from user context
const DEMO_HOUSEHOLD_ID = "00000000-0000-0000-0000-000000000001";

export default function ShoppingListsPage() {
  const t = useTranslations("Shopping");

  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadShoppingLists() {
      try {
        const response = await api.getShoppingLists(DEMO_HOUSEHOLD_ID);
        setShoppingLists(response.shopping_lists);
      } catch (error) {
        console.error("Failed to load shopping lists:", error);
      } finally {
        setLoading(false);
      }
    }
    loadShoppingLists();
  }, []);

  // Separate active and completed lists
  const activeLists = shoppingLists.filter((list) => list.status === "active");
  const completedLists = shoppingLists.filter((list) => list.status === "completed");

  // Calculate current week start/end for generate button
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday is start of week
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - diff);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  // Loading skeleton
  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="animate-pulse">
          <div className="mb-8 flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-fjord-100 dark:bg-fjord-800" />
            <div>
              <div className="mb-2 h-7 w-40 rounded bg-fjord-100 dark:bg-fjord-800" />
              <div className="h-4 w-64 rounded bg-fjord-100 dark:bg-fjord-800" />
            </div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-2xl bg-fjord-100 dark:bg-fjord-800" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const isEmpty = shoppingLists.length === 0;

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      {/* Header */}
      <div className="mb-8 flex animate-slide-up flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-forest-500 to-forest-600 shadow-lg shadow-forest-500/20">
            <ShoppingCart className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-fjord-800 dark:text-fjord-100">
              {t("title")}
            </h1>
            <p className="mt-0.5 text-fjord-500 dark:text-fjord-400">{t("subtitle")}</p>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {isEmpty && (
        <div
          className="paper-card animate-fade-in p-12 text-center"
          style={{ animationDelay: "100ms" }}
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-fjord-100 dark:bg-fjord-800">
            <ShoppingCart className="h-10 w-10 text-fjord-400 dark:text-fjord-500" />
          </div>
          <h2 className="mb-2 font-display text-xl font-semibold text-fjord-800 dark:text-fjord-100">
            {t("empty")}
          </h2>
          <p className="mx-auto mb-8 max-w-md text-fjord-500 dark:text-fjord-400">
            {t("emptyMessage")}
          </p>
          <div className="mx-auto max-w-xs">
            <GenerateButton
              householdId={DEMO_HOUSEHOLD_ID}
              weekStart={weekStart}
              weekEnd={weekEnd}
            />
          </div>
        </div>
      )}

      {/* Generate button for non-empty state */}
      {!isEmpty && (
        <div className="mb-8 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <GenerateButton householdId={DEMO_HOUSEHOLD_ID} weekStart={weekStart} weekEnd={weekEnd} />
        </div>
      )}

      {/* Active lists section */}
      {activeLists.length > 0 && (
        <section className="mb-10">
          <h2
            className={cn(
              "mb-4 font-display text-lg font-semibold text-fjord-800 dark:text-fjord-100",
              "animate-fade-in"
            )}
            style={{ animationDelay: "150ms" }}
          >
            {t("active")}
          </h2>
          <div className="space-y-4">
            {activeLists.map((list, index) => (
              <ShoppingListCard
                key={list.id}
                shoppingList={list}
                animationDelay={200 + index * 50}
              />
            ))}
          </div>
        </section>
      )}

      {/* Completed lists section */}
      {completedLists.length > 0 && (
        <section>
          <h2
            className={cn(
              "mb-4 font-display text-lg font-semibold text-fjord-500 dark:text-fjord-400",
              "animate-fade-in"
            )}
            style={{
              animationDelay: `${200 + activeLists.length * 50 + 50}ms`,
            }}
          >
            {t("completed")}
          </h2>
          <div className="space-y-4 opacity-75">
            {completedLists.map((list, index) => (
              <ShoppingListCard
                key={list.id}
                shoppingList={list}
                animationDelay={200 + activeLists.length * 50 + 100 + index * 50}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
