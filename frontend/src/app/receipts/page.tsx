"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Receipt, Search, Calendar, ChevronRight, ShoppingBag } from "lucide-react";
import { api, formatNOK, formatDate, type ReceiptListItem } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function ReceiptsPage() {
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
  const filteredReceipts = receipts.filter((r) =>
    r.merchant_name.toLowerCase().includes(search.toLowerCase()) ||
    r.store_location?.toLowerCase().includes(search.toLowerCase())
  );

  // Group by month
  const groupedReceipts = groupByMonth(filteredReceipts);

  if (loading) {
    return <ReceiptsSkeleton />;
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-display text-fjord-800 mb-2">
          Kvitteringer
        </h1>
        <p className="text-stone">
          {receipts.length} kvitteringer lagret i hvelvet
        </p>
      </div>

      {/* Search */}
      <div className="mb-8 animate-slide-up stagger-1">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-light" />
          <input
            type="search"
            placeholder="Søk etter butikk eller sted..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-paper border border-fjord-100 focus-ring text-fjord-700 placeholder:text-stone-light"
          />
        </div>
      </div>

      {/* Receipt List */}
      {filteredReceipts.length === 0 ? (
        <EmptyState hasSearch={search.length > 0} />
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedReceipts).map(([month, monthReceipts], groupIndex) => (
            <section key={month} className={cn("animate-slide-up", `stagger-${groupIndex + 2}`)}>
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-4 h-4 text-stone" />
                <h2 className="text-sm font-medium text-stone uppercase tracking-wider">
                  {month}
                </h2>
                <span className="text-xs text-stone-light">
                  {monthReceipts.length} kvitteringer · {formatNOK(
                    monthReceipts.reduce((sum, r) => sum + r.total_amount, 0)
                  )} kr
                </span>
              </div>

              <div className="space-y-2">
                {monthReceipts.map((receipt) => (
                  <ReceiptCard key={receipt.id} receipt={receipt} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function ReceiptCard({ receipt }: { receipt: ReceiptListItem }) {
  return (
    <Link
      href={`/receipts/${receipt.id}`}
      className="paper-card flex items-center gap-4 p-4 group"
    >
      {/* Icon */}
      <div className="w-12 h-12 rounded-xl bg-fjord-50 flex items-center justify-center text-fjord-400 group-hover:bg-fjord-100 group-hover:text-fjord-500 transition-colors flex-shrink-0">
        <Receipt className="w-6 h-6" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="font-medium text-fjord-700 group-hover:text-fjord-800 truncate">
            {receipt.merchant_name}
          </h3>
        </div>
        <p className="text-sm text-stone truncate">
          {receipt.store_location && `${receipt.store_location} · `}
          {formatDate(receipt.purchase_date)}
        </p>
      </div>

      {/* Amount & Items */}
      <div className="text-right flex-shrink-0">
        <p className="font-display text-lg text-fjord-800 tabular-nums">
          {formatNOK(receipt.total_amount)}
          <span className="text-xs text-stone ml-1">kr</span>
        </p>
        <p className="text-xs text-stone">
          {receipt.item_count} varer
        </p>
      </div>

      {/* Arrow */}
      <ChevronRight className="w-5 h-5 text-stone-light group-hover:text-fjord-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
    </Link>
  );
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="paper-card p-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-fjord-50 flex items-center justify-center mx-auto mb-4">
        <ShoppingBag className="w-8 h-8 text-fjord-300" />
      </div>
      <h3 className="font-display text-xl text-fjord-700 mb-2">
        {hasSearch ? "Ingen treff" : "Ingen kvitteringer ennå"}
      </h3>
      <p className="text-stone">
        {hasSearch
          ? "Prøv et annet søkeord"
          : "Last opp din første kvittering for å komme i gang"
        }
      </p>
      {!hasSearch && (
        <Link href="/upload" className="btn-primary mt-6 inline-flex">
          Last opp kvittering
        </Link>
      )}
    </div>
  );
}

function ReceiptsSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <div className="skeleton h-10 w-48 mb-2" />
        <div className="skeleton h-5 w-64" />
      </div>
      <div className="skeleton h-12 w-full rounded-xl mb-8" />
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="paper-card p-4 flex gap-4">
            <div className="skeleton w-12 h-12 rounded-xl" />
            <div className="flex-1">
              <div className="skeleton h-5 w-32 mb-1" />
              <div className="skeleton h-4 w-48" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function groupByMonth(receipts: ReceiptListItem[]): Record<string, ReceiptListItem[]> {
  const groups: Record<string, ReceiptListItem[]> = {};

  for (const receipt of receipts) {
    const date = new Date(receipt.purchase_date);
    const month = new Intl.DateTimeFormat("nb-NO", {
      month: "long",
      year: "numeric",
    }).format(date);

    if (!groups[month]) groups[month] = [];
    groups[month].push(receipt);
  }

  return groups;
}
