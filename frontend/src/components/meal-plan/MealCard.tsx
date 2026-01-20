"use client";

import { useTranslations } from "next-intl";
import { Users, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MealPlan } from "@/lib/api";

interface MealCardProps {
  meal: MealPlan;
  onClick?: () => void;
}

export function MealCard({ meal, onClick }: MealCardProps) {
  const t = useTranslations("MealPlan");

  const statusColors = {
    planned: "border-fjord-200 dark:border-fjord-700",
    cooked: "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20",
    skipped: "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 opacity-60",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-3 rounded-xl border-2 transition-all",
        "hover:shadow-md hover:scale-[1.02]",
        statusColors[meal.status]
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-medium text-sm text-fjord-800 dark:text-fjord-100 line-clamp-2">
          {meal.recipe?.name || "Unknown recipe"}
        </h4>
        {meal.status === "cooked" && (
          <Check className="w-4 h-4 text-green-500 shrink-0" />
        )}
        {meal.status === "skipped" && (
          <X className="w-4 h-4 text-gray-400 shrink-0" />
        )}
      </div>

      <div className="mt-1 flex items-center gap-2 text-xs text-fjord-500 dark:text-fjord-400">
        <Users className="w-3 h-3" />
        <span>{meal.servings} {t("servings")}</span>
      </div>

      {meal.status === "cooked" && meal.cost_per_serving && (
        <div className="mt-1 text-xs text-green-600 dark:text-green-400">
          {meal.cost_per_serving.toFixed(2)} kr/porsjon
        </div>
      )}
    </button>
  );
}
