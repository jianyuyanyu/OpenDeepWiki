import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface DocumentSkeletonProps {
  className?: string
}

export function DocumentSkeleton({ className }: DocumentSkeletonProps) {
  return (
    <div className={cn("max-w-4xl mx-auto px-6 py-8 animate-fadeIn", className)}>
      {/* Title Skeleton */}
      <div className="mb-6 space-y-3">
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="h-5 w-1/2" />
      </div>

      {/* Source Files Skeleton */}
      <div className="mb-6">
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>

      {/* Content Skeleton */}
      <div className="space-y-4">
        {/* Paragraph 1 */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        {/* Heading */}
        <Skeleton className="h-7 w-1/2 mt-8" />

        {/* Paragraph 2 */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>

        {/* Code Block */}
        <Skeleton className="h-32 w-full rounded-lg mt-6" />

        {/* Paragraph 3 */}
        <div className="space-y-2 mt-6">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        {/* Heading */}
        <Skeleton className="h-7 w-2/5 mt-8" />

        {/* List Items */}
        <div className="space-y-3 mt-4">
          <div className="flex items-start gap-2">
            <Skeleton className="h-2 w-2 rounded-full mt-2" />
            <Skeleton className="h-4 flex-1" />
          </div>
          <div className="flex items-start gap-2">
            <Skeleton className="h-2 w-2 rounded-full mt-2" />
            <Skeleton className="h-4 flex-1" />
          </div>
          <div className="flex items-start gap-2">
            <Skeleton className="h-2 w-2 rounded-full mt-2" />
            <Skeleton className="h-4 flex-1" />
          </div>
        </div>

        {/* Image Placeholder */}
        <Skeleton className="h-48 w-full rounded-lg mt-6" />

        {/* Final Paragraph */}
        <div className="space-y-2 mt-6">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
    </div>
  )
}

export default DocumentSkeleton
