"use client";

import { DollarSign } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { StatCard } from "./StatCard";
import { formatNOK, formatDate, type CostPerMealResponse } from "@/lib/api";
import { cn } from "@/lib/utils";

interface CostPerMealCardProps {
  data: CostPerMealResponse | null;
  loading?: boolean;
  className?: string;
}

export function CostPerMealCard({
  data,
  loading = false,
  className,
}: CostPerMealCardProps) {
  const locale = useLocale();
  const t = useTranslations("Analytics");

  if (loading || !data) {
    return (
      <StatCard
        title={t("costPerMeal.title")}
        value=""
        loading={true}
        className={className}
      />
    );
  }

  const hasData = data.meals.length > 0;
  const recentMeals = data.meals.slice(0, 5);

  return (
    <StatCard
      title={t("costPerMeal.title")}
      value={hasData ? `${formatNOK(data.average_cost_per_serving, locale)} kr` : "-"}
      subtitle={
        hasData
          ? t("costPerMeal.mealsTracked", { count: data.total_meals })
          : t("costPerMeal.noMeals")
      }
      icon={<DollarSign className="w-6 h-6" />}
      expandable={hasData}
      className={className}
    >
      {/* Recent meals list */}
      {hasData && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-fjord-600 dark:text-fjord-300">
            {t("costPerMeal.recentMeals")}
          </h4>
          <ul className="space-y-2">
            {recentMeals.map((meal) => (
              <li
                key={meal.meal_plan_id}
                className={cn(
                  "flex items-center justify-between py-2",
                  "border-b border-fjord-100/50 dark:border-fjord-700/50 last:border-b-0"
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-fjord-700 dark:text-fjord-200 truncate">
                    {meal.recipe_name}
                  </p>
                  <p className="text-xs text-fjord-500 dark:text-fjord-400">
                    {formatDate(meal.planned_date, locale)} - {meal.servings}{" "}
                    {t("costPerMeal.servings", { count: meal.servings })}
                  </p>
                </div>
                <div className="ml-4 text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-fjord-800 dark:text-fjord-100 tabular-nums">
                    {formatNOK(meal.actual_cost, locale)} kr
                  </p>
                  <p className="text-xs text-fjord-500 dark:text-fjord-400 tabular-nums">
                    {formatNOK(meal.cost_per_serving, locale)} kr/{t("costPerMeal.perServing")}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          {/* Summary */}
          <div className="pt-3 border-t border-fjord-100 dark:border-fjord-700/50">
            <div className="flex justify-between text-sm">
              <span className="text-fjord-600 dark:text-fjord-400">
                {t("costPerMeal.totalSpent")}
              </span>
              <span className="font-semibold text-fjord-800 dark:text-fjord-100 tabular-nums">
                {formatNOK(data.total_cost, locale)} kr
              </span>
            </div>
          </div>
        </div>
      )}
    </StatCard>
  );
}
