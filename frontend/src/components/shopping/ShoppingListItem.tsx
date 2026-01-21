"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { cn, formatQty } from "@/lib/utils";
import type { ShoppingListItem as ShoppingListItemType } from "@/lib/api";

interface ShoppingListItemProps {
  item: ShoppingListItemType;
  onToggle: (itemId: string, isChecked: boolean) => void;
  isUpdating: boolean;
}

export function ShoppingListItem({
  item,
  onToggle,
  isUpdating,
}: ShoppingListItemProps) {
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
    <div
      className={cn(
        "group transition-all duration-300",
        item.is_checked && "opacity-60"
      )}
    >
      {/* Main row - tap to toggle */}
      <button
        onClick={handleToggle}
        disabled={isUpdating}
        className={cn(
          "w-full flex items-center gap-4 p-3 -mx-3 rounded-xl",
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
            "w-12 h-12 flex-shrink-0 rounded-xl border-2 flex items-center justify-center",
            "transition-all duration-300",
            item.is_checked
              ? "bg-forest-500 border-forest-500 dark:bg-forest-500 dark:border-forest-500"
              : "border-fjord-300 dark:border-fjord-500 bg-white dark:bg-fjord-700/50 hover:border-fjord-400 dark:hover:border-fjord-400"
          )}
        >
          {isUpdating ? (
            <Loader2 className="w-6 h-6 text-white dark:text-fjord-200 animate-spin" />
          ) : item.is_checked ? (
            <Check className="w-6 h-6 text-white" strokeWidth={3} />
          ) : null}
        </div>

        {/* Item content */}
        <div className="flex-1 min-w-0 text-left">
          <p
            className={cn(
              "font-medium text-fjord-800 dark:text-fjord-100 transition-all duration-200",
              item.is_checked && "line-through text-fjord-500 dark:text-fjord-400"
            )}
          >
            {item.ingredient_name || `Ingredient ${item.ingredient_id}`}
          </p>
          <p className="text-sm text-fjord-500 dark:text-fjord-400 mt-0.5">
            <span className="font-semibold text-fjord-600 dark:text-fjord-300">{formatQty(item.to_buy_quantity)}</span>{" "}
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
              "w-10 h-10 flex items-center justify-center rounded-lg",
              "text-fjord-400 dark:text-fjord-500",
              "hover:text-fjord-600 dark:hover:text-fjord-300",
              "hover:bg-fjord-100 dark:hover:bg-fjord-700/50",
              "transition-all duration-200"
            )}
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        )}
      </button>

      {/* Expandable details panel */}
      {hasDetails && isExpanded && (
        <div
          className={cn(
            "ml-16 pl-4 pb-3 border-l-2 border-fjord-100 dark:border-fjord-700",
            "animate-fade-in"
          )}
        >
          {item.source_meal_plans.length > 0 && (
            <div className="mb-2">
              <p className="text-xs font-medium text-fjord-400 dark:text-fjord-500 uppercase tracking-wide mb-1">
                {t("mealsUsing")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {item.source_meal_plans.map((mealPlanId, index) => (
                  <span
                    key={mealPlanId}
                    className="px-2 py-0.5 text-xs rounded-full bg-fjord-100 dark:bg-fjord-700/50 text-fjord-600 dark:text-fjord-300"
                  >
                    {`Meal ${index + 1}`}
                  </span>
                ))}
              </div>
            </div>
          )}

          {item.notes && (
            <div>
              <p className="text-xs font-medium text-fjord-400 dark:text-fjord-500 uppercase tracking-wide mb-1">
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
