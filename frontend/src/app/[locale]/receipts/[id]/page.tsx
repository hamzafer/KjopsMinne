"use client";

import {
  ArrowLeft,
  Calendar,
  MapPin,
  CreditCard,
  Trash2,
  Package,
  Tag,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useEffect, useState } from "react";

import { api, formatNOK, formatDate, type Receipt } from "@/lib/api";
import { cn, formatQty } from "@/lib/utils";

export default function ReceiptDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const t = useTranslations("ReceiptDetail");
  const locale = useLocale();

  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function loadReceipt() {
      try {
        const data = await api.getReceipt(id);
        setReceipt(data);
      } catch (error) {
        console.error("Failed to load receipt:", error);
        router.push(`/${locale}/receipts`);
      } finally {
        setLoading(false);
      }
    }
    loadReceipt();
  }, [id, router, locale]);

  const handleDelete = async () => {
    if (!confirm(t("confirmDelete"))) return;

    setDeleting(true);
    try {
      await api.deleteReceipt(id);
      router.push(`/${locale}/receipts`);
    } catch (error) {
      console.error("Failed to delete receipt:", error);
      setDeleting(false);
    }
  };

  if (loading) {
    return <ReceiptDetailSkeleton />;
  }

  if (!receipt) {
    return null;
  }

  // Group items by category
  const categorizedItems = receipt.items.filter((i) => i.category && !i.is_pant);
  const uncategorizedItems = receipt.items.filter((i) => !i.category && !i.is_pant);
  const pantItems = receipt.items.filter((i) => i.is_pant);
  const discountItems = receipt.items.filter((i) => i.discount_amount > 0);

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      {/* Back link */}
      <Link
        href={`/${locale}/receipts`}
        className="mb-6 inline-flex animate-fade-in items-center gap-2 text-stone transition-colors hover:text-fjord-600"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToReceipts")}
      </Link>

      {/* Receipt Card */}
      <div className="receipt-paper stagger-1 animate-slide-up overflow-hidden rounded-2xl shadow-paper-lifted">
        {/* Header */}
        <div className="border-b border-fjord-100 p-6 pb-4">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h1 className="mb-1 font-display text-2xl text-fjord-800">{receipt.merchant_name}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone">
                {receipt.store_location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {receipt.store_location}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {formatDate(receipt.purchase_date, locale)}
                </span>
              </div>
            </div>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-lg p-2 text-stone transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
            >
              {deleting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Trash2 className="h-5 w-5" />
              )}
            </button>
          </div>

          {receipt.payment_method && (
            <div className="flex items-center gap-2 text-sm text-stone">
              <CreditCard className="h-4 w-4" />
              {receipt.payment_method}
            </div>
          )}
        </div>

        {/* Items */}
        <div className="p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-stone">
            <Package className="h-4 w-4" />
            {t("items", { count: receipt.items.length })}
          </h2>

          <div className="space-y-4">
            {/* Categorized items grouped by category */}
            {Object.entries(groupByCategory(categorizedItems, t("other"))).map(
              ([category, items]) => (
                <div key={category}>
                  <div className="mb-2 flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5 text-stone-light" />
                    <span className="text-xs font-medium uppercase tracking-wider text-stone">
                      {category}
                    </span>
                  </div>
                  <div className="space-y-0">
                    {items.map((item) => (
                      <ItemRow key={item.id} item={item} locale={locale} />
                    ))}
                  </div>
                </div>
              )
            )}

            {/* Uncategorized items */}
            {uncategorizedItems.length > 0 && (
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-stone">
                    {t("other")}
                  </span>
                </div>
                <div className="space-y-0">
                  {uncategorizedItems.map((item) => (
                    <ItemRow key={item.id} item={item} locale={locale} />
                  ))}
                </div>
              </div>
            )}

            {/* Pant */}
            {pantItems.length > 0 && (
              <div className="border-t border-fjord-100 pt-2">
                <div className="space-y-0">
                  {pantItems.map((item) => (
                    <ItemRow key={item.id} item={item} locale={locale} isPant />
                  ))}
                </div>
              </div>
            )}

            {/* Discounts */}
            {discountItems.length > 0 && (
              <div className="border-t border-fjord-100 pt-2">
                {discountItems.map((item) => (
                  <div key={item.id} className="receipt-item text-forest-600">
                    <span className="receipt-item-name">{item.raw_name}</span>
                    <span className="receipt-item-price">
                      -{formatNOK(item.discount_amount, locale)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Total */}
        <div className="border-t border-fjord-100 bg-fjord-50/50 p-6 pt-4">
          <div className="flex items-baseline justify-between">
            <span className="font-display text-lg text-fjord-700">{t("total")}</span>
            <span className="font-display text-3xl tabular-nums text-fjord-800">
              {formatNOK(receipt.total_amount, locale)}
              <span className="ml-1.5 text-base text-stone">kr</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ItemRow({
  item,
  locale,
  isPant = false,
}: {
  item: Receipt["items"][0];
  locale: string;
  isPant?: boolean;
}) {
  return (
    <div className={cn("receipt-item", isPant && "text-forest-600")}>
      <div className="flex min-w-0 items-center gap-2">
        {item.category && (
          <span
            className="h-2 w-2 flex-shrink-0 rounded-full"
            style={{ backgroundColor: item.category.color || "#6B7280" }}
          />
        )}
        <span className="receipt-item-name">
          {item.raw_name}
          {item.quantity && Number(item.quantity) !== 1 && (
            <span className="ml-1 text-stone-light">× {formatQty(item.quantity)}</span>
          )}
        </span>
      </div>
      <span className="receipt-item-price">{formatNOK(item.total_price, locale)}</span>
    </div>
  );
}

function ReceiptDetailSkeleton() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <div className="skeleton mb-6 h-5 w-40" />
      <div className="paper-card p-6">
        <div className="skeleton mb-2 h-8 w-48" />
        <div className="skeleton mb-6 h-5 w-64" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex justify-between">
              <div className="skeleton h-5 w-40" />
              <div className="skeleton h-5 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function groupByCategory(
  items: Receipt["items"],
  otherLabel: string
): Record<string, Receipt["items"]> {
  const groups: Record<string, Receipt["items"]> = {};

  for (const item of items) {
    const category = item.category?.name || otherLabel;
    if (!groups[category]) groups[category] = [];
    groups[category].push(item);
  }

  return groups;
}
