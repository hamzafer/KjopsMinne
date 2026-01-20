"use client";

import { Search, X, Tag } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface RecipeSearchProps {
  value: string;
  onChange: (value: string) => void;
  tags: string[];
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
}

export function RecipeSearch({
  value,
  onChange,
  tags,
  selectedTags,
  onTagToggle,
}: RecipeSearchProps) {
  const t = useTranslations("Recipes");

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-fjord-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("search")}
          className={cn(
            "w-full pl-12 pr-10 py-3.5 rounded-xl",
            "bg-white dark:bg-fjord-800/50",
            "border border-fjord-200 dark:border-fjord-700",
            "text-fjord-800 dark:text-fjord-100",
            "placeholder:text-fjord-400 dark:placeholder:text-fjord-500",
            "focus:outline-none focus:ring-2 focus:ring-fjord-500/50 focus:border-fjord-400",
            "transition-all duration-200"
          )}
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg",
              "hover:bg-fjord-100 dark:hover:bg-fjord-700",
              "transition-colors"
            )}
          >
            <X className="w-4 h-4 text-fjord-400" />
          </button>
        )}
      </div>

      {/* Tag Filters */}
      {tags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-fjord-400 dark:text-fjord-500 mr-1">
            <Tag className="w-4 h-4" />
          </div>
          {tags.map((tag, index) => (
            <button
              key={tag}
              onClick={() => onTagToggle(tag)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium",
                "transition-all duration-200",
                "hover:scale-105 active:scale-95",
                "animate-fade-in",
                selectedTags.includes(tag)
                  ? "bg-fjord-500 text-white shadow-md shadow-fjord-500/20"
                  : "bg-fjord-100 dark:bg-fjord-800 text-fjord-600 dark:text-fjord-300 hover:bg-fjord-200 dark:hover:bg-fjord-700"
              )}
              style={{ animationDelay: `${index * 30}ms` }}
            >
              {tag}
            </button>
          ))}
          {selectedTags.length > 0 && (
            <button
              onClick={() => selectedTags.forEach(onTagToggle)}
              className="px-3 py-1.5 text-sm text-fjord-500 hover:text-fjord-700 dark:hover:text-fjord-300"
            >
              {t("clearFilters")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
