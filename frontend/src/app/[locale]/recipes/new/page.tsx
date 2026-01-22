"use client";

import { ArrowLeft, ChefHat } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { RecipeForm } from "@/components/recipes/RecipeForm";
import { cn } from "@/lib/utils";

// TODO: Get from user context
const HOUSEHOLD_ID = "00000000-0000-0000-0000-000000000001";

export default function NewRecipePage() {
  const locale = useLocale();
  const t = useTranslations("Recipes");

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      {/* Header */}
      <div className="mb-8 animate-slide-up">
        <Link
          href={`/${locale}/recipes`}
          className={cn(
            "mb-4 inline-flex items-center gap-2",
            "text-fjord-500 hover:text-fjord-700 dark:hover:text-fjord-300",
            "transition-colors"
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToRecipes")}
        </Link>

        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-forest-500 to-forest-600 shadow-lg shadow-forest-500/20">
            <ChefHat className="h-6 w-6 text-white" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-fjord-800 dark:text-fjord-100">
            {t("newTitle")}
          </h1>
        </div>
      </div>

      {/* Form */}
      <div className="paper-card animate-slide-up p-6" style={{ animationDelay: "50ms" }}>
        <RecipeForm householdId={HOUSEHOLD_ID} />
      </div>
    </div>
  );
}
