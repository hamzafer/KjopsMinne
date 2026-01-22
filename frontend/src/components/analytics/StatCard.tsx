"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type StatCardVariant = "default" | "success" | "warning" | "danger";
export type TrendDirection = "up" | "down" | "neutral";

interface TrendIndicator {
  direction: TrendDirection;
  value: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: TrendIndicator;
  variant?: StatCardVariant;
  expandable?: boolean;
  children?: ReactNode;
  loading?: boolean;
  className?: string;
}

const variantStyles: Record<
  StatCardVariant,
  {
    iconBg: string;
    iconText: string;
    valueBg: string;
  }
> = {
  default: {
    iconBg: "bg-fjord-100 dark:bg-fjord-700/50",
    iconText: "text-fjord-500 dark:text-fjord-300",
    valueBg: "",
  },
  success: {
    iconBg: "bg-forest-100 dark:bg-forest-800/50",
    iconText: "text-forest-500 dark:text-forest-400",
    valueBg: "",
  },
  warning: {
    iconBg: "bg-amber-light/30 dark:bg-amber-dark/20",
    iconText: "text-amber-dark dark:text-amber-warm",
    valueBg: "",
  },
  danger: {
    iconBg: "bg-red-100 dark:bg-red-900/30",
    iconText: "text-red-600 dark:text-red-400",
    valueBg: "",
  },
};

const trendColors: Record<TrendDirection, string> = {
  up: "text-forest-600 dark:text-forest-400",
  down: "text-red-600 dark:text-red-400",
  neutral: "text-fjord-500 dark:text-fjord-400",
};

function TrendIcon({ direction }: { direction: TrendDirection }) {
  if (direction === "up") {
    return (
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      </svg>
    );
  }
  if (direction === "down") {
    return (
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    );
  }
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
    </svg>
  );
}

function StatCardSkeleton() {
  return (
    <div className="paper-card animate-pulse p-5">
      <div className="flex items-start gap-4">
        {/* Icon skeleton */}
        <div className="skeleton h-12 w-12 rounded-xl" />

        {/* Content skeleton */}
        <div className="flex-1">
          <div className="skeleton mb-2 h-4 w-24 rounded" />
          <div className="skeleton mb-1 h-8 w-32 rounded" />
          <div className="skeleton h-3 w-20 rounded" />
        </div>
      </div>
    </div>
  );
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = "default",
  expandable = false,
  children,
  loading = false,
  className,
}: StatCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const styles = variantStyles[variant];

  if (loading) {
    return <StatCardSkeleton />;
  }

  return (
    <div
      className={cn(
        "paper-card overflow-hidden transition-all duration-300",
        expandable && "cursor-pointer",
        className
      )}
    >
      {/* Main content */}
      <div
        className={cn(
          "p-5",
          expandable && "transition-colors hover:bg-fjord-50/30 dark:hover:bg-fjord-700/20"
        )}
        onClick={expandable ? () => setIsExpanded(!isExpanded) : undefined}
        role={expandable ? "button" : undefined}
        tabIndex={expandable ? 0 : undefined}
        onKeyDown={
          expandable
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setIsExpanded(!isExpanded);
                }
              }
            : undefined
        }
      >
        <div className="flex items-start gap-4">
          {/* Icon */}
          {icon && (
            <div
              className={cn(
                "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl transition-colors",
                styles.iconBg,
                styles.iconText
              )}
            >
              {icon}
            </div>
          )}

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-fjord-500 dark:text-fjord-400">{title}</h3>
              {expandable && (
                <div className="ml-2 text-fjord-400 dark:text-fjord-500">
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </div>
              )}
            </div>

            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-2xl font-semibold tabular-nums text-fjord-800 dark:text-fjord-100">
                {value}
              </span>
              {trend && (
                <span
                  className={cn(
                    "flex items-center gap-0.5 text-sm font-medium",
                    trendColors[trend.direction]
                  )}
                >
                  <TrendIcon direction={trend.direction} />
                  {trend.value}
                </span>
              )}
            </div>

            {subtitle && (
              <p className="mt-0.5 text-sm text-fjord-500 dark:text-fjord-400">{subtitle}</p>
            )}
          </div>
        </div>
      </div>

      {/* Expandable content */}
      {expandable && children && (
        <div
          className={cn(
            "overflow-hidden border-t border-fjord-100 transition-all duration-300 ease-in-out dark:border-fjord-700/50",
            isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="p-5 pt-4">{children}</div>
        </div>
      )}
    </div>
  );
}
