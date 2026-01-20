"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
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
import { api, type Recipe } from "@/lib/api";
import { cn } from "@/lib/utils";

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
      <div className="max-w-4xl mx-auto px-6 py-8 animate-pulse">
        <div className="h-6 w-32 bg-fjord-100 dark:bg-fjord-800 rounded mb-4" />
        <div className="h-10 w-64 bg-fjord-100 dark:bg-fjord-800 rounded mb-6" />
        <div className="aspect-video bg-fjord-100 dark:bg-fjord-800 rounded-2xl mb-8" />
        <div className="space-y-4">
          <div className="h-4 bg-fjord-100 dark:bg-fjord-800 rounded w-full" />
          <div className="h-4 bg-fjord-100 dark:bg-fjord-800 rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (!recipe) return null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Back Link */}
      <Link
        href={`/${locale}/recipes`}
        className="inline-flex items-center gap-2 text-fjord-500 hover:text-fjord-700 dark:hover:text-fjord-300 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("backToRecipes")}
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-display font-semibold text-fjord-800 dark:text-fjord-100">
            {recipe.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-fjord-500 dark:text-fjord-400">
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              {recipe.servings} {t("servings")}
            </span>
            {recipe.prep_time_minutes && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {recipe.prep_time_minutes} {t("prepTime")}
              </span>
            )}
            {recipe.source_url && (
              <a
                href={recipe.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-fjord-600 dark:hover:text-fjord-300"
              >
                <ExternalLink className="w-4 h-4" />
                {new URL(recipe.source_url).hostname}
              </a>
            )}
          </div>

          {recipe.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {recipe.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 text-sm rounded-full bg-fjord-100 dark:bg-fjord-800 text-fjord-600 dark:text-fjord-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              /* TODO: Plan meal */
            }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl font-medium",
              "bg-fjord-500 text-white",
              "hover:bg-fjord-600 transition-colors"
            )}
          >
            <Calendar className="w-4 h-4" />
            {t("planMeal")}
          </button>
          <Link
            href={`/${locale}/recipes/${recipe.id}/edit`}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl font-medium",
              "bg-fjord-100 dark:bg-fjord-800 text-fjord-700 dark:text-fjord-200",
              "hover:bg-fjord-200 dark:hover:bg-fjord-700 transition-colors"
            )}
          >
            <Pencil className="w-4 h-4" />
            {t("edit")}
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl font-medium",
              "text-red-600 dark:text-red-400",
              "hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            )}
          >
            <Trash2 className="w-4 h-4" />
            {t("delete")}
          </button>
        </div>
      </div>

      {/* Image */}
      {recipe.image_url ? (
        <img
          src={recipe.image_url}
          alt={recipe.name}
          className="w-full aspect-video object-cover rounded-2xl mb-8"
        />
      ) : (
        <div className="w-full aspect-video bg-fjord-100 dark:bg-fjord-800 rounded-2xl mb-8 flex items-center justify-center">
          <ChefHat className="w-16 h-16 text-fjord-300 dark:text-fjord-600" />
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        {/* Ingredients */}
        <div className="md:col-span-1">
          <h2 className="text-lg font-semibold text-fjord-800 dark:text-fjord-100 mb-4">
            {t("ingredients")}
          </h2>
          <ul className="space-y-2">
            {recipe.ingredients.map((ing, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-fjord-600 dark:text-fjord-300"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-fjord-400 mt-2 shrink-0" />
                <span>
                  {ing.quantity} {ing.unit} {ing.ingredient_name}
                  {ing.notes && (
                    <span className="text-fjord-400 dark:text-fjord-500">
                      {" "}
                      ({ing.notes})
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Instructions */}
        <div className="md:col-span-2">
          <h2 className="text-lg font-semibold text-fjord-800 dark:text-fjord-100 mb-4">
            {t("instructions")}
          </h2>
          <div className="prose prose-fjord dark:prose-invert max-w-none">
            {recipe.instructions.split("\n").map((paragraph, i) => (
              <p key={i} className="text-fjord-600 dark:text-fjord-300">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
