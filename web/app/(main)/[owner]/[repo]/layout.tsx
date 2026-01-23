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

export default async function RepoLayout({ children, params }: RepoLayoutProps) {
  const { owner, repo } = await params;
  
  try {
    const tree = await fetchRepoTree(owner, repo);

    return (
      <RepoShell owner={owner} repo={repo} nodes={tree.nodes}>
        {children}
      </RepoShell>
    );
  } catch {
    notFound();
  }
}
