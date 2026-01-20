"use client";

import { useTranslations } from "next-intl";
import { Clock, Utensils, Trash2, Check, AlertTriangle, XCircle } from "lucide-react";
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

  const getStatusConfig = () => {
    if (leftover.status === "consumed") {
      return {
        card: "paper-card opacity-60",
        badge: "bg-forest-100 text-forest-700 dark:bg-forest-900/30 dark:text-forest-400",
        badgeIcon: Check,
        badgeText: t("consumed"),
      };
    }
    if (leftover.status === "discarded") {
      return {
        card: "paper-card opacity-50",
        badge: "bg-stone-light/50 text-stone dark:bg-stone-light/20 dark:text-stone-light",
        badgeIcon: XCircle,
        badgeText: t("discarded"),
      };
    }
    if (isExpired) {
      return {
        card: "paper-card ring-2 ring-red-300/50 dark:ring-red-700/50",
        badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        badgeIcon: XCircle,
        badgeText: t("expired"),
      };
    }
    if (isExpiringSoon) {
      return {
        card: "paper-card ring-2 ring-amber-300/50 dark:ring-amber-700/50",
        badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
        badgeIcon: AlertTriangle,
        badgeText: `${daysUntilExpiry} ${t("days")}`,
      };
    }
    return {
      card: "paper-card",
      badge: "bg-fjord-100 text-fjord-700 dark:bg-fjord-800 dark:text-fjord-200",
      badgeIcon: Clock,
      badgeText: `${daysUntilExpiry} ${t("days")}`,
    };
  };

  const config = getStatusConfig();
  const BadgeIcon = config.badgeIcon;

  return (
    <div className={cn(
      config.card,
      "p-4 transition-all duration-200",
      leftover.status === "available" && "hover:scale-[1.02]"
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h4 className="font-display font-semibold text-fjord-800 dark:text-fjord-100 leading-tight">
          {recipeName}
        </h4>
        <div className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0",
          config.badge
        )}>
          <BadgeIcon className="w-3.5 h-3.5" />
          {config.badgeText}
        </div>
      </div>

      {/* Servings */}
      <div className="flex items-center gap-2 text-sm text-fjord-600 dark:text-fjord-300">
        <div className="w-7 h-7 rounded-lg bg-fjord-100 dark:bg-fjord-800 flex items-center justify-center">
          <Utensils className="w-3.5 h-3.5 text-fjord-500" />
        </div>
        <span className="font-medium">
          {leftover.remaining_servings} {t("servingsLeft")}
        </span>
      </div>

      {/* Expiry info for available leftovers */}
      {leftover.status === "available" && !isExpired && (
        <div className={cn(
          "mt-3 text-xs flex items-center gap-1.5",
          isExpiringSoon
            ? "text-amber-600 dark:text-amber-400"
            : "text-fjord-500 dark:text-fjord-400"
        )}>
          <Clock className="w-3.5 h-3.5" />
          {t("expiresIn")} {daysUntilExpiry} {t("days")}
        </div>
      )}

      {/* Actions for available leftovers */}
      {leftover.status === "available" && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={onMarkConsumed}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium",
              "bg-forest-500 text-white",
              "hover:bg-forest-600",
              "transition-all duration-200",
              "hover:scale-[1.02] active:scale-[0.98]"
            )}
          >
            <Check className="w-4 h-4" />
            {t("markConsumed")}
          </button>
          <button
            onClick={onMarkDiscarded}
            className={cn(
              "p-2.5 rounded-xl",
              "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20",
              "transition-all duration-200",
              "hover:scale-105 active:scale-95"
            )}
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
