"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";

import { routing, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const localeLabels: Record<Locale, string> = {
  nb: "NO",
  en: "EN",
};

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: Locale) => {
    if (newLocale === locale) return;

    // Replace the locale segment in the pathname
    const segments = pathname.split("/");
    segments[1] = newLocale;
    const newPath = segments.join("/");
    router.push(newPath);
  };

  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-fjord-100 p-0.5 transition-colors duration-200 dark:bg-slate-800">
      {routing.locales.map((loc) => (
        <button
          key={loc}
          onClick={() => switchLocale(loc)}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-200",
            locale === loc
              ? "bg-white text-fjord-700 shadow-sm dark:bg-slate-700 dark:text-slate-100"
              : "text-fjord-400 hover:text-fjord-600 dark:text-slate-400 dark:hover:text-slate-200"
          )}
        >
          {localeLabels[loc]}
        </button>
      ))}
    </div>
  );
}
