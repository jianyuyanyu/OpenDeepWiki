import { notFound } from "next/navigation";
import { fetchRepoDoc } from "@/lib/repository-api";
import { extractHeadings } from "@/lib/markdown";
import { MarkdownRenderer } from "@/components/repo/markdown-renderer";
import { RepoToc } from "@/components/repo/repo-toc";

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

  return (
    <div className="flex gap-8 p-6">
      <div className="min-w-0 flex-1">
        <MarkdownRenderer content={doc.content} />
      </div>
      <aside className="hidden w-64 shrink-0 xl:block">
        <RepoToc headings={headings} />
      </aside>
    </div>
  );
}
