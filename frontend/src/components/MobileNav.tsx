"use client";

import {
  LayoutDashboard,
  Upload,
  Receipt,
  BarChart3,
  Vault,
  ChefHat,
  CalendarDays,
  Soup,
  ShoppingCart,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useState, useEffect } from "react";

import { cn } from "@/lib/utils";

import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeSwitcher } from "./ThemeSwitcher";

export function MobileNav() {
  const pathname = usePathname();
  const t = useTranslations("Navigation");
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const navItems = [
    { href: `/${locale}`, label: t("dashboard"), icon: LayoutDashboard },
    { href: `/${locale}/receipts`, label: t("receipts"), icon: Receipt },
    { href: `/${locale}/upload`, label: t("upload"), icon: Upload },
    { href: `/${locale}/recipes`, label: t("recipes"), icon: ChefHat },
    { href: `/${locale}/plan`, label: t("plan"), icon: CalendarDays },
    { href: `/${locale}/shopping`, label: t("shopping"), icon: ShoppingCart },
    { href: `/${locale}/leftovers`, label: t("leftovers"), icon: Soup },
    { href: `/${locale}/analytics`, label: t("analytics"), icon: BarChart3 },
  ];

  return (
    <>
      {/* Mobile Header Bar */}
      <header className="fixed left-0 right-0 top-0 z-50 h-14 border-b border-fjord-100/50 bg-cream/95 backdrop-blur-md dark:border-fjord-700/30 dark:bg-[#1a2332]/95 lg:hidden">
        <div className="flex h-full items-center justify-between px-4">
          {/* Hamburger */}
          <button
            onClick={() => setIsOpen(true)}
            className="-ml-2 rounded-xl p-2 text-fjord-600 transition-colors hover:bg-fjord-50 dark:text-fjord-300 dark:hover:bg-fjord-800/50"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-fjord-500 to-fjord-600 shadow-sm">
              <Vault className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-lg tracking-tight text-fjord-700 dark:text-fjord-200">
              {t("appName")}
            </span>
          </Link>

          {/* Theme Switcher */}
          <ThemeSwitcher />
        </div>
      </header>

      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden",
          "transition-opacity duration-300",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-[280px] lg:hidden",
          "bg-cream dark:bg-[#1a2332]",
          "border-r border-fjord-100/50 dark:border-fjord-700/30",
          "transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Drawer Header */}
        <div className="flex h-14 items-center justify-between border-b border-fjord-100/50 px-4 dark:border-fjord-700/30">
          <Link
            href={`/${locale}`}
            className="flex items-center gap-2"
            onClick={() => setIsOpen(false)}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-fjord-500 to-fjord-600 shadow-sm">
              <Vault className="h-5 w-5 text-white" />
            </div>
            <span className="font-display text-xl tracking-tight text-fjord-700 dark:text-fjord-200">
              {t("appName")}
            </span>
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="-mr-2 rounded-xl p-2 text-fjord-600 transition-colors hover:bg-fjord-50 dark:text-fjord-300 dark:hover:bg-fjord-800/50"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== `/${locale}` && pathname.startsWith(item.href));

              return (
                <li
                  key={item.href}
                  className="animate-in slide-in-from-left-4 fade-in"
                  style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium",
                      "transition-all duration-200",
                      isActive
                        ? "bg-fjord-500 text-white shadow-sm"
                        : "text-fjord-600 hover:bg-fjord-50 hover:text-fjord-700 dark:text-fjord-300 dark:hover:bg-fjord-800/50 dark:hover:text-fjord-100"
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-fjord-100/50 p-4 dark:border-fjord-700/30">
          <div className="flex items-center justify-between">
            <span className="text-sm text-fjord-500 dark:text-fjord-400">{t("language")}</span>
            <LanguageSwitcher />
          </div>
        </div>
      </aside>
    </>
  );
}
