"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Clock, Users, ChefHat } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Recipe } from "@/lib/api";

interface RecipeCardProps {
  recipe: Recipe;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const locale = useLocale();
  const t = useTranslations("Recipes");

  return (
    <Link
      href={`/${locale}/recipes/${recipe.id}`}
      className={cn(
        "group block bg-white dark:bg-fjord-800/50 rounded-2xl",
        "border border-fjord-100 dark:border-fjord-700/50",
        "hover:shadow-lg hover:border-fjord-200 dark:hover:border-fjord-600",
        "transition-all duration-200"
      )}
    >
      {/* Image or Placeholder */}
      <div className="aspect-[4/3] rounded-t-2xl bg-fjord-100 dark:bg-fjord-700/50 overflow-hidden">
        {recipe.image_url ? (
          <img
            src={recipe.image_url}
            alt={recipe.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ChefHat className="w-12 h-12 text-fjord-300 dark:text-fjord-600" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-fjord-800 dark:text-fjord-100 group-hover:text-fjord-600 dark:group-hover:text-fjord-300 transition-colors line-clamp-2">
          {recipe.name}
        </h3>

        <div className="mt-2 flex items-center gap-4 text-sm text-fjord-500 dark:text-fjord-400">
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {recipe.servings} {t("servings")}
          </span>
          {recipe.prep_time_minutes && (
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {recipe.prep_time_minutes} {t("prepTime")}
            </span>
          )}
        </div>

        {recipe.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {recipe.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs rounded-full bg-fjord-100 dark:bg-fjord-700 text-fjord-600 dark:text-fjord-300"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
