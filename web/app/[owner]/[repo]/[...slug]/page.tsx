import { fetchRepoDoc } from "@/lib/repository-api";
import { extractHeadings } from "@/lib/markdown";
import { MarkdownRenderer } from "@/components/repo/markdown-renderer";
import { DocNotFound } from "@/components/repo/doc-not-found";
import { SourceFiles } from "@/components/repo/source-files";
import { decodeRouteSegment } from "@/lib/repo-route";
import { getLocale, getTranslations } from "next-intl/server";

interface RepoDocPageProps {
  params: Promise<{
    owner: string;
    repo: string;
    slug: string[];
  }>;
  searchParams: Promise<{
    branch?: string;
    lang?: string;
  }>;
}

async function getDocData(owner: string, repo: string, slug: string, branch?: string, lang?: string) {
  try {
    const doc = await fetchRepoDoc(owner, repo, slug, branch, lang);
    if (!doc.exists) {
      return null;
    }
    const headings = extractHeadings(doc.content, 3);
    return { doc, headings };
  } catch {
    return null;
  }
}

export default async function RepoDocPage({ params, searchParams }: RepoDocPageProps) {
  const { owner, repo, slug: slugParts } = await params;
  const decodedOwner = decodeRouteSegment(owner);
  const decodedRepo = decodeRouteSegment(repo);
  const resolvedSearchParams = await searchParams;
  const branch = resolvedSearchParams?.branch;
  const lang = resolvedSearchParams?.lang;
  const slug = slugParts.join("/");

  const data = await getDocData(decodedOwner, decodedRepo, slug, branch, lang);
  
  // 文档不存在，但保留侧边栏（由layout提供）
  if (!data) {
    return (
      <div className="mx-auto max-w-4xl">
        <DocNotFound slug={slug} />
      </div>
    );
  }

  const { doc, headings } = data;
  const locale = await getLocale();
  const t = await getTranslations("common");

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 xl:flex-row">
      <article className="min-w-0 flex-1">
        <MarkdownRenderer content={doc.content} language={locale} />
        <SourceFiles 
          files={doc.sourceFiles || []} 
          branch={branch}
        />
      </article>
      {headings.length > 0 && (
        <aside className="xl:w-64 xl:shrink-0">
          <div className="wiki-scrollbar rounded-xl border border-border/70 bg-muted/20 p-3 xl:sticky xl:top-0 xl:max-h-full xl:overflow-y-auto">
            <div className="mb-2 text-sm font-semibold">{t("repository.tableOfContents")}</div>
            <nav className="space-y-1.5">
              {headings.map((heading) => (
                <a
                  key={heading.id}
                  href={`#${heading.id}`}
                  className="block text-[13px] leading-5 text-muted-foreground hover:text-foreground"
                  style={{ paddingLeft: `${(heading.level - 1) * 12}px` }}
                >
                  {heading.text}
                </a>
              ))}
            </nav>
          </div>
        </aside>
      )}
    </div>
  );
}
