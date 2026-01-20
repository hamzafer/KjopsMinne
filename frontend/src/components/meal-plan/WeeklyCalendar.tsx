"use client";

import { useTranslations, useLocale } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayColumn } from "./DayColumn";
import { cn } from "@/lib/utils";
import type { MealPlan } from "@/lib/api";

interface WeeklyCalendarProps {
  weekStart: Date;
  meals: MealPlan[];
  loading?: boolean;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onAddMeal: (date: Date, mealType: "breakfast" | "lunch" | "dinner") => void;
  onMealClick: (meal: MealPlan) => void;
}

export function WeeklyCalendar({
  weekStart,
  meals,
  loading,
  onPrevWeek,
  onNextWeek,
  onAddMeal,
  onMealClick,
}: WeeklyCalendarProps) {
  const t = useTranslations("MealPlan");
  const locale = useLocale();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    return date;
  });

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const formatWeekRange = () => {
    const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    const localeCode = locale === "en" ? "en-GB" : "nb-NO";
    return `${weekStart.toLocaleDateString(localeCode, opts)} - ${weekEnd.toLocaleDateString(localeCode, opts)}`;
  };

  const getMealsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return meals.filter((m) => m.planned_date.startsWith(dateStr));
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="flex justify-between items-center mb-4">
          <div className="h-8 w-32 bg-fjord-100 dark:bg-fjord-800 rounded" />
          <div className="h-8 w-48 bg-fjord-100 dark:bg-fjord-800 rounded" />
          <div className="h-8 w-32 bg-fjord-100 dark:bg-fjord-800 rounded" />
        </div>
        <div className="grid grid-cols-7 gap-2">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-16 bg-fjord-100 dark:bg-fjord-800 rounded-xl" />
              <div className="h-20 bg-fjord-100 dark:bg-fjord-800 rounded-xl" />
              <div className="h-20 bg-fjord-100 dark:bg-fjord-800 rounded-xl" />
              <div className="h-20 bg-fjord-100 dark:bg-fjord-800 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Week Navigation */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={onPrevWeek}
          className={cn(
            "flex items-center gap-1 px-3 py-2 rounded-lg",
            "text-fjord-600 dark:text-fjord-300",
            "hover:bg-fjord-100 dark:hover:bg-fjord-800",
            "transition-colors"
          )}
        >
          <ChevronLeft className="w-4 h-4" />
          {t("prevWeek")}
        </button>

        <h2 className="text-lg font-semibold text-fjord-800 dark:text-fjord-100">
          {formatWeekRange()}
        </h2>

        <button
          onClick={onNextWeek}
          className={cn(
            "flex items-center gap-1 px-3 py-2 rounded-lg",
            "text-fjord-600 dark:text-fjord-300",
            "hover:bg-fjord-100 dark:hover:bg-fjord-800",
            "transition-colors"
          )}
        >
          {t("nextWeek")}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2 overflow-x-auto">
        {days.map((date) => (
          <DayColumn
            key={date.toISOString()}
            date={date}
            meals={getMealsForDate(date)}
            isToday={date.getTime() === today.getTime()}
            onAddMeal={onAddMeal}
            onMealClick={onMealClick}
            locale={locale}
          />
        ))}
      </div>
    </div>
  );
}
