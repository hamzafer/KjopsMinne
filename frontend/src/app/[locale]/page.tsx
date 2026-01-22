"use client";

import { Receipt, TrendingUp, ShoppingCart, ArrowRight, Upload, Sparkles } from "lucide-react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useEffect, useState } from "react";

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
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* Header */}
      <div className="mb-10 animate-fade-in">
        <h1 className="mb-2 font-display text-3xl text-fjord-800 md:text-4xl">{t("greeting")}</h1>
        <p className="text-lg text-stone">{t("subtitle")}</p>
      </div>

      {hasData ? (
        <>
          {/* Stats Grid */}
          <div className="mb-10 grid grid-cols-1 gap-5 md:grid-cols-3">
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
          <section className="stagger-4 animate-slide-up">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-xl text-fjord-700">{t("recentReceipts")}</h2>
              <Link
                href={`/${locale}/receipts`}
                className="flex items-center gap-1.5 text-sm text-fjord-500 transition-colors hover:text-fjord-700"
              >
                {t("viewAll")}
                <ArrowRight className="h-4 w-4" />
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
    <div className={cn("paper-card animate-slide-up p-6", `stagger-${delay}`)}>
      <div className="mb-4 flex items-start justify-between">
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", c.bg)}>
          <Icon className={cn("h-5 w-5", c.icon)} />
        </div>
      </div>
      <p className="mb-1 text-sm text-stone">{label}</p>
      <p className="font-display text-2xl tabular-nums text-fjord-800">
        {value}
        <span className="ml-1.5 font-body text-sm text-stone">{subtitle}</span>
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
        "paper-card group flex animate-slide-up items-center justify-between p-4",
        `stagger-${index + 5}`
      )}
    >
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-fjord-50 text-fjord-500 transition-colors group-hover:bg-fjord-100">
          <Receipt className="h-5 w-5" />
        </div>
        <div>
          <p className="font-medium text-fjord-700 transition-colors group-hover:text-fjord-800">
            {receipt.merchant_name}
          </p>
          <p className="text-sm text-stone">
            {formatRelativeDate(receipt.purchase_date, relativeTranslations, locale)} ·{" "}
            {receipt.item_count} {itemsLabel}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-display text-lg tabular-nums text-fjord-800">
          {formatNOK(receipt.total_amount, locale)}
          <span className="ml-1 text-xs text-stone">kr</span>
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
    <div className="paper-card animate-scale-in p-12 text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-fjord-100 to-fjord-50">
        <Sparkles className="h-10 w-10 text-fjord-400" />
      </div>
      <h2 className="mb-3 font-display text-2xl text-fjord-700">{tEmpty("welcome")}</h2>
      <p className="mx-auto mb-8 max-w-md text-stone">{tEmpty("welcomeMessage")}</p>
      <Link href={`/${locale}/upload`} className="btn-primary">
        <Upload className="h-4 w-4" />
        {tEmpty("uploadReceipt")}
      </Link>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-10">
        <div className="skeleton mb-2 h-10 w-48" />
        <div className="skeleton h-6 w-80" />
      </div>
      <div className="mb-10 grid grid-cols-1 gap-5 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="paper-card p-6">
            <div className="skeleton mb-4 h-11 w-11 rounded-xl" />
            <div className="skeleton mb-2 h-4 w-20" />
            <div className="skeleton h-8 w-32" />
          </div>
        ))}
      </div>
      <div className="skeleton mb-5 h-6 w-40" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="paper-card p-4">
            <div className="flex items-center gap-4">
              <div className="skeleton h-10 w-10 rounded-xl" />
              <div>
                <div className="skeleton mb-1 h-5 w-32" />
                <div className="skeleton h-4 w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
