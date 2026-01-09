// Fumadocs Style Sidebar

import React, { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import {
  Search,
  GitBranch,
  Github,
  PanelLeftClose,
  PanelLeftOpen,
  Hash,
  Loader2,
  Lock,
  Download,
  ChevronRight,
  Home
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import type { DocumentNode } from '@/components/repository/DocumentTree'

interface MenuItem {
  id: string
  label: string
  icon?: React.ReactNode
  path?: string
  children?: MenuItem[]
  badge?: string
  disabled?: boolean
  progress?: number
}

interface FumadocsSidebarProps {
  owner: string
  name: string
  branches: string[]
  selectedBranch: string
  onBranchChange: (branch: string) => void
  documentNodes: DocumentNode[]
  selectedPath?: string
  onSelectNode?: (node: DocumentNode) => void
  loading?: boolean
  className?: string
  sidebarOpen?: boolean
  onSidebarToggle?: () => void
  onDownload?: () => void
  isDownloading?: boolean
}

export const FumadocsSidebar: React.FC<FumadocsSidebarProps> = React.memo(({
  owner,
  name,
  branches,
  selectedBranch,
  onBranchChange,
  documentNodes,
  selectedPath,
  onSelectNode,
  loading,
  className,
  sidebarOpen = true,
  onSidebarToggle,
  onDownload,
  isDownloading
}) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null)

  const menuItems = useMemo(() => {
    const convertToMenuItem = (node: DocumentNode): MenuItem => {
      const basePath = `/${owner}/${name}/${encodeURIComponent(node.path)}`
      const pathWithBranch = selectedBranch && selectedBranch !== 'main'
        ? `${basePath}?branch=${selectedBranch}`
        : basePath

      return {
        id: node.id,
        label: node.name || 'Untitled',
        path: pathWithBranch,
        disabled: node.disabled,
        progress: node.progress,
        children: node.children?.map(convertToMenuItem)
      }
    }
    return documentNodes.map(convertToMenuItem)
  }, [documentNodes, owner, name, selectedBranch])

  const handleMenuClick = useCallback(async (item: MenuItem, event?: React.MouseEvent) => {
    if (item.disabled) {
      event?.preventDefault()
      event?.stopPropagation()
      return
    }

    if (item.path) {
      setLoadingItemId(item.id)
      try {
        navigate(item.path)
        const findNode = (nodes: DocumentNode[], id: string): DocumentNode | null => {
          for (const node of nodes) {
            if (node.id === id) return node
            if (node.children) {
              const found = findNode(node.children, id)
              if (found) return found
            }
          }
          return null
        }
        const node = findNode(documentNodes, item.id)
        if (node && onSelectNode) {
          onSelectNode(node)
        }
      } catch (error) {
        console.error('Navigation error:', error)
      } finally {
        setTimeout(() => setLoadingItemId(null), 500)
      }
    }
  }, [navigate, documentNodes, onSelectNode])

  const renderMenuItem = useCallback((item: MenuItem, level: number = 0): React.ReactNode => {
    const hasChildren = item.children && item.children.length > 0
    const isSelected = item.path === selectedPath ||
      item.path === window.location.pathname ||
      window.location.pathname.includes(item.path + '/')
    const isLoading = loadingItemId === item.id
    const isDisabled = item.disabled || false
    const hasProgress = typeof item.progress === 'number'

    // Indentation
    const paddingLeft = level * 12 + 12

    if (hasChildren) {
      return (
        <div key={item.id} className="mb-1">
          <div 
            className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
            style={{ paddingLeft: `${paddingLeft}px` }}
          >
            {item.label}
          </div>
          <div className="mt-1 border-l border-border/40 ml-3 pl-1">
             {item.children?.map(child => renderMenuItem(child, level + 1))}
          </div>
        </div>
      )
    }

    return (
      <div key={item.id} className="relative">
        <button
          className={cn(
            "flex items-center w-full py-1.5 px-3 text-[13.5px] transition-colors duration-200 rounded-md relative text-left",
            isSelected 
              ? "text-primary font-medium bg-primary/5" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
            isDisabled && "opacity-50 cursor-not-allowed"
          )}
          style={{ paddingLeft: `${paddingLeft}px` }}
          onClick={(e) => {
            if (isDisabled || isLoading) {
              e.preventDefault()
              e.stopPropagation()
              return
            }
            handleMenuClick(item, e)
          }}
          disabled={isDisabled || isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
          {isDisabled && !isLoading && <Lock className="mr-2 h-3 w-3" />}
          <span className="truncate flex-1">{item.label}</span>
          {item.badge && (
            <span className="ml-2 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
              {item.badge}
            </span>
          )}
        </button>
      </div>
    )
  }, [handleMenuClick, selectedPath, loadingItemId])

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-background border-r border-border",
        className
      )}
    >
      {/* Header Info */}
      <div className="px-4 py-4 border-b border-border/40">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1 overflow-hidden flex-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 -ml-1 text-muted-foreground hover:text-foreground shrink-0"
              onClick={() => navigate('/')}
              title={t('common.backToHome') || 'Back to Home'}
            >
              <Home className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                <span className="font-bold text-xs">{owner[0]?.toUpperCase()}</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-medium text-muted-foreground truncate">{owner}</span>
                <span className="text-sm font-semibold truncate leading-none">{name}</span>
              </div>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <div className="flex gap-2">
           <Button
            variant="outline"
            size="sm"
            className="flex-1 h-7 text-xs border-border/60"
            onClick={onDownload}
            disabled={!onDownload || isDownloading}
          >
            {isDownloading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Download className="h-3 w-3 mr-1" />}
            ZIP
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 w-7 px-0 border-border/60"
            onClick={() => window.open(`https://github.com/${owner}/${name}`, '_blank')}
          >
            <Github className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="h-9 pl-8 text-sm bg-muted/30 border-transparent focus:bg-background focus:border-border transition-all"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 h-5 px-1.5 bg-background border rounded text-[10px] flex items-center text-muted-foreground">
            23K
          </kbd>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-6 py-2">
          {/* Main Links */}
          <div className="space-y-1">
            <button
              className={cn(
                "w-full flex items-center px-3 py-1.5 text-[13.5px] rounded-md transition-colors",
                window.location.pathname.includes('/mindmap')
                  ? "text-primary font-medium bg-primary/5"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
              onClick={() => navigate(`/${owner}/${name}/mindmap`)}
            >
              <Hash className="mr-2 h-3.5 w-3.5 opacity-70" />
              Mind Map
            </button>
          </div>

          {/* Branch Select */}
          <div className="space-y-2">
            <div className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Branch
            </div>
            <Select value={selectedBranch} onValueChange={onBranchChange} disabled={loading || branches.length === 0}>
              <SelectTrigger className="h-8 text-xs bg-transparent border-border/60 focus:ring-0 focus:ring-offset-0">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-3.5 w-3.5" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {branches.map(branch => (
                  <SelectItem key={branch} value={branch} className="text-xs">{branch}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Docs */}
          <div className="space-y-1">
             {menuItems.length > 0 ? (
              menuItems
                .filter(item => !searchQuery || (item.label && item.label.toLowerCase().includes(searchQuery.toLowerCase())))
                .map(item => renderMenuItem(item))
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">No documents found</p>
            )}
          </div>
        </div>
      </ScrollArea>
      
      {/* Sidebar Toggle at Bottom */}
      <div className="p-3 border-t border-border/40 flex justify-end">
         <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={onSidebarToggle}>
            <PanelLeftClose className="h-4 w-4" />
         </Button>
      </div>
    </div>
  )
})

FumadocsSidebar.displayName = 'FumadocsSidebar'

export default FumadocsSidebar