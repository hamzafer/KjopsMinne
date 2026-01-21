"use client";

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from "recharts";
import { ShoppingCart } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { StatCard } from "./StatCard";
import { formatNOK, type TopItemsResponse } from "@/lib/api";
import { cn } from "@/lib/utils";

interface TopItemsCardProps {
  data: TopItemsResponse | null;
  loading?: boolean;
  className?: string;
  onSortChange?: (sortBy: "spend" | "count") => void;
}

// Truncate long item names
function truncateName(name: string, maxLength: number = 20): string {
  if (name.length <= maxLength) return name;
  return name.substring(0, maxLength - 1) + "…";
}

// Custom bar shape with rounded corners
function RoundedBar(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
}) {
  const { x = 0, y = 0, width = 0, height = 0, fill } = props;
  const radius = 4;

  if (width <= 0) return null;

  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fill}
      rx={radius}
      ry={radius}
    />
  );
}

// Custom tooltip
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: { name: string; value: number; count: number; unit: string | null } }>;
  locale: string;
  sortBy: "spend" | "count";
}

function CustomTooltip({ active, payload, locale, sortBy }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  return (
    <div className="bg-paper dark:bg-fjord-800 rounded-lg shadow-paper-hover px-3 py-2 border border-fjord-100 dark:border-fjord-700">
      <p className="text-sm font-medium text-fjord-800 dark:text-fjord-100 mb-1">
        {data.name}
      </p>
      <p className="text-xs text-fjord-500 dark:text-fjord-400">
        {sortBy === "spend"
          ? `${formatNOK(data.value, locale)} kr`
          : `${data.count}x purchased`}
      </p>
    </div>
  );
}

export function TopItemsCard({
  data,
  loading = false,
  className,
  onSortChange,
}: TopItemsCardProps) {
  const locale = useLocale();
  const t = useTranslations("Analytics");
  const [sortBy, setSortBy] = useState<"spend" | "count">(data?.sort_by || "spend");

  const handleSortChange = (newSortBy: "spend" | "count") => {
    setSortBy(newSortBy);
    onSortChange?.(newSortBy);
  };

  if (loading || !data) {
    return (
      <StatCard
        title={t("topItems.title")}
        value=""
        loading={true}
        className={className}
      />
    );
  }

  const hasData = data.items.length > 0;

  // Transform data for chart (convert Decimal strings to numbers)
  const chartData = data.items.slice(0, 10).map((item, index) => ({
    name: truncateName(item.item_name),
    fullName: item.item_name,
    value: sortBy === "spend" ? Number(item.total_spent) : item.purchase_count,
    count: item.purchase_count,
    spent: Number(item.total_spent),
    unit: item.unit,
    rank: index + 1,
  }));

  const maxValue = Math.max(...chartData.map((d) => d.value), 1);

  return (
    <StatCard
      title={t("topItems.title")}
      value={hasData ? `${data.items.length} ${t("items")}` : "-"}
      subtitle={hasData ? t("topItems.subtitle") : t("noDataToShow")}
      icon={<ShoppingCart className="w-6 h-6" />}
      expandable={hasData}
      className={className}
    >
      {hasData && (
        <div className="space-y-4">
          {/* Sort toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => handleSortChange("spend")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-full transition-colors",
                sortBy === "spend"
                  ? "bg-fjord-800 dark:bg-fjord-100 text-white dark:text-fjord-900"
                  : "bg-fjord-100 dark:bg-fjord-700 text-fjord-600 dark:text-fjord-300 hover:bg-fjord-200 dark:hover:bg-fjord-600"
              )}
            >
              {t("topItems.bySpend")}
            </button>
            <button
              onClick={() => handleSortChange("count")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-full transition-colors",
                sortBy === "count"
                  ? "bg-fjord-800 dark:bg-fjord-100 text-white dark:text-fjord-900"
                  : "bg-fjord-100 dark:bg-fjord-700 text-fjord-600 dark:text-fjord-300 hover:bg-fjord-200 dark:hover:bg-fjord-600"
              )}
            >
              {t("topItems.byFrequency")}
            </button>
          </div>

          {/* Bar Chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#538FAB" />
                    <stop offset="100%" stopColor="#2D4A5E" />
                  </linearGradient>
                </defs>
                <XAxis type="number" hide domain={[0, maxValue]} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={{ fontSize: 11, fill: "#6B7280" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={<CustomTooltip locale={locale} sortBy={sortBy} />}
                  cursor={{ fill: "rgba(45, 74, 94, 0.05)" }}
                />
                <Bar
                  dataKey="value"
                  shape={<RoundedBar />}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {chartData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill="url(#barGradient)"
                      style={{
                        animationDelay: `${index * 50}ms`,
                      }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Detailed list */}
          <div className="pt-3 border-t border-fjord-100 dark:border-fjord-700/50">
            <h4 className="text-sm font-medium text-fjord-600 dark:text-fjord-300 mb-2">
              {t("detailedOverview")}
            </h4>
            <ul className="space-y-1.5 max-h-36 overflow-y-auto">
              {data.items.map((item, index) => (
                <li
                  key={item.item_name}
                  className="flex items-center justify-between py-1 text-sm"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-fjord-100 dark:bg-fjord-700 text-fjord-600 dark:text-fjord-300 text-xs flex items-center justify-center font-medium">
                      {index + 1}
                    </span>
                    <span className="text-fjord-700 dark:text-fjord-200 truncate">
                      {item.item_name}
                    </span>
                    <span className="text-fjord-400 dark:text-fjord-500 text-xs flex-shrink-0">
                      ({item.purchase_count}x)
                    </span>
                  </div>
                  <span className="text-fjord-800 dark:text-fjord-100 font-medium tabular-nums ml-2 flex-shrink-0">
                    {formatNOK(item.total_spent, locale)} kr
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
