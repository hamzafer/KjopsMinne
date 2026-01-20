"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Search, Loader2, ChefHat, Coffee, Sun, Moon, X } from "lucide-react";
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

const mealTypeConfig = {
  breakfast: { icon: Coffee, label: "breakfast" },
  lunch: { icon: Sun, label: "lunch" },
  dinner: { icon: Moon, label: "dinner" },
} as const;

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

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      {/* Recipe Search */}
      <div>
        <label className="block text-sm font-medium text-fjord-700 dark:text-fjord-200 mb-3">
          {t("selectRecipe")} *
        </label>

        {!selectedRecipe ? (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-fjord-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("searchRecipes")}
                className={cn(
                  "w-full pl-12 pr-4 py-3.5 rounded-xl",
                  "bg-white dark:bg-fjord-800/50",
                  "border border-fjord-200 dark:border-fjord-700",
                  "text-fjord-800 dark:text-fjord-100",
                  "placeholder:text-fjord-400 dark:placeholder:text-fjord-500",
                  "focus:outline-none focus:ring-2 focus:ring-fjord-500/50 focus:border-fjord-400",
                  "transition-all"
                )}
              />
            </div>

            <div className="paper-card overflow-hidden max-h-56 overflow-y-auto">
              {loading ? (
                <div className="p-6 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-fjord-400" />
                </div>
              ) : filteredRecipes.length === 0 ? (
                <div className="p-6 text-center text-fjord-500">
                  <ChefHat className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>{t("noRecipesFound")}</p>
                </div>
              ) : (
                <div className="divide-y divide-fjord-100 dark:divide-fjord-700">
                  {filteredRecipes.map((recipe, index) => (
                    <button
                      key={recipe.id}
                      type="button"
                      onClick={() => {
                        setSelectedRecipe(recipe);
                        setServings(recipe.servings);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-3.5",
                        "hover:bg-fjord-50 dark:hover:bg-fjord-800/50",
                        "text-fjord-700 dark:text-fjord-200 font-medium",
                        "transition-colors",
                        "animate-fade-in"
                      )}
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      {recipe.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="paper-card p-4 flex items-center justify-between animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-fjord-100 dark:bg-fjord-800 flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-fjord-500" />
              </div>
              <span className="font-medium text-fjord-800 dark:text-fjord-100">
                {selectedRecipe.name}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedRecipe(null)}
              className={cn(
                "p-2 rounded-lg",
                "text-fjord-500 hover:text-fjord-700 dark:hover:text-fjord-300",
                "hover:bg-fjord-100 dark:hover:bg-fjord-800",
                "transition-colors"
              )}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-fjord-700 dark:text-fjord-200 mb-3">
          {t("date")} *
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={cn(
            "w-full px-4 py-3.5 rounded-xl",
            "bg-white dark:bg-fjord-800/50",
            "border border-fjord-200 dark:border-fjord-700",
            "text-fjord-800 dark:text-fjord-100",
            "focus:outline-none focus:ring-2 focus:ring-fjord-500/50 focus:border-fjord-400",
            "transition-all"
          )}
          required
        />
      </div>

      {/* Meal Type */}
      <div>
        <label className="block text-sm font-medium text-fjord-700 dark:text-fjord-200 mb-3">
          {t("mealType")} *
        </label>
        <div className="grid grid-cols-3 gap-3">
          {(["breakfast", "lunch", "dinner"] as const).map((type) => {
            const config = mealTypeConfig[type];
            const Icon = config.icon;
            const isSelected = mealType === type;

            return (
              <button
                key={type}
                type="button"
                onClick={() => setMealType(type)}
                className={cn(
                  "flex flex-col items-center gap-2 py-4 rounded-xl font-medium",
                  "transition-all duration-200",
                  "hover:scale-[1.02] active:scale-[0.98]",
                  isSelected
                    ? "bg-fjord-500 text-white shadow-lg shadow-fjord-500/20"
                    : "bg-fjord-50 dark:bg-fjord-800/50 text-fjord-600 dark:text-fjord-300 hover:bg-fjord-100 dark:hover:bg-fjord-800"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{t(type)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Servings */}
      <div>
        <label className="block text-sm font-medium text-fjord-700 dark:text-fjord-200 mb-3">
          {t("servings")}
        </label>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setServings(Math.max(1, servings - 1))}
            className={cn(
              "w-12 h-12 rounded-xl font-bold text-lg",
              "bg-fjord-100 dark:bg-fjord-800 text-fjord-600 dark:text-fjord-300",
              "hover:bg-fjord-200 dark:hover:bg-fjord-700",
              "transition-all duration-200",
              "hover:scale-105 active:scale-95"
            )}
          >
            −
          </button>
          <input
            type="number"
            value={servings}
            onChange={(e) => setServings(parseInt(e.target.value) || 1)}
            min="1"
            className={cn(
              "w-20 text-center px-4 py-3 rounded-xl",
              "bg-white dark:bg-fjord-800/50",
              "border border-fjord-200 dark:border-fjord-700",
              "text-fjord-800 dark:text-fjord-100 font-semibold text-lg",
              "focus:outline-none focus:ring-2 focus:ring-fjord-500/50",
              "tabular-nums"
            )}
          />
          <button
            type="button"
            onClick={() => setServings(servings + 1)}
            className={cn(
              "w-12 h-12 rounded-xl font-bold text-lg",
              "bg-fjord-100 dark:bg-fjord-800 text-fjord-600 dark:text-fjord-300",
              "hover:bg-fjord-200 dark:hover:bg-fjord-700",
              "transition-all duration-200",
              "hover:scale-105 active:scale-95"
            )}
          >
            +
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className={cn(
            "flex-1 py-3.5 rounded-xl font-medium",
            "text-fjord-600 dark:text-fjord-300",
            "hover:bg-fjord-100 dark:hover:bg-fjord-800",
            "transition-all duration-200",
            "hover:scale-[1.01] active:scale-[0.99]"
          )}
        >
          {t("cancel")}
        </button>
        <button
          type="submit"
          disabled={saving || !selectedRecipe}
          className={cn(
            "flex-1 py-3.5 rounded-xl font-medium",
            "bg-fjord-500 text-white",
            "hover:bg-fjord-600",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-all duration-200",
            "hover:scale-[1.01] active:scale-[0.99]",
            "flex items-center justify-center gap-2"
          )}
        >
          {saving && <Loader2 className="w-5 h-5 animate-spin" />}
          {t("save")}
        </button>
      </div>
    </form>
  );
}
