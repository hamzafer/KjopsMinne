"use client";

import { Plus, Coffee, Sun, Moon } from "lucide-react";
import { useTranslations } from "next-intl";

import type { MealPlan } from "@/lib/api";
import { cn } from "@/lib/utils";

import { MealCard } from "./MealCard";

interface MealSlotProps {
  mealType: "breakfast" | "lunch" | "dinner";
  meal?: MealPlan;
  onAddClick?: () => void;
  onMealClick?: (meal: MealPlan) => void;
}

const mealIcons = {
  breakfast: Coffee,
  lunch: Sun,
  dinner: Moon,
};

export function MealSlot({ mealType, meal, onAddClick, onMealClick }: MealSlotProps) {
  const t = useTranslations("MealPlan");
  const Icon = mealIcons[mealType];

  if (meal) {
    return <MealCard meal={meal} onClick={() => onMealClick?.(meal)} />;
  }

  return (
    <button
      onClick={onAddClick}
      className={cn(
        "group h-20 w-full rounded-xl",
        "border-2 border-dashed border-fjord-200/60 dark:border-fjord-700/60",
        "hover:border-fjord-400 dark:hover:border-fjord-500",
        "hover:bg-fjord-50/50 dark:hover:bg-fjord-800/30",
        "flex items-center justify-center gap-2",
        "text-fjord-400 dark:text-fjord-500",
        "transition-all duration-200",
        "hover:scale-[1.02] active:scale-[0.98]"
      )}
    >
      <div className="flex items-center gap-2 transition-transform group-hover:scale-105">
        <div className="relative">
          <Icon className="h-4 w-4 opacity-50" />
          <Plus className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-white dark:bg-fjord-900" />
        </div>
        <span className="text-sm font-medium">{t(mealType)}</span>
      </div>
    </button>
  );
}
