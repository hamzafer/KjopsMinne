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
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { useSidebar } from "./SidebarContext";

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
    { href: `/${locale}/upload`, label: t("upload"), icon: Upload },
    { href: `/${locale}/receipts`, label: t("receipts"), icon: Receipt },
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
        "bg-cream/95 dark:bg-[#1a2332]/95 backdrop-blur-md",
        "border-r border-fjord-100/50 dark:border-fjord-700/30",
        "transition-all duration-300 ease-out",
        "hidden lg:flex flex-col",
        isCollapsed ? "w-[72px]" : "w-[240px]",
        className
      )}
    >
      {/* Logo Section */}
      <div
        className={cn(
          "flex items-center h-16 border-b border-fjord-100/50 dark:border-fjord-700/30",
          isCollapsed ? "justify-center px-3" : "px-5"
        )}
      >
        <Link
          href={`/${locale}`}
          className={cn(
            "flex items-center gap-3 group",
            isCollapsed && "justify-center"
          )}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fjord-500 to-fjord-600 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
            <Vault className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <span className="font-display text-xl text-fjord-700 dark:text-fjord-200 tracking-tight">
              {t("appName")}
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
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
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium",
                    "transition-all duration-200",
                    isCollapsed && "justify-center px-2",
                    isActive
                      ? "bg-fjord-500 text-white shadow-sm"
                      : "text-fjord-600 dark:text-fjord-300 hover:bg-fjord-50 dark:hover:bg-fjord-800/50 hover:text-fjord-700 dark:hover:text-fjord-100"
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon
                    className={cn("w-5 h-5 flex-shrink-0", isCollapsed && "w-5 h-5")}
                  />
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
          "border-t border-fjord-100/50 dark:border-fjord-700/30 p-3",
          "flex flex-col gap-2"
        )}
      >
        {/* Theme & Language */}
        <div
          className={cn(
            "flex items-center",
            isCollapsed ? "flex-col gap-2" : "justify-between"
          )}
        >
          <ThemeSwitcher />
          <LanguageSwitcher />
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={toggleCollapse}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium w-full",
            "text-fjord-500 dark:text-fjord-400 hover:bg-fjord-50 dark:hover:bg-fjord-800/50",
            "transition-all duration-200",
            isCollapsed && "justify-center px-2"
          )}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <PanelLeft className="w-5 h-5" />
          ) : (
            <>
              <PanelLeftClose className="w-5 h-5" />
              <span>{t("collapse")}</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
