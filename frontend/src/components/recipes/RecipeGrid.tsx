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
            className="paper-card overflow-hidden animate-pulse"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="aspect-[4/3] bg-fjord-100 dark:bg-fjord-700/50" />
            <div className="p-4 space-y-3">
              <div className="h-5 bg-fjord-100 dark:bg-fjord-700 rounded w-3/4" />
              <div className="h-4 bg-fjord-100 dark:bg-fjord-700 rounded w-1/2" />
              <div className="flex gap-2">
                <div className="h-5 bg-fjord-100 dark:bg-fjord-700 rounded-full w-16" />
                <div className="h-5 bg-fjord-100 dark:bg-fjord-700 rounded-full w-12" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-fjord-100 dark:bg-fjord-800 flex items-center justify-center">
          <ChefHat className="w-10 h-10 text-fjord-400 dark:text-fjord-500" />
        </div>
        <h3 className="text-xl font-display font-semibold text-fjord-700 dark:text-fjord-200">
          {t("noRecipes")}
        </h3>
        <p className="mt-2 text-fjord-500 dark:text-fjord-400 max-w-sm mx-auto">
          {t("noRecipesMessage")}
        </p>
        <Link
          href={`/${locale}/recipes/import`}
          className={cn(
            "mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-xl",
            "bg-fjord-500 text-white font-medium",
            "hover:bg-fjord-600",
            "shadow-lg shadow-fjord-500/20",
            "transition-all duration-200",
            "hover:scale-[1.02] active:scale-[0.98]"
          )}
        >
          <Plus className="w-5 h-5" />
          {t("import")}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {recipes.map((recipe, index) => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          animationDelay={index * 60}
        />
      ))}
    </div>
  );
}
