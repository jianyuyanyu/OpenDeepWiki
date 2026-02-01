import { fetchMindMap } from "@/lib/repository-api";
import { MindMapViewer } from "@/components/repo/mind-map-viewer";
import { DocsPage, DocsBody } from "fumadocs-ui/page";
import { Network, Loader2, AlertCircle } from "lucide-react";

interface MindMapPageProps {
  params: Promise<{
    owner: string;
    repo: string;
  }>;
  searchParams: Promise<{
    branch?: string;
    lang?: string;
  }>;
}

async function getMindMapData(owner: string, repo: string, branch?: string, lang?: string) {
  try {
    return await fetchMindMap(owner, repo, branch, lang);
  } catch {
    return null;
  }
}

export default async function MindMapPage({ params, searchParams }: MindMapPageProps) {
  const { owner, repo } = await params;
  const resolvedSearchParams = await searchParams;
  const branch = resolvedSearchParams?.branch;
  const lang = resolvedSearchParams?.lang;

  const mindMap = await getMindMapData(owner, repo, branch, lang);

  // 思维导图不存在
  if (!mindMap) {
    return (
      <DocsPage toc={[]}>
        <DocsBody>
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="h-12 w-12 text-fd-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">无法加载思维导图</h2>
            <p className="text-fd-muted-foreground">
              请稍后重试或检查仓库是否存在
            </p>
          </div>
        </DocsBody>
      </DocsPage>
    );
  }

  // 思维导图正在生成中
  if (mindMap.statusName === "Pending" || mindMap.statusName === "Processing") {
    return (
      <DocsPage toc={[]}>
        <DocsBody>
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
            <h2 className="text-xl font-semibold mb-2">正在生成项目架构思维导图</h2>
            <p className="text-fd-muted-foreground">
              AI 正在分析项目结构，请稍候...
            </p>
          </div>
        </DocsBody>
      </DocsPage>
    );
  }

  // 思维导图生成失败
  if (mindMap.statusName === "Failed") {
    return (
      <DocsPage toc={[]}>
        <DocsBody>
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">思维导图生成失败</h2>
            <p className="text-fd-muted-foreground">
              请尝试重新生成仓库文档
            </p>
          </div>
        </DocsBody>
      </DocsPage>
    );
  }

  // 思维导图内容为空
  if (!mindMap.content) {
    return (
      <DocsPage toc={[]}>
        <DocsBody>
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Network className="h-12 w-12 text-fd-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">暂无思维导图</h2>
            <p className="text-fd-muted-foreground">
              该仓库尚未生成项目架构思维导图
            </p>
          </div>
        </DocsBody>
      </DocsPage>
    );
  }

  return (
    <DocsPage toc={[]}>
      <DocsBody>
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Network className="h-8 w-8 text-blue-500" />
            <h1 className="text-3xl font-bold">项目架构</h1>
          </div>
          <p className="text-fd-muted-foreground">
            {owner}/{repo} 的项目架构思维导图，展示核心模块和文件结构
          </p>
        </div>
        
        <MindMapViewer
          content={mindMap.content}
          owner={owner}
          repo={repo}
          branch={mindMap.branch}
        />
      </DocsBody>
    </DocsPage>
  );
}
