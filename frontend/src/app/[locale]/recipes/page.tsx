"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Download } from "lucide-react";
import { api, type Recipe } from "@/lib/api";
import { RecipeGrid } from "@/components/recipes/RecipeGrid";
import { RecipeSearch } from "@/components/recipes/RecipeSearch";
import { cn } from "@/lib/utils";

// TODO: Get from user context
const HOUSEHOLD_ID = "00000000-0000-0000-0000-000000000001";

export default function RecipesPage() {
  const locale = useLocale();
  const t = useTranslations("Recipes");

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    async function loadRecipes() {
      try {
        const response = await api.getRecipes(HOUSEHOLD_ID);
        setRecipes(response.recipes);
      } catch (error) {
        console.error("Failed to load recipes:", error);
      } finally {
        setLoading(false);
      }
    }
    loadRecipes();
  }, []);

  // Extract unique tags from recipes
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    recipes.forEach((r) => r.tags.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [recipes]);

  // Filter recipes
  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      const matchesSearch =
        !search ||
        recipe.name.toLowerCase().includes(search.toLowerCase()) ||
        recipe.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));

      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.some((tag) => recipe.tags.includes(tag));

      return matchesSearch && matchesTags;
    });
  }, [recipes, search, selectedTags]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-display font-semibold text-fjord-800 dark:text-fjord-100">
            {t("title")}
          </h1>
          <p className="mt-1 text-fjord-500 dark:text-fjord-400">
            {t("subtitle")}
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/${locale}/recipes/import`}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium",
              "bg-fjord-100 dark:bg-fjord-800 text-fjord-700 dark:text-fjord-200",
              "hover:bg-fjord-200 dark:hover:bg-fjord-700 transition-colors"
            )}
          >
            <Download className="w-4 h-4" />
            {t("import")}
          </Link>
          <Link
            href={`/${locale}/recipes/new`}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium",
              "bg-fjord-500 text-white",
              "hover:bg-fjord-600 transition-colors"
            )}
          >
            <Plus className="w-4 h-4" />
            {t("newRecipe")}
          </Link>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="mb-8">
        <RecipeSearch
          value={search}
          onChange={setSearch}
          tags={allTags}
          selectedTags={selectedTags}
          onTagToggle={handleTagToggle}
        />
      </div>

      {/* Grid */}
      <RecipeGrid recipes={filteredRecipes} loading={loading} />

      {/* No results message */}
      {!loading && recipes.length > 0 && filteredRecipes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-fjord-500 dark:text-fjord-400">{t("noResults")}</p>
          <button
            onClick={() => {
              setSearch("");
              setSelectedTags([]);
            }}
            className="mt-2 text-fjord-600 dark:text-fjord-300 hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
