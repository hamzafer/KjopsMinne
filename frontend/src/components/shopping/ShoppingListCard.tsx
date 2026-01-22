"use client";

import { ShoppingCart, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { formatDate, type ShoppingList } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ShoppingListCardProps {
  shoppingList: ShoppingList;
  animationDelay?: number;
}

export function ShoppingListCard({ shoppingList, animationDelay = 0 }: ShoppingListCardProps) {
  const locale = useLocale();
  const t = useTranslations("Shopping");

  const isComplete = shoppingList.status === "completed";
  const totalItems = shoppingList.items.length;
  const checkedItems = shoppingList.items.filter((item) => item.is_checked).length;
  const progressPercent = totalItems > 0 ? (checkedItems / totalItems) * 100 : 0;

  const startDate = formatDate(shoppingList.date_range_start, locale);
  const endDate = formatDate(shoppingList.date_range_end, locale);

  return (
    <Link
      href={`/${locale}/shopping/${shoppingList.id}`}
      className={cn(
        "paper-card group block overflow-hidden",
        "animate-slide-up opacity-0",
        "hover:scale-[1.02] active:scale-[0.98]",
        "transition-all duration-200"
      )}
      style={{
        animationDelay: `${animationDelay}ms`,
        animationFillMode: "forwards",
      }}
    >
      <div className="p-5">
        {/* Header with icon */}
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div
            className={cn(
              "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl",
              "transition-all duration-300",
              isComplete ? "bg-forest-100 text-forest-500" : "bg-fjord-100 text-fjord-500"
            )}
          >
            {isComplete ? (
              <CheckCircle2 className="h-6 w-6" />
            ) : (
              <ShoppingCart className="h-6 w-6" />
            )}
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-1 font-display font-semibold text-fjord-800 transition-colors group-hover:text-fjord-600">
              {shoppingList.name}
            </h3>
            <p className="mt-0.5 text-sm text-fjord-500">
              {t("dateRange", { start: startDate, end: endDate })}
            </p>
          </div>
        </div>

        {/* Progress section */}
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-sm text-fjord-500">
              {isComplete
                ? t("allDone")
                : t("progress", { checked: checkedItems, total: totalItems })}
            </span>
            <span
              className={cn(
                "text-sm font-semibold tabular-nums",
                isComplete ? "text-forest-600" : "text-fjord-700"
              )}
            >
              {Math.round(progressPercent)}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2 overflow-hidden rounded-full bg-fjord-100">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500 ease-out",
                isComplete ? "bg-forest-500" : "bg-fjord-400"
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Status badge */}
        {isComplete && (
          <div className="mt-3 flex justify-end">
            <span className="rounded-full bg-forest-100 px-2.5 py-0.5 text-xs font-medium text-forest-600">
              {t("completed")}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
