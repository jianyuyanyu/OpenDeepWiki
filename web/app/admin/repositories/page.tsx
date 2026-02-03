"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getRepositories,
  deleteRepository,
  updateRepositoryStatus,
  syncRepositoryStats,
  batchSyncRepositoryStats,
  batchDeleteRepositories,
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
  RotateCcw,
  MoreHorizontal,
  CheckSquare,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "@/hooks/use-translations";
import { useLocale } from "next-intl";

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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [syncing, setSyncing] = useState<string | null>(null);
  const [batchSyncing, setBatchSyncing] = useState(false);
  const [batchDeleting, setBatchDeleting] = useState(false);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const t = useTranslations();
  const locale = useLocale();

  const statusOptions = [
    { value: "all", label: t('admin.repositories.allStatus') },
    { value: "0", label: t('admin.repositories.pending') },
    { value: "1", label: t('admin.repositories.processing') },
    { value: "2", label: t('admin.repositories.completed') },
    { value: "3", label: t('admin.repositories.failed') },
  ];

  const statusLabels: Record<number, string> = {
    0: t('admin.repositories.pending'),
    1: t('admin.repositories.processing'),
    2: t('admin.repositories.completed'),
    3: t('admin.repositories.failed'),
  };

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
      setSelectedIds(new Set());
    } catch (error) {
      console.error("Failed to fetch repositories:", error);
      toast.error(t('admin.toast.fetchRepoFailed'));
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
      toast.success(t('admin.toast.deleteSuccess'));
      setDeleteId(null);
      fetchData();
    } catch (error) {
      toast.error(t('admin.toast.deleteFailed'));
    }
  };

  const handleStatusChange = async (id: string, newStatus: number) => {
    try {
      await updateRepositoryStatus(id, newStatus);
      toast.success(t('admin.toast.statusUpdateSuccess'));
      fetchData();
    } catch (error) {
      toast.error(t('admin.toast.statusUpdateFailed'));
    }
  };

  const handleSyncStats = async (id: string) => {
    setSyncing(id);
    try {
      const result = await syncRepositoryStats(id);
      if (result.success) {
        toast.success(`${t('admin.toast.syncSuccess')}: ⭐ ${result.starCount} 🍴 ${result.forkCount}`);
        fetchData();
      } else {
        toast.error(result.message || t('admin.toast.syncFailed'));
      }
    } catch (error) {
      toast.error(t('admin.toast.syncFailed'));
    } finally {
      setSyncing(null);
    }
  };

  const handleBatchSync = async () => {
    if (selectedIds.size === 0) {
      toast.warning(t('admin.repositories.selectFirst'));
      return;
    }
    setBatchSyncing(true);
    try {
      const result = await batchSyncRepositoryStats(Array.from(selectedIds));
      toast.success(t('admin.repositories.batchSyncResult', { success: result.successCount, failed: result.failedCount }));
      fetchData();
    } catch (error) {
      toast.error(t('admin.toast.syncFailed'));
    } finally {
      setBatchSyncing(false);
    }
  };

  const handleBatchDelete = async () => {
    setBatchDeleting(true);
    try {
      const result = await batchDeleteRepositories(Array.from(selectedIds));
      toast.success(t('admin.repositories.batchDeleteResult', { success: result.successCount, failed: result.failedCount }));
      setShowBatchDeleteConfirm(false);
      fetchData();
    } catch (error) {
      toast.error(t('admin.toast.deleteFailed'));
    } finally {
      setBatchDeleting(false);
    }
  };

  const toggleSelectAll = () => {
    if (!data) return;
    if (selectedIds.size === data.items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.items.map((r) => r.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;
  const allSelected = data && data.items.length > 0 && selectedIds.size === data.items.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('admin.repositories.title')}</h1>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {t('admin.common.refresh')}
        </Button>
      </div>

      {/* 搜索和筛选 */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-1 gap-2">
            <Input
              placeholder={t('admin.repositories.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="max-w-md"
            />
            <Button onClick={handleSearch}>
              <Search className="mr-2 h-4 w-4" />
              {t('admin.common.search')}
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

      {/* 批量操作栏 */}
      {selectedIds.size > 0 && (
        <Card className="p-3 bg-muted/50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {t('admin.repositories.selectedCount', { count: selectedIds.size })}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBatchSync}
                disabled={batchSyncing}
              >
                {batchSyncing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="mr-2 h-4 w-4" />
                )}
                {t('admin.repositories.batchSync')}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowBatchDeleteConfirm(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t('admin.repositories.batchDelete')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
              >
                {t('admin.repositories.cancelSelect')}
              </Button>
            </div>
          </div>
        </Card>
      )}

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
                    <th className="px-4 py-3 text-left">
                      <Checkbox
                        checked={allSelected ? true : someSelected ? "indeterminate" : false}
                        onCheckedChange={toggleSelectAll}
                        aria-label={t('admin.common.selectAll')}
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">{t('admin.repositories.repository')}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">{t('admin.repositories.visibility')}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">{t('admin.repositories.status')}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">{t('admin.repositories.statistics')}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">{t('admin.repositories.createdAt')}</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">{t('admin.repositories.operations')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data?.items.map((repo) => (
                    <tr key={repo.id} className={`hover:bg-muted/50 ${selectedIds.has(repo.id) ? "bg-muted/30" : ""}`}>
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={selectedIds.has(repo.id)}
                          onCheckedChange={() => toggleSelect(repo.id)}
                          aria-label={`Select ${repo.repoName}`}
                        />
                      </td>
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
                            <Globe className="h-4 w-4" /> {t('admin.repositories.public')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-gray-500">
                            <Lock className="h-4 w-4" /> {t('admin.repositories.private')}
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
                              {statusLabels[repo.status]}
                            </span>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">{t('admin.repositories.pending')}</SelectItem>
                            <SelectItem value="1">{t('admin.repositories.processing')}</SelectItem>
                            <SelectItem value="2">{t('admin.repositories.completed')}</SelectItem>
                            <SelectItem value="3">{t('admin.repositories.failed')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <span className="text-muted-foreground">⭐ {repo.starCount}</span>
                          <span className="ml-2 text-muted-foreground">🍴 {repo.forkCount}</span>
                          <span className="ml-2 text-muted-foreground">👁 {repo.viewCount}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(repo.createdAt).toLocaleDateString(locale === 'zh' ? 'zh-CN' : locale)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSyncStats(repo.id)}
                            disabled={syncing === repo.id}
                            title={t('admin.repositories.syncStats')}
                          >
                            {syncing === repo.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RotateCcw className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedRepo(repo)}
                            title={t('admin.repositories.viewDetail')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(repo.id)}
                            title={t('admin.common.delete')}
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
                  {t('admin.repositories.totalRecords', { count: data?.total })}
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
            <DialogTitle>{t('admin.repositories.repoDetail')}</DialogTitle>
          </DialogHeader>
          {selectedRepo && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">{t('admin.repositories.repoName')}</label>
                <p>{selectedRepo.orgName}/{selectedRepo.repoName}</p>
              </div>
              <div>
                <label className="text-sm font-medium">{t('admin.repositories.gitUrl')}</label>
                <p className="text-sm text-muted-foreground break-all">{selectedRepo.gitUrl}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">{t('admin.repositories.status')}</label>
                  <p>{statusLabels[selectedRepo.status]}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">{t('admin.repositories.visibility')}</label>
                  <p>{selectedRepo.isPublic ? t('admin.repositories.public') : t('admin.repositories.private')}</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium">{t('admin.repositories.star')}</label>
                  <p>{selectedRepo.starCount}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">{t('admin.repositories.fork')}</label>
                  <p>{selectedRepo.forkCount}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">{t('admin.repositories.bookmark')}</label>
                  <p>{selectedRepo.bookmarkCount}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">{t('admin.repositories.view')}</label>
                  <p>{selectedRepo.viewCount}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">{t('admin.repositories.createdAt')}</label>
                <p>{new Date(selectedRepo.createdAt).toLocaleString(locale === 'zh' ? 'zh-CN' : locale)}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRepo(null)}>
              {t('admin.common.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.repositories.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.repositories.deleteWarning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('admin.common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              {t('admin.common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 批量删除确认对话框 */}
      <AlertDialog open={showBatchDeleteConfirm} onOpenChange={setShowBatchDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.repositories.confirmBatchDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.repositories.batchDeleteWarning', { count: selectedIds.size })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={batchDeleting}>{t('admin.common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBatchDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={batchDeleting}
            >
              {batchDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('admin.repositories.deleting')}
                </>
              ) : (
                t('admin.common.confirm')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
