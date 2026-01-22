import React from "react";
import { notFound } from "next/navigation";
import { fetchRepoTree } from "@/lib/repository-api";
import { RepoShell } from "@/components/repo/repo-shell";

interface RepoLayoutProps {
  children: React.ReactNode;
  params: {
    owner: string;
    repo: string;
  };
}

export default async function RepoLayout({ children, params }: RepoLayoutProps) {
  try {
    const tree = await fetchRepoTree(params.owner, params.repo);

    return (
      <RepoShell owner={params.owner} repo={params.repo} nodes={tree.nodes}>
        {children}
      </RepoShell>
    );
  } catch {
    notFound();
  }
}
