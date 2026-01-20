"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ShoppingCart, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface GenerateButtonProps {
  householdId: string;
  weekStart: Date;
  weekEnd: Date;
}

export function GenerateButton({
  householdId,
  weekStart,
  weekEnd,
}: GenerateButtonProps) {
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
          "w-full flex items-center justify-center gap-3",
          "px-6 py-4 rounded-2xl font-semibold",
          "transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-forest-300 focus:ring-offset-2 focus:ring-offset-cream",
          isGenerating
            ? "bg-forest-400 cursor-wait"
            : "bg-forest-500 hover:bg-forest-600 active:bg-forest-700",
          "text-white shadow-paper"
        )}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>{t("generating")}</span>
          </>
        ) : (
          <>
            <ShoppingCart className="w-5 h-5" />
            <span>{t("generateForWeek")}</span>
          </>
        )}
      </button>

      {error && (
        <p className="text-sm text-red-500 text-center animate-fade-in">
          {error}
        </p>
      )}
    </div>
  );
}
