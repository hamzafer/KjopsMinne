"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
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
          "hover:bg-fjord-50/50 active:bg-fjord-100/50",
          "focus:outline-none focus:ring-2 focus:ring-fjord-300 focus:ring-offset-2 focus:ring-offset-cream",
          isUpdating && "cursor-wait"
        )}
      >
        {/* Large 48px checkbox */}
        <div
          className={cn(
            "w-12 h-12 flex-shrink-0 rounded-xl border-2 flex items-center justify-center",
            "transition-all duration-300",
            item.is_checked
              ? "bg-forest-500 border-forest-500"
              : "border-fjord-300 bg-paper hover:border-fjord-400"
          )}
        >
          {isUpdating ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : item.is_checked ? (
            <Check className="w-6 h-6 text-white" strokeWidth={3} />
          ) : null}
        </div>

        {/* Item content */}
        <div className="flex-1 min-w-0 text-left">
          <p
            className={cn(
              "font-medium text-fjord-800 transition-all duration-200",
              item.is_checked && "line-through text-fjord-500"
            )}
          >
            {item.ingredient_name || `Ingredient ${item.ingredient_id}`}
          </p>
          <p className="text-sm text-fjord-500 mt-0.5">
            <span className="font-semibold">{item.to_buy_quantity}</span>{" "}
            <span>{item.required_unit}</span>
            {item.on_hand_quantity > 0 && (
              <span className="ml-2 text-forest-600">
                ({item.on_hand_quantity} {t("itemOnHand")})
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
              "text-fjord-400 hover:text-fjord-600 hover:bg-fjord-100",
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
            "ml-16 pl-4 pb-3 border-l-2 border-fjord-100",
            "animate-fade-in"
          )}
        >
          {item.source_meal_plans.length > 0 && (
            <div className="mb-2">
              <p className="text-xs font-medium text-fjord-400 uppercase tracking-wide mb-1">
                {t("mealsUsing")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {item.source_meal_plans.map((mealPlanId, index) => (
                  <span
                    key={mealPlanId}
                    className="px-2 py-0.5 text-xs rounded-full bg-fjord-100 text-fjord-600"
                  >
                    {`Meal ${index + 1}`}
                  </span>
                ))}
              </div>
            </div>
          )}

          {item.notes && (
            <div>
              <p className="text-xs font-medium text-fjord-400 uppercase tracking-wide mb-1">
                {t("notes")}
              </p>
              <p className="text-sm text-fjord-600">{item.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
