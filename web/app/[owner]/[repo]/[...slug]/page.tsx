import { notFound } from "next/navigation";
import { fetchRepoDoc } from "@/lib/repository-api";
import { extractHeadings } from "@/lib/markdown";
import { MarkdownRenderer } from "@/components/repo/markdown-renderer";
import { DocsPage, DocsBody } from "fumadocs-ui/page";
import type { TOCItemType } from "fumadocs-core/toc";

interface RepoDocPageProps {
  params: Promise<{
    owner: string;
    repo: string;
    slug: string[];
  }>;
}

async function getDocData(owner: string, repo: string, slug: string) {
  try {
    const doc = await fetchRepoDoc(owner, repo, slug);
    const headings = extractHeadings(doc.content, 3);
    return { doc, headings };
  } catch {
    return null;
  }
}

export default async function RepoDocPage({ params }: RepoDocPageProps) {
  const { owner, repo, slug: slugParts } = await params;
  const slug = slugParts.join("/");

  const data = await getDocData(owner, repo, slug);
  
  if (!data) {
    notFound();
  }

  const { doc, headings } = data;

  // 转换 headings 为 fumadocs TOC 格式
  const toc: TOCItemType[] = headings.map((h) => ({
    title: h.text,
    url: `#${h.id}`,
    depth: h.level,
  }));

  return (
    <DocsPage toc={toc}>
      <DocsBody>
        <MarkdownRenderer content={doc.content} />
      </DocsBody>
    </DocsPage>
  );
}
