"use client";

import { useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { useTranslations } from "@/hooks/use-translations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Star } from "lucide-react";

export default function SubscribePage() {
  const t = useTranslations();
  const [activeItem, setActiveItem] = useState(t("sidebar.subscribe"));

  const subscriptions = [
    {
      name: "tensorflow",
      owner: "tensorflow",
      description: "An Open Source Machine Learning Framework for Everyone",
      subscribed: true,
    },
    {
      name: "kubernetes",
      owner: "kubernetes",
      description: "Production-Grade Container Orchestration",
      subscribed: true,
    },
    {
      name: "rust",
      owner: "rust-lang",
      description: "Empowering everyone to build reliable and efficient software.",
      subscribed: true,
    },
  ];

  return (
    <AppLayout activeItem={activeItem} onItemClick={setActiveItem}>
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{t("sidebar.subscribe")}</h1>
          <p className="text-muted-foreground">
            Repositories you're watching for updates
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {subscriptions.map((repo) => (
            <Card key={`${repo.owner}/${repo.name}`} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{repo.name}</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      {repo.owner}
                    </CardDescription>
                  </div>
                  <Button
                    variant={repo.subscribed ? "default" : "outline"}
                    size="sm"
                    className="gap-1"
                  >
                    {repo.subscribed ? (
                      <>
                        <Bell className="h-3 w-3" />
                        Watching
                      </>
                    ) : (
                      <>
                        <BellOff className="h-3 w-3" />
                        Watch
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">{repo.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
