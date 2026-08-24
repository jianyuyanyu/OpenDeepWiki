"use server";

import { clearHomePageCache } from "@/lib/home-data";

export async function refreshHomePageCache() {
  clearHomePageCache();
}
