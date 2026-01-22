"use client";

import { AlertTriangle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { formatDate, type RestockPredictionsResponse, type RestockPrediction } from "@/lib/api";
import { cn, formatQty } from "@/lib/utils";

import { StatCard, type StatCardVariant } from "./StatCard";

interface RestockCardProps {
  data: RestockPredictionsResponse | null;
  loading?: boolean;
  className?: string;
}

type UrgencyLevel = "critical" | "warning" | "good";

function getUrgencyLevel(daysUntilEmpty: number | null): UrgencyLevel {
  if (daysUntilEmpty === null) return "good";
  if (daysUntilEmpty < 3) return "critical";
  if (daysUntilEmpty <= 7) return "warning";
  return "good";
}

function getUrgencyStyles(level: UrgencyLevel): {
  badge: string;
  dot: string;
} {
  switch (level) {
    case "critical":
      return {
        badge: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
        dot: "bg-red-500",
      };
    case "warning":
      return {
        badge: "bg-amber-light/30 dark:bg-amber-dark/20 text-amber-dark dark:text-amber-warm",
        dot: "bg-amber-warm",
      };
    case "good":
      return {
        badge: "bg-forest-100 dark:bg-forest-800/50 text-forest-600 dark:text-forest-400",
        dot: "bg-forest-500",
      };
  }
}

function getVariantFromPredictions(predictions: RestockPrediction[]): StatCardVariant {
  const hasCritical = predictions.some(
    (p) => p.days_until_empty !== null && p.days_until_empty < 3
  );
  const hasWarning = predictions.some(
    (p) => p.days_until_empty !== null && p.days_until_empty >= 3 && p.days_until_empty <= 7
  );

  if (hasCritical) return "danger";
  if (hasWarning) return "warning";
  return "success";
}

export function RestockCard({ data, loading = false, className }: RestockCardProps) {
  const locale = useLocale();
  const t = useTranslations("Analytics");

  if (loading || !data) {
    return <StatCard title={t("restock.title")} value="" loading={true} className={className} />;
  }

  // Filter to items that need restocking (have a predicted runout date)
  const itemsNeedingRestock = data.predictions.filter(
    (p) => p.days_until_empty !== null && p.days_until_empty <= 14
  );

  // Sort by days until empty (most urgent first)
  const sortedItems = [...itemsNeedingRestock].sort((a, b) => {
    const daysA = a.days_until_empty ?? Infinity;
    const daysB = b.days_until_empty ?? Infinity;
    return daysA - daysB;
  });

  const hasItems = sortedItems.length > 0;
  const variant = hasItems ? getVariantFromPredictions(sortedItems) : "success";

  // Count items by urgency
  const criticalCount = sortedItems.filter(
    (p) => p.days_until_empty !== null && p.days_until_empty < 3
  ).length;
  const warningCount = sortedItems.filter(
    (p) => p.days_until_empty !== null && p.days_until_empty >= 3 && p.days_until_empty <= 7
  ).length;

  return (
    <StatCard
      title={t("restock.title")}
      value={hasItems ? sortedItems.length.toString() : "0"}
      subtitle={hasItems ? t("restock.itemsRunningLow") : t("restock.allStocked")}
      icon={<AlertTriangle className="h-6 w-6" />}
      variant={variant}
      expandable={hasItems}
      className={className}
    >
      {hasItems && (
        <div className="space-y-4">
          {/* Urgency summary */}
          <div className="flex gap-3">
            {criticalCount > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                <span className="text-xs font-medium text-red-700 dark:text-red-400">
                  {criticalCount} {t("restock.critical")}
                </span>
              </div>
            )}
            {warningCount > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-warm" />
                <span className="text-xs font-medium text-amber-dark dark:text-amber-warm">
                  {warningCount} {t("restock.soon")}
                </span>
              </div>
            )}
          </div>

          {/* Items list */}
          <ul className="max-h-48 space-y-2 overflow-y-auto">
            {sortedItems.map((item) => {
              const urgency = getUrgencyLevel(item.days_until_empty);
              const styles = getUrgencyStyles(urgency);

              return (
                <li
                  key={item.ingredient_id}
                  className={cn(
                    "flex items-center justify-between py-2",
                    "border-b border-fjord-100/50 last:border-b-0 dark:border-fjord-700/50"
                  )}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className={cn("h-2 w-2 flex-shrink-0 rounded-full", styles.dot)} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-fjord-700 dark:text-fjord-200">
                        {item.ingredient_name}
                      </p>
                      <p className="text-xs text-fjord-500 dark:text-fjord-400">
                        {formatQty(item.current_quantity)} {item.unit} {t("restock.remaining")}
                      </p>
                    </div>
                  </div>
                  <div className="ml-3 flex flex-shrink-0 flex-col items-end gap-1">
                    <span
                      className={cn("rounded-full px-2 py-0.5 text-xs font-medium", styles.badge)}
                    >
                      {item.days_until_empty !== null
                        ? item.days_until_empty < 1
                          ? t("restock.today")
                          : item.days_until_empty === 1
                            ? t("restock.tomorrow")
                            : t("restock.daysLeft", { days: Math.round(item.days_until_empty) })
                        : t("restock.unknown")}
                    </span>
                    {item.recommended_restock_date && (
                      <span className="text-xs text-fjord-500 dark:text-fjord-400">
                        {t("restock.restockBy", {
                          date: formatDate(item.recommended_restock_date, locale),
                        })}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Tip */}
          <div className="border-t border-fjord-100 pt-3 dark:border-fjord-700/50">
            <p className="text-xs text-fjord-500 dark:text-fjord-400">{t("restock.tip")}</p>
          </div>
        </div>
      )}
    </StatCard>
  );
}
