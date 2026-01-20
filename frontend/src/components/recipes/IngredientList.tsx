"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { IngredientInput } from "./IngredientInput";
import { cn } from "@/lib/utils";

interface Ingredient {
  ingredient_name: string;
  quantity: number;
  unit: string;
  notes: string | null;
}

interface IngredientListProps {
  ingredients: Ingredient[];
  onChange: (ingredients: Ingredient[]) => void;
}

export function IngredientList({ ingredients, onChange }: IngredientListProps) {
  const t = useTranslations("Recipes");

  const handleAdd = () => {
    onChange([
      ...ingredients,
      { ingredient_name: "", quantity: 0, unit: "g", notes: null },
    ]);
  };

  const handleChange = (index: number, ingredient: Ingredient) => {
    const updated = [...ingredients];
    updated[index] = ingredient;
    onChange(updated);
  };

  const handleRemove = (index: number) => {
    onChange(ingredients.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-fjord-700 dark:text-fjord-200">
        {t("ingredients")}
      </label>

      <div className="space-y-2">
        {ingredients.map((ingredient, index) => (
          <IngredientInput
            key={index}
            ingredient={ingredient}
            onChange={(ing) => handleChange(index, ing)}
            onRemove={() => handleRemove(index)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={handleAdd}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg",
          "text-fjord-600 dark:text-fjord-300",
          "hover:bg-fjord-100 dark:hover:bg-fjord-800",
          "transition-colors"
        )}
      >
        <Plus className="w-4 h-4" />
        {t("addIngredient")}
      </button>
    </div>
  );
}
