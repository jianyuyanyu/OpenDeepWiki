let cachedServerApiProxyUrl: string | null = null;
let cachedServerApiProxyUrlLoadedAt = 0;
const SERVER_ENV_CACHE_TTL = 5000;

function readServerApiProxyUrlFromEnvFiles(): string {
  if (typeof window !== "undefined") {
    return "";
  }

  const now = Date.now();
  if (cachedServerApiProxyUrl !== null && now - cachedServerApiProxyUrlLoadedAt < SERVER_ENV_CACHE_TTL) {
    return cachedServerApiProxyUrl;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require("fs");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require("path");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const dotenv = require("dotenv");

    const envFiles = [
      path.resolve(process.cwd(), ".env.local"),
      path.resolve(process.cwd(), ".env"),
    ];

    for (const envFile of envFiles) {
      if (!fs.existsSync(envFile)) {
        continue;
      }

      const parsed = dotenv.parse(fs.readFileSync(envFile));
      const apiProxyUrl = parsed.API_PROXY_URL?.trim();
      if (apiProxyUrl) {
        cachedServerApiProxyUrl = apiProxyUrl;
        cachedServerApiProxyUrlLoadedAt = now;
        return apiProxyUrl;
      }
    }
  } catch {
    // Fall through to the empty value below.
  }

  cachedServerApiProxyUrl = "";
  cachedServerApiProxyUrlLoadedAt = now;
  return "";
}

export function getApiProxyUrl(): string {
  const publicApiProxyUrl = process.env.NEXT_PUBLIC_API_PROXY_URL?.trim();

  if (typeof window !== "undefined") {
    return publicApiProxyUrl || "";
  }

  return process.env.API_PROXY_URL?.trim() || publicApiProxyUrl || readServerApiProxyUrlFromEnvFiles();
}
