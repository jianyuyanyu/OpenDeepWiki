"use client";

import { useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { useTranslations } from "@/hooks/use-translations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bookmark, Star, GitFork, Trash2 } from "lucide-react";

export default function BookmarksPage() {
  const t = useTranslations();
  const [activeItem, setActiveItem] = useState(t("sidebar.bookmarks"));

  const bookmarks = [
    {
      name: "awesome-react",
      owner: "enaqx",
      description: "A collection of awesome things regarding React ecosystem",
      stars: 63000,
      forks: 7200,
      savedAt: "3 days ago",
    },
    {
      name: "free-programming-books",
      owner: "EbookFoundation",
      description: "Freely available programming books",
      stars: 335000,
      forks: 61000,
      savedAt: "1 week ago",
    },
    {
      name: "system-design-primer",
      owner: "donnemartin",
      description: "Learn how to design large-scale systems",
      stars: 271000,
      forks: 45800,
      savedAt: "2 weeks ago",
    },
  ];

  return (
    <AppLayout activeItem={activeItem} onItemClick={setActiveItem}>
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{t("sidebar.bookmarks")}</h1>
          <p className="text-muted-foreground">
            Your saved repositories for quick access
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {bookmarks.map((repo) => (
            <Card key={`${repo.owner}/${repo.name}`} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Bookmark className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <CardTitle className="text-lg">{repo.name}</CardTitle>
                    </div>
                    <CardDescription className="text-sm text-muted-foreground mt-1">
                      {repo.owner}
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-3 line-clamp-2">{repo.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      <span>{(repo.stars / 1000).toFixed(0)}k</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <GitFork className="h-3 w-3" />
                      <span>{(repo.forks / 1000).toFixed(1)}k</span>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{repo.savedAt}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
