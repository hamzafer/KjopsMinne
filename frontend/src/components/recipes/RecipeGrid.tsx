"use client";

import { ChefHat, Plus } from "lucide-react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";

import type { Recipe } from "@/lib/api";
import { cn } from "@/lib/utils";

import { RecipeCard } from "./RecipeCard";

interface RecipeGridProps {
  recipes: Recipe[];
  loading?: boolean;
}

export function RecipeGrid({ recipes, loading }: RecipeGridProps) {
  const t = useTranslations("Recipes");
  const locale = useLocale();

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="paper-card animate-pulse overflow-hidden"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="aspect-[4/3] bg-fjord-100 dark:bg-fjord-700/50" />
            <div className="space-y-3 p-4">
              <div className="h-5 w-3/4 rounded bg-fjord-100 dark:bg-fjord-700" />
              <div className="h-4 w-1/2 rounded bg-fjord-100 dark:bg-fjord-700" />
              <div className="flex gap-2">
                <div className="h-5 w-16 rounded-full bg-fjord-100 dark:bg-fjord-700" />
                <div className="h-5 w-12 rounded-full bg-fjord-100 dark:bg-fjord-700" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className="animate-fade-in py-16 text-center">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-fjord-100 dark:bg-fjord-800">
          <ChefHat className="h-10 w-10 text-fjord-400 dark:text-fjord-500" />
        </div>
        <h3 className="font-display text-xl font-semibold text-fjord-700 dark:text-fjord-200">
          {t("noRecipes")}
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-fjord-500 dark:text-fjord-400">
          {t("noRecipesMessage")}
        </p>
        <Link
          href={`/${locale}/recipes/import`}
          className={cn(
            "mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3",
            "bg-fjord-500 font-medium text-white",
            "hover:bg-fjord-600",
            "shadow-lg shadow-fjord-500/20",
            "transition-all duration-200",
            "hover:scale-[1.02] active:scale-[0.98]"
          )}
        >
          <Plus className="h-5 w-5" />
          {t("import")}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {recipes.map((recipe, index) => (
        <RecipeCard key={recipe.id} recipe={recipe} animationDelay={index * 60} />
      ))}
    </div>
  );
}
