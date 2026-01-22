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
  animationDelay?: number;
}

const UNITS = ["g", "kg", "ml", "dl", "l", "stk", "ss", "ts", "kopp"];

export function IngredientInput({
  ingredient,
  onChange,
  onRemove,
  animationDelay = 0,
}: IngredientInputProps) {
  const t = useTranslations("Recipes");

  const inputClasses = cn(
    "rounded-xl px-3 py-2.5",
    "bg-white dark:bg-fjord-800/50",
    "border border-fjord-200 dark:border-fjord-700",
    "text-fjord-800 dark:text-fjord-100",
    "placeholder:text-fjord-400 dark:placeholder:text-fjord-500",
    "focus:border-fjord-400 focus:outline-none focus:ring-2 focus:ring-fjord-500/50",
    "transition-all duration-200"
  );

  return (
    <div
      className={cn(
        "group flex items-start gap-2 rounded-xl p-3",
        "bg-fjord-50/50 dark:bg-fjord-800/30",
        "border border-transparent hover:border-fjord-200 dark:hover:border-fjord-700",
        "animate-fade-in opacity-0",
        "transition-all duration-200"
      )}
      style={{
        animationDelay: `${animationDelay}ms`,
        animationFillMode: "forwards",
      }}
    >
      <input
        type="number"
        value={ingredient.quantity || ""}
        onChange={(e) => onChange({ ...ingredient, quantity: parseFloat(e.target.value) || 0 })}
        placeholder={t("quantity")}
        className={cn(inputClasses, "w-20")}
        min="0"
        step="0.1"
      />

      <select
        value={ingredient.unit}
        onChange={(e) => onChange({ ...ingredient, unit: e.target.value })}
        className={cn(inputClasses, "w-24 cursor-pointer")}
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
        onChange={(e) => onChange({ ...ingredient, ingredient_name: e.target.value })}
        placeholder={t("ingredientName")}
        className={cn(inputClasses, "min-w-0 flex-1")}
      />

      <input
        type="text"
        value={ingredient.notes || ""}
        onChange={(e) => onChange({ ...ingredient, notes: e.target.value || null })}
        placeholder={t("notes")}
        className={cn(inputClasses, "hidden w-32 sm:block")}
      />

      <button
        type="button"
        onClick={onRemove}
        className={cn(
          "rounded-xl p-2.5",
          "text-fjord-400 hover:text-red-500",
          "hover:bg-red-50 dark:hover:bg-red-900/20",
          "hover:scale-110 active:scale-95",
          "transition-all duration-200"
        )}
      >
        <Trash2 className="h-5 w-5" />
      </button>
    </div>
  );
}
