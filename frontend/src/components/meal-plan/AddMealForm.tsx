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
