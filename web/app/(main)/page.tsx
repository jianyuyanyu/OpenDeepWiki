"use client";

import { useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Flame, Puzzle } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";

export default function Home() {
  const t = useTranslations();
  const [activeItem, setActiveItem] = useState(t("sidebar.explore"));

  return (
    <AppLayout activeItem={activeItem} onItemClick={setActiveItem}>
      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-8">
          <h1 className="text-center text-4xl font-medium tracking-tight text-foreground">
            {t("home.title")}
          </h1>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Search className="h-5 w-5" />
            </div>
            <Input
              placeholder={t("home.searchPlaceholder")}
              className="h-14 rounded-full pl-12 text-lg shadow-sm transition-all hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary/20 bg-secondary/50 border-transparent"
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button variant="secondary" className="gap-2 rounded-full h-10 px-6 bg-teal-500/10 text-teal-500 hover:bg-teal-500/20 hover:text-teal-400 border border-teal-500/20">
              <Plus className="h-4 w-4" />
              {t("home.addPrivateRepo")}
            </Button>
            <Button variant="secondary" className="gap-2 rounded-full h-10 px-6 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 hover:text-blue-400 border border-blue-500/20">
              <Flame className="h-4 w-4" />
              {t("home.exploreTrending")}
            </Button>
          </div>
          <div className="flex justify-center">
            <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
              <Puzzle className="h-4 w-4" />
              {t("home.mcpIntegration")}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
