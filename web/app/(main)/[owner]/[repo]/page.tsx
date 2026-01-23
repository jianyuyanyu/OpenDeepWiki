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
  if (!tree.defaultSlug) {
    notFound();
  }

  redirect(`/${owner}/${repo}/${encodeSlug(tree.defaultSlug)}`);
}
