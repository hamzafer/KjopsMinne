"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { api, type Recipe, type RecipeCreate } from "@/lib/api";
import { cn } from "@/lib/utils";

import { IngredientList } from "./IngredientList";

interface RecipeFormProps {
  recipe?: Recipe;
  defaultValues?: Partial<RecipeCreate>;
  householdId: string;
}

export function RecipeForm({ recipe, defaultValues, householdId }: RecipeFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Recipes");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(recipe?.name ?? defaultValues?.name ?? "");
  const [servings, setServings] = useState(recipe?.servings ?? defaultValues?.servings ?? 2);
  const [prepTime, setPrepTime] = useState<number | "">(
    recipe?.prep_time_minutes ?? defaultValues?.prep_time_minutes ?? ""
  );
  const [tags, setTags] = useState((recipe?.tags ?? defaultValues?.tags ?? []).join(", "));
  const [instructions, setInstructions] = useState(
    recipe?.instructions ?? defaultValues?.instructions ?? ""
  );
  const [ingredients, setIngredients] = useState(
    recipe?.ingredients.map((i) => ({
      ingredient_name: i.ingredient_name,
      quantity: i.quantity,
      unit: i.unit,
      notes: i.notes,
    })) ??
      defaultValues?.ingredients?.map((i) => ({
        ingredient_name: i.ingredient_name,
        quantity: i.quantity,
        unit: i.unit,
        notes: i.notes,
      })) ?? [{ ingredient_name: "", quantity: 0, unit: "g", notes: null }]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const data: RecipeCreate = {
        household_id: householdId,
        name,
        servings,
        prep_time_minutes: prepTime || null,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        instructions,
        ingredients: ingredients
          .filter((i) => i.ingredient_name.trim())
          .map((i) => ({
            ingredient_id: null,
            ingredient_name: i.ingredient_name,
            quantity: i.quantity,
            unit: i.unit,
            notes: i.notes,
          })),
        source_url: recipe?.source_url ?? defaultValues?.source_url,
        image_url: recipe?.image_url ?? defaultValues?.image_url,
      };

      if (recipe) {
        await api.updateRecipe(recipe.id, data);
      } else {
        await api.createRecipe(data);
      }

      router.push(`/${locale}/recipes`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const inputClasses = cn(
    "w-full rounded-xl px-4 py-3",
    "bg-white dark:bg-fjord-800/50",
    "border border-fjord-200 dark:border-fjord-700",
    "text-fjord-800 dark:text-fjord-100",
    "placeholder:text-fjord-400",
    "focus:outline-none focus:ring-2 focus:ring-fjord-500/50",
    "transition-all"
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="animate-fade-in rounded-xl border border-red-200 bg-red-50 p-4 text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Name */}
      <div className="animate-fade-in" style={{ animationDelay: "0ms" }}>
        <label className="mb-2 block text-sm font-medium text-fjord-700 dark:text-fjord-200">
          {t("nameLabel")} *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("namePlaceholder")}
          className={inputClasses}
          required
        />
      </div>

      {/* Servings & Prep Time */}
      <div className="grid animate-fade-in grid-cols-2 gap-4" style={{ animationDelay: "50ms" }}>
        <div>
          <label className="mb-2 block text-sm font-medium text-fjord-700 dark:text-fjord-200">
            {t("servingsLabel")} *
          </label>
          <input
            type="number"
            value={servings}
            onChange={(e) => setServings(parseInt(e.target.value) || 1)}
            className={inputClasses}
            min="1"
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-fjord-700 dark:text-fjord-200">
            {t("prepTimeLabel")}
          </label>
          <input
            type="number"
            value={prepTime}
            onChange={(e) => setPrepTime(e.target.value ? parseInt(e.target.value) : "")}
            placeholder={t("prepTimePlaceholder")}
            className={inputClasses}
            min="1"
          />
        </div>
      </div>

      {/* Tags */}
      <div className="animate-fade-in" style={{ animationDelay: "100ms" }}>
        <label className="mb-2 block text-sm font-medium text-fjord-700 dark:text-fjord-200">
          {t("tagsLabel")}
        </label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder={t("tagsPlaceholder")}
          className={inputClasses}
        />
      </div>

      {/* Ingredients */}
      <div className="animate-fade-in" style={{ animationDelay: "150ms" }}>
        <IngredientList ingredients={ingredients} onChange={setIngredients} />
      </div>

      {/* Instructions */}
      <div className="animate-fade-in" style={{ animationDelay: "200ms" }}>
        <label className="mb-2 block text-sm font-medium text-fjord-700 dark:text-fjord-200">
          {t("instructionsLabel")}
        </label>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder={t("instructionsPlaceholder")}
          className={cn(inputClasses, "min-h-[200px] resize-y")}
          rows={8}
        />
      </div>

      {/* Actions */}
      <div
        className="flex animate-fade-in justify-end gap-3 border-t border-fjord-200 pt-4 dark:border-fjord-700"
        style={{ animationDelay: "250ms" }}
      >
        <button
          type="button"
          onClick={() => router.back()}
          className={cn(
            "rounded-xl px-5 py-2.5 font-medium",
            "text-fjord-600 dark:text-fjord-300",
            "hover:bg-fjord-100 dark:hover:bg-fjord-800",
            "hover:scale-[1.02] active:scale-[0.98]",
            "transition-all duration-200"
          )}
        >
          {t("cancel")}
        </button>
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className={cn(
            "rounded-xl px-5 py-2.5 font-medium",
            "bg-fjord-500 text-white",
            "hover:bg-fjord-600 disabled:cursor-not-allowed disabled:opacity-50",
            "shadow-lg shadow-fjord-500/20",
            "hover:scale-[1.02] active:scale-[0.98]",
            "flex items-center gap-2 transition-all duration-200"
          )}
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? t("saving") : t("save")}
        </button>
      </div>
    </form>
  );
}
