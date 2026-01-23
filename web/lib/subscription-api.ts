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

export interface AddSubscriptionRequest {
  userId: string;
  repositoryId: string;
}

export interface SubscriptionResponse {
  success: boolean;
  errorMessage?: string;
  subscriptionId?: string;
}

export interface SubscriptionStatusResponse {
  isSubscribed: boolean;
  subscribedAt?: string;
}

/**
 * Add a subscription for a repository
 */
export async function addSubscription(request: AddSubscriptionRequest): Promise<SubscriptionResponse> {
  const url = buildApiUrl("/api/v1/subscriptions");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  return await response.json();
}

/**
 * Remove a subscription from a repository
 */
export async function removeSubscription(repositoryId: string, userId: string): Promise<SubscriptionResponse> {
  const url = buildApiUrl(`/api/v1/subscriptions/${encodeURIComponent(repositoryId)}?userId=${encodeURIComponent(userId)}`);

  const response = await fetch(url, {
    method: "DELETE",
  });

  return await response.json();
}

/**
 * Get subscription status for a repository
 */
export async function getSubscriptionStatus(
  repositoryId: string,
  userId: string
): Promise<SubscriptionStatusResponse> {
  const url = buildApiUrl(
    `/api/v1/subscriptions/${encodeURIComponent(repositoryId)}/status?userId=${encodeURIComponent(userId)}`
  );

  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Failed to fetch subscription status");
  }

  return await response.json();
}
