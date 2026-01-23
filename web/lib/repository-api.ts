import type { 
  RepoDocResponse, 
  RepoTreeResponse, 
  RepositorySubmitRequest, 
  RepositoryListResponse,
  RepositoryItemResponse,
  UpdateVisibilityRequest,
  UpdateVisibilityResponse
} from "@/types/repository";

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


/**
 * Submit a repository for wiki generation
 */
export async function submitRepository(request: RepositorySubmitRequest): Promise<RepositoryItemResponse> {
  const url = buildApiUrl("/api/v1/repositories/submit");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to submit repository");
  }

  return await response.json();
}

/**
 * Fetch repository list with optional filters
 */
export async function fetchRepositoryList(params?: {
  page?: number;
  pageSize?: number;
  ownerId?: string;
  status?: number;
  keyword?: string;
  sortBy?: 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  isPublic?: boolean;
}): Promise<RepositoryListResponse> {
  const searchParams = new URLSearchParams();
  
  // page and pageSize are required by the backend API
  searchParams.set("page", (params?.page ?? 1).toString());
  searchParams.set("pageSize", (params?.pageSize ?? 20).toString());
  if (params?.ownerId) searchParams.set("ownerId", params.ownerId);
  if (params?.status !== undefined) searchParams.set("status", params.status.toString());
  if (params?.keyword) searchParams.set("keyword", params.keyword);
  if (params?.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params?.sortOrder) searchParams.set("sortOrder", params.sortOrder);
  if (params?.isPublic !== undefined) searchParams.set("isPublic", params.isPublic.toString());

  const queryString = searchParams.toString();
  const url = buildApiUrl(`/api/v1/repositories/list${queryString ? `?${queryString}` : ""}`);

  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Failed to fetch repository list");
  }

  return await response.json();
}


/**
 * Update repository visibility (public/private)
 * @param request - The visibility update request containing repositoryId, isPublic, and ownerUserId
 * @returns The update result with success status and updated visibility
 */
export async function updateRepositoryVisibility(
  request: UpdateVisibilityRequest
): Promise<UpdateVisibilityResponse> {
  const url = buildApiUrl("/api/v1/repositories/visibility");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to update repository visibility");
  }

  return await response.json();
}
