"use client";

import { Store } from "lucide-react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useLocale, useTranslations } from "next-intl";
import { StatCard } from "./StatCard";
import { formatNOK, type ByStoreResponse } from "@/lib/api";

interface StoreCardProps {
  data: ByStoreResponse | null;
  loading?: boolean;
  className?: string;
}

// Norwegian store brand colors
const storeColors: Record<string, string> = {
  REMA: "#F7941D",
  "REMA 1000": "#F7941D",
  KIWI: "#8CC63F",
  MENY: "#E31E24",
  COOP: "#00A651",
  "COOP EXTRA": "#00A651",
  "COOP PRIX": "#00A651",
  "COOP OBS": "#00A651",
  "COOP MEGA": "#00A651",
  JOKER: "#FFD700",
  BUNNPRIS: "#0066B3",
  SPAR: "#E31E24",
  EUROPRIS: "#0066B3",
  NORMAL: "#FF69B4",
};

function getStoreColor(storeName: string): string {
  const normalized = storeName.toUpperCase().trim();

  // Check exact match first
  if (storeColors[normalized]) {
    return storeColors[normalized];
  }

  // Check if store name contains any known brand
  for (const [brand, color] of Object.entries(storeColors)) {
    if (normalized.includes(brand)) {
      return color;
    }
  }

  // Default fjord color
  return "#538FAB";
}

// Custom tooltip
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: { store_name: string; total_spent: number; receipt_count: number; avg_receipt: number } }>;
  locale: string;
  t: ReturnType<typeof useTranslations>;
}

function CustomTooltip({ active, payload, locale, t }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  return (
    <div className="bg-paper dark:bg-fjord-800 rounded-lg shadow-paper-hover px-3 py-2 border border-fjord-100 dark:border-fjord-700">
      <p className="text-sm font-medium text-fjord-800 dark:text-fjord-100 mb-1">
        {data.store_name}
      </p>
      <div className="space-y-0.5 text-xs text-fjord-500 dark:text-fjord-400">
        <p>{formatNOK(data.total_spent, locale)} kr</p>
        <p>{data.receipt_count} {t("visits")}</p>
        <p>{t("avgReceipt")}: {formatNOK(data.avg_receipt, locale)} kr</p>
      </div>
    </div>
  );
}

// Format date for last visit
function formatLastVisit(dateStr: string | null, locale: string): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString(locale === "nb" ? "nb-NO" : "en-US", {
    month: "short",
    day: "numeric",
  });
}

export function StoreCard({
  data,
  loading = false,
  className,
}: StoreCardProps) {
  const locale = useLocale();
  const t = useTranslations("Analytics.byStore");

  if (loading || !data) {
    return (
      <StatCard
        title={t("title")}
        value=""
        loading={true}
        className={className}
      />
    );
  }

  const hasData = data.stores.length > 0;

  // Transform data for chart
  const chartData = data.stores.slice(0, 8).map((store) => ({
    store_name: store.store_name,
    total_spent: Number(store.total_spent),
    receipt_count: store.receipt_count,
    avg_receipt: Number(store.avg_receipt),
    last_visit: store.last_visit,
    color: getStoreColor(store.store_name),
  }));

  return (
    <StatCard
      title={t("title")}
      value={hasData ? `${data.stores.length} ${data.stores.length === 1 ? "butikk" : "butikker"}` : "-"}
      subtitle={hasData ? t("subtitle") : undefined}
      icon={<Store className="w-6 h-6" />}
      expandable={hasData}
      className={className}
    >
      {hasData && (
        <div className="space-y-4">
          {/* Bar Chart */}
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 0, left: 0, bottom: 20 }}
              >
                <XAxis
                  dataKey="store_name"
                  tick={{ fontSize: 10, fill: "#6B7280" }}
                  tickLine={false}
                  axisLine={false}
                  angle={-30}
                  textAnchor="end"
                  height={50}
                  interval={0}
                />
                <Tooltip
                  content={<CustomTooltip locale={locale} t={t} />}
                  cursor={{ fill: "rgba(45, 74, 94, 0.05)" }}
                />
                <Bar
                  dataKey="total_spent"
                  radius={[4, 4, 0, 0]}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      style={{
                        animationDelay: `${index * 80}ms`,
                      }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Detailed table */}
          <div className="pt-3 border-t border-fjord-100 dark:border-fjord-700/50">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-fjord-500 dark:text-fjord-400 text-xs">
                    <th className="text-left font-medium pb-2">Butikk</th>
                    <th className="text-right font-medium pb-2">{t("visits")}</th>
                    <th className="text-right font-medium pb-2">Total</th>
                    <th className="text-right font-medium pb-2 hidden sm:table-cell">Snitt</th>
                    <th className="text-right font-medium pb-2 hidden sm:table-cell">{t("lastVisit")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-fjord-50 dark:divide-fjord-700/30">
                  {data.stores.map((store) => (
                    <tr key={store.store_name}>
                      <td className="py-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: getStoreColor(store.store_name) }}
                          />
                          <span className="text-fjord-700 dark:text-fjord-200 truncate max-w-[120px]">
                            {store.store_name}
                          </span>
                        </div>
                      </td>
                      <td className="py-1.5 text-right text-fjord-600 dark:text-fjord-300">
                        {store.receipt_count}
                      </td>
                      <td className="py-1.5 text-right text-fjord-800 dark:text-fjord-100 font-medium tabular-nums">
                        {formatNOK(store.total_spent, locale)} kr
                      </td>
                      <td className="py-1.5 text-right text-fjord-500 dark:text-fjord-400 tabular-nums hidden sm:table-cell">
                        {formatNOK(store.avg_receipt, locale)} kr
                      </td>
                      <td className="py-1.5 text-right text-fjord-400 dark:text-fjord-500 hidden sm:table-cell">
                        {formatLastVisit(store.last_visit, locale)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </StatCard>
  );
}
