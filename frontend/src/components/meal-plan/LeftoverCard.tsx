"use client";

import { useTranslations } from "next-intl";
import { Clock, Utensils, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Leftover } from "@/lib/api";

interface LeftoverCardProps {
  leftover: Leftover;
  recipeName: string;
  onMarkConsumed: () => void;
  onMarkDiscarded: () => void;
}

export function LeftoverCard({
  leftover,
  recipeName,
  onMarkConsumed,
  onMarkDiscarded,
}: LeftoverCardProps) {
  const t = useTranslations("Leftovers");

  const expiresAt = new Date(leftover.expires_at);
  const now = new Date();
  const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isExpired = daysUntilExpiry < 0;
  const isExpiringSoon = daysUntilExpiry <= 2 && daysUntilExpiry >= 0;

  const statusColors = {
    available: isExpired
      ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20"
      : isExpiringSoon
      ? "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20"
      : "border-fjord-200 dark:border-fjord-700",
    consumed: "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 opacity-60",
    discarded: "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 opacity-60",
  };

  return (
    <div
      className={cn(
        "p-4 rounded-xl border-2 transition-all",
        statusColors[leftover.status]
      )}
    >
      <h4 className="font-medium text-fjord-800 dark:text-fjord-100">
        {recipeName}
      </h4>

      <div className="mt-2 flex items-center gap-4 text-sm text-fjord-600 dark:text-fjord-300">
        <span className="flex items-center gap-1">
          <Utensils className="w-4 h-4" />
          {leftover.remaining_servings} {t("servingsLeft")}
        </span>
      </div>

      {leftover.status === "available" && (
        <div className={cn(
          "mt-2 text-sm flex items-center gap-1",
          isExpired ? "text-red-600 dark:text-red-400" :
          isExpiringSoon ? "text-amber-600 dark:text-amber-400" :
          "text-fjord-500 dark:text-fjord-400"
        )}>
          <Clock className="w-4 h-4" />
          {isExpired
            ? t("expired")
            : `${t("expiresIn")} ${daysUntilExpiry} ${t("days")}`}
        </div>
      )}

      {leftover.status === "available" && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={onMarkConsumed}
            className={cn(
              "flex-1 py-2 rounded-lg text-sm font-medium",
              "bg-green-500 text-white",
              "hover:bg-green-600 transition-colors"
            )}
          >
            {t("markConsumed")}
          </button>
          <button
            onClick={onMarkDiscarded}
            className={cn(
              "p-2 rounded-lg",
              "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20",
              "transition-colors"
            )}
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      )}

      {leftover.status !== "available" && (
        <div className={cn(
          "mt-2 text-sm font-medium",
          leftover.status === "consumed" ? "text-green-600 dark:text-green-400" : "text-gray-500"
        )}>
          {t(leftover.status)}
        </div>
      )}
    </div>
  );
}
