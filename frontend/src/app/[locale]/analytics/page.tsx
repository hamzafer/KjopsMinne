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
} from "@/lib/api";
import {
  CostPerMealCard,
  WasteCard,
  SpendTrendCard,
  RestockCard,
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
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
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
        const [cost, waste, trend, restock] = await Promise.all([
          api.getCostPerMeal(DEMO_HOUSEHOLD_ID, startStr, endStr).catch(() => null),
          api.getWasteAnalytics(DEMO_HOUSEHOLD_ID, startStr, endStr).catch(() => null),
          api.getSpendTrend(DEMO_HOUSEHOLD_ID, startStr, endStr, "weekly").catch(() => null),
          api.getRestockPredictions(DEMO_HOUSEHOLD_ID).catch(() => null),
        ]);

        setCostData(cost);
        setWasteData(waste);
        setTrendData(trend);
        setRestockData(restock);
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]);

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

        {/* Dashboard grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="animate-slide-up stagger-1">
            <CostPerMealCard data={costData} loading={loading} />
          </div>
          <div className="animate-slide-up stagger-2">
            <WasteCard data={wasteData} loading={loading} />
          </div>
          <div className="animate-slide-up stagger-3">
            <SpendTrendCard data={trendData} loading={loading} />
          </div>
          <div className="animate-slide-up stagger-4">
            <RestockCard data={restockData} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  );
}
