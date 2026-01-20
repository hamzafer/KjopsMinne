"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface IngredientInputProps {
  ingredient: {
    ingredient_name: string;
    quantity: number;
    unit: string;
    notes: string | null;
  };
  onChange: (ingredient: IngredientInputProps["ingredient"]) => void;
  onRemove: () => void;
}

const UNITS = ["g", "kg", "ml", "dl", "l", "stk", "ss", "ts", "kopp"];

export function IngredientInput({
  ingredient,
  onChange,
  onRemove,
}: IngredientInputProps) {
  const t = useTranslations("Recipes");

  const inputClasses = cn(
    "px-3 py-2 rounded-lg",
    "bg-white dark:bg-fjord-800",
    "border border-fjord-200 dark:border-fjord-700",
    "text-fjord-800 dark:text-fjord-100",
    "placeholder:text-fjord-400",
    "focus:outline-none focus:ring-2 focus:ring-fjord-500/50",
    "transition-all"
  );

  return (
    <div className="flex gap-2 items-start">
      <input
        type="number"
        value={ingredient.quantity || ""}
        onChange={(e) =>
          onChange({ ...ingredient, quantity: parseFloat(e.target.value) || 0 })
        }
        placeholder={t("quantity")}
        className={cn(inputClasses, "w-20")}
        min="0"
        step="0.1"
      />

      <select
        value={ingredient.unit}
        onChange={(e) => onChange({ ...ingredient, unit: e.target.value })}
        className={cn(inputClasses, "w-24")}
      >
        {UNITS.map((unit) => (
          <option key={unit} value={unit}>
            {unit}
          </option>
        ))}
      </select>

      <input
        type="text"
        value={ingredient.ingredient_name}
        onChange={(e) =>
          onChange({ ...ingredient, ingredient_name: e.target.value })
        }
        placeholder={t("ingredientName")}
        className={cn(inputClasses, "flex-1")}
      />

      <input
        type="text"
        value={ingredient.notes || ""}
        onChange={(e) =>
          onChange({ ...ingredient, notes: e.target.value || null })
        }
        placeholder={t("notes")}
        className={cn(inputClasses, "w-32")}
      />

      <button
        type="button"
        onClick={onRemove}
        className="p-2 text-fjord-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  );
}
