"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  CreditCard,
  Trash2,
  Receipt as ReceiptIcon,
  Package,
  Tag,
  Loader2
} from "lucide-react";
import { api, formatNOK, formatDate, type Receipt } from "@/lib/api";
import { cn } from "@/lib/utils";

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
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Back link */}
      <Link
        href={`/${locale}/receipts`}
        className="inline-flex items-center gap-2 text-stone hover:text-fjord-600 transition-colors mb-6 animate-fade-in"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("backToReceipts")}
      </Link>

      {/* Receipt Card */}
      <div className="receipt-paper rounded-2xl shadow-paper-lifted overflow-hidden animate-slide-up stagger-1">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-fjord-100">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-display text-fjord-800 mb-1">
                {receipt.merchant_name}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone">
                {receipt.store_location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {receipt.store_location}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {formatDate(receipt.purchase_date, locale)}
                </span>
              </div>
            </div>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-2 rounded-lg text-stone hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {deleting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Trash2 className="w-5 h-5" />
              )}
            </button>
          </div>

          {receipt.payment_method && (
            <div className="flex items-center gap-2 text-sm text-stone">
              <CreditCard className="w-4 h-4" />
              {receipt.payment_method}
            </div>
          )}
        </div>

        {/* Items */}
        <div className="p-6">
          <h2 className="text-sm font-medium text-stone uppercase tracking-wider mb-4 flex items-center gap-2">
            <Package className="w-4 h-4" />
            {t("items", { count: receipt.items.length })}
          </h2>

          <div className="space-y-4">
            {/* Categorized items grouped by category */}
            {Object.entries(groupByCategory(categorizedItems, t("other"))).map(([category, items]) => (
              <div key={category}>
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-3.5 h-3.5 text-stone-light" />
                  <span className="text-xs font-medium text-stone uppercase tracking-wider">
                    {category}
                  </span>
                </div>
                <div className="space-y-0">
                  {items.map((item) => (
                    <ItemRow key={item.id} item={item} locale={locale} />
                  ))}
                </div>
              </div>
            ))}

            {/* Uncategorized items */}
            {uncategorizedItems.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-stone uppercase tracking-wider">
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
              <div className="pt-2 border-t border-fjord-100">
                <div className="space-y-0">
                  {pantItems.map((item) => (
                    <ItemRow key={item.id} item={item} locale={locale} isPant />
                  ))}
                </div>
              </div>
            )}

            {/* Discounts */}
            {discountItems.length > 0 && (
              <div className="pt-2 border-t border-fjord-100">
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
        <div className="p-6 pt-4 bg-fjord-50/50 border-t border-fjord-100">
          <div className="flex justify-between items-baseline">
            <span className="text-lg font-display text-fjord-700">{t("total")}</span>
            <span className="text-3xl font-display text-fjord-800 tabular-nums">
              {formatNOK(receipt.total_amount, locale)}
              <span className="text-base text-stone ml-1.5">kr</span>
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
  isPant = false
}: {
  item: Receipt["items"][0];
  locale: string;
  isPant?: boolean;
}) {
  return (
    <div className={cn("receipt-item", isPant && "text-forest-600")}>
      <div className="flex items-center gap-2 min-w-0">
        {item.category && (
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: item.category.color || "#6B7280" }}
          />
        )}
        <span className="receipt-item-name">
          {item.raw_name}
          {item.quantity && item.quantity !== 1 && (
            <span className="text-stone-light ml-1">
              × {item.quantity}
            </span>
          )}
        </span>
      </div>
      <span className="receipt-item-price">
        {formatNOK(item.total_price, locale)}
      </span>
    </div>
  );
}

function ReceiptDetailSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="skeleton h-5 w-40 mb-6" />
      <div className="paper-card p-6">
        <div className="skeleton h-8 w-48 mb-2" />
        <div className="skeleton h-5 w-64 mb-6" />
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

function groupByCategory(items: Receipt["items"], otherLabel: string): Record<string, Receipt["items"]> {
  const groups: Record<string, Receipt["items"]> = {};

  for (const item of items) {
    const category = item.category?.name || otherLabel;
    if (!groups[category]) groups[category] = [];
    groups[category].push(item);
  }

  return groups;
}
