import { notFound, redirect } from "next/navigation";
import { fetchRepoTree } from "@/lib/repository-api";

interface RepoIndexProps {
  params: {
    owner: string;
    repo: string;
  };
}

function encodeSlug(slug: string) {
  return slug
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

export default async function RepoIndex({ params }: RepoIndexProps) {
  const tree = await fetchRepoTree(params.owner, params.repo);
  if (!tree.defaultSlug) {
    notFound();
  }

  redirect(`/${params.owner}/${params.repo}/${encodeSlug(tree.defaultSlug)}`);
}
