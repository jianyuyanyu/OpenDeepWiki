import { getToken } from "./auth-api";

function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "";
}

function buildApiUrl(path: string) {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    return path;
  }
  const trimmedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  return `${trimmedBase}${path}`;
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Request failed: ${response.status}`);
  }

  return response.json();
}

// Statistics API
export interface DailyRepositoryStatistic {
  date: string;
  processedCount: number;
  submittedCount: number;
}

export interface DailyUserStatistic {
  date: string;
  newUserCount: number;
}

export interface DashboardStatistics {
  repositoryStats: DailyRepositoryStatistic[];
  userStats: DailyUserStatistic[];
}

export interface DailyTokenUsage {
  date: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface TokenUsageStatistics {
  dailyUsages: DailyTokenUsage[];
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
}

export async function getDashboardStatistics(days: number = 7): Promise<DashboardStatistics> {
  const url = buildApiUrl(`/api/admin/statistics/dashboard?days=${days}`);
  const result = await fetchWithAuth(url);
  return result.data;
}

export async function getTokenUsageStatistics(days: number = 7): Promise<TokenUsageStatistics> {
  const url = buildApiUrl(`/api/admin/statistics/token-usage?days=${days}`);
  const result = await fetchWithAuth(url);
  return result.data;
}

// Repository API
export interface AdminRepository {
  id: string;
  gitUrl: string;
  repoName: string;
  orgName: string;
  isPublic: boolean;
  status: number;
  statusText: string;
  starCount: number;
  forkCount: number;
  bookmarkCount: number;
  viewCount: number;
  ownerUserId?: string;
  ownerUserName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface RepositoryListResponse {
  items: AdminRepository[];
  total: number;
  page: number;
  pageSize: number;
}

export async function getRepositories(
  page: number = 1,
  pageSize: number = 20,
  search?: string,
  status?: number
): Promise<RepositoryListResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });
  if (search) params.append("search", search);
  if (status !== undefined) params.append("status", status.toString());

  const url = buildApiUrl(`/api/admin/repositories?${params}`);
  const result = await fetchWithAuth(url);
  return result.data;
}

export async function deleteRepository(id: string): Promise<void> {
  const url = buildApiUrl(`/api/admin/repositories/${id}`);
  await fetchWithAuth(url, { method: "DELETE" });
}

export async function updateRepositoryStatus(id: string, status: number): Promise<void> {
  const url = buildApiUrl(`/api/admin/repositories/${id}/status`);
  await fetchWithAuth(url, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}
