"use client";

import { Users, Check, X, ChefHat } from "lucide-react";
import { useTranslations } from "next-intl";

import type { MealPlan } from "@/lib/api";
import { cn, toNumber } from "@/lib/utils";

interface MealCardProps {
  meal: MealPlan;
  onClick?: () => void;
}

export function MealCard({ meal, onClick }: MealCardProps) {
  const t = useTranslations("MealPlan");

  const statusStyles = {
    planned: {
      card: "paper-card hover:shadow-paper-hover",
      icon: "bg-fjord-50 dark:bg-fjord-700 text-fjord-500 dark:text-fjord-300",
      badge: "",
    },
    cooked: {
      card: "paper-card bg-forest-50/30 dark:bg-forest-900/30 border border-forest-200/50 dark:border-forest-700/50",
      icon: "bg-forest-100 dark:bg-forest-800 text-forest-500 dark:text-forest-400",
      badge: "bg-forest-100 dark:bg-forest-800 text-forest-600 dark:text-forest-400",
    },
    skipped: {
      card: "paper-card opacity-50",
      icon: "bg-stone-light/30 dark:bg-fjord-700/30 text-stone dark:text-fjord-400",
      badge: "bg-stone-light/30 dark:bg-fjord-700/30 text-stone dark:text-fjord-400",
    },
  };

  const styles = statusStyles[meal.status];

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-xl p-3 text-left transition-all duration-200",
        "hover:scale-[1.02] active:scale-[0.98]",
        styles.card
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            styles.icon
          )}
        >
          {meal.status === "cooked" ? (
            <Check className="h-4 w-4" />
          ) : meal.status === "skipped" ? (
            <X className="h-4 w-4" />
          ) : (
            <ChefHat className="h-4 w-4" />
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <h4 className="line-clamp-2 text-sm font-medium leading-tight text-fjord-700 dark:text-fjord-200">
            {meal.recipe?.name || "Unknown recipe"}
          </h4>

          <div className="mt-1.5 flex items-center gap-2 text-xs text-stone dark:text-fjord-400">
            <Users className="h-3 w-3" />
            <span>
              {meal.servings} {t("servings")}
            </span>
          </div>

          {meal.status === "cooked" && meal.cost_per_serving && (
            <p className="mt-1 text-xs font-medium tabular-nums text-forest-600 dark:text-forest-400">
              {toNumber(meal.cost_per_serving).toFixed(0)} kr/porsjon
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
