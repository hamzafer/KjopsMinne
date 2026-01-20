"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { RecipeForm } from "@/components/recipes/RecipeForm";

// TODO: Get from user context
const HOUSEHOLD_ID = "00000000-0000-0000-0000-000000000001";

export default function NewRecipePage() {
  const locale = useLocale();
  const t = useTranslations("Recipes");

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/${locale}/recipes`}
          className="inline-flex items-center gap-2 text-fjord-500 hover:text-fjord-700 dark:hover:text-fjord-300 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("backToRecipes")}
        </Link>

        <h1 className="text-2xl font-display font-semibold text-fjord-800 dark:text-fjord-100">
          {t("newTitle")}
        </h1>
      </div>

      {/* Form */}
      <RecipeForm householdId={HOUSEHOLD_ID} />
    </div>
  );
}
