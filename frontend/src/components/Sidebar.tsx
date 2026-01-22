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
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";

import { cn } from "@/lib/utils";

import { LanguageSwitcher } from "./LanguageSwitcher";
import { useSidebar } from "./SidebarContext";
import { ThemeSwitcher } from "./ThemeSwitcher";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const t = useTranslations("Navigation");
  const locale = useLocale();
  const { isCollapsed, toggleCollapse } = useSidebar();

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
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen",
        "bg-cream/95 backdrop-blur-md dark:bg-[#1a2332]/95",
        "border-r border-fjord-100/50 dark:border-fjord-700/30",
        "transition-all duration-300 ease-out",
        "hidden flex-col lg:flex",
        isCollapsed ? "w-[72px]" : "w-[240px]",
        className
      )}
    >
      {/* Logo Section */}
      <div
        className={cn(
          "flex h-16 items-center border-b border-fjord-100/50 dark:border-fjord-700/30",
          isCollapsed ? "justify-center px-3" : "px-5"
        )}
      >
        <Link
          href={`/${locale}`}
          className={cn("group flex items-center gap-3", isCollapsed && "justify-center")}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-fjord-500 to-fjord-600 shadow-sm transition-all duration-200 group-hover:scale-105 group-hover:shadow-md">
            <Vault className="h-5 w-5 text-white" />
          </div>
          {!isCollapsed && (
            <span className="font-display text-xl tracking-tight text-fjord-700 dark:text-fjord-200">
              {t("appName")}
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== `/${locale}` && pathname.startsWith(item.href));

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                    "transition-all duration-200",
                    isCollapsed && "justify-center px-2",
                    isActive
                      ? "bg-fjord-500 text-white shadow-sm"
                      : "text-fjord-600 hover:bg-fjord-50 hover:text-fjord-700 dark:text-fjord-300 dark:hover:bg-fjord-800/50 dark:hover:text-fjord-100"
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className={cn("h-5 w-5 flex-shrink-0", isCollapsed && "h-5 w-5")} />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Section */}
      <div
        className={cn(
          "border-t border-fjord-100/50 p-3 dark:border-fjord-700/30",
          "flex flex-col gap-2"
        )}
      >
        {/* Theme & Language */}
        <div
          className={cn("flex items-center", isCollapsed ? "flex-col gap-2" : "justify-between")}
        >
          <ThemeSwitcher />
          <LanguageSwitcher />
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={toggleCollapse}
          className={cn(
            "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium",
            "text-fjord-500 hover:bg-fjord-50 dark:text-fjord-400 dark:hover:bg-fjord-800/50",
            "transition-all duration-200",
            isCollapsed && "justify-center px-2"
          )}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <PanelLeft className="h-5 w-5" />
          ) : (
            <>
              <PanelLeftClose className="h-5 w-5" />
              <span>{t("collapse")}</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
