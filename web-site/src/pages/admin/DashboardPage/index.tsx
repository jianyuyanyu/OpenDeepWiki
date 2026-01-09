// 管理员仪表板页面

import React, { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  Users,
  Database,
  Shield,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Eye,
  FileText,
  Settings,
  UserPlus,
  FolderPlus,
  BarChart3,
  Globe,
  Cpu,
  HardDrive,
  Activity,
  PieChart,
  Gauge,
  Server
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { statsService } from '@/services/admin.service'
import type { ComprehensiveDashboard } from '@/services/admin.service'

type ChartPoint = {
  label: string
  value: number
}

type LineSeries = {
  label: string
  color: string
  values: number[]
}

const clamp = (value: number, min = 0, max = 100) => Math.min(Math.max(value, min), max)

const buildPoints = (values: number[], width: number, height: number, padding: number) => {
  if (!values.length) return []
  const maxValue = Math.max(...values, 1)
  const minValue = Math.min(...values, 0)
  const range = maxValue - minValue || 1
  const availableWidth = width - padding * 2
  const availableHeight = height - padding * 2

  return values.map((value, index) => {
    const ratio = values.length > 1 ? index / (values.length - 1) : 0
    const x = padding + ratio * availableWidth
    const normalized = (value - minValue) / range
    const y = height - padding - normalized * availableHeight
    return { x, y, value }
  })
}

const buildLinePath = (values: number[], width: number, height: number, padding: number) => {
  const points = buildPoints(values, width, height, padding)
  if (!points.length) return ''
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`).join(' ')
}

const buildAreaPath = (values: number[], width: number, height: number, padding: number) => {
  const points = buildPoints(values, width, height, padding)
  if (!points.length) return ''
  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`).join(' ')
  const last = points[points.length - 1]
  const first = points[0]
  return `${linePath} L${last.x},${height - padding} L${first.x},${height - padding} Z`
}

const MiniLineChart: React.FC<{ data: ChartPoint[]; color: string; minLabel: string; maxLabel: string }> = ({ data, color, minLabel, maxLabel }) => {
  const width = 280
  const height = 120
  const padding = 16
  const values = data.map(item => item.value)
  const linePath = buildLinePath(values, width, height, padding)
  const areaPath = buildAreaPath(values, width, height, padding)
  const maxValue = Math.max(...values, 0)
  const minValue = Math.min(...values, 0)
  const gradientId = `area-${color.replace('#', '')}`

  return (
    <div className="space-y-2">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-28">
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path d={linePath} fill="none" stroke={color} strokeWidth="2" />
      </svg>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{data[0]?.label ?? '--'}</span>
        <span>{data[data.length - 1]?.label ?? '--'}</span>
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{minLabel} {minValue.toLocaleString()}</span>
        <span>{maxLabel} {maxValue.toLocaleString()}</span>
      </div>
    </div>
  )
}

