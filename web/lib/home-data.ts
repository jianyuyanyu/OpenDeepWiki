import { cache } from "react";
import { buildApiUrl } from "./api-client";
import type { LanguageInfo } from "./recommendation-api";
import type { RepositoryListResponse } from "@/types/repository";

export const HOME_PAGE_CACHE_SECONDS = 10;
const HOME_PAGE_CACHE_MS = HOME_PAGE_CACHE_SECONDS * 1000;
const LIST_PAGE_SIZE = 200;

export type HomePageData = {
  repositories: RepositoryListResponse["items"];
  total: number;
  languages: LanguageInfo[];
  error: boolean;
};

type HomePageCacheEntry = {
  data: HomePageData;
  expiresAt: number;
};

let homePageCache: HomePageCacheEntry | null = null;
let homePageInflight: Promise<HomePageData> | null = null;

export function clearHomePageCache() {
  homePageCache = null;
}

async function fetchJson<T>(path: string): Promise<T> {
  const url = buildApiUrl(path);
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.status}`);
  }

  return (await response.json()) as T;
}

async function loadHomePublicRepositories(): Promise<RepositoryListResponse> {
  const searchParams = new URLSearchParams({
    page: "1",
    pageSize: LIST_PAGE_SIZE.toString(),
    isPublic: "true",
    sortBy: "status",
  });

  const firstPage = await fetchJson<RepositoryListResponse>(
    `/api/v1/repositories/list?${searchParams.toString()}`
  );

  if (firstPage.items.length >= firstPage.total) {
    return firstPage;
  }

  const items = [...firstPage.items];
  const totalPages = Math.ceil(firstPage.total / LIST_PAGE_SIZE);

  for (let page = 2; page <= totalPages; page += 1) {
    searchParams.set("page", page.toString());
    const response = await fetchJson<RepositoryListResponse>(
      `/api/v1/repositories/list?${searchParams.toString()}`
    );

    if (response.items.length === 0) {
      break;
    }

    items.push(...response.items);
  }

  return {
    ...firstPage,
    items,
  };
}

async function loadHomeLanguages(): Promise<LanguageInfo[]> {
  const response = await fetchJson<{ languages: LanguageInfo[] }>(
    "/api/v1/recommendations/languages"
  );
  return response.languages ?? [];
}

async function fetchHomePageData(): Promise<HomePageData> {
  const [reposResult, languagesResult] = await Promise.allSettled([
    loadHomePublicRepositories(),
    loadHomeLanguages(),
  ]);

  if (reposResult.status === "rejected") {
    console.error("Failed to load homepage repositories:", reposResult.reason);
    return {
      repositories: [],
      total: 0,
      languages:
        languagesResult.status === "fulfilled" ? languagesResult.value : [],
      error: true,
    };
  }

  return {
    repositories: reposResult.value.items,
    total: reposResult.value.total,
    languages:
      languagesResult.status === "fulfilled" ? languagesResult.value : [],
    error: false,
  };
}

async function loadHomePageData(): Promise<HomePageData> {
  const now = Date.now();
  if (homePageCache && homePageCache.expiresAt > now) {
    return homePageCache.data;
  }

  if (homePageInflight) {
    return homePageInflight;
  }

  homePageInflight = (async () => {
    try {
      const data = await fetchHomePageData();
      if (!data.error) {
        homePageCache = {
          data,
          expiresAt: Date.now() + HOME_PAGE_CACHE_MS,
        };
      }
      return data;
    } finally {
      homePageInflight = null;
    }
  })();

  return homePageInflight;
}

export const getHomePageData = cache(loadHomePageData);
