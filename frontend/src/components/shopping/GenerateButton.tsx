"use client";

import { ShoppingCart, Loader2 } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface GenerateButtonProps {
  householdId: string;
  weekStart: Date;
  weekEnd: Date;
}

export function GenerateButton({ householdId, weekStart, weekEnd }: GenerateButtonProps) {
  const t = useTranslations("Shopping");
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Format dates as YYYY-MM-DD
      const startDate = weekStart.toISOString().split("T")[0];
      const endDate = weekEnd.toISOString().split("T")[0];

      const response = await api.generateShoppingList({
        household_id: householdId,
        start_date: startDate,
        end_date: endDate,
      });

      // Redirect to the new shopping list
      router.push(`/${locale}/shopping/${response.shopping_list.id}`);
    } catch (err) {
      console.error("Failed to generate shopping list:", err);
      setError(err instanceof Error ? err.message : "Failed to generate");
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className={cn(
          "flex w-full items-center justify-center gap-3",
          "rounded-2xl px-6 py-4 font-semibold",
          "transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-forest-300 focus:ring-offset-2 focus:ring-offset-cream",
          isGenerating
            ? "cursor-wait bg-forest-400"
            : "bg-forest-500 hover:bg-forest-600 active:bg-forest-700",
          "text-white shadow-paper"
        )}
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>{t("generating")}</span>
          </>
        ) : (
          <>
            <ShoppingCart className="h-5 w-5" />
            <span>{t("generateForWeek")}</span>
          </>
        )}
      </button>

      {error && <p className="animate-fade-in text-center text-sm text-red-500">{error}</p>}
    </div>
  );
}
