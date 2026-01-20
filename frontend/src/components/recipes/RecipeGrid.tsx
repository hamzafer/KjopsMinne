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
