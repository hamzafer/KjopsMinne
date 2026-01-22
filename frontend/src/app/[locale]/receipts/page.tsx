"use client";

import { Receipt, Search, Calendar, ChevronRight, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useEffect, useState } from "react";

import { api, formatNOK, formatDate, type ReceiptListItem } from "@/lib/api";
import { cn, toNumber } from "@/lib/utils";

export default function ReceiptsPage() {
  const t = useTranslations("Receipts");
  const tEmpty = useTranslations("EmptyState");
  const locale = useLocale();

  const [receipts, setReceipts] = useState<ReceiptListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadReceipts() {
      try {
        const data = await api.getReceipts();
        setReceipts(data);
      } catch (error) {
        console.error("Failed to load receipts:", error);
      } finally {
        setLoading(false);
      }
    }
    loadReceipts();
  }, []);

  // Filter receipts by search
  const filteredReceipts = receipts.filter(
    (r) =>
      r.merchant_name.toLowerCase().includes(search.toLowerCase()) ||
      r.store_location?.toLowerCase().includes(search.toLowerCase())
  );

  // Group by month
  const groupedReceipts = groupByMonth(filteredReceipts, locale);

  if (loading) {
    return <ReceiptsSkeleton />;
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <h1 className="mb-2 font-display text-3xl text-fjord-800">{t("title")}</h1>
        <p className="text-stone">{t("storedInVault", { count: receipts.length })}</p>
      </div>

      {/* Search */}
      <div className="stagger-1 mb-8 animate-slide-up">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-light" />
          <input
            type="search"
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="focus-ring w-full rounded-xl border border-fjord-100 bg-paper py-3 pl-12 pr-4 text-fjord-700 placeholder:text-stone-light"
          />
        </div>
      </div>

      {/* Receipt List */}
      {filteredReceipts.length === 0 ? (
        <EmptyState hasSearch={search.length > 0} locale={locale} tEmpty={tEmpty} />
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedReceipts).map(([month, monthReceipts], groupIndex) => (
            <section key={month} className={cn("animate-slide-up", `stagger-${groupIndex + 2}`)}>
              <div className="mb-4 flex items-center gap-3">
                <Calendar className="h-4 w-4 text-stone" />
                <h2 className="text-sm font-medium uppercase tracking-wider text-stone">{month}</h2>
                <span className="text-xs text-stone-light">
                  {t("receiptsInMonth", { count: monthReceipts.length })} ·{" "}
                  {formatNOK(
                    monthReceipts.reduce((sum, r) => sum + toNumber(r.total_amount), 0),
                    locale
                  )}{" "}
                  kr
                </span>
              </div>

              <div className="space-y-2">
                {monthReceipts.map((receipt) => (
                  <ReceiptCard key={receipt.id} receipt={receipt} locale={locale} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function ReceiptCard({ receipt, locale }: { receipt: ReceiptListItem; locale: string }) {
  const t = useTranslations("Dashboard");

  return (
    <Link
      href={`/${locale}/receipts/${receipt.id}`}
      className="paper-card group flex items-center gap-4 p-4"
    >
      {/* Icon */}
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-fjord-50 text-fjord-400 transition-colors group-hover:bg-fjord-100 group-hover:text-fjord-500">
        <Receipt className="h-6 w-6" />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-center gap-2">
          <h3 className="truncate font-medium text-fjord-700 group-hover:text-fjord-800">
            {receipt.merchant_name}
          </h3>
        </div>
        <p className="truncate text-sm text-stone">
          {receipt.store_location && `${receipt.store_location} · `}
          {formatDate(receipt.purchase_date, locale)}
        </p>
      </div>

      {/* Amount & Items */}
      <div className="flex-shrink-0 text-right">
        <p className="font-display text-lg tabular-nums text-fjord-800">
          {formatNOK(receipt.total_amount, locale)}
          <span className="ml-1 text-xs text-stone">kr</span>
        </p>
        <p className="text-xs text-stone">
          {receipt.item_count} {t("items")}
        </p>
      </div>

      {/* Arrow */}
      <ChevronRight className="h-5 w-5 flex-shrink-0 text-stone-light transition-all group-hover:translate-x-0.5 group-hover:text-fjord-400" />
    </Link>
  );
}

function EmptyState({
  hasSearch,
  locale,
  tEmpty,
}: {
  hasSearch: boolean;
  locale: string;
  tEmpty: ReturnType<typeof useTranslations<"EmptyState">>;
}) {
  return (
    <div className="paper-card p-12 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-fjord-50">
        <ShoppingBag className="h-8 w-8 text-fjord-300" />
      </div>
      <h3 className="mb-2 font-display text-xl text-fjord-700">
        {hasSearch ? tEmpty("noResults") : tEmpty("noReceipts")}
      </h3>
      <p className="text-stone">
        {hasSearch ? tEmpty("tryDifferentSearch") : tEmpty("noReceiptsMessage")}
      </p>
      {!hasSearch && (
        <Link href={`/${locale}/upload`} className="btn-primary mt-6 inline-flex">
          {tEmpty("uploadReceipt")}
        </Link>
      )}
    </div>
  );
}

function ReceiptsSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-8">
        <div className="skeleton mb-2 h-10 w-48" />
        <div className="skeleton h-5 w-64" />
      </div>
      <div className="skeleton mb-8 h-12 w-full rounded-xl" />
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="paper-card flex gap-4 p-4">
            <div className="skeleton h-12 w-12 rounded-xl" />
            <div className="flex-1">
              <div className="skeleton mb-1 h-5 w-32" />
              <div className="skeleton h-4 w-48" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function groupByMonth(
  receipts: ReceiptListItem[],
  locale: string
): Record<string, ReceiptListItem[]> {
  const groups: Record<string, ReceiptListItem[]> = {};
  const localeCode = locale === "en" ? "en-GB" : "nb-NO";

  for (const receipt of receipts) {
    const date = new Date(receipt.purchase_date);
    const month = new Intl.DateTimeFormat(localeCode, {
      month: "long",
      year: "numeric",
    }).format(date);

    if (!groups[month]) groups[month] = [];
    groups[month].push(receipt);
  }

  return groups;
}
