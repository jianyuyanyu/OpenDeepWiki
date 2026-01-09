import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DocumentNode } from '@/components/repository/DocumentTree'

interface DocsPagerProps {
  nodes: DocumentNode[]
  currentPath?: string
  owner: string
  name: string
  branch?: string
}

export const DocsPager: React.FC<DocsPagerProps> = ({
  nodes,
  currentPath,
  owner,
  name,
  branch
}) => {
  const { prev, next } = useMemo(() => {
    if (!currentPath) return { prev: null, next: null }

    const flatNodes: DocumentNode[] = []
    
    // Flatten only files (or folders that have content? usually only files are navigable)
    // Assuming 'file' type is what we want.
    const flatten = (currentNodes: DocumentNode[]) => {
      for (const node of currentNodes) {
        if (node.type === 'file') {
          flatNodes.push(node)
        }
        if (node.children && node.children.length > 0) {
          flatten(node.children)
        }
      }
    }

    flatten(nodes)

    const currentIndex = flatNodes.findIndex(n => n.path === currentPath)
    
    if (currentIndex === -1) return { prev: null, next: null }

    return {
      prev: currentIndex > 0 ? flatNodes[currentIndex - 1] : null,
      next: currentIndex < flatNodes.length - 1 ? flatNodes[currentIndex + 1] : null
    }
  }, [nodes, currentPath])

  if (!prev && !next) return null

  const getUrl = (node: DocumentNode) => {
    const basePath = `/${owner}/${name}/${encodeURIComponent(node.path)}`
    return branch && branch !== 'main' ? `${basePath}?branch=${branch}` : basePath
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 mt-12 pt-6 border-t border-border/40">
      {prev ? (
        <Link
          to={getUrl(prev)}
          className={cn(
            "group flex flex-col gap-1 p-4 rounded-lg border border-border/40 hover:border-primary/30 bg-card hover:bg-muted/50 transition-all flex-1 min-w-0"
          )}
        >
          <div className="flex items-center text-xs text-muted-foreground group-hover:text-primary transition-colors">
            <ChevronLeft className="h-3 w-3 mr-1" />
            Previous
          </div>
          <div className="font-medium truncate text-foreground">{prev.name}</div>
        </Link>
      ) : (
        <div className="flex-1 sm:block hidden" />
      )}

      {next ? (
        <Link
          to={getUrl(next)}
          className={cn(
            "group flex flex-col gap-1 p-4 rounded-lg border border-border/40 hover:border-primary/30 bg-card hover:bg-muted/50 transition-all flex-1 min-w-0 text-right items-end"
          )}
        >
          <div className="flex items-center text-xs text-muted-foreground group-hover:text-primary transition-colors">
            Next
            <ChevronRight className="h-3 w-3 ml-1" />
          </div>
          <div className="font-medium truncate text-foreground">{next.name}</div>
        </Link>
      ) : (
        <div className="flex-1 sm:block hidden" />
      )}
    </div>
  )
}
