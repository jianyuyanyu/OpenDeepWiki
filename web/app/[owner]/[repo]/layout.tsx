import React from "react";
import { notFound } from "next/navigation";
import { fetchRepoTree, fetchRepoBranches } from "@/lib/repository-api";
import { RepoShell } from "@/components/repo/repo-shell";
import { RepositoryProcessingStatus } from "@/components/repo/repository-processing-status";
import { RootProvider } from "fumadocs-ui/provider/next";

interface RepoLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    owner: string;
    repo: string;
  }>;
  searchParams: Promise<{
    branch?: string;
    lang?: string;
  }>;
}

async function getTreeData(owner: string, repo: string, branch?: string, lang?: string) {
  try {
    const tree = await fetchRepoTree(owner, repo, branch, lang);
    return tree;
  } catch {
    return null;
  }
}

async function getBranchesData(owner: string, repo: string) {
  try {
    const branches = await fetchRepoBranches(owner, repo);
    return branches;
  } catch {
    return null;
  }
}

export default async function RepoLayout({ children, params, searchParams }: RepoLayoutProps) {
  const { owner, repo } = await params;
  const resolvedSearchParams = await searchParams;
  const branch = resolvedSearchParams?.branch;
  const lang = resolvedSearchParams?.lang;
  
  const tree = await getTreeData(owner, repo, branch, lang);
  
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

  // 获取分支和语言数据
  const branches = await getBranchesData(owner, repo);

  return (
    <RootProvider>
      <RepoShell 
        owner={owner} 
        repo={repo} 
        nodes={tree.nodes}
        branches={branches ?? undefined}
        currentBranch={tree.currentBranch}
        currentLanguage={tree.currentLanguage}
      >
        {children}
      </RepoShell>
    </RootProvider>
  );
}
