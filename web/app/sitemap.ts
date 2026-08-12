import type { MetadataRoute } from "next";
import { fetchRepoBranches, fetchRepoTree, fetchRepositoryList } from "@/lib/repository-api";
import type { RepoTreeNode } from "@/types/repository";
import { buildRepoBasePath, buildRepoDocPath } from "@/lib/repo-route";
import { absoluteUrl } from "@/lib/repo-seo";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 100;
const MAX_REPOSITORIES = 1000;
const MAX_URLS = 50000;
const DEFAULT_SITEMAP_REVALIDATE_SECONDS = 3600;

type SitemapCacheEntry = {
  urls: MetadataRoute.Sitemap;
  expiresAt: number;
};

let sitemapCache: SitemapCacheEntry | null = null;
let sitemapRefresh: Promise<MetadataRoute.Sitemap> | null = null;

function getSitemapRevalidateMs(): number {
  const parsed = Number.parseInt(process.env.SITEMAP_REVALIDATE_SECONDS ?? "", 10);
  const seconds = Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_SITEMAP_REVALIDATE_SECONDS;
  return seconds * 1000;
}

function collectLeafSlugs(nodes: RepoTreeNode[]): string[] {
  const slugs: string[] = [];

  const walk = (items: RepoTreeNode[]) => {
    for (const item of items) {
      if (item.children.length === 0) {
        slugs.push(item.slug);
        continue;
      }

      walk(item.children);
    }
  };

  walk(nodes);
  return slugs;
}

function buildVariantQuery(branch: string, lang: string): string {
  const params = new URLSearchParams();
  params.set("branch", branch);
  params.set("lang", lang);
  return `?${params.toString()}`;
}

function escapeXml(value: string): string {
  return value.replace(/[&<>]/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      default:
        return character;
    }
  });
}

function addSitemapUrl(
  urls: MetadataRoute.Sitemap,
  knownUrls: Set<string>,
  path: string,
  entry: Omit<MetadataRoute.Sitemap[number], "url">,
) {
  if (urls.length >= MAX_URLS) {
    return;
  }

  const url = absoluteUrl(path);
  if (knownUrls.has(url)) {
    return;
  }

  knownUrls.add(url);
  urls.push({ url: escapeXml(url), ...entry });
}

function addTreeUrls(
  urls: MetadataRoute.Sitemap,
  knownUrls: Set<string>,
  owner: string,
  repo: string,
  nodes: RepoTreeNode[],
  lastModified: Date,
  query = "",
) {
  for (const slug of collectLeafSlugs(nodes)) {
    if (urls.length >= MAX_URLS) {
      return;
    }

    addSitemapUrl(urls, knownUrls, `${buildRepoDocPath(owner, repo, slug)}${query}`, {
      lastModified,
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }
}

async function buildSitemapUrls(): Promise<{ urls: MetadataRoute.Sitemap; complete: boolean }> {
  const urls: MetadataRoute.Sitemap = [];
  const knownUrls = new Set<string>();

  addSitemapUrl(urls, knownUrls, "/", {
    changeFrequency: "daily",
    priority: 1,
  });

  try {
    let page = 1;
    let processedRepositories = 0;
    let total = Number.POSITIVE_INFINITY;

    while (processedRepositories < Math.min(total, MAX_REPOSITORIES) && urls.length < MAX_URLS) {
      const response = await fetchRepositoryList({
        page,
        pageSize: PAGE_SIZE,
        isPublic: true,
        status: 2,
        sortBy: "updatedAt",
      });

      total = response.total;
      if (response.items.length === 0) {
        break;
      }

      for (const repo of response.items) {
        if (urls.length >= MAX_URLS) {
          break;
        }

        processedRepositories += 1;
        const lastModified = new Date(repo.updatedAt ?? repo.createdAt);

        try {
          const tree = await fetchRepoTree(repo.orgName, repo.repoName);
          if (!tree.exists || tree.statusName !== "Completed" || tree.nodes.length === 0) {
            continue;
          }

          addSitemapUrl(urls, knownUrls, buildRepoBasePath(repo.orgName, repo.repoName), {
            lastModified,
            changeFrequency: "weekly",
            priority: 0.7,
          });
          addTreeUrls(urls, knownUrls, repo.orgName, repo.repoName, tree.nodes, lastModified);

          if (urls.length >= MAX_URLS) {
            break;
          }

          const branches = await fetchRepoBranches(repo.orgName, repo.repoName);
          const defaultBranch = tree.currentBranch || branches.defaultBranch;
          const defaultLanguage = tree.currentLanguage || branches.defaultLanguage;

          for (const branch of branches.branches) {
            for (const lang of branch.languages) {
              if (urls.length >= MAX_URLS) {
                break;
              }

              if (branch.name === defaultBranch && lang === defaultLanguage) {
                continue;
              }

              try {
                const variantTree = await fetchRepoTree(repo.orgName, repo.repoName, branch.name, lang);
                if (!variantTree.exists || variantTree.statusName !== "Completed" || variantTree.nodes.length === 0) {
                  continue;
                }

                addTreeUrls(
                  urls,
                  knownUrls,
                  repo.orgName,
                  repo.repoName,
                  variantTree.nodes,
                  lastModified,
                  buildVariantQuery(branch.name, lang),
                );
              } catch {
                continue;
              }
            }

            if (urls.length >= MAX_URLS) {
              break;
            }
          }
        } catch {
          continue;
        }
      }

      page += 1;
    }
  } catch {
    return { urls, complete: false };
  }

  return { urls, complete: true };
}

async function refreshSitemap(): Promise<MetadataRoute.Sitemap> {
  if (sitemapRefresh) {
    return sitemapRefresh;
  }

  sitemapRefresh = buildSitemapUrls()
    .then((result) => {
      if (result.complete) {
        sitemapCache = {
          urls: result.urls,
          expiresAt: Date.now() + getSitemapRevalidateMs(),
        };
      }

      return sitemapCache?.urls ?? result.urls;
    })
    .catch(() => sitemapCache?.urls ?? [])
    .finally(() => {
      sitemapRefresh = null;
    });

  return sitemapRefresh;
}

async function getCachedSitemap(): Promise<MetadataRoute.Sitemap> {
  const cached = sitemapCache;
  if (cached && cached.expiresAt > Date.now()) {
    return cached.urls;
  }

  if (cached) {
    void refreshSitemap();
    return cached.urls;
  }

  return refreshSitemap();
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return getCachedSitemap();
}
