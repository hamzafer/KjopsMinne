"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Soup, Filter } from "lucide-react";
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-slide-up">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Soup className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-semibold text-fjord-800 dark:text-fjord-100">
              {t("title")}
            </h1>
            <p className="mt-0.5 text-fjord-500 dark:text-fjord-400">
              {t("subtitle")}
            </p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 animate-fade-in stagger-1">
          <Filter className="w-4 h-4 text-fjord-400" />
          <div className="flex gap-1 p-1 rounded-xl bg-fjord-100/50 dark:bg-fjord-800/50">
            <button
              onClick={() => setFilter("available")}
              className={cn(
                "px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200",
                filter === "available"
                  ? "bg-white dark:bg-fjord-700 text-fjord-800 dark:text-fjord-100 shadow-sm"
                  : "text-fjord-600 dark:text-fjord-400 hover:text-fjord-800 dark:hover:text-fjord-200"
              )}
            >
              {t("filterAvailable")}
            </button>
            <button
              onClick={() => setFilter("all")}
              className={cn(
                "px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200",
                filter === "all"
                  ? "bg-white dark:bg-fjord-700 text-fjord-800 dark:text-fjord-100 shadow-sm"
                  : "text-fjord-600 dark:text-fjord-400 hover:text-fjord-800 dark:hover:text-fjord-200"
              )}
            >
              {t("filterAll")}
            </button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-40 bg-fjord-100 dark:bg-fjord-800 rounded-xl animate-pulse"
              style={{ animationDelay: `${i * 50}ms` }}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && leftovers.length === 0 && (
        <div className="text-center py-16 animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-fjord-100 dark:bg-fjord-800 flex items-center justify-center">
            <Soup className="w-10 h-10 text-fjord-400 dark:text-fjord-500" />
          </div>
          <h3 className="text-xl font-display font-semibold text-fjord-700 dark:text-fjord-200">
            {t("noLeftovers")}
          </h3>
          <p className="mt-2 text-fjord-500 dark:text-fjord-400 max-w-sm mx-auto">
            {t("noLeftoversMessage")}
          </p>
        </div>
      )}

      {/* Grid */}
      {!loading && leftovers.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {leftovers.map((leftover, index) => (
            <div
              key={leftover.id}
              className="animate-slide-up opacity-0"
              style={{
                animationDelay: `${index * 60}ms`,
                animationFillMode: 'forwards'
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
