import type { RepoDocResponse, RepoTreeResponse } from "@/types/repository";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

function buildApiUrl(path: string) {
  if (!API_BASE_URL) {
    return path;
  }

  const trimmedBase = API_BASE_URL.endsWith("/")
    ? API_BASE_URL.slice(0, -1)
    : API_BASE_URL;

  return `${trimmedBase}${path}`;
}

function encodePathSegments(path: string) {
  return path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

export async function fetchRepoTree(owner: string, repo: string) {
  const url = buildApiUrl(
    `/api/v1/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/tree`,
  );

  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Failed to fetch repository tree");
  }

  return (await response.json()) as RepoTreeResponse;
}

export async function fetchRepoDoc(owner: string, repo: string, slug: string) {
  const encodedSlug = encodePathSegments(slug);
  const url = buildApiUrl(
    `/api/v1/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/docs/${encodedSlug}`,
  );

  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Failed to fetch repository doc");
  }

  return (await response.json()) as RepoDocResponse;
}
