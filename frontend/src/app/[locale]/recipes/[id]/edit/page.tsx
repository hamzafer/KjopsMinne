"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, Pencil } from "lucide-react";
import { api, type Recipe } from "@/lib/api";
import { RecipeForm } from "@/components/recipes/RecipeForm";
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
      <div className="max-w-3xl mx-auto px-6 py-8 animate-pulse">
        <div className="h-6 w-32 bg-fjord-100 dark:bg-fjord-800 rounded mb-4" />
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-fjord-100 dark:bg-fjord-800 rounded-xl" />
          <div className="h-8 w-48 bg-fjord-100 dark:bg-fjord-800 rounded" />
        </div>
        <div className="paper-card p-6 space-y-6">
          <div className="h-12 bg-fjord-100 dark:bg-fjord-700 rounded-xl" />
          <div className="h-12 bg-fjord-100 dark:bg-fjord-700 rounded-xl" />
          <div className="h-32 bg-fjord-100 dark:bg-fjord-700 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!recipe) return null;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8 animate-slide-up">
        <Link
          href={`/${locale}/recipes/${recipe.id}`}
          className={cn(
            "inline-flex items-center gap-2 mb-4",
            "text-fjord-500 hover:text-fjord-700 dark:hover:text-fjord-300",
            "transition-colors"
          )}
        >
          <ArrowLeft className="w-4 h-4" />
          {recipe.name}
        </Link>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-fjord-500 to-fjord-600 flex items-center justify-center shadow-lg shadow-fjord-500/20">
            <Pencil className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-display font-semibold text-fjord-800 dark:text-fjord-100">
            {t("editTitle")}
          </h1>
        </div>
      </div>

      {/* Form */}
      <div className="paper-card p-6 animate-slide-up" style={{ animationDelay: '50ms' }}>
        <RecipeForm recipe={recipe} householdId={recipe.household_id} />
      </div>
    </div>
  );
}
