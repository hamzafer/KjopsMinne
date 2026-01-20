"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
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

const variantStyles: Record<StatCardVariant, {
  iconBg: string;
  iconText: string;
  valueBg: string;
}> = {
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
        className="w-4 h-4"
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
        className="w-4 h-4"
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
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
    </svg>
  );
}

function StatCardSkeleton() {
  return (
    <div className="paper-card p-5 animate-pulse">
      <div className="flex items-start gap-4">
        {/* Icon skeleton */}
        <div className="w-12 h-12 rounded-xl skeleton" />

        {/* Content skeleton */}
        <div className="flex-1">
          <div className="h-4 w-24 skeleton rounded mb-2" />
          <div className="h-8 w-32 skeleton rounded mb-1" />
          <div className="h-3 w-20 skeleton rounded" />
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
        className={cn("p-5", expandable && "hover:bg-fjord-50/30 dark:hover:bg-fjord-700/20 transition-colors")}
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
                "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
                styles.iconBg,
                styles.iconText
              )}
            >
              {icon}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-fjord-500 dark:text-fjord-400">
                {title}
              </h3>
              {expandable && (
                <div className="text-fjord-400 dark:text-fjord-500 ml-2">
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </div>
              )}
            </div>

            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-display font-semibold text-fjord-800 dark:text-fjord-100 tabular-nums">
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
              <p className="mt-0.5 text-sm text-fjord-500 dark:text-fjord-400">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Expandable content */}
      {expandable && children && (
        <div
          className={cn(
            "border-t border-fjord-100 dark:border-fjord-700/50 overflow-hidden transition-all duration-300 ease-in-out",
            isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="p-5 pt-4">{children}</div>
        </div>
      )}
    </div>
  );
}
