"use client";

import { ArrowLeft, CalendarPlus } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { AddMealForm } from "@/components/meal-plan/AddMealForm";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

// TODO: Get from user context
const HOUSEHOLD_ID = "00000000-0000-0000-0000-000000000001";

export default function AddMealPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("MealPlan");
  const searchParams = useSearchParams();

  const defaultDate = searchParams.get("date") || undefined;
  const defaultMealType = searchParams.get("meal") as "breakfast" | "lunch" | "dinner" | undefined;

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (data: {
    recipe_id: string;
    planned_date: string;
    meal_type: "breakfast" | "lunch" | "dinner";
    servings: number;
  }) => {
    setSaving(true);
    try {
      await api.createMealPlan({
        household_id: HOUSEHOLD_ID,
        ...data,
      });
      router.push(`/${locale}/plan`);
    } catch (error) {
      console.error("Failed to create meal:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-6 py-8">
      {/* Header */}
      <div className="mb-8 animate-slide-up">
        <Link
          href={`/${locale}/plan`}
          className={cn(
            "mb-4 inline-flex items-center gap-2",
            "text-fjord-500 hover:text-fjord-700 dark:hover:text-fjord-300",
            "transition-colors"
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          {t("title")}
        </Link>

        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-fjord-500 to-fjord-600 shadow-lg shadow-fjord-500/20">
            <CalendarPlus className="h-6 w-6 text-white" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-fjord-800 dark:text-fjord-100">
            {t("addTitle")}
          </h1>
        </div>
      </div>

      {/* Form */}
      <div className="paper-card stagger-1 animate-slide-up p-6">
        <AddMealForm
          householdId={HOUSEHOLD_ID}
          defaultDate={defaultDate}
          defaultMealType={defaultMealType}
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          saving={saving}
        />
      </div>
    </div>
  );
}
