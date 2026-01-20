"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { api, type Recipe } from "@/lib/api";
import { RecipeForm } from "@/components/recipes/RecipeForm";

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
        <div className="h-10 w-48 bg-fjord-100 dark:bg-fjord-800 rounded mb-8" />
        <div className="space-y-6">
          <div className="h-12 bg-fjord-100 dark:bg-fjord-800 rounded-xl" />
          <div className="h-12 bg-fjord-100 dark:bg-fjord-800 rounded-xl" />
          <div className="h-32 bg-fjord-100 dark:bg-fjord-800 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!recipe) return null;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/${locale}/recipes/${recipe.id}`}
          className="inline-flex items-center gap-2 text-fjord-500 hover:text-fjord-700 dark:hover:text-fjord-300 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("backToRecipes")}
        </Link>

        <h1 className="text-2xl font-display font-semibold text-fjord-800 dark:text-fjord-100">
          {t("editTitle")}
        </h1>
      </div>

      {/* Form */}
      <RecipeForm recipe={recipe} householdId={recipe.household_id} />
    </div>
  );
}
