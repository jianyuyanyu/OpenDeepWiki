import { notFound, redirect } from "next/navigation";
import { fetchRepoTree } from "@/lib/repository-api";

interface RepoIndexProps {
  params: Promise<{
    owner: string;
    repo: string;
  }>;
}

function encodeSlug(slug: string) {
  return slug
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

export default async function RepoIndex({ params }: RepoIndexProps) {
  const { owner, repo } = await params;
  const tree = await fetchRepoTree(owner, repo);
  
  
  // 仓库不存在
  if (!tree.exists) {
    notFound();
  }

  // 仓库正在处理中、等待处理或失败，layout会处理显示
  if (tree.statusName !== "Completed" || !tree.defaultSlug) {
    return null;
  }

  redirect(`/${owner}/${repo}/${encodeSlug(tree.defaultSlug)}`);
}