const MultiLineChart: React.FC<{ series: LineSeries[]; minLabel: string; maxLabel: string }> = ({ series, minLabel, maxLabel }) => {
  const width = 320
  const height = 140
  const padding = 20
  const allValues = series.flatMap(item => item.values)
  const maxValue = Math.max(...allValues, 1)
  const minValue = Math.min(...allValues, 0)

  return (
    <div className="space-y-2">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32">
        {series.map(item => (
          <path
            key={item.label}
            d={buildLinePath(item.values.map(value => (value - minValue) / (maxValue - minValue || 1) * 100), width, height, padding)}
            fill="none"
            stroke={item.color}
            strokeWidth="2"
          />
        ))}
      </svg>
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {series.map(item => (
          <div key={item.label} className="flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{minLabel} {minValue.toLocaleString()}</span>
        <span>{maxLabel} {maxValue.toLocaleString()}</span>
      </div>
    </div>
  )
}

const DonutChart: React.FC<{ data: Array<{ label: string; value: number; color: string }> }> = ({ data }) => {
  const radius = 44
  const strokeWidth = 12
  const size = 120
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-muted/20"
          strokeWidth={strokeWidth}
        />
        {data.map(item => {
          const length = (item.value / 100) * circumference
          const dashArray = `${length} ${circumference - length}`
          const dashOffset = -offset
          offset += length
          return (
            <circle
              key={item.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth={strokeWidth}
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          )
        })}
      </svg>
      <div className="space-y-2 text-sm">
        {data.map(item => (
          <div key={item.label} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span>{item.label}</span>
            </div>
            <span className="text-muted-foreground">{item.value.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const BarList: React.FC<{ items: Array<{ label: string; value: number }> }> = ({ items }) => {
  const max = Math.max(...items.map(item => item.value), 1)
  return (
    <div className="space-y-3">
      {items.map(item => (
        <div key={item.label} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="truncate">{item.label}</span>
            <span className="text-muted-foreground">{item.value.toLocaleString()}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted/30">
            <div
              className="h-2 rounded-full bg-primary/70"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

const DashboardPage: React.FC = () => {
  const { t } = useTranslation('admin')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [dashboardData, setDashboardData] = useState<ComprehensiveDashboard | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  // 获取仪表板数据
  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    try {
      setError(null)
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      const data = await statsService.getComprehensiveDashboard()
      setDashboardData(data)
      setLastUpdated(new Date())
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error)
      setError(error.message || t('dashboard.fetchFailed'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [t])

  // 组件挂载时获取数据
  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // 自动刷新功能（每30秒）
  useEffect(() => {
    const interval = setInterval(() => {
      if (dashboardData) {
        fetchDashboardData(true)
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [fetchDashboardData, dashboardData])

  const refreshData = () => {
    fetchDashboardData(true)
  }

  // 格式化数字显示
  const formatNumber = (num?: number | null) => {
    const value = typeof num === 'number' && !Number.isNaN(num) ? num : 0

    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M'
    }
    if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K'
    }
    return value.toString()
  }

  // 格式化百分比显示
  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }

  const formatDuration = (seconds: number) => {
    const safeSeconds = Math.max(0, Math.floor(seconds))
    const days = Math.floor(safeSeconds / 86400)
    const hours = Math.floor((safeSeconds % 86400) / 3600)
    const minutes = Math.floor((safeSeconds % 3600) / 60)
    return t('dashboard.durationFormat', { days, hours, minutes })
  }

  const formatStorage = (value: number, unit: string) => {
    if (!value || Number.isNaN(value)) return `0 ${unit}`
    return `${value.toLocaleString()} ${unit}`
  }

  const getHealthTone = (status: string) => {
    const normalized = status.toLowerCase()
    if (normalized.includes('error')) return 'text-red-600'
    if (normalized.includes('warning')) return 'text-amber-600'
    return 'text-green-600'
  }

  // 获取趋势图标
  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (value < 0) return <TrendingDown className="h-4 w-4 text-red-600" />
    return <div className="h-4 w-4" />
  }

  // 加载状态
  if (loading && !dashboardData) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  // 错误状态
  if (error && !dashboardData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground">{t('dashboard.overview')}</p>
        </div>
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              className="ml-2"
            >
              {t('dashboard.retryButton')}
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!dashboardData) return null

  // 安全的默认值
  const safeData = {
    systemStats: {
      totalUsers: 0,
      totalRepositories: 0,
      totalDocuments: 0,
      totalViews: 0,
      monthlyNewUsers: 0,
      monthlyNewRepositories: 0,
      monthlyNewDocuments: 0,
      monthlyViews: 0,
      userGrowthRate: 0,
      repositoryGrowthRate: 0,
      documentGrowthRate: 0,
      viewGrowthRate: 0,
      ...(dashboardData?.systemStats ?? {})
    },
    performance: {
      cpuUsage: 0,
      memoryUsage: 0,
      diskUsage: 0,
      totalMemory: 0,
      usedMemory: 0,
      totalDiskSpace: 0,
      usedDiskSpace: 0,
      systemStartTime: new Date(0).toISOString(),
      uptimeSeconds: 0,
      activeConnections: 0,
      ...(dashboardData?.performance ?? {})
    },
    repositoryStatusDistribution: dashboardData?.repositoryStatusDistribution ?? [],
    userActivity: {
      onlineUsers: 0,
      dailyActiveUsers: 0,
      weeklyActiveUsers: 0,
      monthlyActiveUsers: 0,
      activeUserGrowthRate: 0,
      recentLoginUsers: [],
      ...(dashboardData?.userActivity ?? {})
    },
    recentUsers: dashboardData?.recentUsers ?? [],
    recentRepositories: dashboardData?.recentRepositories ?? [],
    popularContent: dashboardData?.popularContent ?? [],
    recentErrors: dashboardData?.recentErrors ?? [],
    healthCheck: {
      overallScore: 0,
      healthLevel: '',
      database: { name: '', status: '', isHealthy: false, responseTime: 0, lastCheckTime: '' },
      aiService: { name: '', status: '', isHealthy: false, responseTime: 0, lastCheckTime: '' },
      emailService: { name: '', status: '', isHealthy: false, responseTime: 0, lastCheckTime: '' },
      fileStorage: { name: '', status: '', isHealthy: false, responseTime: 0, lastCheckTime: '' },
      systemPerformance: { name: '', status: '', isHealthy: false, responseTime: 0, lastCheckTime: '' },
      checkTime: '',
      warnings: [],
      errors: [],
      ...(dashboardData?.healthCheck ?? {})
    },
    trends: {
      userTrends: [],
      repositoryTrends: [],
      documentTrends: [],
      viewTrends: [],
      performanceTrends: [],
      ...(dashboardData?.trends ?? {})
    }
  }

  const statusColors = {
    completed: '#16a34a',
    processing: '#2563eb',
    pending: '#f59e0b',
    failed: '#dc2626',
    unknown: '#94a3b8'
  }

  const statusDistribution = safeData.repositoryStatusDistribution.map(item => ({
    label: t(`dashboard.${item.status.toLowerCase()}`),
    value: Number(item.percentage) || 0,
    color:
      statusColors[item.status.toLowerCase() as keyof typeof statusColors] ?? statusColors.unknown
  }))

  const trendCards = [
    {
      title: t('dashboard.userTrends'),
      icon: Users,
      color: '#2563eb',
      data: safeData.trends.userTrends.map(item => ({ label: item.date, value: Number(item.value) || 0 }))
    },
    {
      title: t('dashboard.repositoryTrends'),
      icon: Database,
      color: '#16a34a',
      data: safeData.trends.repositoryTrends.map(item => ({ label: item.date, value: Number(item.value) || 0 }))
    },
    {
      title: t('dashboard.documentTrends'),
      icon: FileText,
      color: '#7c3aed',
      data: safeData.trends.documentTrends.map(item => ({ label: item.date, value: Number(item.value) || 0 }))
    },
    {
      title: t('dashboard.viewTrends'),
      icon: Eye,
      color: '#f97316',
      data: safeData.trends.viewTrends.map(item => ({ label: item.date, value: Number(item.value) || 0 }))
    }
  ]

  const performanceSeries: LineSeries[] = [
    {
      label: t('dashboard.cpuUsage'),
      color: '#ef4444',
      values: safeData.trends.performanceTrends.map(item => clamp(Number(item.cpuUsage) || 0))
    },
    {
      label: t('dashboard.memoryUsage'),
      color: '#3b82f6',
      values: safeData.trends.performanceTrends.map(item => clamp(Number(item.memoryUsage) || 0))
    },
    {
      label: t('dashboard.activeConnections'),
      color: '#10b981',
      values: safeData.trends.performanceTrends.map(item => Number(item.activeConnections) || 0)
    }
  ]

  const healthItems = [
    safeData.healthCheck.database,
    safeData.healthCheck.aiService,
    safeData.healthCheck.emailService,
    safeData.healthCheck.fileStorage,
    safeData.healthCheck.systemPerformance
  ]

  const popularContentItems = safeData.popularContent.map(item => ({
    label: `${item.title} · ${item.type}`,
    value: Number(item.viewCount) || 0
  }))


  return (
    <div className="space-y-6">
      {/* 页面标题和操作栏 */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h1>
          <div className="flex items-center space-x-2 mt-1">
            <p className="text-muted-foreground">{t('dashboard.overview')}</p>
            {lastUpdated && (
              <>
                <Separator orientation="vertical" className="h-4" />
                <p className="text-xs text-muted-foreground">
                  {t('dashboard.lastUpdated')}: {lastUpdated.toLocaleTimeString()}
                </p>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
            {t('dashboard.autoRefresh')}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
            {t('dashboard.refresh')}
          </Button>
        </div>
      </div>

      {/* 系统性能与健康概览 */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Gauge className="h-5 w-5 text-blue-600" />
              <span>{t('dashboard.systemPerformance')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-red-500" />
                  <span>{t('dashboard.cpuUsage')}</span>
                </div>
                <span className="text-muted-foreground">{safeData.performance.cpuUsage.toFixed(1)}%</span>
              </div>
              <Progress value={clamp(safeData.performance.cpuUsage)} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-500" />
                  <span>{t('dashboard.memoryUsage')}</span>
                </div>
                <span className="text-muted-foreground">{safeData.performance.memoryUsage.toFixed(1)}%</span>
              </div>
              <Progress value={clamp(safeData.performance.memoryUsage)} />
              <p className="text-xs text-muted-foreground">
                {formatStorage(safeData.performance.usedMemory, 'MB')} / {formatStorage(safeData.performance.totalMemory, 'MB')}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-amber-500" />
                  <span>{t('dashboard.diskUsage')}</span>
                </div>
                <span className="text-muted-foreground">{safeData.performance.diskUsage.toFixed(1)}%</span>
              </div>
              <Progress value={clamp(safeData.performance.diskUsage)} />
              <p className="text-xs text-muted-foreground">
                {formatStorage(safeData.performance.usedDiskSpace, 'GB')} / {formatStorage(safeData.performance.totalDiskSpace, 'GB')}
              </p>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">{t('dashboard.uptime')}</p>
                <p className="font-semibold">{formatDuration(safeData.performance.uptimeSeconds)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('dashboard.activeConnections')}</p>
                <p className="font-semibold">{safeData.performance.activeConnections}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-green-600" />
              <span>{t('dashboard.healthCheck')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('dashboard.overallHealth')}</p>
                <p className="text-3xl font-bold">{safeData.healthCheck.overallScore}</p>
                <p className="text-xs text-muted-foreground">{safeData.healthCheck.healthLevel}</p>
              </div>
              <Badge variant={safeData.healthCheck.errors.length ? 'destructive' : 'default'}>
                {safeData.healthCheck.errors.length ? t('dashboard.healthRisk') : t('dashboard.healthGood')}
              </Badge>
            </div>
            <div className="space-y-2 text-sm">
              {healthItems.map(item => (
                <div key={item.name} className="flex items-center justify-between">
                  <span>{item.name}</span>
                  <span className={cn('font-medium', getHealthTone(item.status))}>{item.status || '--'}</span>
                </div>
              ))}
            </div>
            {(safeData.healthCheck.warnings.length > 0 || safeData.healthCheck.errors.length > 0) && (
              <div className="space-y-1 text-xs text-muted-foreground">
                {safeData.healthCheck.warnings.slice(0, 2).map((warning, index) => (
                  <p key={`warning-${index}`}>{t('dashboard.warning')}: {warning}</p>
                ))}
                {safeData.healthCheck.errors.slice(0, 2).map((errorItem, index) => (
                  <p key={`error-${index}`}>{t('dashboard.error')}: {errorItem}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="h-5 w-5 text-purple-600" />
              <span>{t('dashboard.repositoryStatusDistribution')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusDistribution.length > 0 ? (
              <DonutChart data={statusDistribution} />
            ) : (
              <p className="text-sm text-muted-foreground">{t('messages.no_data')}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 趋势分析 */}
      <div className="grid gap-4 lg:grid-cols-2">
        {trendCards.map(card => (
          <Card key={card.title}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <card.icon className="h-5 w-5" style={{ color: card.color }} />
                <span>{card.title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MiniLineChart
                data={card.data}
                color={card.color}
                minLabel={t('dashboard.min')}
                maxLabel={t('dashboard.max')}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 性能趋势 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Server className="h-5 w-5 text-indigo-600" />
            <span>{t('dashboard.performanceTrends')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MultiLineChart
            series={performanceSeries}
            minLabel={t('dashboard.min')}
            maxLabel={t('dashboard.max')}
          />
        </CardContent>
      </Card>


      {/* 核心统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.stats.total_users')}</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(safeData.systemStats.totalUsers)}</div>
            <div className="flex items-center space-x-1 mt-1">
              {getTrendIcon(safeData.systemStats.userGrowthRate)}
              <p className="text-xs text-muted-foreground">
                {formatPercentage(safeData.systemStats.userGrowthRate)} {t('dashboard.comparedToLastMonth')}
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('dashboard.monthlyNew')}: {safeData.systemStats.monthlyNewUsers}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.stats.total_repositories')}</CardTitle>
            <Database className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(safeData.systemStats.totalRepositories)}</div>
            <div className="flex items-center space-x-1 mt-1">
              {getTrendIcon(safeData.systemStats.repositoryGrowthRate)}
              <p className="text-xs text-muted-foreground">
                {formatPercentage(safeData.systemStats.repositoryGrowthRate)} {t('dashboard.comparedToLastMonth')}
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('dashboard.monthlyNew')}: {safeData.systemStats.monthlyNewRepositories}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.stats.total_documents')}</CardTitle>
            <FileText className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(safeData.systemStats.totalDocuments)}</div>
            <div className="flex items-center space-x-1 mt-1">
              {getTrendIcon(safeData.systemStats.documentGrowthRate)}
              <p className="text-xs text-muted-foreground">
                {formatPercentage(safeData.systemStats.documentGrowthRate)} {t('dashboard.comparedToLastMonth')}
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('dashboard.monthlyNew')}: {formatNumber(safeData.systemStats.monthlyNewDocuments)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.totalViews')}</CardTitle>
            <Eye className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(safeData.systemStats.totalViews)}</div>
            <div className="flex items-center space-x-1 mt-1">
              {getTrendIcon(safeData.systemStats.viewGrowthRate)}
              <p className="text-xs text-muted-foreground">
                {formatPercentage(safeData.systemStats.viewGrowthRate)} {t('dashboard.comparedToLastMonth')}
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('dashboard.monthlyViews')}: {formatNumber(safeData.systemStats.monthlyViews)}
            </p>
          </CardContent>
        </Card>
      </div>


      {/* 内容与访问洞察 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-sky-600" />
              <span>{t('dashboard.popularContent')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {popularContentItems.length > 0 ? (
              <BarList items={popularContentItems} />
            ) : (
              <p className="text-sm text-muted-foreground">{t('messages.no_data')}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5 text-orange-600" />
              <span>{t('dashboard.recentLoginUsers')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {safeData.userActivity.recentLoginUsers.slice(0, 5).map(user => (
                <div key={user.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.name?.[0] ?? 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(user.loginTime).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant={user.isOnline ? 'default' : 'secondary'} className="text-xs">
                    {user.isOnline ? t('dashboard.online') : t('dashboard.offline')}
                  </Badge>
                </div>
              ))}
              {safeData.userActivity.recentLoginUsers.length === 0 && (
                <p className="text-sm text-muted-foreground">{t('messages.no_data')}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 用户活跃度和最近活动 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span>{t('dashboard.userActivityStats')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-sm text-muted-foreground">{t('dashboard.onlineUsers')}</p>
                <p className="text-2xl font-bold text-orange-600">{safeData.userActivity.onlineUsers}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('dashboard.todayActive')}</p>
                <p className="text-2xl font-bold text-blue-600">{safeData.userActivity.dailyActiveUsers}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('dashboard.weekActive')}</p>
                <p className="text-2xl font-bold text-green-600">{safeData.userActivity.weeklyActiveUsers}</p>
              </div>
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>{t('dashboard.monthlyActiveUsers')}: {safeData.userActivity.monthlyActiveUsers}</p>
              <div className="flex items-center space-x-1">
                <span>{t('dashboard.increaseRate')}:</span>
                {getTrendIcon(safeData.userActivity.activeUserGrowthRate)}
                <span>{formatPercentage(safeData.userActivity.activeUserGrowthRate)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-purple-600" />
              <span>{t('dashboard.recentUsers')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {safeData.recentUsers.slice(0, 4).map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.name?.[0] ?? 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.roles?.length ? user.roles.join(', ') : t('dashboard.unknown')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={user.isOnline ? "default" : "secondary"} className="text-xs">
                      {user.isOnline ? t('dashboard.online') : t('dashboard.offline')}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 最近创建的仓库 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-green-600" />
            <span>{t('dashboard.recentRepositories')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {safeData.recentRepositories.map((repo) => (
              <div key={repo.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">{repo.organizationName}/{repo.name}</h4>
                  <Badge variant="outline" className={cn(
                    "text-xs",
                    repo.status === 'Completed' ? 'text-green-600 border-green-200' :
                    repo.status === 'Processing' ? 'text-blue-600 border-blue-200' :
                    repo.status === 'Pending' ? 'text-yellow-600 border-yellow-200' :
                    'text-red-600 border-red-200'
                  )}>
                    {t(`dashboard.${repo.status.toLowerCase()}`)}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {repo.description || t('dashboard.noDescription')}
                </p>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{t('dashboard.documentation')}: {repo.documentCount}</span>
                  <span>{new Date(repo.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 错误日志 */}
      {safeData.recentErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span>{t('dashboard.recentErrorLogs')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {safeData.recentErrors.slice(0, 5).map((error) => (
                <div key={error.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center space-x-2">
                    <Badge variant={error.level === 'Error' ? 'destructive' : 'secondary'} className="text-xs">
                      {error.level}
                    </Badge>
                    <span className="text-sm">{error.message}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(error.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 快速操作 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.quickActions')}</CardTitle>
          <CardDescription>{t('dashboard.quickActionsDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              {t('dashboard.addUser')}
            </Button>
            <Button variant="outline" size="sm">
              <FolderPlus className="h-4 w-4 mr-2" />
              {t('dashboard.addRepository')}
            </Button>
            <Button variant="outline" size="sm">
              <Shield className="h-4 w-4 mr-2" />
              {t('dashboard.manageRoles')}
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              {t('dashboard.systemSettings')}
            </Button>
            <Button variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              {t('dashboard.viewReports')}
            </Button>
            <Button variant="outline" size="sm">
              <AlertTriangle className="h-4 w-4 mr-2" />
              {t('dashboard.viewLogs')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default DashboardPage
