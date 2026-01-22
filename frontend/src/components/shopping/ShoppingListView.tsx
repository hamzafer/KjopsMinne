"use client";

import { CheckCircle2, ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import type { ShoppingList, ShoppingListItem as ShoppingListItemType } from "@/lib/api";
import { cn } from "@/lib/utils";

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
  const groupedUncheckedItems = useMemo(() => {
    const groups: Record<string, ShoppingListItemType[]> = {};

    uncheckedItems.forEach((item) => {
      const categoryKey = item.ingredient_name
        ? item.ingredient_name.charAt(0).toUpperCase()
        : "Other";

      if (!groups[categoryKey]) {
        groups[categoryKey] = [];
      }
      groups[categoryKey].push(item);
    });

    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [uncheckedItems]);

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="paper-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-fjord-600 dark:text-fjord-300">
            {allChecked
              ? t("allDone")
              : t("progress", { checked: checkedItems, total: totalItems })}
          </span>
          <span className="text-sm font-semibold tabular-nums text-fjord-800 dark:text-fjord-100">
            {Math.round(progressPercent)}%
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-fjord-100 dark:bg-fjord-700/50">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500 ease-out",
              allChecked
                ? "bg-gradient-to-r from-forest-500 to-forest-400"
                : "bg-gradient-to-r from-fjord-500 to-fjord-400 dark:from-fjord-400 dark:to-fjord-300"
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Unchecked items by category with sticky headers */}
      {groupedUncheckedItems.length > 0 && (
        <div className="space-y-4">
          {groupedUncheckedItems.map(([category, items]) => (
            <div key={category} className="group">
              {/* Sticky category header */}
              <div
                className={cn(
                  "sticky top-0 z-10 -mx-4 px-4 py-2.5",
                  "bg-[#FAF9F6]/95 dark:bg-[#1a2332]/95",
                  "border-b border-fjord-100/50 backdrop-blur-md dark:border-fjord-700/30"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-fjord-100 dark:bg-fjord-700/50">
                    <span className="text-sm font-bold text-fjord-500 dark:text-fjord-300">
                      {category}
                    </span>
                  </span>
                  <span className="text-xs font-medium uppercase tracking-wider text-fjord-400 dark:text-fjord-500">
                    {items.length} {items.length === 1 ? "item" : "items"}
                  </span>
                </div>
              </div>

              {/* Items in category */}
              <div className="paper-card mt-2 space-y-1 p-4">
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
        <div className="mt-8">
          <div className="-mx-4 border-t border-fjord-100 px-4 py-3 dark:border-fjord-700/30">
            <h3 className="flex items-center gap-2 font-display text-base font-semibold text-fjord-400 dark:text-fjord-500">
              <CheckCircle2 className="h-5 w-5 text-forest-500 dark:text-forest-400" />
              {t("checked")} ({checkedItemsList.length})
            </h3>
          </div>

          <div className="paper-card space-y-1 p-4 opacity-60 dark:opacity-50">
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
        <div className="fixed bottom-6 left-4 right-4 z-20 md:left-auto md:right-6 md:w-auto">
          <button
            onClick={onComplete}
            className={cn(
              "w-full rounded-2xl px-8 py-4 text-lg font-semibold md:w-auto",
              "bg-gradient-to-r from-forest-500 to-forest-600 text-white",
              "shadow-lg shadow-forest-500/25 dark:shadow-forest-500/15",
              "hover:from-forest-600 hover:to-forest-700 active:from-forest-700 active:to-forest-800",
              "transition-all duration-200",
              "flex items-center justify-center gap-3",
              "animate-slide-up"
            )}
          >
            <CheckCircle2 className="h-6 w-6" />
            {t("markComplete")}
          </button>
        </div>
      )}

      {/* Empty state */}
      {totalItems === 0 && (
        <div className="paper-card p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-fjord-100 dark:bg-fjord-700/50">
            <ShoppingBag className="h-8 w-8 text-fjord-400 dark:text-fjord-500" />
          </div>
          <p className="text-fjord-500 dark:text-fjord-400">{t("emptyMessage")}</p>
        </div>
      )}
    </div>
  );
}
