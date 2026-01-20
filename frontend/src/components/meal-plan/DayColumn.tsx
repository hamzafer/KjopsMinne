"use client";

import { useTranslations } from "next-intl";
import { MealSlot } from "./MealSlot";
import { cn } from "@/lib/utils";
import type { MealPlan } from "@/lib/api";

interface DayColumnProps {
  date: Date;
  meals: MealPlan[];
  isToday?: boolean;
  onAddMeal: (date: Date, mealType: "breakfast" | "lunch" | "dinner") => void;
  onMealClick: (meal: MealPlan) => void;
  locale: string;
}

export function DayColumn({
  date,
  meals,
  isToday,
  onAddMeal,
  onMealClick,
  locale,
}: DayColumnProps) {
  const t = useTranslations("MealPlan");

  const dayName = date.toLocaleDateString(locale === "en" ? "en-GB" : "nb-NO", {
    weekday: "short",
  });
  const dayNumber = date.getDate();

  const getMealForType = (type: "breakfast" | "lunch" | "dinner") =>
    meals.find((m) => m.meal_type === type);

  return (
    <div
      className={cn(
        "flex flex-col min-w-[140px]",
        isToday && "bg-fjord-50/50 dark:bg-fjord-800/30 rounded-xl"
      )}
    >
      {/* Header */}
      <div className={cn(
        "text-center py-3 border-b border-fjord-100 dark:border-fjord-700",
        isToday && "bg-fjord-500 text-white rounded-t-xl"
      )}>
        <div className={cn(
          "text-xs uppercase tracking-wide",
          isToday ? "text-fjord-100" : "text-fjord-500 dark:text-fjord-400"
        )}>
          {dayName}
        </div>
        <div className={cn(
          "text-lg font-semibold",
          isToday ? "text-white" : "text-fjord-800 dark:text-fjord-100"
        )}>
          {dayNumber}
        </div>
        {isToday && (
          <div className="text-xs text-fjord-200">{t("today")}</div>
        )}
      </div>

      {/* Meal Slots */}
      <div className="flex-1 p-2 space-y-2">
        <MealSlot
          mealType="breakfast"
          meal={getMealForType("breakfast")}
          onAddClick={() => onAddMeal(date, "breakfast")}
          onMealClick={onMealClick}
        />
        <MealSlot
          mealType="lunch"
          meal={getMealForType("lunch")}
          onAddClick={() => onAddMeal(date, "lunch")}
          onMealClick={onMealClick}
        />
        <MealSlot
          mealType="dinner"
          meal={getMealForType("dinner")}
          onAddClick={() => onAddMeal(date, "dinner")}
          onMealClick={onMealClick}
        />
      </div>
    </div>
  );
}
