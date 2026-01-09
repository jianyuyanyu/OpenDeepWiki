// 仓库管理页面

import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  ExternalLink,
  FileText,
  Database,
  RefreshCw,
  Filter,
  Download,
  Settings,
  Eye,
  GitBranch,
  Star,
  GitFork,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2
} from 'lucide-react'
import { WarehouseStatus } from '@/types/repository'
import { type BatchOperationDto, type WarehouseInfo, type UpdateRepositoryDto, repositoryService } from '@/services/admin.service'
import { toast } from 'sonner'

const RepositoriesPage: React.FC = () => {
  const { t } = useTranslation('admin')
  const [searchQuery, setSearchQuery] = useState('')
  const [repositories, setRepositories] = useState<WarehouseInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedRepositories, setSelectedRepositories] = useState<string[]>([])

  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingRepository, setEditingRepository] = useState<WarehouseInfo | null>(null)
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const [repositoryToDelete, setRepositoryToDelete] = useState<WarehouseInfo | null>(null)
  const [batchLoading, setBatchLoading] = useState(false)
  const [showBatchDeleteAlert, setShowBatchDeleteAlert] = useState(false)

  // 加载仓库数据
  const loadRepositories = useCallback(async () => {
    try {
      setLoading(true)
      const { data } = await repositoryService.getRepositoryList(
        currentPage,
        pageSize,
        searchQuery || undefined,
        statusFilter === 'all' ? undefined : statusFilter
      ) as any
      // 调试日志
      setRepositories(data.items || [])
      setTotal(data.total || 0)
      // 清空选中状态
      setSelectedRepositories([])
    } catch (error) {
      console.error('Failed to load repositories:', error)
      toast.error(t('repositories.errors.loadFailed'), {
        description: t('repositories.errors.loadFailedDescription')
      })
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, searchQuery, statusFilter])

  useEffect(() => {
    loadRepositories()
  }, [loadRepositories])

  // 搜索和筛选防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        loadRepositories()
      } else {
        setCurrentPage(1)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // 状态筛选立即生效
  useEffect(() => {
    if (currentPage === 1) {
      loadRepositories()
    } else {
      setCurrentPage(1)
    }
  }, [statusFilter])

  const getStatusKey = (status?: WarehouseInfo['status']) => {
    if (typeof status === 'number') {
      switch (status) {
        case WarehouseStatus.Pending:
          return 'pending'
        case WarehouseStatus.Processing:
          return 'processing'
        case WarehouseStatus.Completed:
          return 'completed'
        case WarehouseStatus.Canceled:
          return 'canceled'
        case WarehouseStatus.Unauthorized:
          return 'unauthorized'
        case WarehouseStatus.Failed:
          return 'failed'
        default:
          return 'unknown'
      }
    }

    if (typeof status === 'string') {
      const normalized = status.toLowerCase()
      if (['pending'].includes(normalized)) return 'pending'
      if (['processing', 'inprogress'].includes(normalized)) return 'processing'
      if (['completed', 'success'].includes(normalized)) return 'completed'
      if (['failed', 'error'].includes(normalized)) return 'failed'
      if (['canceled', 'cancelled'].includes(normalized)) return 'canceled'
      if (['unauthorized', 'unauthorised'].includes(normalized)) return 'unauthorized'
    }

    return 'unknown'
  }

  const getStatusBadge = (status?: WarehouseInfo['status']) => {
    const statusKey = getStatusKey(status)
    const statusConfig = {
      pending: {
        variant: 'secondary' as const,
        text: t('repositories.statusLabels.pending'),
        color: 'text-gray-600 bg-gray-100',
        icon: Clock
      },
      processing: {
        variant: 'default' as const,
        text: t('repositories.statusLabels.processing'),
        color: 'text-blue-600 bg-blue-100',
        icon: Loader2
      },
      completed: {
        variant: 'default' as const,
        text: t('repositories.statusLabels.completed'),
        color: 'text-green-600 bg-green-100',
        icon: CheckCircle
      },
      failed: {
        variant: 'destructive' as const,
        text: t('repositories.statusLabels.failed'),
        color: 'text-red-600 bg-red-100',
        icon: AlertCircle
      },
      canceled: {
        variant: 'secondary' as const,
        text: t('repositories.statusLabels.canceled'),
        color: 'text-amber-700 bg-amber-100',
        icon: AlertCircle
      },
      unauthorized: {
        variant: 'secondary' as const,
        text: t('repositories.statusLabels.unauthorized'),
        color: 'text-purple-700 bg-purple-100',
        icon: AlertCircle
      },
      unknown: {
        variant: 'secondary' as const,
        text: t('repositories.statusLabels.unknown'),
        color: 'text-muted-foreground bg-muted/40',
        icon: AlertCircle
      }
    }

    const config = statusConfig[statusKey as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className={`${config.color} flex items-center gap-1`}>
        <Icon className={`h-3 w-3 ${statusKey === 'processing' ? 'animate-spin' : ''}`} />
        {config.text}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return t('messages.no_data')
    return new Date(dateString).toLocaleDateString()
  }

  // 选择操作
  const handleSelectRepository = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedRepositories(prev => [...prev, id])
    } else {
      setSelectedRepositories(prev => prev.filter(item => item !== id))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRepositories(repositories.map(repo => repo.id))
    } else {
      setSelectedRepositories([])
    }
  }

  // 删除操作
  const handleDeleteRepository = async (repository: WarehouseInfo) => {
    setRepositoryToDelete(repository)
    setShowDeleteAlert(true)
  }

  const confirmDeleteRepository = async () => {
    if (!repositoryToDelete) return

    try {
      await repositoryService.deleteRepository(repositoryToDelete.id)
      toast.success(t('repositories.messages.deleteSuccess'), {
        description: t('repositories.messages.deleteSuccessDescription', { name: repositoryToDelete.name })
      })
      loadRepositories()
    } catch (error) {
      toast.error(t('repositories.messages.deleteFailed'), {
        description: t('repositories.messages.deleteFailedDescription')
      })
    } finally {
      setShowDeleteAlert(false)
      setRepositoryToDelete(null)
    }
  }

  // 刷新操作
  const handleRefreshRepository = async (id: string, name: string) => {
    try {
      await repositoryService.refreshRepository(id)
      toast.success(t('repositories.messages.refreshSuccess'), {
        description: t('repositories.messages.refreshSuccessDescription', { name })
      })
      loadRepositories()
    } catch (error) {
      toast.error(t('repositories.messages.refreshFailed'), {
        description: t('repositories.messages.refreshFailedDescription')
      })
    }
  }

  const handleBatchOperation = async (operation: BatchOperationDto['operation']) => {
    if (selectedRepositories.length === 0) return

    try {
      setBatchLoading(true)
      await repositoryService.batchOperateRepositories({
        ids: selectedRepositories,
        operation
      })

      if (operation === 'delete') {
        toast.success(t('repositories.messages.deleteSuccess'), {
          description: t('repositories.batchActionsCount', { count: selectedRepositories.length })
        })
      } else if (operation === 'refresh') {
        toast.success(t('repositories.actions.reprocessRepository'), {
          description: t('repositories.batchActionsCount', { count: selectedRepositories.length })
        })
      } else {
        toast.success(t('common.success'))
      }

      loadRepositories()
    } catch (error) {
      if (operation === 'delete') {
        toast.error(t('repositories.messages.deleteFailed'), {
          description: t('repositories.messages.deleteFailedDescription')
        })
      } else if (operation === 'refresh') {
        toast.error(t('repositories.messages.refreshFailed'), {
          description: t('repositories.messages.refreshFailedDescription')
        })
      } else {
        toast.error(t('common.error'))
      }
    } finally {
      setBatchLoading(false)
    }
  }

  const confirmBatchDelete = async () => {
    try {
      await handleBatchOperation('delete')
    } finally {
      setShowBatchDeleteAlert(false)
    }
  }

  // 编辑操作
  const handleEditRepository = (repository: WarehouseInfo) => {
    setEditingRepository(repository)
    setShowEditDialog(true)
  }


  // 计算统计数据
  const getStatusStats = () => {
    const stats = repositories.reduce((acc, repo) => {
      const statusKey = getStatusKey(repo.status)
      acc[statusKey] = (acc[statusKey] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total: total,
      completed: stats.completed || 0,
      processing: stats.processing || 0,
      pending: stats.pending || 0,
      failed: stats.failed || 0
    }
  }

  const stats = getStatusStats()

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('repositories.title')}</h1>
          <p className="text-muted-foreground">{t('repositories.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedRepositories.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={batchLoading}>
                  {batchLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('repositories.batchActionsCount', { count: selectedRepositories.length })}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{t('repositories.batchActions')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleBatchOperation('refresh')} disabled={batchLoading}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {t('repositories.actions.reprocessRepository')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-700"
                  onClick={() => setShowBatchDeleteAlert(true)}
                  disabled={batchLoading}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('repositories.actions.deleteRepository')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button variant="outline" size="sm" onClick={loadRepositories}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {t('repositories.actions.refreshList', { defaultValue: 'Refresh' })}
          </Button>
        </div>
      </div>

      {/* 仓库统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('repositories.stats.totalRepositories')}</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">{t('repositories.stats.totalRepositoriesDescription')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('repositories.stats.completedRepositories')}</CardTitle>
            <Database className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">{t('repositories.stats.completedRepositoriesDescription')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('repositories.stats.processingRepositories')}</CardTitle>
            <Database className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
            <p className="text-xs text-muted-foreground">{t('repositories.stats.processingRepositoriesDescription')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('repositories.stats.pendingRepositories')}</CardTitle>
            <Database className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">{t('repositories.stats.pendingRepositoriesDescription')}</p>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和筛选 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('repositories.repositoryList')}</CardTitle>
          <CardDescription>{t('repositories.totalRepositories', { total })}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={t('repositories.search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder={t('repositories.filterStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('repositories.allStatus')}</SelectItem>
                <SelectItem value={String(WarehouseStatus.Pending)}>{t('repositories.statusLabels.pending')}</SelectItem>
                <SelectItem value={String(WarehouseStatus.Processing)}>{t('repositories.statusLabels.processing')}</SelectItem>
                <SelectItem value={String(WarehouseStatus.Completed)}>{t('repositories.statusLabels.completed')}</SelectItem>
                <SelectItem value={String(WarehouseStatus.Failed)}>{t('repositories.statusLabels.failed')}</SelectItem>
                <SelectItem value={String(WarehouseStatus.Canceled)}>{t('repositories.statusLabels.canceled')}</SelectItem>
                <SelectItem value={String(WarehouseStatus.Unauthorized)}>{t('repositories.statusLabels.unauthorized')}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}>
              {t('common.reset')}
            </Button>
          </div>

          {/* 仓库表格 */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectedRepositories.length === repositories.length && repositories.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>{t('repositories.table.name')}</TableHead>
                  <TableHead>{t('repositories.table.organization')}</TableHead>
                  <TableHead>{t('repositories.table.status')}</TableHead>
                  <TableHead className="text-center">{t('repositories.table.statistics')}</TableHead>
                  <TableHead>{t('repositories.table.created_at')}</TableHead>
                  <TableHead className="text-right">{t('repositories.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      {t('messages.loading')}
                    </TableCell>
                  </TableRow>
                ) : repositories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      {t('messages.no_data')}
                    </TableCell>
                  </TableRow>
                ) : (
                  repositories.map((repo) => (
                    <TableRow
                      key={repo.id}
                      className={selectedRepositories.includes(repo.id) ? 'bg-blue-50' : ''}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedRepositories.includes(repo.id)}
                          onCheckedChange={(checked) => handleSelectRepository(repo.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{repo.name}</span>
                            {repo.isRecommended && (
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            )}
                          </div>
                          {repo.address && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <a
                                href={repo.address.replace('.git', '')}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline flex items-center"
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                {repo.address.includes('github.com') ? 'GitHub' :
                                  repo.address.includes('gitee.com') ? 'Gitee' : 'Git'}
                              </a>
                              {repo.branch && (
                                <div className="flex items-center">
                                  <GitBranch className="h-3 w-3 mr-1" />
                                  {repo.branch}
                                </div>
                              )}
                            </div>
                          )}
                          {repo.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-[240px]">
                              {repo.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{repo.organizationName}</TableCell>
                      <TableCell>{getStatusBadge(repo.status)}</TableCell>
                      <TableCell className="text-center">
                        <div className="space-y-1">
                          <div className="flex items-center justify-center space-x-1">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{repo.documentCount || 0}</span>
                          </div>
                          {(repo.stars || repo.forks) && (
                            <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
                              {repo.stars && repo.stars > 0 && (
                                <div className="flex items-center">
                                  <Star className="h-3 w-3 mr-1" />
                                  {repo.stars}
                                </div>
                              )}
                              {repo.forks && repo.forks > 0 && (
                                <div className="flex items-center">
                                  <GitFork className="h-3 w-3 mr-1" />
                                  {repo.forks}
                                </div>
                              )}
                            </div>
                          )}
                          {repo.language && (
                            <div className="text-xs text-muted-foreground">
                              {repo.language}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{formatDate(repo.createdAt)}</div>
                        {repo.version && (
                          <div className="text-xs text-muted-foreground">
                            v{repo.version}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">{t('repositories.actions.openMenu')}</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuLabel>{t('repositories.actions.actionMenu')}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link to={`/${repo.organizationName}/${repo.name}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                {t('repositories.actions.viewRepository')}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditRepository(repo)}>
                              <Edit className="mr-2 h-4 w-4" />
                              {t('repositories.actions.editInfo')}
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/admin/repositories/${repo.id}`}>
                                <Settings className="mr-2 h-4 w-4" />
                                {t('repositories.actions.manageContent')}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRefreshRepository(repo.id, repo.name)}>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              {t('repositories.actions.reprocessRepository')}
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              {t('repositories.actions.exportMarkdown')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-700"
                              onClick={() => handleDeleteRepository(repo)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t('repositories.actions.deleteRepository')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* 分页 */}
          {total > pageSize && (
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                {t('repositories.pagination.previous')}
              </Button>
              <div className="text-sm text-muted-foreground">
                {t('repositories.pagination.pageInfo', { current: currentPage, total: Math.ceil(total / pageSize) })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={currentPage >= Math.ceil(total / pageSize)}
              >
                {t('repositories.pagination.next')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 编辑仓库对话框 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <EditRepositoryDialog
            repository={editingRepository}
            onSuccess={() => {
              setShowEditDialog(false)
              setEditingRepository(null)
              loadRepositories()
            }}
            onCancel={() => {
              setShowEditDialog(false)
              setEditingRepository(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('repositories.deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('repositories.deleteDialog.description', { name: repositoryToDelete?.name })}
              <br />
              <span className="text-red-600 font-medium">
                {t('repositories.deleteDialog.warning')}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('repositories.deleteDialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteRepository} className="bg-red-600 hover:bg-red-700">
              {t('repositories.deleteDialog.confirmDelete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 批量删除确认对话框 */}
      <AlertDialog open={showBatchDeleteAlert} onOpenChange={setShowBatchDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('repositories.deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('repositories.deleteDialog.batchDescription', { count: selectedRepositories.length })}
              <br />
              <span className="text-red-600 font-medium">
                {t('repositories.deleteDialog.warning')}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('repositories.deleteDialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBatchDelete} className="bg-red-600 hover:bg-red-700">
              {t('repositories.deleteDialog.confirmDelete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}



// 编辑仓库对话框组件
const EditRepositoryDialog: React.FC<{
  repository: WarehouseInfo | null
  onSuccess: () => void
  onCancel: () => void
}> = ({ repository, onSuccess, onCancel }) => {
  const { t } = useTranslation('admin')
  const [formData, setFormData] = useState<UpdateRepositoryDto>({
    description: '',
    isRecommended: false,
    prompt: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (repository) {
      setFormData({
        description: repository.description || '',
        isRecommended: repository.isRecommended || false,
        prompt: ''
      })
    }
  }, [repository])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!repository) return

    setLoading(true)
    try {
      await repositoryService.updateRepository(repository.id, formData)
      toast.success(t('repositories.messages.updateSuccess'))
      onSuccess()
    } catch (error: any) {
      toast.error(t('repositories.messages.updateFailed'), {
        description: error.message || t('repositories.messages.updateFailedDescription')
      })
    } finally {
      setLoading(false)
    }
  }

  if (!repository) return null

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('repositories.editDialog.title')}</DialogTitle>
        <DialogDescription>
          {t('repositories.editDialog.description', {
            organizationName: repository.organizationName,
            name: repository.name
          })}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="description">{t('repositories.editDialog.repositoryDescription')}</Label>
          <Textarea
            id="description"
            placeholder={t('repositories.editDialog.descriptionPlaceholder')}
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="isRecommended"
            checked={formData.isRecommended}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isRecommended: checked }))}
          />
          <Label htmlFor="isRecommended">{t('repositories.editDialog.isRecommended')}</Label>
        </div>
        <div>
          <Label htmlFor="prompt">{t('repositories.editDialog.customPrompt')}</Label>
          <Textarea
            id="prompt"
            placeholder={t('repositories.editDialog.promptPlaceholder')}
            value={formData.prompt}
            onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('repositories.editDialog.cancel')}
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('repositories.editDialog.saveChanges')}
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}

export default RepositoriesPage
