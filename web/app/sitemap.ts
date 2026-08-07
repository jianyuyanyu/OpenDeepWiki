import type { MetadataRoute } from "next";
import { fetchRepoBranches, fetchRepoTree, fetchRepositoryList } from "@/lib/repository-api";
import type { RepoTreeNode } from "@/types/repository";
import { buildRepoBasePath, buildRepoDocPath } from "@/lib/repo-route";
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

function buildVariantQuery(branch: string, lang: string): string {
  const params = new URLSearchParams();
  params.set("branch", branch);
  params.set("lang", lang);
  return `?${params.toString()}`;
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
  urls.push({ url, ...entry });
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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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
    return urls;
  }

  return urls;
}
