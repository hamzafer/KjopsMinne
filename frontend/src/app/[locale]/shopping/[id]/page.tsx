"use client";

import { ArrowLeft, Trash2, ShoppingCart, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, useCallback } from "react";

import { ShoppingListView } from "@/components/shopping/ShoppingListView";
import { api, formatDate, type ShoppingList } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function ShoppingListDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Shopping");

  const [shoppingList, setShoppingList] = useState<ShoppingList | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadShoppingList() {
      try {
        const data = await api.getShoppingList(params.id as string);
        setShoppingList(data);
      } catch (error) {
        console.error("Failed to load shopping list:", error);
        // Redirect to shopping lists on error
        router.push(`/${locale}/shopping`);
      } finally {
        setLoading(false);
      }
    }
    loadShoppingList();
  }, [params.id, locale, router]);

  const handleToggleItem = useCallback(
    async (itemId: string, isChecked: boolean) => {
      if (!shoppingList) return;

      // Optimistic update
      setUpdatingItems((prev) => new Set(prev).add(itemId));
      setShoppingList((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((item) =>
            item.id === itemId ? { ...item, is_checked: isChecked } : item
          ),
        };
      });

      try {
        await api.updateShoppingListItem(shoppingList.id, itemId, {
          is_checked: isChecked,
        });
      } catch (error) {
        console.error("Failed to update item:", error);
        // Revert on error
        setShoppingList((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            items: prev.items.map((item) =>
              item.id === itemId ? { ...item, is_checked: !isChecked } : item
            ),
          };
        });
      } finally {
        setUpdatingItems((prev) => {
          const next = new Set(prev);
          next.delete(itemId);
          return next;
        });
      }
    },
    [shoppingList]
  );

  const handleComplete = useCallback(async () => {
    if (!shoppingList || !confirm(t("confirmComplete"))) return;

    try {
      await api.updateShoppingList(shoppingList.id, { status: "completed" });
      setShoppingList((prev) => (prev ? { ...prev, status: "completed" } : prev));
    } catch (error) {
      console.error("Failed to complete shopping list:", error);
    }
  }, [shoppingList, t]);

  const handleDelete = useCallback(async () => {
    if (!shoppingList || !confirm(t("confirmDelete"))) return;

    setDeleting(true);
    try {
      await api.deleteShoppingList(shoppingList.id);
      router.push(`/${locale}/shopping`);
    } catch (error) {
      console.error("Failed to delete shopping list:", error);
      setDeleting(false);
    }
  }, [shoppingList, locale, router, t]);

  // Loading state
  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-fjord-400" />
        </div>
      </div>
    );
  }

  // Not found state
  if (!shoppingList) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="paper-card animate-fade-in p-12 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-fjord-100 dark:bg-fjord-800">
            <ShoppingCart className="h-10 w-10 text-fjord-400 dark:text-fjord-500" />
          </div>
          <h2 className="mb-2 font-display text-xl font-semibold text-fjord-800 dark:text-fjord-100">
            {t("empty")}
          </h2>
          <Link
            href={`/${locale}/shopping`}
            className={cn(
              "mt-4 inline-flex items-center gap-2",
              "text-fjord-500 hover:text-fjord-700 dark:hover:text-fjord-300",
              "transition-colors"
            )}
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backToLists")}
          </Link>
        </div>
      </div>
    );
  }

  const startDate = formatDate(shoppingList.date_range_start, locale);
  const endDate = formatDate(shoppingList.date_range_end, locale);

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      {/* Back Link */}
      <Link
        href={`/${locale}/shopping`}
        className={cn(
          "mb-6 inline-flex items-center gap-2",
          "text-fjord-500 hover:text-fjord-700 dark:hover:text-fjord-300",
          "animate-fade-in transition-colors"
        )}
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToLists")}
      </Link>

      {/* Header */}
      <div className="mb-8 flex animate-slide-up flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-forest-500 to-forest-600 shadow-lg shadow-forest-500/20">
            <ShoppingCart className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-fjord-800 dark:text-fjord-100">
              {shoppingList.name}
            </h1>
            <p className="mt-0.5 text-fjord-500 dark:text-fjord-400">
              {t("dateRange", { start: startDate, end: endDate })}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex animate-fade-in gap-2" style={{ animationDelay: "100ms" }}>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2.5 font-medium",
              "text-red-600 dark:text-red-400",
              "hover:bg-red-50 dark:hover:bg-red-900/20",
              "hover:scale-[1.02] active:scale-[0.98]",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "transition-all duration-200"
            )}
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {t("delete")}
          </button>
        </div>
      </div>

      {/* Shopping list view */}
      <div className="animate-fade-in" style={{ animationDelay: "150ms" }}>
        <ShoppingListView
          shoppingList={shoppingList}
          onToggleItem={handleToggleItem}
          onComplete={handleComplete}
          updatingItems={updatingItems}
        />
      </div>
    </div>
  );
}
