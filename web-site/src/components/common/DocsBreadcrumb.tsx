import React, { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DocumentNode } from '@/components/repository/DocumentTree'

interface DocsBreadcrumbProps {
  nodes: DocumentNode[]
  currentPath?: string
  className?: string
  owner: string
  name: string
}

export const DocsBreadcrumb: React.FC<DocsBreadcrumbProps> = ({ 
  nodes, 
  currentPath, 
  className,
  owner,
  name 
}) => {
  const breadcrumbs = useMemo(() => {
    if (!currentPath) return []

    const trail: DocumentNode[] = []
    
    const findPath = (currentNodes: DocumentNode[], targetPath: string): boolean => {
      for (const node of currentNodes) {
        trail.push(node)
        if (node.path === targetPath) {
          return true
        }
        if (node.children && node.children.length > 0) {
          if (findPath(node.children, targetPath)) {
            return true
          }
        }
        trail.pop()
      }
      return false
    }

    findPath(nodes, currentPath)
    return trail
  }, [nodes, currentPath])

  if (breadcrumbs.length === 0) return null

  return (
    <nav className={cn("flex items-center text-sm text-muted-foreground mb-4 overflow-hidden", className)}>
      <Link 
        to={`/${owner}/${name}`}
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>
      
      {breadcrumbs.map((node, index) => {
        const isLast = index === breadcrumbs.length - 1
        const url = `/${owner}/${name}/${encodeURIComponent(node.path)}`
        
        return (
          <React.Fragment key={node.id || node.path}>
            <ChevronRight className="h-4 w-4 mx-1 flex-shrink-0 text-muted-foreground/50" />
            <Link
              to={url}
              className={cn(
                "truncate transition-colors max-w-[150px]",
                isLast 
                  ? "text-foreground font-medium pointer-events-none" 
                  : "hover:text-foreground"
              )}
            >
              {node.name}
            </Link>
          </React.Fragment>
        )
      })}
    </nav>
  )
}
