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
