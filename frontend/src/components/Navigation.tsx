"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Upload,
  Receipt,
  BarChart3,
  Vault,
  ChefHat,
  CalendarDays,
  Soup
} from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeSwitcher } from "./ThemeSwitcher";

export function Navigation() {
  const pathname = usePathname();
  const t = useTranslations("Navigation");
  const locale = useLocale();

  const navItems = [
    { href: `/${locale}`, label: t("dashboard"), icon: LayoutDashboard },
    { href: `/${locale}/upload`, label: t("upload"), icon: Upload },
    { href: `/${locale}/receipts`, label: t("receipts"), icon: Receipt },
    { href: `/${locale}/recipes`, label: t("recipes"), icon: ChefHat },
    { href: `/${locale}/plan`, label: t("plan"), icon: CalendarDays },
    { href: `/${locale}/leftovers`, label: t("leftovers"), icon: Soup },
    { href: `/${locale}/analytics`, label: t("analytics"), icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-50 bg-cream/80 dark:bg-[#1a2332]/80 backdrop-blur-md border-b border-fjord-100/50 dark:border-fjord-700/50 transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href={`/${locale}`}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-fjord-500 to-fjord-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <Vault className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-xl text-fjord-700 dark:text-fjord-200 tracking-tight hidden sm:inline">
              {t("appName")}
            </span>
          </Link>

          {/* Navigation + Language Switcher */}
          <div className="flex items-center gap-3">
            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href ||
                  (item.href !== `/${locale}` && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-fjord-500 text-white shadow-sm"
                        : "text-fjord-600 dark:text-fjord-300 hover:bg-fjord-50 dark:hover:bg-fjord-800/50 hover:text-fjord-700 dark:hover:text-fjord-100"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <ThemeSwitcher />
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
}
