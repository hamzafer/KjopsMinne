"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
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
    <div className="flex items-center gap-0.5 bg-fjord-50 rounded-lg p-0.5">
      {routing.locales.map((loc) => (
        <button
          key={loc}
          onClick={() => switchLocale(loc)}
          className={cn(
            "px-2.5 py-1 text-xs font-medium rounded-md transition-all",
            locale === loc
              ? "bg-white text-fjord-700 shadow-sm"
              : "text-fjord-400 hover:text-fjord-600"
          )}
        >
          {localeLabels[loc]}
        </button>
      ))}
    </div>
  );
}
