"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { X, Users, Clock, Trash2, ChefHat } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MealPlan } from "@/lib/api";

interface MealDetailProps {
  meal: MealPlan;
  onClose: () => void;
  onCook: (data: { actual_servings?: number; create_leftover: boolean; leftover_servings?: number }) => void;
  onSkip: () => void;
  onDelete: () => void;
  cooking?: boolean;
}

export function MealDetail({
  meal,
  onClose,
  onCook,
  onSkip,
  onDelete,
  cooking,
}: MealDetailProps) {
  const t = useTranslations("MealPlan");

  const [showCookForm, setShowCookForm] = useState(false);
  const [actualServings, setActualServings] = useState(meal.servings);
  const [createLeftover, setCreateLeftover] = useState(false);
  const [leftoverServings, setLeftoverServings] = useState(0);

  const handleCook = () => {
    onCook({
      actual_servings: actualServings,
      create_leftover: createLeftover,
      leftover_servings: createLeftover ? leftoverServings : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-fjord-900 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-fjord-100 dark:border-fjord-700">
          <h3 className="text-lg font-semibold text-fjord-800 dark:text-fjord-100">
            {meal.recipe?.name || "Unknown"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-fjord-100 dark:hover:bg-fjord-800"
          >
            <X className="w-5 h-5 text-fjord-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Status Badge */}
          <div className={cn(
            "inline-flex px-3 py-1 rounded-full text-sm font-medium",
            meal.status === "planned" && "bg-fjord-100 text-fjord-700 dark:bg-fjord-800 dark:text-fjord-200",
            meal.status === "cooked" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
            meal.status === "skipped" && "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
          )}>
            {t(meal.status)}
          </div>

          {/* Info */}
          <div className="flex items-center gap-4 text-sm text-fjord-600 dark:text-fjord-300">
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {meal.servings} {t("servings")}
            </span>
            {meal.recipe?.prep_time_minutes && (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {meal.recipe.prep_time_minutes} min
              </span>
            )}
          </div>

          {/* Cook Form */}
          {meal.status === "planned" && showCookForm && (
            <div className="p-4 bg-fjord-50 dark:bg-fjord-800/50 rounded-xl space-y-4">
              <h4 className="font-medium text-fjord-700 dark:text-fjord-200">
                {t("cookTitle")}
              </h4>

              <div>
                <label className="block text-sm text-fjord-600 dark:text-fjord-300 mb-1">
                  {t("actualServings")}
                </label>
                <input
                  type="number"
                  value={actualServings}
                  onChange={(e) => setActualServings(parseInt(e.target.value) || 1)}
                  min="1"
                  className={cn(
                    "w-full px-3 py-2 rounded-lg",
                    "bg-white dark:bg-fjord-900",
                    "border border-fjord-200 dark:border-fjord-700",
                    "text-fjord-800 dark:text-fjord-100"
                  )}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="createLeftover"
                  checked={createLeftover}
                  onChange={(e) => setCreateLeftover(e.target.checked)}
                  className="rounded border-fjord-300"
                />
                <label htmlFor="createLeftover" className="text-sm text-fjord-600 dark:text-fjord-300">
                  {t("createLeftover")}
                </label>
              </div>

              {createLeftover && (
                <div>
                  <label className="block text-sm text-fjord-600 dark:text-fjord-300 mb-1">
                    {t("leftoverServings")}
                  </label>
                  <input
                    type="number"
                    value={leftoverServings}
                    onChange={(e) => setLeftoverServings(parseInt(e.target.value) || 0)}
                    min="0"
                    max={actualServings - 1}
                    className={cn(
                      "w-full px-3 py-2 rounded-lg",
                      "bg-white dark:bg-fjord-900",
                      "border border-fjord-200 dark:border-fjord-700",
                      "text-fjord-800 dark:text-fjord-100"
                    )}
                  />
                </div>
              )}

              <button
                onClick={handleCook}
                disabled={cooking}
                className={cn(
                  "w-full py-2 rounded-lg font-medium",
                  "bg-green-500 text-white",
                  "hover:bg-green-600 disabled:opacity-50",
                  "transition-colors"
                )}
              >
                {cooking ? "..." : t("cookConfirm")}
              </button>
            </div>
          )}

          {/* Cooked Info */}
          {meal.status === "cooked" && meal.actual_cost && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <div className="text-sm text-green-700 dark:text-green-400">
                {t("costCalculated")}: {meal.actual_cost.toFixed(2)} kr
              </div>
              <div className="text-xs text-green-600 dark:text-green-500 mt-1">
                {meal.cost_per_serving?.toFixed(2)} kr/porsjon
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {meal.status === "planned" && (
          <div className="p-4 border-t border-fjord-100 dark:border-fjord-700 flex gap-2">
            {!showCookForm && (
              <>
                <button
                  onClick={() => setShowCookForm(true)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium",
                    "bg-green-500 text-white",
                    "hover:bg-green-600 transition-colors"
                  )}
                >
                  <ChefHat className="w-4 h-4" />
                  {t("cook")}
                </button>
                <button
                  onClick={onSkip}
                  className={cn(
                    "px-4 py-2 rounded-lg font-medium",
                    "bg-fjord-100 dark:bg-fjord-800 text-fjord-600 dark:text-fjord-300",
                    "hover:bg-fjord-200 dark:hover:bg-fjord-700 transition-colors"
                  )}
                >
                  {t("skip")}
                </button>
              </>
            )}
            <button
              onClick={onDelete}
              className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
