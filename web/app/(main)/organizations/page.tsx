"use client";

import { useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { useTranslations } from "@/hooks/use-translations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Building2, Users, GitFork, ExternalLink } from "lucide-react";

export default function OrganizationsPage() {
  const t = useTranslations();
  const [activeItem, setActiveItem] = useState(t("sidebar.organizations"));

  const organizations = [
    {
      name: "Microsoft",
      handle: "microsoft",
      description: "Open source projects and samples from Microsoft",
      avatar: "https://avatars.githubusercontent.com/u/6154722?s=200&v=4",
      members: 5800,
      repos: 6200,
    },
    {
      name: "Google",
      handle: "google",
      description: "Google's open source projects",
      avatar: "https://avatars.githubusercontent.com/u/1342004?s=200&v=4",
      members: 2100,
      repos: 2500,
    },
    {
      name: "Meta",
      handle: "facebook",
      description: "Open source projects from Meta",
      avatar: "https://avatars.githubusercontent.com/u/69631?s=200&v=4",
      members: 1800,
      repos: 180,
    },
    {
      name: "Vercel",
      handle: "vercel",
      description: "Develop. Preview. Ship.",
      avatar: "https://avatars.githubusercontent.com/u/14985020?s=200&v=4",
      members: 180,
      repos: 150,
    },
  ];

  return (
    <AppLayout activeItem={activeItem} onItemClick={setActiveItem}>
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{t("sidebar.organizations")}</h1>
          <p className="text-muted-foreground">
            Browse repositories from popular organizations
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => (
            <Card key={org.handle} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={org.avatar} alt={org.name} />
                    <AvatarFallback>
                      <Building2 className="h-8 w-8" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{org.name}</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      @{org.handle}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {org.description}
                </p>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{org.members.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <GitFork className="h-4 w-4" />
                      <span>{org.repos.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" className="w-full gap-2" size="sm">
                  <ExternalLink className="h-3 w-3" />
                  View Organization
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
