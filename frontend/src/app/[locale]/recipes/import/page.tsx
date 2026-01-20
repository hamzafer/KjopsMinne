"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Link as LinkIcon,
  Download,
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
    "flex-1 px-4 py-3.5 rounded-xl",
    "bg-white dark:bg-fjord-800/50",
    "border border-fjord-200 dark:border-fjord-700",
    "text-fjord-800 dark:text-fjord-100",
    "placeholder:text-fjord-400 dark:placeholder:text-fjord-500",
    "focus:outline-none focus:ring-2 focus:ring-fjord-500/50 focus:border-fjord-400",
    "transition-all duration-200"
  );

  // Show form if we have import result
  if (importResult) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <Link
            href={`/${locale}/recipes`}
            className={cn(
              "inline-flex items-center gap-2 mb-4",
              "text-fjord-500 hover:text-fjord-700 dark:hover:text-fjord-300",
              "transition-colors"
            )}
          >
            <ArrowLeft className="w-4 h-4" />
            {t("backToRecipes")}
          </Link>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-forest-500 to-forest-600 flex items-center justify-center shadow-lg shadow-forest-500/20">
              <Download className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-semibold text-fjord-800 dark:text-fjord-100">
                {t("reviewAndSave")}
              </h1>

              {importResult.recipe.source_url && (
                <p className="mt-0.5 text-sm text-fjord-500 dark:text-fjord-400 flex items-center gap-2">
                  <LinkIcon className="w-3.5 h-3.5" />
                  {t("importedFrom")}:{" "}
                  {new URL(importResult.recipe.source_url).hostname}
                </p>
              )}
            </div>
          </div>

          {importResult.confidence < 0.8 && (
            <div className="mt-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm flex items-start gap-3 border border-amber-200 dark:border-amber-800 animate-fade-in">
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
              <span>
                {t("confidence")}: {Math.round(importResult.confidence * 100)}%
                - Please review carefully
              </span>
            </div>
          )}
        </div>

        {/* Form with imported data */}
        <div className="paper-card p-6 animate-slide-up" style={{ animationDelay: '50ms' }}>
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
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8 animate-slide-up">
        <Link
          href={`/${locale}/recipes`}
          className={cn(
            "inline-flex items-center gap-2 mb-4",
            "text-fjord-500 hover:text-fjord-700 dark:hover:text-fjord-300",
            "transition-colors"
          )}
        >
          <ArrowLeft className="w-4 h-4" />
          {t("backToRecipes")}
        </Link>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-fjord-500 to-fjord-600 flex items-center justify-center shadow-lg shadow-fjord-500/20">
            <Download className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-semibold text-fjord-800 dark:text-fjord-100">
              {t("importTitle")}
            </h1>
            <p className="mt-0.5 text-fjord-500 dark:text-fjord-400">
              {t("importSubtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* Import Form */}
      <form onSubmit={handleImport} className="space-y-6">
        <div className="paper-card p-6 animate-slide-up" style={{ animationDelay: '50ms' }}>
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
                "px-5 py-3.5 rounded-xl font-medium",
                "bg-fjord-500 text-white",
                "hover:bg-fjord-600 disabled:opacity-50 disabled:cursor-not-allowed",
                "shadow-lg shadow-fjord-500/20",
                "hover:scale-[1.02] active:scale-[0.98]",
                "transition-all duration-200 flex items-center gap-2 shrink-0"
              )}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? t("importing") : t("importButton")}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 animate-fade-in">
            <p className="font-medium">{error}</p>
            <p className="mt-1 text-sm opacity-80">{t("importFailedMessage")}</p>
            <Link
              href={`/${locale}/recipes/new`}
              className={cn(
                "mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg",
                "text-sm font-medium",
                "bg-red-100 dark:bg-red-900/30",
                "hover:bg-red-200 dark:hover:bg-red-900/50",
                "transition-colors"
              )}
            >
              {t("createManually")} →
            </Link>
          </div>
        )}
      </form>
    </div>
  );
}
