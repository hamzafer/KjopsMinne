"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Clock, Users, ChefHat } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Recipe } from "@/lib/api";

interface RecipeCardProps {
  recipe: Recipe;
  animationDelay?: number;
}

export function RecipeCard({ recipe, animationDelay = 0 }: RecipeCardProps) {
  const locale = useLocale();
  const t = useTranslations("Recipes");

  return (
    <Link
      href={`/${locale}/recipes/${recipe.id}`}
      className={cn(
        "group block paper-card overflow-hidden",
        "animate-slide-up opacity-0",
        "hover:scale-[1.02] active:scale-[0.98]",
        "transition-all duration-200"
      )}
      style={{
        animationDelay: `${animationDelay}ms`,
        animationFillMode: 'forwards'
      }}
    >
      {/* Image or Placeholder */}
      <div className="aspect-[4/3] bg-fjord-100 dark:bg-fjord-700/50 overflow-hidden relative">
        {recipe.image_url ? (
          <img
            src={recipe.image_url}
            alt={recipe.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-fjord-100 to-fjord-200 dark:from-fjord-700/50 dark:to-fjord-800/50">
            <ChefHat className="w-12 h-12 text-fjord-300 dark:text-fjord-600" />
          </div>
        )}
        {/* Overlay gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-fjord-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-display font-semibold text-fjord-800 dark:text-fjord-100 group-hover:text-fjord-600 dark:group-hover:text-fjord-300 transition-colors line-clamp-2">
          {recipe.name}
        </h3>

        <div className="mt-2 flex items-center gap-4 text-sm text-fjord-500 dark:text-fjord-400">
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            {recipe.servings} {t("servings")}
          </span>
          {recipe.prep_time_minutes && (
            <span className="flex items-center gap-1.5">
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
                className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-fjord-100 dark:bg-fjord-700 text-fjord-600 dark:text-fjord-300"
              >
                {tag}
              </span>
            ))}
            {recipe.tags.length > 3 && (
              <span className="px-2 py-0.5 text-xs text-fjord-400">
                +{recipe.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
