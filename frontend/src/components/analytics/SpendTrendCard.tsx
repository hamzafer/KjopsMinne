"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";

import { formatNOK, type SpendTrendResponse } from "@/lib/api";
import { cn } from "@/lib/utils";

import { StatCard, type TrendDirection } from "./StatCard";

interface SpendTrendCardProps {
  data: SpendTrendResponse | null;
  loading?: boolean;
  className?: string;
}

function calculateTrend(
  trends: SpendTrendResponse["trends"]
): { direction: TrendDirection; percentage: number } | null {
  if (trends.length < 2) return null;

  const current = Number(trends[trends.length - 1].total_spent);
  const previous = Number(trends[trends.length - 2].total_spent);

  if (previous === 0) return null;

  const change = ((current - previous) / previous) * 100;
  const direction: TrendDirection = change > 0 ? "up" : change < 0 ? "down" : "neutral";

  return { direction, percentage: Math.abs(change) };
}

function formatPeriodLabel(period: string, granularity: string, locale: string): string {
  const localeCode = locale === "en" ? "en-GB" : "nb-NO";

  switch (granularity) {
    case "daily": {
      const date = new Date(period);
      return date.toLocaleDateString(localeCode, { day: "numeric", month: "short" });
    }
    case "weekly": {
      // Backend returns ISO week format: "YYYY-WXX" (e.g., "2026-W03")
      const weekMatch = /^\d{4}-W(\d{2})$/.exec(period);
      if (weekMatch) {
        const weekNum = parseInt(weekMatch[1], 10);
        const weekLabel = locale === "en" ? "Week" : "Uke";
        return `${weekLabel} ${weekNum}`;
      }
      // Fallback for other formats
      const date = new Date(period);
      const weekLabel = locale === "en" ? "Week" : "Uke";
      return `${weekLabel} ${getWeekNumber(date)}`;
    }
    case "monthly": {
      const date = new Date(period);
      return date.toLocaleDateString(localeCode, { month: "short", year: "2-digit" });
    }
    default:
      return period;
  }
}

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// Custom tooltip component matching StatCard aesthetic
interface CustomTooltipProps {
  active?: boolean;
  payload?: { value: number; payload: { period: string; label: string } }[];
  locale: string;
}

function CustomTooltip({ active, payload, locale }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  const data = payload[0];
  return (
    <div className="rounded-lg border border-fjord-100 bg-paper px-3 py-2 shadow-paper-hover dark:border-fjord-700 dark:bg-fjord-800">
      <p className="mb-0.5 text-xs text-fjord-500 dark:text-fjord-400">{data.payload.label}</p>
      <p className="text-sm font-semibold tabular-nums text-fjord-800 dark:text-fjord-100">
        {formatNOK(data.value, locale)} kr
      </p>
    </div>
  );
}

export function SpendTrendCard({ data, loading = false, className }: SpendTrendCardProps) {
  const locale = useLocale();
  const t = useTranslations("Analytics");

  if (loading || !data) {
    return <StatCard title={t("spendTrend.title")} value="" loading={true} className={className} />;
  }

  const hasData = data.trends.length > 0;
  const latestSpend = hasData ? data.trends[data.trends.length - 1].total_spent : 0;
  const trend = calculateTrend(data.trends);

  // Determine variant: success if trending down (saving money), default otherwise
  const variant = trend?.direction === "down" ? "success" : "default";

  // Choose icon based on trend
  const icon =
    trend?.direction === "down" ? (
      <TrendingDown className="h-6 w-6" />
    ) : trend?.direction === "up" ? (
      <TrendingUp className="h-6 w-6" />
    ) : (
      <TrendingUp className="h-6 w-6" />
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
          {/* Area Chart - hidden on mobile */}
          <div className="hidden h-40 md:block">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data.trends.map((point) => ({
                  ...point,
                  label: formatPeriodLabel(point.period, data.granularity, locale),
                }))}
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#A9C7D5" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#A9C7D5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#6B7280" }}
                  dy={8}
                />
                <Tooltip
                  content={<CustomTooltip locale={locale} />}
                  cursor={{
                    stroke: "#538FAB",
                    strokeWidth: 1,
                    strokeDasharray: "4 4",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total_spent"
                  stroke="#538FAB"
                  strokeWidth={2}
                  fill="url(#spendGradient)"
                  dot={{
                    r: 4,
                    fill: "#2D4A5E",
                    stroke: "#FFFFFF",
                    strokeWidth: 2,
                  }}
                  activeDot={{
                    r: 6,
                    fill: "#2D4A5E",
                    stroke: "#FFFFFF",
                    strokeWidth: 2,
                  }}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <h4 className="text-sm font-medium text-fjord-600 dark:text-fjord-300">
            {t("spendTrend.periodBreakdown")}
          </h4>

          {/* Period breakdown list */}
          <ul className="max-h-48 space-y-2 overflow-y-auto">
            {[...data.trends].reverse().map((point, index) => {
              const isLatest = index === 0;
              return (
                <li
                  key={point.period}
                  className={cn(
                    "flex items-center justify-between py-2",
                    "border-b border-fjord-100/50 last:border-b-0 dark:border-fjord-700/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
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
                        {formatPeriodLabel(point.period, data.granularity, locale)}
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
            <div className="border-t border-fjord-100 pt-3 dark:border-fjord-700/50">
              <div className="flex items-center gap-2 text-sm">
                {trend.direction === "down" ? (
                  <>
                    <span className="flex items-center gap-1 text-forest-600 dark:text-forest-400">
                      <TrendingDown className="h-4 w-4" />
                      {t("spendTrend.savingMoney")}
                    </span>
                    <span className="text-fjord-500 dark:text-fjord-400">
                      ({trend.percentage.toFixed(1)}% {t("spendTrend.less")})
                    </span>
                  </>
                ) : trend.direction === "up" ? (
                  <>
                    <span className="flex items-center gap-1 text-amber-dark dark:text-amber-warm">
                      <TrendingUp className="h-4 w-4" />
                      {t("spendTrend.spendingMore")}
                    </span>
                    <span className="text-fjord-500 dark:text-fjord-400">
                      ({trend.percentage.toFixed(1)}% {t("spendTrend.more")})
                    </span>
                  </>
                ) : (
                  <span className="flex items-center gap-1 text-fjord-500 dark:text-fjord-400">
                    <Minus className="h-4 w-4" />
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
