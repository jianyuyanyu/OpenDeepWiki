import type { MetadataRoute } from "next";
import { fetchRepoTree, fetchRepositoryList } from "@/lib/repository-api";
import type { RepoTreeNode } from "@/types/repository";
import { buildRepoDocPath } from "@/lib/repo-route";
import { absoluteUrl } from "@/lib/repo-seo";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 100;
const MAX_REPOSITORIES = 1000;
const MAX_URLS = 50000;

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const urls: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      changeFrequency: "daily",
      priority: 1,
    },
  ];

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

        try {
          const tree = await fetchRepoTree(repo.orgName, repo.repoName);
          if (!tree.exists || tree.statusName !== "Completed" || tree.nodes.length === 0) {
            continue;
          }

          urls.push({
            url: absoluteUrl(`/${encodeURIComponent(repo.orgName)}/${encodeURIComponent(repo.repoName)}`),
            lastModified: repo.updatedAt ? new Date(repo.updatedAt) : new Date(repo.createdAt),
            changeFrequency: "weekly",
            priority: 0.7,
          });

          for (const slug of collectLeafSlugs(tree.nodes)) {
            if (urls.length >= MAX_URLS) {
              break;
            }

            urls.push({
              url: absoluteUrl(buildRepoDocPath(repo.orgName, repo.repoName, slug)),
              lastModified: repo.updatedAt ? new Date(repo.updatedAt) : new Date(repo.createdAt),
              changeFrequency: "weekly",
              priority: 0.6,
            });
          }
        } catch {
          continue;
        }
      }

      page += 1;
    }
  } catch {
    return urls;
  }

  return urls;
}
