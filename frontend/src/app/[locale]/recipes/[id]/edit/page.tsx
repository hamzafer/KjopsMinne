"use client";

import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { RecipeForm } from "@/components/recipes/RecipeForm";
import { api, type Recipe } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function EditRecipePage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Recipes");

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl animate-pulse px-6 py-8">
        <div className="mb-4 h-6 w-32 rounded bg-fjord-100 dark:bg-fjord-800" />
        <div className="mb-8 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-fjord-100 dark:bg-fjord-800" />
          <div className="h-8 w-48 rounded bg-fjord-100 dark:bg-fjord-800" />
        </div>
        <div className="paper-card space-y-6 p-6">
          <div className="h-12 rounded-xl bg-fjord-100 dark:bg-fjord-700" />
          <div className="h-12 rounded-xl bg-fjord-100 dark:bg-fjord-700" />
          <div className="h-32 rounded-xl bg-fjord-100 dark:bg-fjord-700" />
        </div>
      </div>
    );
  }

  if (!recipe) return null;

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      {/* Header */}
      <div className="mb-8 animate-slide-up">
        <Link
          href={`/${locale}/recipes/${recipe.id}`}
          className={cn(
            "mb-4 inline-flex items-center gap-2",
            "text-fjord-500 hover:text-fjord-700 dark:hover:text-fjord-300",
            "transition-colors"
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          {recipe.name}
        </Link>

        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-fjord-500 to-fjord-600 shadow-lg shadow-fjord-500/20">
            <Pencil className="h-6 w-6 text-white" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-fjord-800 dark:text-fjord-100">
            {t("editTitle")}
          </h1>
        </div>
      </div>

      {/* Form */}
      <div className="paper-card animate-slide-up p-6" style={{ animationDelay: "50ms" }}>
        <RecipeForm recipe={recipe} householdId={recipe.household_id} />
      </div>
    </div>
  );
}
