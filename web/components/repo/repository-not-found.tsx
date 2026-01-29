"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { GitBranch, Star, GitFork, Code, Plus, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitRepository } from "@/lib/repository-api";
import { useAuth } from "@/contexts/auth-context";
import { getToken } from "@/lib/auth-api";
import type { GitRepoCheckResponse } from "@/types/repository";

interface RepositoryNotFoundProps {
  owner: string;
  repo: string;
  gitHubInfo: GitRepoCheckResponse | null;
}

export function RepositoryNotFound({ owner, repo, gitHubInfo }: RepositoryNotFoundProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!gitHubInfo?.gitUrl || !gitHubInfo.defaultBranch) return;

    // 检查是否已登录
    if (!isAuthenticated) {
      // 未登录，跳转到登录页并携带当前URL
      const returnUrl = encodeURIComponent(pathname);
      router.push(`/auth?returnUrl=${returnUrl}`);
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const token = getToken();
      await submitRepository({
        gitUrl: gitHubInfo.gitUrl,
        repoName: repo,
        orgName: owner,
        branchName: gitHubInfo.defaultBranch,
        languageCode: "zh",
        isPublic: true,
      }, token ?? undefined);
      
      // 刷新页面以显示处理状态
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "提交失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  // GitHub上也不存在
  if (!gitHubInfo?.exists) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="rounded-full bg-muted/50 p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <GitBranch className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">仓库不存在</h1>
          <p className="text-muted-foreground mb-6">
            未找到 <span className="font-mono text-foreground">{owner}/{repo}</span> 仓库
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            该仓库在 GitHub 上不存在，或者是私有仓库。
          </p>
          <Button variant="outline" onClick={() => router.push("/")}>
            返回首页
          </Button>
        </div>
      </div>
    );
  }

  // GitHub上存在，可以提交生成
  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          {/* 仓库头部 */}
          <div className="flex items-start gap-4 mb-6">
            {gitHubInfo.avatarUrl && (
              <img
                src={gitHubInfo.avatarUrl}
                alt={owner}
                className="w-16 h-16 rounded-lg"
              />
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold truncate">
                {owner}/{repo}
              </h1>
              {gitHubInfo.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {gitHubInfo.description}
                </p>
              )}
            </div>
          </div>

          {/* 统计信息 */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4" />
              <span>{gitHubInfo.starCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <GitFork className="h-4 w-4" />
              <span>{gitHubInfo.forkCount.toLocaleString()}</span>
            </div>
            {gitHubInfo.language && (
              <div className="flex items-center gap-1">
                <Code className="h-4 w-4" />
                <span>{gitHubInfo.language}</span>
              </div>
            )}
            {gitHubInfo.defaultBranch && (
              <div className="flex items-center gap-1">
                <GitBranch className="h-4 w-4" />
                <span>{gitHubInfo.defaultBranch}</span>
              </div>
            )}
          </div>

          {/* 提示信息 */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-600 dark:text-blue-400">
              该仓库在 GitHub 上存在，但尚未生成文档。点击下方按钮开始生成 Wiki 文档。
            </p>
          </div>

          {/* 错误信息 */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-3">
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  提交中...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  生成 Wiki 文档
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open(gitHubInfo.gitUrl ?? "", "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              GitHub
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
