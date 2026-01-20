"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Plus, CalendarDays } from "lucide-react";
import { api, type MealPlan } from "@/lib/api";
import { WeeklyCalendar } from "@/components/meal-plan/WeeklyCalendar";
import { MealDetail } from "@/components/meal-plan/MealDetail";
import { GenerateButton } from "@/components/shopping";
import { cn } from "@/lib/utils";

// TODO: Get from user context
const HOUSEHOLD_ID = "00000000-0000-0000-0000-000000000001";

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function MealPlanPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("MealPlan");

  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [meals, setMeals] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeal, setSelectedMeal] = useState<MealPlan | null>(null);
  const [cooking, setCooking] = useState(false);

  const weekEnd = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    return end;
  }, [weekStart]);

  const loadMeals = useCallback(async () => {
    setLoading(true);
    try {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const response = await api.getMealPlans(
        HOUSEHOLD_ID,
        weekStart.toISOString(),
        weekEnd.toISOString()
      );
      setMeals(response.meal_plans);
    } catch (error) {
      console.error("Failed to load meals:", error);
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => {
    loadMeals();
  }, [loadMeals]);

  const handlePrevWeek = () => {
    const newStart = new Date(weekStart);
    newStart.setDate(newStart.getDate() - 7);
    setWeekStart(newStart);
  };

  const handleNextWeek = () => {
    const newStart = new Date(weekStart);
    newStart.setDate(newStart.getDate() + 7);
    setWeekStart(newStart);
  };

  const handleAddMeal = (date: Date, mealType: "breakfast" | "lunch" | "dinner") => {
    const dateStr = date.toISOString().split("T")[0];
    router.push(`/${locale}/plan/add?date=${dateStr}&meal=${mealType}`);
  };

  const handleCook = async (data: { actual_servings?: number; create_leftover: boolean; leftover_servings?: number }) => {
    if (!selectedMeal) return;

    setCooking(true);
    try {
      await api.cookMealPlan(selectedMeal.id, data);
      await loadMeals();
      setSelectedMeal(null);
    } catch (error) {
      console.error("Failed to cook meal:", error);
    } finally {
      setCooking(false);
    }
  };

  const handleSkip = async () => {
    if (!selectedMeal) return;

    try {
      await api.updateMealPlan(selectedMeal.id, { status: "skipped" });
      await loadMeals();
      setSelectedMeal(null);
    } catch (error) {
      console.error("Failed to skip meal:", error);
    }
  };

  const handleDelete = async () => {
    if (!selectedMeal || !confirm(t("confirmDelete"))) return;

    try {
      await api.deleteMealPlan(selectedMeal.id);
      await loadMeals();
      setSelectedMeal(null);
    } catch (error) {
      console.error("Failed to delete meal:", error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-slide-up">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-fjord-500 to-fjord-600 flex items-center justify-center shadow-lg shadow-fjord-500/20">
            <CalendarDays className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-semibold text-fjord-800 dark:text-fjord-100">
              {t("title")}
            </h1>
            <p className="mt-0.5 text-fjord-500 dark:text-fjord-400">
              {t("subtitle")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/${locale}/plan/add`)}
            className={cn(
              "flex items-center gap-2 px-5 py-3 rounded-xl font-medium",
              "bg-fjord-500 text-white",
              "hover:bg-fjord-600",
              "shadow-lg shadow-fjord-500/20",
              "transition-all duration-200",
              "hover:scale-[1.02] active:scale-[0.98]"
            )}
          >
            <Plus className="w-5 h-5" />
            {t("addMeal")}
          </button>

          <div className="w-auto">
            <GenerateButton
              householdId={HOUSEHOLD_ID}
              weekStart={weekStart}
              weekEnd={weekEnd}
            />
          </div>
        </div>
      </div>

      {/* Calendar */}
      <WeeklyCalendar
        weekStart={weekStart}
        meals={meals}
        loading={loading}
        onPrevWeek={handlePrevWeek}
        onNextWeek={handleNextWeek}
        onAddMeal={handleAddMeal}
        onMealClick={setSelectedMeal}
      />

      {/* Meal Detail Modal */}
      {selectedMeal && (
        <MealDetail
          meal={selectedMeal}
          onClose={() => setSelectedMeal(null)}
          onCook={handleCook}
          onSkip={handleSkip}
          onDelete={handleDelete}
          cooking={cooking}
        />
      )}
    </div>
  );
}
