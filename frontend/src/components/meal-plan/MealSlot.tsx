"use client";

import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { MealCard } from "./MealCard";
import { cn } from "@/lib/utils";
import type { MealPlan } from "@/lib/api";

interface MealSlotProps {
  mealType: "breakfast" | "lunch" | "dinner";
  meal?: MealPlan;
  onAddClick?: () => void;
  onMealClick?: (meal: MealPlan) => void;
}

export function MealSlot({ mealType, meal, onAddClick, onMealClick }: MealSlotProps) {
  const t = useTranslations("MealPlan");

  if (meal) {
    return <MealCard meal={meal} onClick={() => onMealClick?.(meal)} />;
  }

  return (
    <button
      onClick={onAddClick}
      className={cn(
        "w-full h-20 rounded-xl border-2 border-dashed",
        "border-fjord-200 dark:border-fjord-700",
        "hover:border-fjord-400 dark:hover:border-fjord-500",
        "hover:bg-fjord-50 dark:hover:bg-fjord-800/30",
        "flex items-center justify-center gap-2",
        "text-fjord-400 dark:text-fjord-500 text-sm",
        "transition-all"
      )}
    >
      <Plus className="w-4 h-4" />
      <span>{t(mealType)}</span>
    </button>
  );
}
