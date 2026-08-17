"use client";

import { useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { RepositoryItemResponse } from "@/types/repository";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronDown,
  ChevronRight,
  FolderOpen,
  GitBranch,
  ListTree,
  Search,
} from "lucide-react";

type TreeNode = {
  name: string;
  path: string;
  children: Map<string, TreeNode>;
  repositoryCount: number;
};

interface RepositoryExplorerViewProps {
  repositories: RepositoryItemResponse[];
  renderRepository: (repository: RepositoryItemResponse) => ReactNode;
  emptyMessage: string;
  labels: {
    treeTitle: string;
    allRepositories: string;
    repositoryCount: (count: number) => string;
    emptyFolder: string;
    expandFolder: string;
    collapseFolder: string;
    filterPlaceholder: string;
    noMatch: string;
  };
  className?: string;
  contentClassName?: string;
}

const ROOT_PATH = "";

const AVATAR_TONES = [
  "bg-teal-500/15 text-teal-600 dark:text-teal-400",
  "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400",
] as const;

function splitRepositoryPath(repository: RepositoryItemResponse) {
  return [
    repository.orgName,
    ...repository.repoName.split("/").filter(Boolean),
  ].filter(Boolean);
}

function getRepositoryFolderPath(repository: RepositoryItemResponse) {
  const segments = splitRepositoryPath(repository);
  return segments.slice(0, -1).join("/");
}

function createNode(name: string, path: string): TreeNode {
  return {
    name,
    path,
    children: new Map(),
    repositoryCount: 0,
  };
}

function buildTree(repositories: RepositoryItemResponse[]) {
  const root = createNode("Repositories", ROOT_PATH);
  const folderPaths = new Set<string>();

  for (const repository of repositories) {
    const segments = splitRepositoryPath(repository);
    const folderSegments = segments.slice(0, -1);
    let current = root;

    current.repositoryCount += 1;
    folderSegments.forEach((segment, index) => {
      const path = folderSegments.slice(0, index + 1).join("/");
      let child = current.children.get(segment);

      if (!child) {
        child = createNode(segment, path);
        current.children.set(segment, child);
      }

      child.repositoryCount += 1;
      folderPaths.add(path);
      current = child;
    });
  }

  return {
    root,
    folderPaths: Array.from(folderPaths),
  };
}

function sortNodes(nodes: Iterable<TreeNode>) {
  return Array.from(nodes).sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );
}

function getInitials(name: string) {
  const cleaned = name.replace(/[-_]/g, " ").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  }
  return cleaned.slice(0, 2).toUpperCase() || "?";
}

function getAvatarTone(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}

function getLetterGroup(name: string) {
  const first = name.trim().charAt(0).toUpperCase();
  return /[A-Z0-9]/.test(first) ? first : "#";
}

function filterTree(node: TreeNode, query: string): TreeNode | null {
  if (!query) return node;

  const filteredChildren = new Map<string, TreeNode>();
  for (const [key, child] of node.children) {
    const next = filterTree(child, query);
    if (next) filteredChildren.set(key, next);
  }

  if (node.name.toLowerCase().includes(query) || filteredChildren.size > 0) {
    return {
      ...node,
      children: filteredChildren,
    };
  }

  return null;
}

function CountBadge({
  count,
  active = false,
}: {
  count: number;
  active?: boolean;
}) {
  return (
    <span
      className={cn(
        "ml-auto shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[11px] tabular-nums tracking-tight",
        active
          ? "bg-teal-500/15 text-teal-700 dark:text-teal-300"
          : "bg-muted text-muted-foreground"
      )}
    >
      {count}
    </span>
  );
}

function OrgAvatar({ name, active }: { name: string; active?: boolean }) {
  return (
    <span
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[10px] font-semibold tracking-wide transition-colors",
        active
          ? "bg-teal-500/20 text-teal-700 dark:text-teal-300"
          : getAvatarTone(name)
      )}
    >
      {getInitials(name)}
    </span>
  );
}

