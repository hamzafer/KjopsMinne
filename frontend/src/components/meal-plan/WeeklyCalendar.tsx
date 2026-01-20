"use client";

import { useTranslations, useLocale } from "next-intl";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
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
    return `${weekStart.toLocaleDateString(localeCode, opts)} – ${weekEnd.toLocaleDateString(localeCode, opts)}`;
  };

  const getMealsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return meals.filter((m) => m.planned_date.startsWith(dateStr));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Navigation skeleton */}
        <div className="flex justify-between items-center">
          <div className="h-10 w-28 bg-fjord-100 dark:bg-fjord-800 rounded-xl animate-pulse" />
          <div className="h-8 w-40 bg-fjord-100 dark:bg-fjord-800 rounded-lg animate-pulse" />
          <div className="h-10 w-28 bg-fjord-100 dark:bg-fjord-800 rounded-xl animate-pulse" />
        </div>
        {/* Calendar skeleton */}
        <div className="grid grid-cols-7 gap-3">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="space-y-2 animate-pulse" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="h-16 bg-fjord-100 dark:bg-fjord-800 rounded-xl" />
              <div className="h-20 bg-fjord-100/50 dark:bg-fjord-800/50 rounded-xl" />
              <div className="h-20 bg-fjord-100/50 dark:bg-fjord-800/50 rounded-xl" />
              <div className="h-20 bg-fjord-100/50 dark:bg-fjord-800/50 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Week Navigation */}
      <div className="flex justify-between items-center animate-fade-in">
        <button
          onClick={onPrevWeek}
          className={cn(
            "group flex items-center gap-2 px-4 py-2.5 rounded-xl",
            "text-fjord-600 dark:text-fjord-300 font-medium",
            "hover:bg-fjord-100 dark:hover:bg-fjord-800",
            "transition-all duration-200",
            "hover:scale-[1.02] active:scale-[0.98]"
          )}
        >
          <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <span className="hidden sm:inline">{t("prevWeek")}</span>
        </button>

        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-fjord-400 dark:text-fjord-500" />
          <h2 className="text-lg font-display font-semibold text-fjord-800 dark:text-fjord-100">
            {formatWeekRange()}
          </h2>
        </div>

        <button
          onClick={onNextWeek}
          className={cn(
            "group flex items-center gap-2 px-4 py-2.5 rounded-xl",
            "text-fjord-600 dark:text-fjord-300 font-medium",
            "hover:bg-fjord-100 dark:hover:bg-fjord-800",
            "transition-all duration-200",
            "hover:scale-[1.02] active:scale-[0.98]"
          )}
        >
          <span className="hidden sm:inline">{t("nextWeek")}</span>
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-3 overflow-x-auto pb-2">
        {days.map((date, index) => (
          <DayColumn
            key={date.toISOString()}
            date={date}
            meals={getMealsForDate(date)}
            isToday={date.getTime() === today.getTime()}
            onAddMeal={onAddMeal}
            onMealClick={onMealClick}
            locale={locale}
            animationDelay={index * 60}
          />
        ))}
      </div>
    </div>
  );
}
