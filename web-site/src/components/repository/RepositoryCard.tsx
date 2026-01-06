// 仓库卡片组件

import React, { useCallback, useMemo } from 'react'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Star, GitBranch, Calendar, AlertCircle, ChevronRight } from 'lucide-react'
import { WarehouseStatus, type RepositoryInfo } from '@/types/repository'
import { formatDistanceToNow } from '@/utils/date'
import { useTranslation } from 'react-i18next'

const getStatusVariant = (status: WarehouseStatus): 'default' | 'secondary' | 'success' | 'destructive' => {
  switch (status) {
    case WarehouseStatus.Pending:
      return 'secondary'
    case WarehouseStatus.Processing:
      return 'default'
    case WarehouseStatus.Completed:
      return 'success'
    case WarehouseStatus.Failed:
    case WarehouseStatus.Canceled:
    case WarehouseStatus.Unauthorized:
      return 'destructive'
    default:
      return 'secondary'
  }
}

interface RepositoryCardProps {
  repository: RepositoryInfo
  onClick?: (repository: RepositoryInfo) => void
}

export const RepositoryCard: React.FC<RepositoryCardProps> = React.memo(({ repository, onClick }) => {
  const { t } = useTranslation()

  // 缓存状态信息
  const statusInfo = useMemo(() => ({
    label: t(`home.repository_card.status.${repository.status}`),
    variant: getStatusVariant(repository.status)
  }), [repository.status, t])

  // 缓存头像显示文本
  const avatarText = useMemo(() =>
    repository.organizationName.substring(0, 2).toUpperCase(),
    [repository.organizationName]
  )

  // 缓存时间格式化
  const formattedTime = useMemo(() =>
    formatDistanceToNow(repository.createdAt),
    [repository.createdAt]
  )

  // 缓存点击处理器
  const handleClick = useCallback(() => {
    onClick?.(repository)
  }, [onClick, repository])

  return (
    <Card
      className="group hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 cursor-pointer h-full flex flex-col border-2 hover:border-primary/50 hover:-translate-y-1"
      onClick={handleClick}
    >
      <CardHeader className="pb-3 pt-4 px-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors">
              {repository.name}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {repository.organizationName}
            </p>
          </div>
          <Avatar className="h-10 w-10 border-2 border-muted group-hover:border-primary/50 transition-colors">
            <AvatarFallback className="bg-gradient-to-br from-primary/10 to-secondary/10 text-primary font-semibold">
              {avatarText}
            </AvatarFallback>
          </Avatar>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-3 px-4">
        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
          {repository.description || t('repository.layout.no_description')}
        </p>
        {repository.error && (
          <div className="mt-3 flex items-start gap-2 p-2 rounded-md bg-destructive/10 border border-destructive/20">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
            <span className="text-xs text-destructive line-clamp-2">{repository.error}</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3 border-t px-4 pb-4 flex-col gap-3">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              <Star className="h-4 w-4 fill-current" />
              <span className="font-medium">{repository?.stars || 0}</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              <GitBranch className="h-4 w-4" />
              <span className="font-medium">{repository?.forks || 0}</span>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </div>

        <div className="flex items-center justify-between w-full gap-2">
          {repository.branch && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <GitBranch className="h-3 w-3" />
              <span className="truncate max-w-[100px]">{repository.branch}</span>
            </div>
          )}
          <Badge
            variant={statusInfo.variant as any}
            className="px-2 py-1 text-xs font-medium"
          >
            {statusInfo.label}
          </Badge>
        </div>
      </CardFooter>
    </Card>
  )
})

RepositoryCard.displayName = 'RepositoryCard'

export default RepositoryCard