import React from "react";
import { notFound } from "next/navigation";
import { fetchRepoTree } from "@/lib/repository-api";
import { RepoShell } from "@/components/repo/repo-shell";

interface RepoLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    owner: string;
    repo: string;
  }>;
}

async function getTreeData(owner: string, repo: string) {
  try {
    const tree = await fetchRepoTree(owner, repo);
    return tree;
  } catch {
    return null;
  }
}

export default async function RepoLayout({ children, params }: RepoLayoutProps) {
  const { owner, repo } = await params;
  
  const tree = await getTreeData(owner, repo);
  
  if (!tree) {
    notFound();
  }

  return (
    <RepoShell owner={owner} repo={repo} nodes={tree.nodes}>
      {children}
    </RepoShell>
  );
}
