"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { StatCard, type TrendDirection } from "./StatCard";
import { formatNOK, type SpendTrendResponse } from "@/lib/api";
import { cn } from "@/lib/utils";

interface SpendTrendCardProps {
  data: SpendTrendResponse | null;
  loading?: boolean;
  className?: string;
}

function calculateTrend(
  trends: SpendTrendResponse["trends"]
): { direction: TrendDirection; percentage: number } | null {
  if (trends.length < 2) return null;

  const current = trends[trends.length - 1].total_spent;
  const previous = trends[trends.length - 2].total_spent;

  if (previous === 0) return null;

  const change = ((current - previous) / previous) * 100;
  const direction: TrendDirection =
    change > 0 ? "up" : change < 0 ? "down" : "neutral";

  return { direction, percentage: Math.abs(change) };
}

function formatPeriodLabel(period: string, granularity: string): string {
  const date = new Date(period);

  switch (granularity) {
    case "daily":
      return date.toLocaleDateString("nb-NO", { day: "numeric", month: "short" });
    case "weekly":
      return `Uke ${getWeekNumber(date)}`;
    case "monthly":
      return date.toLocaleDateString("nb-NO", { month: "short", year: "2-digit" });
    default:
      return period;
  }
}

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

export function SpendTrendCard({
  data,
  loading = false,
  className,
}: SpendTrendCardProps) {
  const locale = useLocale();
  const t = useTranslations("Analytics");

  if (loading || !data) {
    return (
      <StatCard
        title={t("spendTrend.title")}
        value=""
        loading={true}
        className={className}
      />
    );
  }

  const hasData = data.trends.length > 0;
  const latestSpend = hasData
    ? data.trends[data.trends.length - 1].total_spent
    : 0;
  const trend = calculateTrend(data.trends);

  // Determine variant: success if trending down (saving money), default otherwise
  const variant = trend?.direction === "down" ? "success" : "default";

  // Choose icon based on trend
  const icon =
    trend?.direction === "down" ? (
      <TrendingDown className="w-6 h-6" />
    ) : trend?.direction === "up" ? (
      <TrendingUp className="w-6 h-6" />
    ) : (
      <TrendingUp className="w-6 h-6" />
    );

  return (
    <StatCard
      title={t("spendTrend.title")}
      value={hasData ? `${formatNOK(latestSpend, locale)} kr` : "-"}
      subtitle={hasData ? t(`spendTrend.granularity.${data.granularity}`) : t("spendTrend.noData")}
      icon={icon}
      trend={
        trend
          ? {
              direction: trend.direction,
              value: `${trend.percentage.toFixed(1)}%`,
            }
          : undefined
      }
      variant={variant}
      expandable={hasData && data.trends.length > 1}
      className={className}
    >
      {hasData && data.trends.length > 1 && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-fjord-600 dark:text-fjord-300">
            {t("spendTrend.periodBreakdown")}
          </h4>

          {/* Period breakdown list */}
          <ul className="space-y-2 max-h-48 overflow-y-auto">
            {[...data.trends].reverse().map((point, index) => {
              const isLatest = index === 0;
              return (
                <li
                  key={point.period}
                  className={cn(
                    "flex items-center justify-between py-2",
                    "border-b border-fjord-100/50 dark:border-fjord-700/50 last:border-b-0"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full",
                        isLatest
                          ? "bg-fjord-500 dark:bg-fjord-400"
                          : "bg-fjord-200 dark:bg-fjord-600"
                      )}
                    />
                    <div>
                      <p
                        className={cn(
                          "text-sm font-medium",
                          isLatest
                            ? "text-fjord-800 dark:text-fjord-100"
                            : "text-fjord-600 dark:text-fjord-300"
                        )}
                      >
                        {formatPeriodLabel(point.period, data.granularity)}
                      </p>
                      <p className="text-xs text-fjord-500 dark:text-fjord-400">
                        {point.receipt_count} {t("spendTrend.receipts")} - {point.meal_count}{" "}
                        {t("spendTrend.meals")}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "text-sm tabular-nums",
                      isLatest
                        ? "font-semibold text-fjord-800 dark:text-fjord-100"
                        : "text-fjord-600 dark:text-fjord-300"
                    )}
                  >
                    {formatNOK(point.total_spent, locale)} kr
                  </span>
                </li>
              );
            })}
          </ul>

          {/* Trend summary */}
          {trend && (
            <div className="pt-3 border-t border-fjord-100 dark:border-fjord-700/50">
              <div className="flex items-center gap-2 text-sm">
                {trend.direction === "down" ? (
                  <>
                    <span className="flex items-center gap-1 text-forest-600 dark:text-forest-400">
                      <TrendingDown className="w-4 h-4" />
                      {t("spendTrend.savingMoney")}
                    </span>
                    <span className="text-fjord-500 dark:text-fjord-400">
                      ({trend.percentage.toFixed(1)}% {t("spendTrend.less")})
                    </span>
                  </>
                ) : trend.direction === "up" ? (
                  <>
                    <span className="flex items-center gap-1 text-amber-dark dark:text-amber-warm">
                      <TrendingUp className="w-4 h-4" />
                      {t("spendTrend.spendingMore")}
                    </span>
                    <span className="text-fjord-500 dark:text-fjord-400">
                      ({trend.percentage.toFixed(1)}% {t("spendTrend.more")})
                    </span>
                  </>
                ) : (
                  <span className="flex items-center gap-1 text-fjord-500 dark:text-fjord-400">
                    <Minus className="w-4 h-4" />
                    {t("spendTrend.stable")}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </StatCard>
  );
}
