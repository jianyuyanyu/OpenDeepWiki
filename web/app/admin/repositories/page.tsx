"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  getRepositories,
  deleteRepository,
  updateRepositoryStatus,
  AdminRepository,
  RepositoryListResponse,
} from "@/lib/admin-api";
import {
  Loader2,
  Search,
  Trash2,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Globe,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

const statusOptions = [
  { value: "all", label: "全部状态" },
  { value: "0", label: "待处理" },
  { value: "1", label: "处理中" },
  { value: "2", label: "已完成" },
  { value: "3", label: "失败" },
];

const statusColors: Record<number, string> = {
  0: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  1: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  2: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  3: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function AdminRepositoriesPage() {
  const [data, setData] = useState<RepositoryListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [selectedRepo, setSelectedRepo] = useState<AdminRepository | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getRepositories(
        page,
        20,
        search || undefined,
        status === "all" ? undefined : parseInt(status)
      );
      setData(result);
    } catch (error) {
      console.error("Failed to fetch repositories:", error);
      toast.error("获取仓库列表失败");
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = () => {
    setPage(1);
    fetchData();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteRepository(deleteId);
      toast.success("删除成功");
      setDeleteId(null);
      fetchData();
    } catch (error) {
      toast.error("删除失败");
    }
  };

  const handleStatusChange = async (id: string, newStatus: number) => {
    try {
      await updateRepositoryStatus(id, newStatus);
      toast.success("状态更新成功");
      fetchData();
    } catch (error) {
      toast.error("状态更新失败");
    }
  };

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">仓库管理</h1>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          刷新
        </Button>
      </div>

      {/* 搜索和筛选 */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-1 gap-2">
            <Input
              placeholder="搜索仓库名称、组织或 Git URL..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="max-w-md"
            />
            <Button onClick={handleSearch}>
              <Search className="mr-2 h-4 w-4" />
              搜索
            </Button>
          </div>
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* 仓库列表 */}
      <Card>
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">仓库</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">可见性</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">状态</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">统计</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">创建时间</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data?.items.map((repo) => (
                    <tr key={repo.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{repo.orgName}/{repo.repoName}</p>
                          <p className="text-sm text-muted-foreground truncate max-w-xs">
                            {repo.gitUrl}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {repo.isPublic ? (
                          <span className="inline-flex items-center gap-1 text-green-600">
                            <Globe className="h-4 w-4" /> 公开
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-gray-500">
                            <Lock className="h-4 w-4" /> 私有
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Select
                          value={repo.status.toString()}
                          onValueChange={(v) => handleStatusChange(repo.id, parseInt(v))}
                        >
                          <SelectTrigger className="w-[100px]">
                            <span className={`px-2 py-1 rounded text-xs ${statusColors[repo.status]}`}>
                              {repo.statusText}
                            </span>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">待处理</SelectItem>
                            <SelectItem value="1">处理中</SelectItem>
                            <SelectItem value="2">已完成</SelectItem>
                            <SelectItem value="3">失败</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <span className="text-muted-foreground">⭐ {repo.starCount}</span>
                          <span className="ml-2 text-muted-foreground">🔖 {repo.bookmarkCount}</span>
                          <span className="ml-2 text-muted-foreground">👁 {repo.viewCount}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(repo.createdAt).toLocaleDateString("zh-CN")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedRepo(repo)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(repo.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  共 {data?.total} 条记录
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* 详情对话框 */}
      <Dialog open={!!selectedRepo} onOpenChange={() => setSelectedRepo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>仓库详情</DialogTitle>
          </DialogHeader>
          {selectedRepo && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">仓库名称</label>
                <p>{selectedRepo.orgName}/{selectedRepo.repoName}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Git URL</label>
                <p className="text-sm text-muted-foreground break-all">{selectedRepo.gitUrl}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">状态</label>
                  <p>{selectedRepo.statusText}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">可见性</label>
                  <p>{selectedRepo.isPublic ? "公开" : "私有"}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Star</label>
                  <p>{selectedRepo.starCount}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">收藏</label>
                  <p>{selectedRepo.bookmarkCount}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">浏览</label>
                  <p>{selectedRepo.viewCount}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">创建时间</label>
                <p>{new Date(selectedRepo.createdAt).toLocaleString("zh-CN")}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRepo(null)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将删除该仓库及其所有相关数据，且无法恢复。确定要继续吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
