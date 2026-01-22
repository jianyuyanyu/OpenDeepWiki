"use client";

import React from "react";
import { SidebarProvider, SidebarInset } from "@/components/animate-ui/components/radix/sidebar";
import { Header } from "@/components/header";
import { RepoSidebar } from "@/components/repo/repo-sidebar";
import { useTranslations } from "@/hooks/use-translations";
import type { RepoTreeNode } from "@/types/repository";

interface RepoShellProps {
  owner: string;
  repo: string;
  nodes: RepoTreeNode[];
  children: React.ReactNode;
}

export function RepoShell({ owner, repo, nodes, children }: RepoShellProps) {
  const t = useTranslations();
  const now = new Date();
  const dayIndex = now.getDay();
  const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const weekdayKey = weekdays[dayIndex];
  const currentWeekday = t(`common.weekdays.${weekdayKey}`);
  const title = `${owner}/${repo}`;

  const user = {
    name: t("common.user"),
    avatar: "",
    email: "user@example.com",
  };

  return (
    <SidebarProvider>
      <RepoSidebar owner={owner} repo={repo} nodes={nodes} />
      <SidebarInset>
        <Header
          title={title}
          currentWeekday={currentWeekday}
          isAuthenticated={false}
          user={user}
        />
        <div className="flex min-h-[calc(100vh-4rem)] flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
