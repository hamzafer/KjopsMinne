"use client";

import {
  ArrowLeft,
  Clock,
  Users,
  Pencil,
  Trash2,
  Calendar,
  ExternalLink,
  ChefHat,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { api, type Recipe } from "@/lib/api";
import { cn, formatQty } from "@/lib/utils";

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Recipes");

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function loadRecipe() {
      try {
        const data = await api.getRecipe(params.id as string);
        setRecipe(data);
      } catch (error) {
        console.error("Failed to load recipe:", error);
        router.push(`/${locale}/recipes`);
      } finally {
        setLoading(false);
      }
    }
    loadRecipe();
  }, [params.id, locale, router]);

  const handleDelete = async () => {
    if (!recipe || !confirm(t("confirmDelete"))) return;

    setDeleting(true);
    try {
      await api.deleteRecipe(recipe.id);
      router.push(`/${locale}/recipes`);
    } catch (error) {
      console.error("Failed to delete:", error);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl animate-pulse px-6 py-8">
        <div className="mb-4 h-6 w-32 rounded bg-fjord-100 dark:bg-fjord-800" />
        <div className="mb-6 h-10 w-64 rounded bg-fjord-100 dark:bg-fjord-800" />
        <div className="mb-8 aspect-video rounded-2xl bg-fjord-100 dark:bg-fjord-800" />
        <div className="space-y-4">
          <div className="h-4 w-full rounded bg-fjord-100 dark:bg-fjord-800" />
          <div className="h-4 w-3/4 rounded bg-fjord-100 dark:bg-fjord-800" />
        </div>
      </div>
    );
  }

  if (!recipe) return null;

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      {/* Back Link */}
      <Link
        href={`/${locale}/recipes`}
        className={cn(
          "mb-6 inline-flex items-center gap-2",
          "text-fjord-500 hover:text-fjord-700 dark:hover:text-fjord-300",
          "animate-fade-in transition-colors"
        )}
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToRecipes")}
      </Link>

      {/* Header */}
      <div className="mb-6 flex animate-slide-up flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="font-display text-3xl font-semibold text-fjord-800 dark:text-fjord-100">
            {recipe.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-fjord-500 dark:text-fjord-400">
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {recipe.servings} {t("servings")}
            </span>
            {recipe.prep_time_minutes && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {recipe.prep_time_minutes} {t("prepTime")}
              </span>
            )}
            {recipe.source_url && (
              <a
                href={recipe.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 transition-colors hover:text-fjord-600 dark:hover:text-fjord-300"
              >
                <ExternalLink className="h-4 w-4" />
                {new URL(recipe.source_url).hostname}
              </a>
            )}
          </div>

          {recipe.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {recipe.tags.map((tag, index) => (
                <span
                  key={tag}
                  className={cn(
                    "rounded-full px-3 py-1 text-sm",
                    "bg-fjord-100 text-fjord-600 dark:bg-fjord-800 dark:text-fjord-300",
                    "animate-fade-in opacity-0"
                  )}
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animationFillMode: "forwards",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex animate-fade-in gap-2" style={{ animationDelay: "100ms" }}>
          <button
            onClick={() => {
              /* TODO: Plan meal */
            }}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2.5 font-medium",
              "bg-fjord-500 text-white",
              "hover:bg-fjord-600",
              "shadow-lg shadow-fjord-500/20",
              "hover:scale-[1.02] active:scale-[0.98]",
              "transition-all duration-200"
            )}
          >
            <Calendar className="h-4 w-4" />
            {t("planMeal")}
          </button>
          <Link
            href={`/${locale}/recipes/${recipe.id}/edit`}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2.5 font-medium",
              "bg-fjord-100 text-fjord-700 dark:bg-fjord-800 dark:text-fjord-200",
              "hover:bg-fjord-200 dark:hover:bg-fjord-700",
              "hover:scale-[1.02] active:scale-[0.98]",
              "transition-all duration-200"
            )}
          >
            <Pencil className="h-4 w-4" />
            {t("edit")}
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2.5 font-medium",
              "text-red-600 dark:text-red-400",
              "hover:bg-red-50 dark:hover:bg-red-900/20",
              "hover:scale-[1.02] active:scale-[0.98]",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "transition-all duration-200"
            )}
          >
            <Trash2 className="h-4 w-4" />
            {t("delete")}
          </button>
        </div>
      </div>

      {/* Image */}
      <div className="animate-fade-in" style={{ animationDelay: "150ms" }}>
        {recipe.image_url ? (
          <div className="relative mb-8 aspect-video w-full overflow-hidden rounded-2xl shadow-lg">
            <Image
              src={recipe.image_url}
              alt={recipe.name}
              fill
              unoptimized
              className="object-cover"
            />
          </div>
        ) : (
          <div className="mb-8 flex aspect-video w-full items-center justify-center rounded-2xl bg-gradient-to-br from-fjord-100 to-fjord-200 dark:from-fjord-700/50 dark:to-fjord-800/50">
            <ChefHat className="h-16 w-16 text-fjord-300 dark:text-fjord-600" />
          </div>
        )}
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Ingredients */}
        <div
          className="paper-card animate-slide-up p-6 opacity-0 md:col-span-1"
          style={{ animationDelay: "200ms", animationFillMode: "forwards" }}
        >
          <h2 className="mb-4 font-display text-lg font-semibold text-fjord-800 dark:text-fjord-100">
            {t("ingredients")}
          </h2>
          <ul className="space-y-2.5">
            {recipe.ingredients.map((ing, i) => (
              <li
                key={i}
                className={cn(
                  "flex items-start gap-2 text-fjord-600 dark:text-fjord-300",
                  "animate-fade-in opacity-0"
                )}
                style={{
                  animationDelay: `${250 + i * 30}ms`,
                  animationFillMode: "forwards",
                }}
              >
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-forest-500" />
                <span>
                  <strong className="font-medium">
                    {formatQty(ing.quantity)} {ing.unit}
                  </strong>{" "}
                  {ing.ingredient_name}
                  {ing.notes && (
                    <span className="text-fjord-400 dark:text-fjord-500"> ({ing.notes})</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Instructions */}
        <div
          className="paper-card animate-slide-up p-6 opacity-0 md:col-span-2"
          style={{ animationDelay: "250ms", animationFillMode: "forwards" }}
        >
          <h2 className="mb-4 font-display text-lg font-semibold text-fjord-800 dark:text-fjord-100">
            {t("instructions")}
          </h2>
          <div className="prose prose-fjord dark:prose-invert max-w-none">
            {recipe.instructions.split("\n").map((paragraph, i) => (
              <p
                key={i}
                className={cn("text-fjord-600 dark:text-fjord-300", "animate-fade-in opacity-0")}
                style={{
                  animationDelay: `${300 + i * 50}ms`,
                  animationFillMode: "forwards",
                }}
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
