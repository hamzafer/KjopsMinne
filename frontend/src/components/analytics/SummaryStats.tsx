"use client";

import { Wallet, Receipt, ShoppingBag, Calculator } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, useRef } from "react";

import { formatNOK, type Summary } from "@/lib/api";
import { cn } from "@/lib/utils";

interface SummaryStatsProps {
  data: Summary | null;
  loading?: boolean;
  className?: string;
}

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  format: (val: number) => string;
  suffix?: string;
  loading?: boolean;
  delay?: number;
}

// Animated counter hook
function useCountUp(end: number, duration = 1000, delay = 0) {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (end === 0) {
      setCount(0);
      return;
    }

    const timeout = setTimeout(() => {
      const animate = (timestamp: number) => {
        if (!startTimeRef.current) {
          startTimeRef.current = timestamp;
        }

        const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(eased * end);

        if (current !== countRef.current) {
          countRef.current = current;
          setCount(current);
        }

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(timeout);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [end, duration, delay]);

  return count;
}

function StatItem({ icon, label, value, format, suffix, loading, delay = 0 }: StatItemProps) {
  const animatedValue = useCountUp(loading ? 0 : value, 1200, delay);

  return (
    <div className="flex flex-col items-center py-4 text-center md:py-6">
      <div className="mb-2 text-fjord-400 dark:text-fjord-500">{icon}</div>
      {loading ? (
        <div className="skeleton mb-1 h-9 w-24 rounded" />
      ) : (
        <p className="font-display text-2xl font-semibold tabular-nums text-fjord-700 dark:text-fjord-200 md:text-3xl">
          {format(animatedValue)}
          {suffix && <span className="ml-1 text-lg md:text-xl">{suffix}</span>}
        </p>
      )}
      <p className="mt-1 text-xs uppercase tracking-wider text-stone dark:text-fjord-400">
        {label}
      </p>
    </div>
  );
}

export function SummaryStats({ data, loading = false, className }: SummaryStatsProps) {
  const locale = useLocale();
  const t = useTranslations("Analytics");

  const formatCurrency = (val: number) => formatNOK(val, locale);
  const formatNumber = (val: number) => val.toLocaleString(locale === "en" ? "en-NO" : "nb-NO");

  return (
    <div
      className={cn(
        "rounded-xl bg-cream shadow-paper dark:bg-fjord-800/50",
        "border border-fjord-100/50 dark:border-fjord-700/30",
        className
      )}
    >
      <div className="grid grid-cols-2 md:grid-cols-4">
        {/* Total Spent */}
        <div className="border-b border-r border-fjord-100 dark:border-fjord-700/50 md:border-b-0">
          <StatItem
            icon={<Wallet className="h-5 w-5" />}
            label={t("totalSpending")}
            value={Number(data?.total_spent) || 0}
            format={formatCurrency}
            suffix="kr"
            loading={loading}
            delay={0}
          />
        </div>

        {/* Receipts */}
        <div className="border-b border-fjord-100 dark:border-fjord-700/50 md:border-b-0 md:border-r">
          <StatItem
            icon={<Receipt className="h-5 w-5" />}
            label={t("receipts")}
            value={data?.total_receipts || 0}
            format={formatNumber}
            loading={loading}
            delay={100}
          />
        </div>

        {/* Items */}
        <div className="border-r border-fjord-100 dark:border-fjord-700/50">
          <StatItem
            icon={<ShoppingBag className="h-5 w-5" />}
            label={t("itemsPurchased")}
            value={data?.total_items || 0}
            format={formatNumber}
            loading={loading}
            delay={200}
          />
        </div>

        {/* Average */}
        <div>
          <StatItem
            icon={<Calculator className="h-5 w-5" />}
            label={t("average")}
            value={Number(data?.avg_receipt_amount) || 0}
            format={formatCurrency}
            suffix="kr"
            loading={loading}
            delay={300}
          />
        </div>
      </div>
    </div>
  );
}
