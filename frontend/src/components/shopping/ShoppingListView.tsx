"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ShoppingList, ShoppingListItem as ShoppingListItemType } from "@/lib/api";
import { ShoppingListItem } from "./ShoppingListItem";

interface ShoppingListViewProps {
  shoppingList: ShoppingList;
  onToggleItem: (itemId: string, isChecked: boolean) => void;
  onComplete: () => void;
  updatingItems: Set<string>;
}

export function ShoppingListView({
  shoppingList,
  onToggleItem,
  onComplete,
  updatingItems,
}: ShoppingListViewProps) {
  const t = useTranslations("Shopping");

  // Calculate progress
  const totalItems = shoppingList.items.length;
  const checkedItems = shoppingList.items.filter((item) => item.is_checked).length;
  const progressPercent = totalItems > 0 ? (checkedItems / totalItems) * 100 : 0;
  const allChecked = totalItems > 0 && checkedItems === totalItems;

  // Separate unchecked and checked items
  const { uncheckedItems, checkedItemsList } = useMemo(() => {
    const unchecked: ShoppingListItemType[] = [];
    const checked: ShoppingListItemType[] = [];

    shoppingList.items.forEach((item) => {
      if (item.is_checked) {
        checked.push(item);
      } else {
        unchecked.push(item);
      }
    });

    return { uncheckedItems: unchecked, checkedItemsList: checked };
  }, [shoppingList.items]);

  // Group items by category (using ingredient_id first letter as mock category for now)
  // In a real implementation, this would use actual category data
  const groupedUncheckedItems = useMemo(() => {
    const groups: Record<string, ShoppingListItemType[]> = {};

    uncheckedItems.forEach((item) => {
      // Use first letter of ingredient name as category placeholder
      const categoryKey = item.ingredient_name
        ? item.ingredient_name.charAt(0).toUpperCase()
        : "Other";

      if (!groups[categoryKey]) {
        groups[categoryKey] = [];
      }
      groups[categoryKey].push(item);
    });

    // Sort by category name
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [uncheckedItems]);

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="paper-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-fjord-600">
            {allChecked
              ? t("allDone")
              : t("progress", { checked: checkedItems, total: totalItems })}
          </span>
          <span className="text-sm font-semibold text-fjord-800 tabular-nums">
            {Math.round(progressPercent)}%
          </span>
        </div>
        <div className="h-3 bg-fjord-100 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500 ease-out",
              allChecked ? "bg-forest-500" : "bg-fjord-500"
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Unchecked items by category with sticky headers */}
      {groupedUncheckedItems.length > 0 && (
        <div className="space-y-4">
          {groupedUncheckedItems.map(([category, items]) => (
            <div key={category}>
              {/* Sticky category header */}
              <div className="sticky top-0 z-10 py-2 -mx-4 px-4 bg-cream/95 backdrop-blur-sm">
                <h3 className="font-display font-semibold text-fjord-700 text-lg">
                  {category}
                </h3>
              </div>

              {/* Items in category */}
              <div className="paper-card p-4 space-y-1">
                {items.map((item) => (
                  <ShoppingListItem
                    key={item.id}
                    item={item}
                    onToggle={onToggleItem}
                    isUpdating={updatingItems.has(item.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Checked items section at bottom */}
      {checkedItemsList.length > 0 && (
        <div>
          <div className="py-2 -mx-4 px-4">
            <h3 className="font-display font-semibold text-fjord-500 text-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-forest-500" />
              {t("checked")} ({checkedItemsList.length})
            </h3>
          </div>

          <div className="paper-card p-4 opacity-75 space-y-1">
            {checkedItemsList.map((item) => (
              <ShoppingListItem
                key={item.id}
                item={item}
                onToggle={onToggleItem}
                isUpdating={updatingItems.has(item.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Mark Complete button when all items checked */}
      {allChecked && shoppingList.status !== "completed" && (
        <div className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-auto z-20">
          <button
            onClick={onComplete}
            className={cn(
              "w-full md:w-auto px-8 py-4 rounded-2xl font-semibold text-lg",
              "bg-forest-500 text-white shadow-paper-lifted",
              "hover:bg-forest-600 active:bg-forest-700",
              "transition-all duration-200",
              "flex items-center justify-center gap-3",
              "animate-slide-up"
            )}
          >
            <CheckCircle2 className="w-6 h-6" />
            {t("markComplete")}
          </button>
        </div>
      )}

      {/* Empty state */}
      {totalItems === 0 && (
        <div className="paper-card p-8 text-center">
          <p className="text-fjord-500">{t("emptyMessage")}</p>
        </div>
      )}
    </div>
  );
}
