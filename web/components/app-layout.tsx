"use client";

import React, { useState, useEffect } from "react";
import { AppSidebar } from "@/app/sidebar";
import { SidebarInset, SidebarProvider } from "@/components/animate-ui/components/radix/sidebar";
import { Header } from "@/components/header";
import { useTranslations } from "@/hooks/use-translations";

interface AppLayoutProps {
  children: React.ReactNode;
  activeItem?: string;
  onItemClick?: (item: string) => void;
}

export function AppLayout({ children, activeItem, onItemClick }: AppLayoutProps) {
  const t = useTranslations();
  const defaultActiveItem = activeItem || t("sidebar.explore");
  
  // Get current weekday
  const now = new Date();
  const dayIndex = now.getDay();
  const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const weekdayKey = weekdays[dayIndex];
  const currentWeekday = t(`common.weekdays.${weekdayKey}`);
  
  // TODO: Replace with actual auth state management (e.g., from context or store)
  const [isAuthenticated] = useState(false);
  const [user] = useState({
    name: t("common.user"),
    avatar: "",
    email: "user@example.com"
  });

  return (
    <SidebarProvider>
      <AppSidebar activeItem={defaultActiveItem} onItemClick={onItemClick} />
      <SidebarInset>
        <Header 
          title={defaultActiveItem}
          currentWeekday={currentWeekday}
          isAuthenticated={isAuthenticated}
          user={user}
        />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
