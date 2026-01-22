"use client";

import { Soup, Filter } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, useCallback } from "react";

import { LeftoverCard } from "@/components/meal-plan/LeftoverCard";
import { api, type Leftover, type Recipe } from "@/lib/api";
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
    <div className="mx-auto max-w-4xl px-6 py-8">
      {/* Header */}
      <div className="mb-8 flex animate-slide-up flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/20">
            <Soup className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-fjord-800 dark:text-fjord-100">
              {t("title")}
            </h1>
            <p className="mt-0.5 text-fjord-500 dark:text-fjord-400">{t("subtitle")}</p>
          </div>
        </div>

        {/* Filter */}
        <div className="stagger-1 flex animate-fade-in items-center gap-2">
          <Filter className="h-4 w-4 text-fjord-400" />
          <div className="flex gap-1 rounded-xl bg-fjord-100/50 p-1 dark:bg-fjord-800/50">
            <button
              onClick={() => setFilter("available")}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200",
                filter === "available"
                  ? "bg-white text-fjord-800 shadow-sm dark:bg-fjord-700 dark:text-fjord-100"
                  : "text-fjord-600 hover:text-fjord-800 dark:text-fjord-400 dark:hover:text-fjord-200"
              )}
            >
              {t("filterAvailable")}
            </button>
            <button
              onClick={() => setFilter("all")}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200",
                filter === "all"
                  ? "bg-white text-fjord-800 shadow-sm dark:bg-fjord-700 dark:text-fjord-100"
                  : "text-fjord-600 hover:text-fjord-800 dark:text-fjord-400 dark:hover:text-fjord-200"
              )}
            >
              {t("filterAll")}
            </button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-xl bg-fjord-100 dark:bg-fjord-800"
              style={{ animationDelay: `${i * 50}ms` }}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && leftovers.length === 0 && (
        <div className="animate-fade-in py-16 text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-fjord-100 dark:bg-fjord-800">
            <Soup className="h-10 w-10 text-fjord-400 dark:text-fjord-500" />
          </div>
          <h3 className="font-display text-xl font-semibold text-fjord-700 dark:text-fjord-200">
            {t("noLeftovers")}
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-fjord-500 dark:text-fjord-400">
            {t("noLeftoversMessage")}
          </p>
        </div>
      )}

      {/* Grid */}
      {!loading && leftovers.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {leftovers.map((leftover, index) => (
            <div
              key={leftover.id}
              className="animate-slide-up opacity-0"
              style={{
                animationDelay: `${index * 60}ms`,
                animationFillMode: "forwards",
              }}
            >
              <LeftoverCard
                leftover={leftover}
                recipeName={recipes.get(leftover.recipe_id) || "Unknown"}
                onMarkConsumed={() => handleMarkConsumed(leftover.id)}
                onMarkDiscarded={() => handleMarkDiscarded(leftover.id)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
