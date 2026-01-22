"use client";

import { Check, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import type { ShoppingListItem as ShoppingListItemType } from "@/lib/api";
import { cn, formatQty } from "@/lib/utils";

interface ShoppingListItemProps {
  item: ShoppingListItemType;
  onToggle: (itemId: string, isChecked: boolean) => void;
  isUpdating: boolean;
}

export function ShoppingListItem({ item, onToggle, isUpdating }: ShoppingListItemProps) {
  const t = useTranslations("Shopping");
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    if (!isUpdating) {
      onToggle(item.id, !item.is_checked);
    }
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const hasDetails = item.source_meal_plans.length > 0 || item.notes;

  return (
    <div className={cn("group transition-all duration-300", item.is_checked && "opacity-60")}>
      {/* Main row - tap to toggle */}
      <button
        onClick={handleToggle}
        disabled={isUpdating}
        className={cn(
          "-mx-3 flex w-full items-center gap-4 rounded-xl p-3",
          "transition-all duration-200",
          "hover:bg-fjord-50/50 dark:hover:bg-fjord-700/30",
          "active:bg-fjord-100/50 dark:active:bg-fjord-700/50",
          "focus:outline-none focus:ring-2 focus:ring-fjord-300 dark:focus:ring-fjord-500",
          "focus:ring-offset-2 focus:ring-offset-[#FAF9F6] dark:focus:ring-offset-[#1a2332]",
          isUpdating && "cursor-wait"
        )}
      >
        {/* Large 48px checkbox */}
        <div
          className={cn(
            "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border-2",
            "transition-all duration-300",
            item.is_checked
              ? "border-forest-500 bg-forest-500 dark:border-forest-500 dark:bg-forest-500"
              : "border-fjord-300 bg-white hover:border-fjord-400 dark:border-fjord-500 dark:bg-fjord-700/50 dark:hover:border-fjord-400"
          )}
        >
          {isUpdating ? (
            <Loader2 className="h-6 w-6 animate-spin text-white dark:text-fjord-200" />
          ) : item.is_checked ? (
            <Check className="h-6 w-6 text-white" strokeWidth={3} />
          ) : null}
        </div>

        {/* Item content */}
        <div className="min-w-0 flex-1 text-left">
          <p
            className={cn(
              "font-medium text-fjord-800 transition-all duration-200 dark:text-fjord-100",
              item.is_checked && "text-fjord-500 line-through dark:text-fjord-400"
            )}
          >
            {item.ingredient_name || `Ingredient ${item.ingredient_id}`}
          </p>
          <p className="mt-0.5 text-sm text-fjord-500 dark:text-fjord-400">
            <span className="font-semibold text-fjord-600 dark:text-fjord-300">
              {formatQty(item.to_buy_quantity)}
            </span>{" "}
            <span>{item.required_unit}</span>
            {Number(item.on_hand_quantity) > 0 && (
              <span className="ml-2 text-forest-600 dark:text-forest-400">
                ({formatQty(item.on_hand_quantity)} {t("itemOnHand")})
              </span>
            )}
          </p>
        </div>

        {/* Expand button for details */}
        {hasDetails && (
          <button
            onClick={handleExpandClick}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              "text-fjord-400 dark:text-fjord-500",
              "hover:text-fjord-600 dark:hover:text-fjord-300",
              "hover:bg-fjord-100 dark:hover:bg-fjord-700/50",
              "transition-all duration-200"
            )}
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        )}
      </button>

      {/* Expandable details panel */}
      {hasDetails && isExpanded && (
        <div
          className={cn(
            "ml-16 border-l-2 border-fjord-100 pb-3 pl-4 dark:border-fjord-700",
            "animate-fade-in"
          )}
        >
          {item.source_meal_plans.length > 0 && (
            <div className="mb-2">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-fjord-400 dark:text-fjord-500">
                {t("mealsUsing")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {item.source_meal_plans.map((mealPlanId, index) => (
                  <span
                    key={mealPlanId}
                    className="rounded-full bg-fjord-100 px-2 py-0.5 text-xs text-fjord-600 dark:bg-fjord-700/50 dark:text-fjord-300"
                  >
                    {`Meal ${index + 1}`}
                  </span>
                ))}
              </div>
            </div>
          )}

          {item.notes && (
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-fjord-400 dark:text-fjord-500">
                {t("notes")}
              </p>
              <p className="text-sm text-fjord-600 dark:text-fjord-300">{item.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
