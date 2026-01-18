"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Upload,
  Receipt,
  BarChart3,
  Vault
} from "lucide-react";

const navItems = [
  { href: "/", label: "Oversikt", icon: LayoutDashboard },
  { href: "/upload", label: "Last opp", icon: Upload },
  { href: "/receipts", label: "Kvitteringer", icon: Receipt },
  { href: "/analytics", label: "Analyse", icon: BarChart3 },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-cream/80 backdrop-blur-md border-b border-fjord-100/50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-fjord-500 to-fjord-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <Vault className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-xl text-fjord-700 tracking-tight">
              Kvitteringshvelv
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-fjord-500 text-white shadow-sm"
                      : "text-fjord-600 hover:bg-fjord-50 hover:text-fjord-700"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
