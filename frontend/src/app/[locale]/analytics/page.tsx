"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  api,
  type CostPerMealResponse,
  type WasteResponse,
  type SpendTrendResponse,
  type RestockPredictionsResponse,
  type ByCategory,
  type Summary,
  type TopItemsResponse,
  type ByStoreResponse,
} from "@/lib/api";
import {
  CostPerMealCard,
  WasteCard,
  SpendTrendCard,
  RestockCard,
  CategoryCard,
  SummaryStats,
  TopItemsCard,
  StoreCard,
} from "@/components/analytics";

// TODO: Get from auth context
const DEMO_HOUSEHOLD_ID = "00000000-0000-0000-0000-000000000001";

type Period = "week" | "month" | "30days";

export default function AnalyticsPage() {
  const t = useTranslations("ExtendedAnalytics");
  const tAnalytics = useTranslations("Analytics");

  const [period, setPeriod] = useState<Period>("month");
  const [loading, setLoading] = useState(true);

  const [costData, setCostData] = useState<CostPerMealResponse | null>(null);
  const [wasteData, setWasteData] = useState<WasteResponse | null>(null);
  const [trendData, setTrendData] = useState<SpendTrendResponse | null>(null);
  const [restockData, setRestockData] = useState<RestockPredictionsResponse | null>(null);
  const [categoryData, setCategoryData] = useState<ByCategory | null>(null);
  const [summaryData, setSummaryData] = useState<Summary | null>(null);
  const [topItemsData, setTopItemsData] = useState<TopItemsResponse | null>(null);
  const [storeData, setStoreData] = useState<ByStoreResponse | null>(null);
  const [topItemsSortBy, setTopItemsSortBy] = useState<"spend" | "count">("spend");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const now = new Date();
      let startDate: Date;
      const endDate = now;

      switch (period) {
        case "week":
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          break;
        case "month":
          // Start of current month (e.g., Jan 1 for January)
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "30days":
        default:
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 30);
          break;
      }

      const startStr = startDate.toISOString().split("T")[0];
      const endStr = endDate.toISOString().split("T")[0];

      try {
        const [cost, waste, trend, restock, category, summary, topItems, stores] = await Promise.all([
          api.getCostPerMeal(DEMO_HOUSEHOLD_ID, startStr, endStr).catch(() => null),
          api.getWasteAnalytics(DEMO_HOUSEHOLD_ID, startStr, endStr).catch(() => null),
          api.getSpendTrend(DEMO_HOUSEHOLD_ID, startStr, endStr, "weekly").catch(() => null),
          api.getRestockPredictions(DEMO_HOUSEHOLD_ID).catch(() => null),
          api.getByCategory(startStr, endStr).catch(() => null),
          api.getSummary(startStr, endStr).catch(() => null),
          api.getTopItems(startStr, endStr, topItemsSortBy).catch(() => null),
          api.getByStore(startStr, endStr).catch(() => null),
        ]);

        setCostData(cost);
        setWasteData(waste);
        setTrendData(trend);
        setRestockData(restock);
        setCategoryData(category);
        setSummaryData(summary);
        setTopItemsData(topItems);
        setStoreData(stores);
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period, topItemsSortBy]);

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8 animate-fade-in">
          <h1 className="font-display text-3xl font-bold text-fjord-800 dark:text-fjord-100">
            {tAnalytics("title")}
          </h1>
          <p className="text-stone dark:text-fjord-400 mt-1">
            {tAnalytics("subtitle")}
          </p>

          {/* Period selector */}
          <div className="flex gap-2 mt-4">
            {(["week", "month", "30days"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                  period === p
                    ? "bg-fjord-800 dark:bg-fjord-100 text-white dark:text-fjord-900"
                    : "bg-fjord-100 dark:bg-fjord-700 text-fjord-600 dark:text-fjord-300 hover:bg-fjord-200 dark:hover:bg-fjord-600"
                )}
              >
                {p === "week" && t("thisWeek")}
                {p === "month" && t("thisMonth")}
                {p === "30days" && t("last30Days")}
              </button>
            ))}
          </div>
        </header>

        {/* Summary Stats Hero */}
        <div className="mb-6 animate-fade-in">
          <SummaryStats data={summaryData} loading={loading} />
        </div>

        {/* Dashboard grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="animate-slide-up stagger-1">
            <CategoryCard data={categoryData} loading={loading} />
          </div>
          <div className="animate-slide-up stagger-2">
            <TopItemsCard
              data={topItemsData}
              loading={loading}
              onSortChange={setTopItemsSortBy}
            />
          </div>
          <div className="animate-slide-up stagger-3">
            <SpendTrendCard data={trendData} loading={loading} />
          </div>
          <div className="animate-slide-up stagger-4">
            <CostPerMealCard data={costData} loading={loading} />
          </div>
          <div className="animate-slide-up stagger-5">
            <WasteCard data={wasteData} loading={loading} />
          </div>
          <div className="animate-slide-up stagger-6">
            <RestockCard data={restockData} loading={loading} />
          </div>
          <div className="animate-slide-up stagger-7 md:col-span-2">
            <StoreCard data={storeData} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  );
}
