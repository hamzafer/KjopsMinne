"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./SidebarContext";

interface MainContentProps {
  children: ReactNode;
}

export function MainContent({ children }: MainContentProps) {
  const { isCollapsed } = useSidebar();

  return (
    <main
      className={cn(
        "min-h-screen pb-12 transition-all duration-300",
        // Mobile: top padding for mobile header
        "pt-14 lg:pt-0",
        // Desktop: left padding for sidebar
        isCollapsed ? "lg:pl-[72px]" : "lg:pl-[240px]"
      )}
    >
      {children}
    </main>
  );
}
