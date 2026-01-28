import React from "react";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type * as PageTree from "fumadocs-core/page-tree";
import type { RepoTreeNode, RepoBranchesResponse } from "@/types/repository";
import { BranchLanguageSelector } from "./branch-language-selector";

interface RepoShellProps {
  owner: string;
  repo: string;
  nodes: RepoTreeNode[];
  children: React.ReactNode;
  branches?: RepoBranchesResponse;
  currentBranch?: string;
  currentLanguage?: string;
}

/**
 * 将 RepoTreeNode 转换为 fumadocs PageTree.Node
 */
function convertToPageTreeNode(
  node: RepoTreeNode,
  owner: string,
  repo: string
): PageTree.Node {
  const url = `/${owner}/${repo}/${node.slug}`;

  if (node.children && node.children.length > 0) {
    return {
      type: "folder",
      name: node.title,
      children: node.children.map((child) =>
        convertToPageTreeNode(child, owner, repo)
      ),
    } as PageTree.Folder;
  }

  return {
    type: "page",
    name: node.title,
    url,
  } as PageTree.Item;
}

/**
 * 将 RepoTreeNode[] 转换为 fumadocs PageTree.Root
 */
function convertToPageTree(
  nodes: RepoTreeNode[],
  owner: string,
  repo: string
): PageTree.Root {
  return {
    name: `${owner}/${repo}`,
    children: nodes.map((node) => convertToPageTreeNode(node, owner, repo)),
  };
}

export function RepoShell({ 
  owner, 
  repo, 
  nodes, 
  children,
  branches,
  currentBranch,
  currentLanguage,
}: RepoShellProps) {
  const tree = convertToPageTree(nodes, owner, repo);
  const title = `${owner}/${repo}`;

  // 构建侧边栏顶部的选择器
  const sidebarBanner = branches ? (
    <BranchLanguageSelector
      owner={owner}
      repo={repo}
      branches={branches}
      currentBranch={currentBranch || ""}
      currentLanguage={currentLanguage || ""}
    />
  ) : undefined;

  return (
    <DocsLayout
      tree={tree}
      nav={{
        title,
      }}
      sidebar={{
        defaultOpenLevel: 1,
        collapsible: true,
        banner: sidebarBanner,
      }}
    >
      {children}
    </DocsLayout>
  );
}
