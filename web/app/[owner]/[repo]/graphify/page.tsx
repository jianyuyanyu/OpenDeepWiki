import type { Metadata } from "next";
import { buildRepoGraphifyPath, decodeRouteSegment } from "@/lib/repo-route";
import { fetchGraphifyReport } from "@/lib/repository-api";
import { MarkdownRenderer } from "@/components/repo/markdown-renderer";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import {
  buildCanonicalPath,
  createMarkdownDescription,
  extractMarkdownTitle,
  indexableMetadata,
  noIndexMetadata,
  repoTitle,
} from "@/lib/repo-seo";

interface GraphifyPageProps {
  params: Promise<{
    owner: string;
    repo: string;
  }>;
  searchParams: Promise<{
    branch?: string;
    lang?: string;
    view?: string;
  }>;
}

export async function generateMetadata({ params, searchParams }: GraphifyPageProps): Promise<Metadata> {
  const { owner, repo } = await params;
  const decodedOwner = decodeRouteSegment(owner);
  const decodedRepo = decodeRouteSegment(repo);
  const resolvedSearchParams = await searchParams;
  const currentView = resolvedSearchParams?.view === "report" ? "report" : "graph";
  const canonicalPath = buildCanonicalPath(buildRepoGraphifyPath(decodedOwner, decodedRepo), {
    branch: resolvedSearchParams?.branch,
    lang: resolvedSearchParams?.lang,
    view: currentView === "report" ? "report" : undefined,
  });

  if (currentView !== "report") {
    return noIndexMetadata(
      `Graphify - ${repoTitle(decodedOwner, decodedRepo)}`,
      `Interactive Graphify code graph for ${repoTitle(decodedOwner, decodedRepo)}.`,
      canonicalPath
    );
  }

  try {
    const reportContent = await fetchGraphifyReport(decodedOwner, decodedRepo, resolvedSearchParams?.branch);
    const reportTitle = extractMarkdownTitle(reportContent, `Graphify report - ${repoTitle(decodedOwner, decodedRepo)}`);

    return indexableMetadata({
      title: `${reportTitle} - ${repoTitle(decodedOwner, decodedRepo)}`,
      description: createMarkdownDescription(reportContent, `Graphify report for ${repoTitle(decodedOwner, decodedRepo)}.`),
      canonicalPath,
      type: "article",
    });
  } catch {
    return noIndexMetadata(
      `Graphify report - ${repoTitle(decodedOwner, decodedRepo)}`,
      `Graphify report for ${repoTitle(decodedOwner, decodedRepo)} is not available.`,
      canonicalPath
    );
  }
}

export default async function GraphifyPage({ params, searchParams }: GraphifyPageProps) {
  const { owner, repo } = await params;
  const decodedOwner = decodeRouteSegment(owner);
  const decodedRepo = decodeRouteSegment(repo);
  const locale = await getLocale();
  const t = await getTranslations("common");
  const resolvedSearchParams = await searchParams;
  const currentView = resolvedSearchParams?.view === "report" ? "report" : "graph";

  const paramsForApi = new URLSearchParams();
  if (resolvedSearchParams?.branch) {
    paramsForApi.set("branch", resolvedSearchParams.branch);
  }

  const graphifySrc = `/api/v1/repos/${encodeURIComponent(decodedOwner)}/${encodeURIComponent(decodedRepo)}/graphify${
    paramsForApi.toString() ? `?${paramsForApi.toString()}` : ""
  }`;

  const graphParams = new URLSearchParams();
  const reportParams = new URLSearchParams();
  if (resolvedSearchParams?.branch) {
    graphParams.set("branch", resolvedSearchParams.branch);
    reportParams.set("branch", resolvedSearchParams.branch);
  }
  if (resolvedSearchParams?.lang) {
    graphParams.set("lang", resolvedSearchParams.lang);
    reportParams.set("lang", resolvedSearchParams.lang);
  }
  reportParams.set("view", "report");

  const graphHref = `?${graphParams.toString()}`;
  const reportHref = `?${reportParams.toString()}`;

  let reportContent: string | null = null;
  if (currentView === "report") {
    try {
      reportContent = await fetchGraphifyReport(decodedOwner, decodedRepo, resolvedSearchParams?.branch);
    } catch {
      reportContent = null;
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Link
          href={graphHref}
          className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
            currentView === "graph"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background hover:bg-muted"
          }`}
        >
          {t("repository.graphifyGraph")}
        </Link>
        <Link
          href={reportHref}
          className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
            currentView === "report"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background hover:bg-muted"
          }`}
        >
          {t("repository.graphifyReport")}
        </Link>
      </div>

      {currentView === "report" ? (
        <article className="rounded-xl border border-border/70 bg-card p-6 shadow-sm">
          {reportContent ? (
            <MarkdownRenderer content={reportContent} language={locale} />
          ) : (
            <p className="text-sm text-muted-foreground">{t("repository.graphifyNotAvailable")}</p>
          )}
        </article>
      ) : (
        <div className="min-h-[calc(100vh-10rem)] overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
          <iframe
            title={`${decodedOwner}/${decodedRepo} Graphify`}
            src={graphifySrc}
            className="h-[calc(100vh-10rem)] w-full bg-background"
          />
        </div>
      )}
    </div>
  );
}
