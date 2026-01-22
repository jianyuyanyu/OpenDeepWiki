"use client";

import { useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { useTranslations } from "@/hooks/use-translations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Lock, GitFork } from "lucide-react";
import { Empty } from "@/components/ui/empty";

export default function PrivatePage() {
  const t = useTranslations();
  const [activeItem, setActiveItem] = useState(t("sidebar.private"));

  const privateRepos = [
    {
      name: "my-secret-project",
      description: "A private project for internal use",
      updatedAt: "2 days ago",
    },
    {
      name: "company-backend",
      description: "Backend services for company applications",
      updatedAt: "1 week ago",
    },
  ];

  return (
    <AppLayout activeItem={activeItem} onItemClick={setActiveItem}>
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{t("sidebar.private")}</h1>
            <p className="text-muted-foreground">
              Manage your private repositories
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            {t("home.addPrivateRepo")}
          </Button>
        </div>

        {privateRepos.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {privateRepos.map((repo) => (
              <Card key={repo.name} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-lg">{repo.name}</CardTitle>
                    </div>
                  </div>
                  <CardDescription className="text-sm">
                    Updated {repo.updatedAt}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{repo.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Empty
            icon={<GitFork className="h-12 w-12" />}
            title="No private repositories"
            description="Add your first private repository to get started"
          />
        )}
      </div>
    </AppLayout>
  );
}
