"use client";

import { PieChartIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useCallback } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from "recharts";

import { formatNOK, type ByCategory } from "@/lib/api";
import { cn } from "@/lib/utils";

import { StatCard } from "./StatCard";

// Category icons mapping
const categoryIcons: Record<string, string> = {
  Meieri: "🥛",
  Kjøtt: "🥩",
  Fisk: "🐟",
  Brød: "🍞",
  Frukt: "🍎",
  Grønnsaker: "🥬",
  Drikke: "🥤",
  Tørrvarer: "🌾",
  Frossen: "❄️",
  Husholdning: "🧹",
  Snacks: "🍿",
  Pant: "♻️",
};

// Fallback colors using fjord palette
const fallbackColors = [
  "#538FAB", // fjord-400
  "#7EABC0", // fjord-300
  "#A9C7D5", // fjord-200
  "#4B835F", // forest-400
  "#78A287", // forest-300
  "#C4956A", // amber-warm
  "#2D4A5E", // fjord-500
  "#3D5A47", // forest-500
];

interface CategoryCardProps {
  data: ByCategory | null;
  loading?: boolean;
  className?: string;
}

interface ChartDataItem {
  name: string;
  value: number;
  color: string;
  icon: string;
  itemCount: number;
}

// Custom active shape for hover effect (props type from recharts PieSectorDataItem)
const renderActiveShape = (props: unknown) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props as {
    cx: number;
    cy: number;
    innerRadius: number;
    outerRadius: number;
    startAngle: number;
    endAngle: number;
    fill: string;
  };

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{
          filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.15))",
          transition: "all 0.2s ease-out",
        }}
      />
    </g>
  );
};

export function CategoryCard({ data, loading = false, className }: CategoryCardProps) {
  const locale = useLocale();
  const t = useTranslations("Analytics");
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  const onPieEnter = useCallback((_: unknown, index: number) => {
    setActiveIndex(index);
  }, []);

  const onPieLeave = useCallback(() => {
    setActiveIndex(undefined);
  }, []);

  if (loading || !data) {
    return (
      <StatCard title={t("spendingByCategory")} value="" loading={true} className={className} />
    );
  }

  // Transform data for chart (convert Decimal strings to numbers)
  const chartData: ChartDataItem[] = data.categories
    .filter((cat) => Number(cat.total_spent) > 0)
    .sort((a, b) => Number(b.total_spent) - Number(a.total_spent))
    .map((cat, index) => ({
      name: cat.category_name,
      value: Number(cat.total_spent),
      color: cat.category_color || fallbackColors[index % fallbackColors.length],
      icon: categoryIcons[cat.category_name] || "📦",
      itemCount: cat.item_count,
    }));

  // Add uncategorized if present
  if (Number(data.uncategorized_total) > 0) {
    chartData.push({
      name: t("uncategorized"),
      value: Number(data.uncategorized_total),
      color: "#9CA3AF", // stone
      icon: "📦",
      itemCount: data.uncategorized_count,
    });
  }

  const totalSpent = chartData.reduce((sum, item) => sum + item.value, 0);
  const hasData = chartData.length > 0;

  // Top 5 for legend, rest aggregated as "Other"
  const displayData = chartData.slice(0, 5);
  const otherData = chartData.slice(5);
  if (otherData.length > 0) {
    const otherTotal = otherData.reduce((sum, item) => sum + item.value, 0);
    const otherCount = otherData.reduce((sum, item) => sum + item.itemCount, 0);
    displayData.push({
      name: t("uncategorized"),
      value: otherTotal,
      color: "#6B7280", // stone-dark
      icon: "📊",
      itemCount: otherCount,
    });
  }

  return (
    <StatCard
      title={t("spendingByCategory")}
      value={hasData ? `${formatNOK(totalSpent, locale)} kr` : "-"}
      subtitle={hasData ? t("spendingRanked") : t("noDataToShow")}
      icon={<PieChartIcon className="h-6 w-6" />}
      expandable={hasData}
      className={className}
    >
      {hasData && (
        <div className="space-y-4">
          {/* Donut Chart */}
          <div className="relative h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  {displayData.map((entry, index) => (
                    <linearGradient
                      key={`gradient-${index}`}
                      id={`categoryGradient-${index}`}
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="1"
                    >
                      <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                      <stop offset="100%" stopColor={entry.color} stopOpacity={0.7} />
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={displayData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={2}
                  dataKey="value"
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  onMouseEnter={onPieEnter}
                  onMouseLeave={onPieLeave}
                  animationBegin={0}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {displayData.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={`url(#categoryGradient-${index})`}
                      stroke="transparent"
                      style={{ cursor: "pointer" }}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Center label */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="font-display text-lg font-semibold tabular-nums text-fjord-800 dark:text-fjord-100">
                  {formatNOK(totalSpent, locale)}
                </p>
                <p className="text-xs text-fjord-500 dark:text-fjord-400">kr</p>
              </div>
            </div>
          </div>

          {/* Legend pills */}
          <div className="flex flex-wrap gap-2">
            {displayData.map((item, index) => {
              const percentage = ((item.value / totalSpent) * 100).toFixed(0);
              const isActive = activeIndex === index;

              return (
                <button
                  key={item.name}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                    "transition-all duration-200",
                    isActive
                      ? "bg-fjord-100 ring-2 ring-fjord-300 dark:bg-fjord-700 dark:ring-fjord-500"
                      : "bg-fjord-50 hover:bg-fjord-100 dark:bg-fjord-800/50 dark:hover:bg-fjord-700"
                  )}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(undefined)}
                >
                  <span
                    className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-fjord-700 dark:text-fjord-200">
                    {item.icon} {item.name}
                  </span>
                  <span className="tabular-nums text-fjord-500 dark:text-fjord-400">
                    {percentage}%
                  </span>
                </button>
              );
            })}
          </div>

          {/* Detailed list */}
          <div className="border-t border-fjord-100 pt-3 dark:border-fjord-700/50">
            <h4 className="mb-2 text-sm font-medium text-fjord-600 dark:text-fjord-300">
              {t("detailedOverview")}
            </h4>
            <ul className="max-h-36 space-y-1.5 overflow-y-auto">
              {chartData.map((item) => (
                <li key={item.name} className="flex items-center justify-between py-1 text-sm">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2 w-2 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="truncate text-fjord-700 dark:text-fjord-200">
                      {item.icon} {item.name}
                    </span>
                    <span className="text-xs text-fjord-400 dark:text-fjord-500">
                      ({item.itemCount} {t("items")})
                    </span>
                  </div>
                  <span className="ml-2 font-medium tabular-nums text-fjord-800 dark:text-fjord-100">
                    {formatNOK(item.value, locale)} kr
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </StatCard>
  );
}
