"use client";

import { Plus, Utensils } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import { IngredientInput } from "./IngredientInput";

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
    onChange([...ingredients, { ingredient_name: "", quantity: 0, unit: "g", notes: null }]);
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
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center gap-2">
        <Utensils className="h-4 w-4 text-fjord-400" />
        <label className="text-sm font-medium text-fjord-700 dark:text-fjord-200">
          {t("ingredients")}
        </label>
        <span className="text-xs text-fjord-400 dark:text-fjord-500">({ingredients.length})</span>
      </div>

      <div className="space-y-2">
        {ingredients.map((ingredient, index) => (
          <IngredientInput
            key={index}
            ingredient={ingredient}
            onChange={(ing) => handleChange(index, ing)}
            onRemove={() => handleRemove(index)}
            animationDelay={index * 50}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={handleAdd}
        className={cn(
          "flex items-center gap-2 rounded-xl px-4 py-2.5",
          "font-medium text-fjord-600 dark:text-fjord-300",
          "bg-fjord-100/50 dark:bg-fjord-800/50",
          "hover:bg-fjord-200/70 dark:hover:bg-fjord-700/50",
          "border border-dashed border-fjord-300 dark:border-fjord-600",
          "hover:border-fjord-400 dark:hover:border-fjord-500",
          "hover:scale-[1.02] active:scale-[0.98]",
          "transition-all duration-200"
        )}
      >
        <Plus className="h-4 w-4" />
        {t("addIngredient")}
      </button>
    </div>
  );
}
