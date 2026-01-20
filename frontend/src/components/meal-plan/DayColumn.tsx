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
  animationDelay?: number;
}

export function DayColumn({
  date,
  meals,
  isToday,
  onAddMeal,
  onMealClick,
  locale,
  animationDelay = 0,
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
        "flex flex-col min-w-[140px] rounded-xl overflow-hidden",
        "animate-slide-up opacity-0",
        isToday
          ? "paper-card ring-2 ring-fjord-400/50 dark:ring-fjord-500/50"
          : "bg-white/50 dark:bg-fjord-900/30"
      )}
      style={{
        animationDelay: `${animationDelay}ms`,
        animationFillMode: 'forwards'
      }}
    >
      {/* Header */}
      <div className={cn(
        "text-center py-3 relative",
        isToday
          ? "bg-gradient-to-br from-fjord-500 to-fjord-600 text-white"
          : "bg-fjord-50/80 dark:bg-fjord-800/50 border-b border-fjord-100 dark:border-fjord-700"
      )}>
        {isToday && (
          <div className="absolute inset-0 bg-[url('/paper-texture.png')] opacity-5" />
        )}
        <div className={cn(
          "text-xs uppercase tracking-wider font-medium",
          isToday ? "text-fjord-100" : "text-fjord-500 dark:text-fjord-400"
        )}>
          {dayName}
        </div>
        <div className={cn(
          "text-xl font-display font-semibold",
          isToday ? "text-white" : "text-fjord-800 dark:text-fjord-100"
        )}>
          {dayNumber}
        </div>
        {isToday && (
          <div className="text-xs font-medium text-fjord-200 tracking-wide">
            {t("today")}
          </div>
        )}
      </div>

      {/* Meal Slots */}
      <div className="flex-1 p-2 space-y-2 bg-white/30 dark:bg-fjord-900/20">
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
