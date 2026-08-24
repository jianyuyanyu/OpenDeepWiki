import { getHomePageData } from "@/lib/home-data";
import { HomePageClient } from "./home-page-client";

export default async function Home() {
  const data = await getHomePageData();
  return <HomePageClient data={data} />;
}
