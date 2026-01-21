"use client";

import { useEffect, useState, useRef } from "react";
import { Wallet, Receipt, ShoppingBag, Calculator } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
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
function useCountUp(end: number, duration: number = 1000, delay: number = 0) {
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
    <div className="flex flex-col items-center text-center py-4 md:py-6">
      <div className="text-fjord-400 dark:text-fjord-500 mb-2">
        {icon}
      </div>
      {loading ? (
        <div className="h-9 w-24 skeleton rounded mb-1" />
      ) : (
        <p className="font-display text-2xl md:text-3xl font-semibold text-fjord-700 dark:text-fjord-200 tabular-nums">
          {format(animatedValue)}
          {suffix && <span className="text-lg md:text-xl ml-1">{suffix}</span>}
        </p>
      )}
      <p className="text-xs uppercase tracking-wider text-stone dark:text-fjord-400 mt-1">
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
        "bg-cream dark:bg-fjord-800/50 rounded-xl shadow-paper",
        "border border-fjord-100/50 dark:border-fjord-700/30",
        className
      )}
    >
      <div className="grid grid-cols-2 md:grid-cols-4">
        {/* Total Spent */}
        <div className="border-r border-b md:border-b-0 border-fjord-100 dark:border-fjord-700/50">
          <StatItem
            icon={<Wallet className="w-5 h-5" />}
            label={t("totalSpending")}
            value={Number(data?.total_spent) || 0}
            format={formatCurrency}
            suffix="kr"
            loading={loading}
            delay={0}
          />
        </div>

        {/* Receipts */}
        <div className="border-b md:border-b-0 md:border-r border-fjord-100 dark:border-fjord-700/50">
          <StatItem
            icon={<Receipt className="w-5 h-5" />}
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
            icon={<ShoppingBag className="w-5 h-5" />}
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
            icon={<Calculator className="w-5 h-5" />}
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
