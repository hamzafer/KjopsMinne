"use client";

import { X, Users, Clock, Trash2, ChefHat, Check, SkipForward, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import type { MealPlan } from "@/lib/api";
import { cn, toNumber } from "@/lib/utils";

interface MealDetailProps {
  meal: MealPlan;
  onClose: () => void;
  onCook: (data: {
    actual_servings?: number;
    create_leftover: boolean;
    leftover_servings?: number;
  }) => void;
  onSkip: () => void;
  onDelete: () => void;
  cooking?: boolean;
}

export function MealDetail({ meal, onClose, onCook, onSkip, onDelete, cooking }: MealDetailProps) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 animate-fade-in bg-fjord-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          "paper-card relative max-h-[90vh] w-full max-w-md overflow-hidden",
          "animate-scale-in"
        )}
      >
        {/* Paper texture overlay */}
        <div className="pointer-events-none absolute inset-0 bg-[url('/paper-texture.png')] opacity-[0.02]" />

        {/* Header */}
        <div className="relative flex items-start justify-between border-b border-fjord-100 p-5 dark:border-fjord-700">
          <div className="flex-1 pr-4">
            <h3 className="font-display text-xl font-semibold text-fjord-800 dark:text-fjord-100">
              {meal.recipe?.name || "Unknown"}
            </h3>
            {/* Status Badge */}
            <div
              className={cn(
                "mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium",
                meal.status === "planned" &&
                  "bg-fjord-100 text-fjord-700 dark:bg-fjord-800 dark:text-fjord-200",
                meal.status === "cooked" &&
                  "bg-forest-100 text-forest-700 dark:bg-forest-900/30 dark:text-forest-400",
                meal.status === "skipped" &&
                  "bg-stone-light/50 text-stone dark:bg-stone-light/20 dark:text-stone-light"
              )}
            >
              {meal.status === "cooked" && <Check className="h-3.5 w-3.5" />}
              {meal.status === "skipped" && <SkipForward className="h-3.5 w-3.5" />}
              {t(meal.status)}
            </div>
          </div>
          <button
            onClick={onClose}
            className={cn(
              "-mr-1 -mt-1 rounded-xl p-2",
              "hover:bg-fjord-100 dark:hover:bg-fjord-800",
              "transition-colors"
            )}
          >
            <X className="h-5 w-5 text-fjord-500" />
          </button>
        </div>

        {/* Content */}
        <div className="relative max-h-[calc(90vh-180px)] space-y-5 overflow-y-auto p-5">
          {/* Info */}
          <div className="flex items-center gap-5 text-sm text-fjord-600 dark:text-fjord-300">
            <span className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-fjord-100 dark:bg-fjord-800">
                <Users className="h-4 w-4 text-fjord-500" />
              </div>
              <span className="font-medium">
                {meal.servings} {t("servings")}
              </span>
            </span>
            {meal.recipe?.prep_time_minutes && (
              <span className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-fjord-100 dark:bg-fjord-800">
                  <Clock className="h-4 w-4 text-fjord-500" />
                </div>
                <span className="font-medium">{meal.recipe.prep_time_minutes} min</span>
              </span>
            )}
          </div>

          {/* Cook Form */}
          {meal.status === "planned" && showCookForm && (
            <div className="space-y-4 rounded-xl border border-fjord-100 bg-fjord-50/50 p-4 dark:border-fjord-700 dark:bg-fjord-800/30">
              <h4 className="font-display font-semibold text-fjord-700 dark:text-fjord-200">
                {t("cookTitle")}
              </h4>

              <div>
                <label className="mb-2 block text-sm font-medium text-fjord-600 dark:text-fjord-300">
                  {t("actualServings")}
                </label>
                <input
                  type="number"
                  value={actualServings}
                  onChange={(e) => setActualServings(parseInt(e.target.value) || 1)}
                  min="1"
                  className={cn(
                    "w-full rounded-xl px-4 py-2.5",
                    "bg-white dark:bg-fjord-900",
                    "border border-fjord-200 dark:border-fjord-700",
                    "text-fjord-800 dark:text-fjord-100",
                    "focus:outline-none focus:ring-2 focus:ring-fjord-500/50"
                  )}
                />
              </div>

              <label className="group flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={createLeftover}
                  onChange={(e) => setCreateLeftover(e.target.checked)}
                  className="h-5 w-5 rounded border-fjord-300 text-fjord-500 focus:ring-fjord-500/50"
                />
                <span className="text-sm font-medium text-fjord-600 group-hover:text-fjord-700 dark:text-fjord-300">
                  {t("createLeftover")}
                </span>
              </label>

              {createLeftover && (
                <div className="animate-fade-in">
                  <label className="mb-2 block text-sm font-medium text-fjord-600 dark:text-fjord-300">
                    {t("leftoverServings")}
                  </label>
                  <input
                    type="number"
                    value={leftoverServings}
                    onChange={(e) => setLeftoverServings(parseInt(e.target.value) || 0)}
                    min="0"
                    max={actualServings - 1}
                    className={cn(
                      "w-full rounded-xl px-4 py-2.5",
                      "bg-white dark:bg-fjord-900",
                      "border border-fjord-200 dark:border-fjord-700",
                      "text-fjord-800 dark:text-fjord-100",
                      "focus:outline-none focus:ring-2 focus:ring-fjord-500/50"
                    )}
                  />
                </div>
              )}

              <button
                onClick={handleCook}
                disabled={cooking}
                className={cn(
                  "w-full rounded-xl py-3 font-medium",
                  "bg-forest-500 text-white",
                  "hover:bg-forest-600",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  "transition-all duration-200",
                  "hover:scale-[1.01] active:scale-[0.99]",
                  "flex items-center justify-center gap-2"
                )}
              >
                {cooking ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Check className="h-5 w-5" />
                    {t("cookConfirm")}
                  </>
                )}
              </button>
            </div>
          )}

          {/* Cooked Info */}
          {meal.status === "cooked" && meal.actual_cost && meal.cost_per_serving && (
            <div className="rounded-xl border border-forest-200/50 bg-forest-50/50 p-4 dark:border-forest-700/50 dark:bg-forest-900/20">
              <div className="flex items-center gap-2 font-medium text-forest-700 dark:text-forest-400">
                <Check className="h-4 w-4" />
                {t("costCalculated")}: {toNumber(meal.actual_cost).toFixed(2)} kr
              </div>
              <div className="mt-1 text-sm tabular-nums text-forest-600 dark:text-forest-500">
                {toNumber(meal.cost_per_serving).toFixed(2)} kr/porsjon
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {meal.status === "planned" && (
          <div className="relative flex gap-3 border-t border-fjord-100 p-5 dark:border-fjord-700">
            {!showCookForm && (
              <>
                <button
                  onClick={() => setShowCookForm(true)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-xl py-3 font-medium",
                    "bg-forest-500 text-white",
                    "hover:bg-forest-600",
                    "transition-all duration-200",
                    "hover:scale-[1.01] active:scale-[0.99]"
                  )}
                >
                  <ChefHat className="h-5 w-5" />
                  {t("cook")}
                </button>
                <button
                  onClick={onSkip}
                  className={cn(
                    "rounded-xl px-5 py-3 font-medium",
                    "bg-fjord-100 dark:bg-fjord-800",
                    "text-fjord-600 dark:text-fjord-300",
                    "hover:bg-fjord-200 dark:hover:bg-fjord-700",
                    "transition-all duration-200",
                    "hover:scale-[1.01] active:scale-[0.99]"
                  )}
                >
                  {t("skip")}
                </button>
              </>
            )}
            <button
              onClick={onDelete}
              className={cn(
                "rounded-xl p-3",
                "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20",
                "transition-colors"
              )}
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
