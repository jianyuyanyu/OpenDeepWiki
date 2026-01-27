import React from "react";
import { notFound } from "next/navigation";
import { fetchRepoTree } from "@/lib/repository-api";
import { RepoShell } from "@/components/repo/repo-shell";
import { RepositoryProcessingStatus } from "@/components/repo/repository-processing-status";

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
  
  // API请求失败
  if (!tree) {
    notFound();
  }

  // 仓库不存在
  if (!tree.exists) {
    notFound();
  }

  // 仓库正在处理中或等待处理
  if (tree.statusName === "Pending" || tree.statusName === "Processing" || tree.statusName === "Failed") {
    return (
      <RepositoryProcessingStatus
        owner={owner}
        repo={repo}
        status={tree.statusName}
      />
    );
  }

  // 仓库已完成但没有文档
  if (tree.nodes.length === 0) {
    return (
      <RepositoryProcessingStatus
        owner={owner}
        repo={repo}
        status="Completed"
      />
    );
  }

  return (
    <RepoShell owner={owner} repo={repo} nodes={tree.nodes}>
      {children}
    </RepoShell>
  );
}
