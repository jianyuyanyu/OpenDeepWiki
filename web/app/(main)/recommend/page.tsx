"use client";

import { useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { useTranslations } from "@/hooks/use-translations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, GitFork, Eye } from "lucide-react";

export default function RecommendPage() {
  const t = useTranslations();
  const [activeItem, setActiveItem] = useState(t("sidebar.recommend"));

  const recommendedRepos = [
    {
      name: "react",
      owner: "facebook",
      description: "A declarative, efficient, and flexible JavaScript library for building user interfaces.",
      stars: 228000,
      forks: 46500,
      watchers: 6800,
    },
    {
      name: "vue",
      owner: "vuejs",
      description: "Vue.js is a progressive, incrementally-adoptable JavaScript framework for building UI on the web.",
      stars: 207000,
      forks: 33800,
      watchers: 6200,
    },
    {
      name: "next.js",
      owner: "vercel",
      description: "The React Framework for the Web",
      stars: 125000,
      forks: 26700,
      watchers: 1900,
    },
  ];

  return (
    <AppLayout activeItem={activeItem} onItemClick={setActiveItem}>
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{t("sidebar.recommend")}</h1>
          <p className="text-muted-foreground">
            Discover trending and recommended repositories
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recommendedRepos.map((repo) => (
            <Card key={`${repo.owner}/${repo.name}`} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{repo.name}</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  {repo.owner}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4 line-clamp-2">{repo.description}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4" />
                    <span>{(repo.stars / 1000).toFixed(1)}k</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <GitFork className="h-4 w-4" />
                    <span>{(repo.forks / 1000).toFixed(1)}k</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>{(repo.watchers / 1000).toFixed(1)}k</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
