"use client";

import { useEffect, useState, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/hooks/use-translations";
import { fetchRepositoryList } from "@/lib/repository-api";
import { PublicRepositoryCard } from "./public-repository-card";
import type { RepositoryItemResponse } from "@/types/repository";
import { GitBranch, XCircle, RefreshCw, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface PublicRepositoryListProps {
  keyword: string;
  className?: string;
}

function RepositoryGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="p-4 border rounded-lg">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PublicRepositoryList({ keyword, className }: PublicRepositoryListProps) {
  const t = useTranslations();
  const [repositories, setRepositories] = useState<RepositoryItemResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRepositories = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetchRepositoryList({
        isPublic: true,
        sortBy: "createdAt",
        sortOrder: "desc",
        keyword: keyword || undefined,
      });
      setRepositories(response.items);
    } catch (err) {
      setError("Failed to load repositories");
      console.error("Failed to fetch public repositories:", err);
    } finally {
      setIsLoading(false);
    }
  }, [keyword]);

  useEffect(() => {
    loadRepositories();
  }, [loadRepositories]);

  // 客户端过滤（作为服务端过滤的补充）
  const filteredRepositories = repositories.filter((repo) => {
    if (!keyword) return true;
    const lowerKeyword = keyword.toLowerCase();
    return (
      repo.orgName.toLowerCase().includes(lowerKeyword) ||
      repo.repoName.toLowerCase().includes(lowerKeyword)
    );
  });

  if (isLoading && repositories.length === 0) {
    return (
      <div className={cn("w-full", className)}>
        <h2 className="text-xl font-semibold mb-4">
          {t("home.publicRepository.title")}
        </h2>
        <RepositoryGridSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("w-full", className)}>
        <h2 className="text-xl font-semibold mb-4">
          {t("home.publicRepository.title")}
        </h2>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <XCircle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-muted-foreground mb-4">{t("home.publicRepository.loadError")}</p>
          <Button variant="outline" onClick={loadRepositories}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {t("home.repository.retry")}
          </Button>
        </div>
      </div>
    );
  }

  if (repositories.length === 0) {
    return (
      <div className={cn("w-full", className)}>
        <h2 className="text-xl font-semibold mb-4">
          {t("home.publicRepository.title")}
        </h2>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {t("home.publicRepository.empty")}
          </p>
        </div>
      </div>
    );
  }

  if (filteredRepositories.length === 0 && keyword) {
    return (
      <div className={cn("w-full", className)}>
        <h2 className="text-xl font-semibold mb-4">
          {t("home.publicRepository.title")}
        </h2>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Search className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {t("home.publicRepository.noResults")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">
          {t("home.publicRepository.title")}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={loadRepositories}
          disabled={isLoading}
        >
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRepositories.map((repo) => (
          <PublicRepositoryCard key={repo.id} repository={repo} />
        ))}
      </div>
    </div>
  );
}
