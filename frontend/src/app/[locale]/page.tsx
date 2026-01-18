"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import {
  Receipt,
  TrendingUp,
  ShoppingCart,
  ArrowRight,
  Upload,
  Sparkles
} from "lucide-react";
import { api, formatNOK, formatRelativeDate, type Summary, type ReceiptListItem } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const t = useTranslations("Dashboard");
  const tEmpty = useTranslations("EmptyState");
  const tCommon = useTranslations("Common");
  const locale = useLocale();

  const [summary, setSummary] = useState<Summary | null>(null);
  const [recentReceipts, setRecentReceipts] = useState<ReceiptListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [summaryData, receiptsData] = await Promise.all([
          api.getSummary(),
          api.getReceipts(0, 5),
        ]);
        setSummary(summaryData);
        setRecentReceipts(receiptsData);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  const hasData = summary && summary.total_receipts > 0;

  // Create relative date formatter with translations
  const relativeTranslations = {
    today: tCommon("today"),
    yesterday: tCommon("yesterday"),
    daysAgo: (days: number) => tCommon("daysAgo", { days }),
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-10 animate-fade-in">
        <h1 className="text-3xl md:text-4xl font-display text-fjord-800 mb-2">
          {t("greeting")}
        </h1>
        <p className="text-stone text-lg">
          {t("subtitle")}
        </p>
      </div>

      {hasData ? (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
            <StatCard
              icon={Receipt}
              label={t("receipts")}
              value={summary.total_receipts.toString()}
              subtitle={t("totalStored")}
              color="fjord"
              delay={1}
            />
            <StatCard
              icon={TrendingUp}
              label={t("totalSpending")}
              value={formatNOK(summary.total_spent, locale)}
              subtitle={t("currency")}
              color="forest"
              delay={2}
            />
            <StatCard
              icon={ShoppingCart}
              label={t("average")}
              value={formatNOK(summary.avg_receipt_amount, locale)}
              subtitle={t("perPurchase")}
              color="amber"
              delay={3}
            />
          </div>

          {/* Recent Receipts */}
          <section className="animate-slide-up stagger-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-display text-fjord-700">
                {t("recentReceipts")}
              </h2>
              <Link
                href={`/${locale}/receipts`}
                className="flex items-center gap-1.5 text-sm text-fjord-500 hover:text-fjord-700 transition-colors"
              >
                {t("viewAll")}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-3">
              {recentReceipts.map((receipt, index) => (
                <ReceiptRow
                  key={receipt.id}
                  receipt={receipt}
                  index={index}
                  locale={locale}
                  itemsLabel={t("items")}
                  relativeTranslations={relativeTranslations}
                />
              ))}
            </div>
          </section>
        </>
      ) : (
        <EmptyState locale={locale} tEmpty={tEmpty} />
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  color,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  subtitle: string;
  color: "fjord" | "forest" | "amber";
  delay: number;
}) {
  const colors = {
    fjord: {
      bg: "bg-fjord-50",
      icon: "text-fjord-500",
      border: "border-fjord-100",
    },
    forest: {
      bg: "bg-forest-50",
      icon: "text-forest-500",
      border: "border-forest-100",
    },
    amber: {
      bg: "bg-amber-light/30",
      icon: "text-amber-dark",
      border: "border-amber-light",
    },
  };

  const c = colors[color];

  return (
    <div
      className={cn(
        "paper-card p-6 animate-slide-up",
        `stagger-${delay}`
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", c.bg)}>
          <Icon className={cn("w-5 h-5", c.icon)} />
        </div>
      </div>
      <p className="text-sm text-stone mb-1">{label}</p>
      <p className="text-2xl font-display text-fjord-800 tabular-nums">
        {value}
        <span className="text-sm font-body text-stone ml-1.5">{subtitle}</span>
      </p>
    </div>
  );
}

function ReceiptRow({
  receipt,
  index,
  locale,
  itemsLabel,
  relativeTranslations,
}: {
  receipt: ReceiptListItem;
  index: number;
  locale: string;
  itemsLabel: string;
  relativeTranslations: {
    today: string;
    yesterday: string;
    daysAgo: (days: number) => string;
  };
}) {
  return (
    <Link
      href={`/${locale}/receipts/${receipt.id}`}
      className={cn(
        "paper-card flex items-center justify-between p-4 group animate-slide-up",
        `stagger-${index + 5}`
      )}
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-fjord-50 flex items-center justify-center text-fjord-500 group-hover:bg-fjord-100 transition-colors">
          <Receipt className="w-5 h-5" />
        </div>
        <div>
          <p className="font-medium text-fjord-700 group-hover:text-fjord-800 transition-colors">
            {receipt.merchant_name}
          </p>
          <p className="text-sm text-stone">
            {formatRelativeDate(receipt.purchase_date, relativeTranslations, locale)} · {receipt.item_count} {itemsLabel}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-display text-lg text-fjord-800 tabular-nums">
          {formatNOK(receipt.total_amount, locale)}
          <span className="text-xs text-stone ml-1">kr</span>
        </p>
      </div>
    </Link>
  );
}

function EmptyState({
  locale,
  tEmpty,
}: {
  locale: string;
  tEmpty: ReturnType<typeof useTranslations<"EmptyState">>;
}) {
  return (
    <div className="paper-card p-12 text-center animate-scale-in">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-fjord-100 to-fjord-50 flex items-center justify-center mx-auto mb-6">
        <Sparkles className="w-10 h-10 text-fjord-400" />
      </div>
      <h2 className="text-2xl font-display text-fjord-700 mb-3">
        {tEmpty("welcome")}
      </h2>
      <p className="text-stone max-w-md mx-auto mb-8">
        {tEmpty("welcomeMessage")}
      </p>
      <Link href={`/${locale}/upload`} className="btn-primary">
        <Upload className="w-4 h-4" />
        {tEmpty("uploadReceipt")}
      </Link>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-10">
        <div className="skeleton h-10 w-48 mb-2" />
        <div className="skeleton h-6 w-80" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        {[1, 2, 3].map((i) => (
          <div key={i} className="paper-card p-6">
            <div className="skeleton w-11 h-11 rounded-xl mb-4" />
            <div className="skeleton h-4 w-20 mb-2" />
            <div className="skeleton h-8 w-32" />
          </div>
        ))}
      </div>
      <div className="skeleton h-6 w-40 mb-5" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="paper-card p-4">
            <div className="flex items-center gap-4">
              <div className="skeleton w-10 h-10 rounded-xl" />
              <div>
                <div className="skeleton h-5 w-32 mb-1" />
                <div className="skeleton h-4 w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
