"use client";

import { useEffect, useState, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/hooks/use-translations";
import { fetchAllRepositoryList, fetchRepositoryList } from "@/lib/repository-api";
import { PublicRepositoryCard } from "./public-repository-card";
import { RepositoryExplorerView } from "./repository-explorer-view";
import { LanguageTags } from "./language-tags";
import type { RepositoryItemResponse } from "@/types/repository";
import {
  GitBranch,
  XCircle,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  ListTree,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PublicRepositoryListProps {
  keyword: string;
  className?: string;
}

const PAGE_SIZE = 12;

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
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"tree" | "grid">("tree");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const isTreeView = viewMode === "tree";
  const totalPages = isTreeView ? 1 : Math.ceil(total / PAGE_SIZE);

  const loadRepositories = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = {
        isPublic: true,
        sortBy: "status",
        keyword: keyword || undefined,
        language: selectedLanguage || undefined,
      } as const;
      const response = isTreeView
        ? await fetchAllRepositoryList(params)
        : await fetchRepositoryList({
            ...params,
            page,
            pageSize: PAGE_SIZE,
          });

      setRepositories(response.items);
      setTotal(response.total);
    } catch (err) {
      setError(t("home.publicRepository.loadError"));
      console.error("Failed to fetch public repositories:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isTreeView, keyword, page, selectedLanguage, t]);

  useEffect(() => {
    loadRepositories();
  }, [loadRepositories]);

  useEffect(() => {
    setPage(1);
  }, [keyword, selectedLanguage, viewMode]);

  const handleLanguageChange = (language: string | null) => {
    setSelectedLanguage(language);
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  const pagination =
    totalPages > 1 ? (
      <div className="flex items-center justify-center gap-4 mt-8">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevPage}
          disabled={page === 1 || isLoading}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {t("home.bookmarks.previous")}
        </Button>
        <span className="text-sm text-muted-foreground">
          {t("home.bookmarks.pageInfo")
            .replace("{current}", page.toString())
            .replace("{total}", totalPages.toString())}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextPage}
          disabled={page === totalPages || isLoading}
        >
          {t("home.bookmarks.next")}
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    ) : null;

  if (isLoading && repositories.length === 0) {
    return (
      <div className={cn("w-full", className)}>
        <h2 className="text-xl font-semibold mb-4">
          {t("home.publicRepository.title")}
        </h2>
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-7 w-20 rounded-full" />
            ))}
          </div>
        </div>
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
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button variant="outline" onClick={loadRepositories}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {t("home.repository.retry")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">
          {t("home.publicRepository.title")}
        </h2>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="grid flex-1 grid-cols-2 rounded-lg border bg-muted/30 p-1 sm:flex sm:flex-none">
            <Button
              variant={viewMode === "tree" ? "secondary" : "ghost"}
              size="sm"
              className="gap-1.5"
              onClick={() => setViewMode("tree")}
            >
              <ListTree className="h-4 w-4" />
              {t("home.repository.view.tree")}
            </Button>
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              className="gap-1.5"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
              {t("home.repository.view.grid")}
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={loadRepositories}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      <LanguageTags
        selectedLanguage={selectedLanguage}
        onLanguageChange={handleLanguageChange}
        className="mb-6"
      />

      {repositories.length === 0 && !keyword && !selectedLanguage ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {t("home.publicRepository.empty")}
          </p>
        </div>
      ) : repositories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Search className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {t("home.publicRepository.noResults")}
          </p>
        </div>
      ) : (
        <>
          {viewMode === "tree" ? (
            <RepositoryExplorerView
              repositories={repositories}
              emptyMessage={t("home.publicRepository.empty")}
              labels={{
                treeTitle: t("home.repository.tree.title"),
                allRepositories: t("home.repository.tree.all"),
                repositoryCount: (count) =>
                  t("home.repository.tree.count").replace("{count}", count.toString()),
                emptyFolder: t("home.repository.tree.emptyFolder"),
                expandFolder: t("home.repository.tree.expandFolder"),
                collapseFolder: t("home.repository.tree.collapseFolder"),
              }}
              renderRepository={(repo) => (
                <PublicRepositoryCard repository={repo} variant="tree" />
              )}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {repositories.map((repo) => (
                <PublicRepositoryCard key={repo.id} repository={repo} />
              ))}
            </div>
          )}
          {pagination}
        </>
      )}
    </div>
  );
}
