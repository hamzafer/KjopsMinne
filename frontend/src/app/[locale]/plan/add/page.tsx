"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/api";
import { AddMealForm } from "@/components/meal-plan/AddMealForm";

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
    <div className="max-w-lg mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/${locale}/plan`}
          className="inline-flex items-center gap-2 text-fjord-500 hover:text-fjord-700 dark:hover:text-fjord-300 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("title")}
        </Link>

        <h1 className="text-2xl font-display font-semibold text-fjord-800 dark:text-fjord-100">
          {t("addTitle")}
        </h1>
      </div>

      {/* Form */}
      <AddMealForm
        householdId={HOUSEHOLD_ID}
        defaultDate={defaultDate}
        defaultMealType={defaultMealType}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        saving={saving}
      />
    </div>
  );
}
