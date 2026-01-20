"use client";

import { useTranslations } from "next-intl";
import { Users, Check, X, ChefHat } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MealPlan } from "@/lib/api";

interface MealCardProps {
  meal: MealPlan;
  onClick?: () => void;
}

export function MealCard({ meal, onClick }: MealCardProps) {
  const t = useTranslations("MealPlan");

  const statusStyles = {
    planned: {
      card: "paper-card hover:shadow-paper-hover",
      icon: "bg-fjord-50 text-fjord-500",
      badge: "",
    },
    cooked: {
      card: "paper-card bg-forest-50/30 border border-forest-200/50",
      icon: "bg-forest-100 text-forest-500",
      badge: "bg-forest-100 text-forest-600",
    },
    skipped: {
      card: "paper-card opacity-50",
      icon: "bg-stone-light/30 text-stone",
      badge: "bg-stone-light/30 text-stone",
    },
  };

  const styles = statusStyles[meal.status];

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-3 rounded-xl transition-all duration-200",
        "hover:scale-[1.02] active:scale-[0.98]",
        styles.card
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
          styles.icon
        )}>
          {meal.status === "cooked" ? (
            <Check className="w-4 h-4" />
          ) : meal.status === "skipped" ? (
            <X className="w-4 h-4" />
          ) : (
            <ChefHat className="w-4 h-4" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm text-fjord-700 line-clamp-2 leading-tight">
            {meal.recipe?.name || "Unknown recipe"}
          </h4>

          <div className="mt-1.5 flex items-center gap-2 text-xs text-stone">
            <Users className="w-3 h-3" />
            <span>{meal.servings} {t("servings")}</span>
          </div>

          {meal.status === "cooked" && meal.cost_per_serving && (
            <p className="mt-1 text-xs font-medium text-forest-600 tabular-nums">
              {meal.cost_per_serving.toFixed(0)} kr/porsjon
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
