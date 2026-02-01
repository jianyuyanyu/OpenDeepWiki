"use client";

import { useMemo, useState } from "react";
import { ChevronRight, ChevronDown, FileCode2, FolderOpen, ExternalLink } from "lucide-react";
import type { MindMapNode } from "@/types/repository";

interface MindMapViewerProps {
  content: string;
  owner: string;
  repo: string;
  branch?: string;
  gitUrl?: string;
}

/**
 * 解析思维导图内容为树形结构
 * 格式: # 一级标题\n## 二级标题:文件路径\n### 三级标题
 */
function parseMindMapContent(content: string): MindMapNode[] {
  const lines = content.split("\n").filter(line => line.trim());
  const root: MindMapNode[] = [];
  const stack: { node: MindMapNode; level: number }[] = [];

  for (const line of lines) {
    const match = line.match(/^(#{1,3})\s+(.+)$/);
    if (!match) continue;

    const level = match[1].length;
    const titlePart = match[2].trim();
    
    // 解析标题和文件路径 (格式: 标题:文件路径)
    const colonIndex = titlePart.lastIndexOf(":");
    let title: string;
    let filePath: string | undefined;
    
    if (colonIndex > 0 && !titlePart.substring(colonIndex).includes(" ")) {
      title = titlePart.substring(0, colonIndex).trim();
      filePath = titlePart.substring(colonIndex + 1).trim();
    } else {
      title = titlePart;
    }

    const node: MindMapNode = {
      title,
      filePath,
      level,
      children: [],
    };

    // 找到父节点
    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    if (stack.length === 0) {
      root.push(node);
    } else {
      stack[stack.length - 1].node.children.push(node);
    }

    stack.push({ node, level });
  }

  return root;
}

/**
 * 构建文件链接 URL
 */
function buildFileUrl(gitUrl: string | undefined, branch: string, filePath: string): string {
  if (!gitUrl) return "#";
  
  let normalizedUrl = gitUrl.replace(/\.git$/, "").trim();
  if (normalizedUrl.startsWith("git@")) {
    normalizedUrl = normalizedUrl.replace("git@", "https://").replace(":", "/");
  }
  normalizedUrl = normalizedUrl.replace(/\/$/, "");

  if (normalizedUrl.includes("github.com")) {
    return `${normalizedUrl}/blob/${branch}/${filePath}`;
  } else if (normalizedUrl.includes("gitlab.com") || normalizedUrl.includes("gitlab")) {
    return `${normalizedUrl}/-/blob/${branch}/${filePath}`;
  } else if (normalizedUrl.includes("gitee.com")) {
    return `${normalizedUrl}/blob/${branch}/${filePath}`;
  } else if (normalizedUrl.includes("bitbucket.org")) {
    return `${normalizedUrl}/src/${branch}/${filePath}`;
  }
  
  return `${normalizedUrl}/blob/${branch}/${filePath}`;
}

interface MindMapNodeItemProps {
  node: MindMapNode;
  gitUrl?: string;
  branch: string;
  defaultExpanded?: boolean;
}

function MindMapNodeItem({ node, gitUrl, branch, defaultExpanded = true }: MindMapNodeItemProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const hasChildren = node.children.length > 0;

  const levelColors = [
    "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300",
    "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300",
    "bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-300",
  ];

  const colorClass = levelColors[(node.level - 1) % levelColors.length];

  return (
    <div className="relative">
      <div
        className={`flex items-center gap-2 p-2 rounded-lg border ${colorClass} mb-2 cursor-pointer hover:opacity-80 transition-opacity`}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {hasChildren ? (
          expanded ? (
            <ChevronDown className="h-4 w-4 flex-shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
          )
        ) : (
          <div className="w-4" />
        )}
        
        {node.filePath ? (
          node.filePath.includes("/") ? (
            <FolderOpen className="h-4 w-4 flex-shrink-0" />
          ) : (
            <FileCode2 className="h-4 w-4 flex-shrink-0" />
          )
        ) : null}
        
        <span className="font-medium flex-1">{node.title}</span>
        
        {node.filePath && gitUrl && (
          <a
            href={buildFileUrl(gitUrl, branch, node.filePath)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-xs opacity-60 hover:opacity-100"
          >
            <code className="bg-black/10 dark:bg-white/10 px-1 rounded">{node.filePath}</code>
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
      
      {hasChildren && expanded && (
        <div className="ml-6 pl-4 border-l-2 border-fd-border">
          {node.children.map((child, index) => (
            <MindMapNodeItem
              key={`${child.title}-${index}`}
              node={child}
              gitUrl={gitUrl}
              branch={branch}
              defaultExpanded={node.level < 2}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function MindMapViewer({ content, owner, repo, branch = "main", gitUrl }: MindMapViewerProps) {
  const nodes = useMemo(() => parseMindMapContent(content), [content]);
  const defaultGitUrl = gitUrl || `https://github.com/${owner}/${repo}`;

  if (nodes.length === 0) {
    return (
      <div className="text-center py-12 text-fd-muted-foreground">
        <p>思维导图内容为空</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-fd-muted-foreground mb-6">
        <span>点击节点展开/折叠</span>
        <span>•</span>
        <span>点击文件路径跳转到源代码</span>
      </div>
      
      <div className="space-y-2">
        {nodes.map((node, index) => (
          <MindMapNodeItem
            key={`${node.title}-${index}`}
            node={node}
            gitUrl={defaultGitUrl}
            branch={branch}
            defaultExpanded={true}
          />
        ))}
      </div>
    </div>
  );
}
