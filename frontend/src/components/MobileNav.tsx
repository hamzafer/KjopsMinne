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
  Soup,
  ShoppingCart,
  Menu,
  X,
} from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { useState, useEffect } from "react";

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
      <header className="fixed top-0 left-0 right-0 z-50 lg:hidden h-14 bg-cream/95 dark:bg-[#1a2332]/95 backdrop-blur-md border-b border-fjord-100/50 dark:border-fjord-700/30">
        <div className="flex items-center justify-between h-full px-4">
          {/* Hamburger */}
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 -ml-2 rounded-xl text-fjord-600 dark:text-fjord-300 hover:bg-fjord-50 dark:hover:bg-fjord-800/50 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fjord-500 to-fjord-600 flex items-center justify-center shadow-sm">
              <Vault className="w-4 h-4 text-white" />
            </div>
            <span className="font-display text-lg text-fjord-700 dark:text-fjord-200 tracking-tight">
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
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-[280px] lg:hidden",
          "bg-cream dark:bg-[#1a2332]",
          "border-r border-fjord-100/50 dark:border-fjord-700/30",
          "transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-fjord-100/50 dark:border-fjord-700/30">
          <Link
            href={`/${locale}`}
            className="flex items-center gap-2"
            onClick={() => setIsOpen(false)}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-fjord-500 to-fjord-600 flex items-center justify-center shadow-sm">
              <Vault className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-xl text-fjord-700 dark:text-fjord-200 tracking-tight">
              {t("appName")}
            </span>
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 -mr-2 rounded-xl text-fjord-600 dark:text-fjord-300 hover:bg-fjord-50 dark:hover:bg-fjord-800/50 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
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
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium",
                      "transition-all duration-200",
                      isActive
                        ? "bg-fjord-500 text-white shadow-sm"
                        : "text-fjord-600 dark:text-fjord-300 hover:bg-fjord-50 dark:hover:bg-fjord-800/50 hover:text-fjord-700 dark:hover:text-fjord-100"
                    )}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-fjord-100/50 dark:border-fjord-700/30 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-fjord-500 dark:text-fjord-400">
              {t("language")}
            </span>
            <LanguageSwitcher />
          </div>
        </div>
      </aside>
    </>
  );
}
