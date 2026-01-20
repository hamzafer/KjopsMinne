"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { StatCard } from "./StatCard";
import { formatNOK, formatDate, type WasteResponse } from "@/lib/api";
import { cn } from "@/lib/utils";

type WasteTab = "inventory" | "leftovers";

interface WasteCardProps {
  data: WasteResponse | null;
  loading?: boolean;
  className?: string;
}

export function WasteCard({ data, loading = false, className }: WasteCardProps) {
  const locale = useLocale();
  const t = useTranslations("Analytics");
  const [activeTab, setActiveTab] = useState<WasteTab>("inventory");

  if (loading || !data) {
    return (
      <StatCard
        title={t("waste.title")}
        value=""
        loading={true}
        className={className}
      />
    );
  }

  const hasInventoryWaste = data.inventory_discards.length > 0;
  const hasLeftoverWaste = data.leftover_discards.length > 0;
  const hasAnyWaste = hasInventoryWaste || hasLeftoverWaste;
  const totalWasteValue = data.total_inventory_waste_value;

  // Determine variant based on waste amount
  const variant = hasAnyWaste ? "warning" : "success";

  // Calculate main display value
  const mainValue = hasAnyWaste
    ? `${formatNOK(totalWasteValue, locale)} kr`
    : t("waste.noWaste");

  return (
    <StatCard
      title={t("waste.title")}
      value={mainValue}
      subtitle={
        hasAnyWaste
          ? t("waste.itemsWasted", {
              inventory: data.inventory_discards.length,
              leftovers: data.total_leftover_servings_wasted,
            })
          : t("waste.keepItUp")
      }
      icon={<Trash2 className="w-6 h-6" />}
      variant={variant}
      expandable={hasAnyWaste}
      className={className}
    >
      {hasAnyWaste && (
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-fjord-100/50 dark:bg-fjord-700/30 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab("inventory")}
              className={cn(
                "flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200",
                activeTab === "inventory"
                  ? "bg-paper dark:bg-fjord-600 text-fjord-800 dark:text-fjord-100 shadow-sm"
                  : "text-fjord-600 dark:text-fjord-400 hover:text-fjord-800 dark:hover:text-fjord-200"
              )}
            >
              {t("waste.inventoryTab")}
              {hasInventoryWaste && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-amber-light/30 dark:bg-amber-dark/20 text-amber-dark dark:text-amber-warm">
                  {data.inventory_discards.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("leftovers")}
              className={cn(
                "flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200",
                activeTab === "leftovers"
                  ? "bg-paper dark:bg-fjord-600 text-fjord-800 dark:text-fjord-100 shadow-sm"
                  : "text-fjord-600 dark:text-fjord-400 hover:text-fjord-800 dark:hover:text-fjord-200"
              )}
            >
              {t("waste.leftoversTab")}
              {hasLeftoverWaste && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-amber-light/30 dark:bg-amber-dark/20 text-amber-dark dark:text-amber-warm">
                  {data.leftover_discards.length}
                </span>
              )}
            </button>
          </div>

          {/* Tab content */}
          {activeTab === "inventory" && (
            <div className="space-y-2">
              {!hasInventoryWaste ? (
                <p className="text-sm text-fjord-500 dark:text-fjord-400 text-center py-3">
                  {t("waste.noInventoryWaste")}
                </p>
              ) : (
                <ul className="space-y-2 max-h-48 overflow-y-auto">
                  {data.inventory_discards.map((item, index) => (
                    <li
                      key={`${item.date}-${index}`}
                      className={cn(
                        "flex items-center justify-between py-2",
                        "border-b border-fjord-100/50 dark:border-fjord-700/50 last:border-b-0"
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-fjord-700 dark:text-fjord-200 truncate">
                          {item.ingredient_name || t("waste.unknownItem")}
                        </p>
                        <p className="text-xs text-fjord-500 dark:text-fjord-400">
                          {item.quantity} {item.unit} - {item.reason}
                        </p>
                      </div>
                      {item.estimated_value !== null && (
                        <span className="ml-3 text-sm font-medium text-amber-dark dark:text-amber-warm tabular-nums">
                          {formatNOK(item.estimated_value, locale)} kr
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {activeTab === "leftovers" && (
            <div className="space-y-2">
              {!hasLeftoverWaste ? (
                <p className="text-sm text-fjord-500 dark:text-fjord-400 text-center py-3">
                  {t("waste.noLeftoverWaste")}
                </p>
              ) : (
                <ul className="space-y-2 max-h-48 overflow-y-auto">
                  {data.leftover_discards.map((item) => (
                    <li
                      key={item.leftover_id}
                      className={cn(
                        "flex items-center justify-between py-2",
                        "border-b border-fjord-100/50 dark:border-fjord-700/50 last:border-b-0"
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-fjord-700 dark:text-fjord-200 truncate">
                          {item.recipe_name}
                        </p>
                        <p className="text-xs text-fjord-500 dark:text-fjord-400">
                          {t("waste.discardedOn", {
                            date: item.discarded_at
                              ? formatDate(item.discarded_at, locale)
                              : t("waste.unknown"),
                          })}
                        </p>
                      </div>
                      <span className="ml-3 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-light/30 dark:bg-amber-dark/20 text-amber-dark dark:text-amber-warm">
                        {item.servings_wasted} {t("waste.servings")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Total waste summary */}
          <div className="pt-3 border-t border-fjord-100 dark:border-fjord-700/50">
            <div className="flex justify-between text-sm">
              <span className="text-fjord-600 dark:text-fjord-400">
                {t("waste.totalWasteValue")}
              </span>
              <span className="font-semibold text-amber-dark dark:text-amber-warm tabular-nums">
                {formatNOK(totalWasteValue, locale)} kr
              </span>
            </div>
          </div>
        </div>
      )}
    </StatCard>
  );
}
