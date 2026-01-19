"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  BarChart3,
  TrendingUp,
  Receipt,
  ShoppingCart,
  PieChart
} from "lucide-react";
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from "recharts";
import { api, formatNOK, type Summary, type ByCategory } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ThemeProvider";

export default function AnalyticsPage() {
  const t = useTranslations("Analytics");
  const tEmpty = useTranslations("EmptyState");
  const locale = useLocale();
  const { resolvedTheme } = useTheme();

  const [summary, setSummary] = useState<Summary | null>(null);
  const [byCategory, setByCategory] = useState<ByCategory | null>(null);
  const [loading, setLoading] = useState(true);

  // Theme-aware chart colors
  const chartColors = {
    axisText: resolvedTheme === "dark" ? "#e2e8f0" : "#374151",
    axisTextMuted: resolvedTheme === "dark" ? "#94a3b8" : "#6B7280",
    legendText: resolvedTheme === "dark" ? "#cbd5e1" : "#4B5563",
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [summaryData, categoryData] = await Promise.all([
          api.getSummary(),
          api.getByCategory(),
        ]);
        setSummary(summaryData);
        setByCategory(categoryData);
      } catch (error) {
        console.error("Failed to load analytics:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <AnalyticsSkeleton />;
  }

  const hasData = summary && summary.total_receipts > 0;

  // Parse summary values (API returns strings for decimal fields)
  const totalSpent = parseFloat(String(summary?.total_spent)) || 0;
  const avgReceiptAmount = parseFloat(String(summary?.avg_receipt_amount)) || 0;

  // Prepare chart data - parse string values to numbers for charts
  const pieData = byCategory?.categories.map((cat) => ({
    name: cat.category_name,
    value: parseFloat(String(cat.total_spent)) || 0,
    color: cat.category_color || "#6B7280",
    count: cat.item_count,
  })) || [];

  const uncategorizedTotal = parseFloat(String(byCategory?.uncategorized_total)) || 0;
  if (byCategory && uncategorizedTotal > 0) {
    pieData.push({
      name: t("uncategorized"),
      value: uncategorizedTotal,
      color: "#9CA3AF",
      count: byCategory.uncategorized_count,
    });
  }

  // Sort by value for bar chart
  const barData = [...pieData].sort((a, b) => b.value - a.value);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-display text-fjord-800 mb-2">
          {t("title")}
        </h1>
        <p className="text-stone">
          {t("subtitle")}
        </p>
      </div>

      {hasData ? (
        <>
          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <StatCard
              icon={Receipt}
              label={t("receipts")}
              value={summary.total_receipts.toString()}
              delay={1}
            />
            <StatCard
              icon={TrendingUp}
              label={t("totalSpending")}
              value={`${formatNOK(totalSpent, locale)} kr`}
              delay={2}
            />
            <StatCard
              icon={ShoppingCart}
              label={t("itemsPurchased")}
              value={summary.total_items.toString()}
              delay={3}
            />
            <StatCard
              icon={BarChart3}
              label={t("average")}
              value={`${formatNOK(avgReceiptAmount, locale)} kr`}
              delay={4}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div className="paper-card p-6 animate-slide-up stagger-5">
              <h2 className="text-lg font-display text-fjord-700 mb-6 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-stone" />
                {t("spendingByCategory")}
              </h2>

              {pieData.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip locale={locale} itemsLabel={t("items")} />} />
                      <Legend
                        formatter={(value) => (
                          <span className="text-sm" style={{ color: chartColors.legendText }}>{value}</span>
                        )}
                      />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyChart label={t("noDataToShow")} />
              )}
            </div>

            {/* Bar Chart */}
            <div className="paper-card p-6 animate-slide-up stagger-6">
              <h2 className="text-lg font-display text-fjord-700 mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-stone" />
                {t("spendingRanked")}
              </h2>

              {barData.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={barData.slice(0, 8)}
                      layout="vertical"
                      margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                    >
                      <XAxis
                        type="number"
                        tickFormatter={(v) => `${v.toFixed(0)}`}
                        tick={{ fill: chartColors.axisTextMuted, fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={100}
                        tick={{ fill: chartColors.axisText, fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltip locale={locale} itemsLabel={t("items")} />} />
                      <Bar
                        dataKey="value"
                        radius={[0, 6, 6, 0]}
                      >
                        {barData.slice(0, 8).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyChart label={t("noDataToShow")} />
              )}
            </div>
          </div>

          {/* Category Breakdown Table */}
          <div className="paper-card p-6 mt-6 animate-slide-up stagger-7">
            <h2 className="text-lg font-display text-fjord-700 mb-6">
              {t("detailedOverview")}
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-fjord-100">
                    <th className="text-left text-xs font-medium text-stone uppercase tracking-wider pb-3">
                      {t("category")}
                    </th>
                    <th className="text-right text-xs font-medium text-stone uppercase tracking-wider pb-3">
                      {t("items")}
                    </th>
                    <th className="text-right text-xs font-medium text-stone uppercase tracking-wider pb-3">
                      {t("amount")}
                    </th>
                    <th className="text-right text-xs font-medium text-stone uppercase tracking-wider pb-3">
                      {t("share")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-fjord-50">
                  {pieData.map((cat) => {
                    const percentage = totalSpent > 0
                      ? (cat.value / totalSpent) * 100
                      : 0;

                    return (
                      <tr key={cat.name} className="group">
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: cat.color }}
                            />
                            <span className="text-fjord-700 group-hover:text-fjord-800">
                              {cat.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 text-right text-stone tabular-nums">
                          {cat.count}
                        </td>
                        <td className="py-3 text-right font-medium text-fjord-700 tabular-nums">
                          {formatNOK(cat.value, locale)} kr
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-2 bg-fjord-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${percentage}%`,
                                  backgroundColor: cat.color,
                                }}
                              />
                            </div>
                            <span className="text-sm text-stone tabular-nums w-12">
                              {percentage.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <EmptyState tEmpty={tEmpty} />
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  delay: number;
}) {
  return (
    <div className={cn("paper-card p-5 animate-slide-up", `stagger-${delay}`)}>
      <div className="flex items-center gap-3 mb-2">
        <Icon className="w-5 h-5 text-stone" />
        <span className="text-sm text-stone">{label}</span>
      </div>
      <p className="text-xl font-display text-fjord-800 tabular-nums">{value}</p>
    </div>
  );
}

function CustomTooltip({
  active,
  payload,
  locale,
  itemsLabel,
}: {
  active?: boolean;
  payload?: Array<{ payload: { name: string; value: number; count: number } }>;
  locale: string;
  itemsLabel: string;
}) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <p className="font-medium mb-1">{data.name}</p>
      <p className="text-sm opacity-90">{formatNOK(data.value, locale)} kr</p>
      <p className="text-xs opacity-75">{data.count} {itemsLabel}</p>
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="h-80 flex items-center justify-center">
      <p className="text-stone">{label}</p>
    </div>
  );
}

function EmptyState({ tEmpty }: { tEmpty: ReturnType<typeof useTranslations<"EmptyState">> }) {
  return (
    <div className="paper-card p-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-fjord-50 flex items-center justify-center mx-auto mb-4">
        <BarChart3 className="w-8 h-8 text-fjord-300" />
      </div>
      <h3 className="font-display text-xl text-fjord-700 mb-2">
        {tEmpty("noData")}
      </h3>
      <p className="text-stone">
        {tEmpty("noDataMessage")}
      </p>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-8">
        <div className="skeleton h-10 w-56 mb-2" />
        <div className="skeleton h-5 w-80" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="paper-card p-5">
            <div className="skeleton h-5 w-24 mb-2" />
            <div className="skeleton h-7 w-20" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="paper-card p-6">
          <div className="skeleton h-6 w-40 mb-6" />
          <div className="skeleton h-80 w-full rounded-xl" />
        </div>
        <div className="paper-card p-6">
          <div className="skeleton h-6 w-40 mb-6" />
          <div className="skeleton h-80 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