function TreeRow({
  node,
  depth,
  selectedPath,
  expandedPaths,
  labels,
  forceExpand,
  onSelect,
  onToggle,
}: {
  node: TreeNode;
  depth: number;
  selectedPath: string;
  expandedPaths: Set<string>;
  labels: RepositoryExplorerViewProps["labels"];
  forceExpand: boolean;
  onSelect: (path: string) => void;
  onToggle: (path: string) => void;
}) {
  const hasChildren = node.children.size > 0;
  const isExpanded = forceExpand || expandedPaths.has(node.path);
  const isSelected = selectedPath === node.path;
  const childNodes = sortNodes(node.children.values());

  return (
    <div>
      <div
        className={cn(
          "group relative flex min-w-0 items-center gap-1 rounded-lg transition-colors",
          isSelected
            ? "bg-teal-500/10 text-foreground"
            : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
        )}
        style={{ paddingLeft: `${4 + depth * 14}px` }}
      >
        {isSelected && (
          <span
            aria-hidden
            className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-teal-500"
          />
        )}

        {hasChildren ? (
          <button
            type="button"
            className="flex h-7 w-5 shrink-0 items-center justify-center rounded-md text-muted-foreground/70 opacity-70 transition-opacity hover:bg-background/60 hover:opacity-100 group-hover:opacity-100"
            onClick={() => onToggle(node.path)}
            aria-expanded={isExpanded}
            aria-label={
              isExpanded ? labels.collapseFolder : labels.expandFolder
            }
          >
            <ChevronRight
              className={cn(
                "h-3.5 w-3.5 transition-transform duration-200 ease-out motion-reduce:transition-none",
                isExpanded && "rotate-90"
              )}
            />
          </button>
        ) : (
          <span className="h-7 w-5 shrink-0" />
        )}

        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2.5 py-1.5 pr-2 text-left"
          onClick={() => onSelect(node.path)}
        >
          {depth === 0 ? (
            <OrgAvatar name={node.name} active={isSelected} />
          ) : (
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px]",
                isSelected
                  ? "bg-teal-500/15 text-teal-600 dark:text-teal-300"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <FolderOpen className="h-3 w-3" />
            </span>
          )}
          <span
            className={cn(
              "min-w-0 flex-1 truncate text-[13px]",
              isSelected ? "font-medium text-foreground" : "font-normal"
            )}
          >
            {node.name}
          </span>
          <CountBadge count={node.repositoryCount} active={isSelected} />
        </button>
      </div>

      {hasChildren && (
        <div
          aria-hidden={!isExpanded}
          inert={isExpanded ? undefined : true}
          className={cn(
            "grid transition-[grid-template-rows,opacity,transform] duration-200 ease-out motion-reduce:transition-none",
            isExpanded
              ? "grid-rows-[1fr] translate-y-0 opacity-100"
              : "grid-rows-[0fr] -translate-y-1 opacity-0"
          )}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="mt-0.5 space-y-0.5">
              {childNodes.map((child) => (
                <TreeRow
                  key={child.path}
                  node={child}
                  depth={depth + 1}
                  selectedPath={selectedPath}
                  expandedPaths={expandedPaths}
                  labels={labels}
                  forceExpand={forceExpand}
                  onSelect={onSelect}
                  onToggle={onToggle}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function RepositoryExplorerView({
  repositories,
  renderRepository,
  emptyMessage,
  labels,
  className,
  contentClassName,
}: RepositoryExplorerViewProps) {
  const { root, folderPaths } = useMemo(
    () => buildTree(repositories),
    [repositories]
  );
  const [selectedPath, setSelectedPath] = useState(ROOT_PATH);
  const [collapsedPaths, setCollapsedPaths] = useState<Set<string>>(
    () => new Set()
  );
  const [filter, setFilter] = useState("");
  const [isTreeOpen, setIsTreeOpen] = useState(false);
  const filterInputRef = useRef<HTMLInputElement>(null);
  const query = filter.trim().toLowerCase();

  const effectiveSelectedPath =
    selectedPath === ROOT_PATH || folderPaths.includes(selectedPath)
      ? selectedPath
      : ROOT_PATH;
  const expandedPaths = useMemo(
    () => new Set(folderPaths.filter((path) => !collapsedPaths.has(path))),
    [collapsedPaths, folderPaths]
  );

  const filteredRoot = useMemo(() => {
    if (!query) return root;
    return filterTree(root, query) ?? createNode(root.name, root.path);
  }, [query, root]);

  const rootChildren = useMemo(
    () => sortNodes(filteredRoot.children.values()),
    [filteredRoot]
  );

  const letterGroups = useMemo(() => {
    const groups = new Map<string, TreeNode[]>();
    for (const node of rootChildren) {
      const letter = getLetterGroup(node.name);
      const list = groups.get(letter) ?? [];
      list.push(node);
      groups.set(letter, list);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [rootChildren]);

  const selectedRepositories = useMemo(() => {
    if (effectiveSelectedPath === ROOT_PATH) {
      return repositories;
    }

    return repositories.filter((repository) => {
      const folderPath = getRepositoryFolderPath(repository);
      return (
        folderPath === effectiveSelectedPath ||
        folderPath.startsWith(`${effectiveSelectedPath}/`)
      );
    });
  }, [repositories, effectiveSelectedPath]);

  const breadcrumbSegments = effectiveSelectedPath
    ? effectiveSelectedPath.split("/")
    : [];

  const handleToggle = (path: string) => {
    setCollapsedPaths((current) => {
      const next = new Set(current);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleSelect = (path: string) => {
    setSelectedPath(path);
    setIsTreeOpen(false);
  };

  const handleTreeOpenChange = (open: boolean) => {
    setIsTreeOpen(open);
    if (!open) {
      setFilter("");
    }
  };

  if (repositories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <GitBranch className="mb-4 h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn("flex min-w-0 flex-col gap-4", className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Popover open={isTreeOpen} onOpenChange={handleTreeOpenChange}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 shrink-0 gap-1.5 rounded-lg"
              >
                <ListTree className="h-4 w-4" />
                <span className="truncate">{labels.treeTitle}</span>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ease-out motion-reduce:transition-none",
                    isTreeOpen && "rotate-180"
                  )}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-[min(20rem,calc(100vw-2rem))] overflow-hidden p-0"
              onOpenAutoFocus={(event) => {
                event.preventDefault();
                filterInputRef.current?.focus();
              }}
            >
              <div className="space-y-2.5 border-b border-border/60 px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    {labels.treeTitle}
                  </p>
                  <span className="text-[11px] text-muted-foreground">
                    {labels.repositoryCount(repositories.length)}
                  </span>
                </div>

                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    ref={filterInputRef}
                    value={filter}
                    onChange={(event) => setFilter(event.target.value)}
                    placeholder={labels.filterPlaceholder}
                    className="h-8 rounded-lg border-border/60 bg-background/80 pl-8 text-xs shadow-none focus-visible:border-teal-500/40 focus-visible:ring-teal-500/15"
                  />
                </div>
              </div>

              <ScrollArea className="h-[min(60vh,420px)]">
                <div className="space-y-0.5 p-2 pr-3">
                  <button
                    type="button"
                    className={cn(
                      "relative mb-1 flex w-full min-w-0 items-center gap-2.5 rounded-lg px-2 py-2 text-left text-[13px] transition-colors",
                      effectiveSelectedPath === ROOT_PATH
                        ? "bg-teal-500/10 text-foreground"
                        : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                    )}
                    onClick={() => handleSelect(ROOT_PATH)}
                  >
                    {effectiveSelectedPath === ROOT_PATH && (
                      <span
                        aria-hidden
                        className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-teal-500"
                      />
                    )}
                    <span
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                        effectiveSelectedPath === ROOT_PATH
                          ? "bg-teal-500/20 text-teal-700 dark:text-teal-300"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <GitBranch className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {labels.allRepositories}
                    </span>
                    <CountBadge
                      count={repositories.length}
                      active={effectiveSelectedPath === ROOT_PATH}
                    />
                  </button>

                  {rootChildren.length === 0 ? (
                    <div className="px-2 py-8 text-center text-xs text-muted-foreground">
                      {labels.noMatch}
                    </div>
                  ) : (
                    letterGroups.map(([letter, nodes]) => (
                      <div key={letter} className="pt-1">
                        <div className="sticky top-0 z-[1] bg-popover px-2 py-1 backdrop-blur-sm">
                          <span className="text-[10px] font-semibold tracking-[0.16em] text-muted-foreground/80">
                            {letter}
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          {nodes.map((node) => (
                            <TreeRow
                              key={node.path}
                              node={node}
                              depth={0}
                              selectedPath={effectiveSelectedPath}
                              expandedPaths={expandedPaths}
                              labels={labels}
                              forceExpand={Boolean(query)}
                              onSelect={handleSelect}
                              onToggle={handleToggle}
                            />
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>

          <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            <button
              type="button"
              className="hover:text-foreground"
              onClick={() => setSelectedPath(ROOT_PATH)}
            >
              {labels.allRepositories}
            </button>
            {breadcrumbSegments.map((segment, index) => {
              const path = breadcrumbSegments.slice(0, index + 1).join("/");
              return (
                <span key={path} className="flex min-w-0 items-center gap-1.5">
                  <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                  <button
                    type="button"
                    className={cn(
                      "max-w-[160px] truncate hover:text-foreground",
                      index === breadcrumbSegments.length - 1 &&
                        "font-medium text-foreground"
                    )}
                    onClick={() => setSelectedPath(path)}
                  >
                    {segment}
                  </button>
                </span>
              );
            })}
          </div>
        </div>

        <div className="shrink-0 text-sm text-muted-foreground">
          {labels.repositoryCount(selectedRepositories.length)}
        </div>
      </div>

      {selectedRepositories.length === 0 ? (
        <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 p-8 text-center">
          <FolderOpen className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{labels.emptyFolder}</p>
        </div>
      ) : (
        <div
          className={cn(
            "grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4",
            contentClassName
          )}
        >
          {selectedRepositories.map((repository) => (
            <div key={repository.id} className="h-full min-w-0">
              {renderRepository(repository)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
