"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Link as LinkIcon,
} from "lucide-react";
import { api, type RecipeImportResponse } from "@/lib/api";
import { RecipeForm } from "@/components/recipes/RecipeForm";
import { cn } from "@/lib/utils";

// TODO: Get from user context
const HOUSEHOLD_ID = "00000000-0000-0000-0000-000000000001";

export default function ImportRecipePage() {
  const locale = useLocale();
  const t = useTranslations("Recipes");

  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] =
    useState<RecipeImportResponse | null>(null);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const result = await api.importRecipe({
        url,
        household_id: HOUSEHOLD_ID,
      });
      setImportResult(result);
    } catch {
      setError(t("importFailed"));
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = cn(
    "flex-1 px-4 py-3 rounded-xl",
    "bg-white dark:bg-fjord-800/50",
    "border border-fjord-200 dark:border-fjord-700",
    "text-fjord-800 dark:text-fjord-100",
    "placeholder:text-fjord-400",
    "focus:outline-none focus:ring-2 focus:ring-fjord-500/50",
    "transition-all"
  );

  // Show form if we have import result
  if (importResult) {
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
            {t("reviewAndSave")}
          </h1>

          {importResult.recipe.source_url && (
            <p className="mt-2 text-sm text-fjord-500 dark:text-fjord-400 flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              {t("importedFrom")}:{" "}
              {new URL(importResult.recipe.source_url).hostname}
            </p>
          )}

          {importResult.confidence < 0.8 && (
            <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                {t("confidence")}: {Math.round(importResult.confidence * 100)}%
                - Please review carefully
              </span>
            </div>
          )}
        </div>

        {/* Form with imported data */}
        <RecipeForm
          householdId={HOUSEHOLD_ID}
          defaultValues={{
            name: importResult.recipe.name,
            servings: importResult.recipe.servings,
            prep_time_minutes: importResult.recipe.prep_time_minutes,
            instructions: importResult.recipe.instructions,
            tags: importResult.recipe.tags,
            source_url: importResult.recipe.source_url,
            image_url: importResult.recipe.image_url,
            ingredients: importResult.recipe.ingredients.map((i) => ({
              ingredient_id: i.ingredient_id,
              ingredient_name: i.ingredient_name,
              quantity: i.quantity,
              unit: i.unit,
              notes: i.notes,
            })),
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
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
          {t("importTitle")}
        </h1>
        <p className="mt-2 text-fjord-500 dark:text-fjord-400">
          {t("importSubtitle")}
        </p>
      </div>

      {/* Import Form */}
      <form onSubmit={handleImport} className="space-y-6">
        <div className="flex gap-3">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={t("importPlaceholder")}
            className={inputClasses}
            required
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className={cn(
              "px-5 py-3 rounded-xl font-medium",
              "bg-fjord-500 text-white",
              "hover:bg-fjord-600 disabled:opacity-50",
              "transition-colors flex items-center gap-2 shrink-0"
            )}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? t("importing") : t("importButton")}
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
            <p className="font-medium">{error}</p>
            <p className="mt-1 text-sm">{t("importFailedMessage")}</p>
            <Link
              href={`/${locale}/recipes/new`}
              className="mt-3 inline-block text-sm font-medium hover:underline"
            >
              {t("createManually")} →
            </Link>
          </div>
        )}
      </form>
    </div>
  );
}
