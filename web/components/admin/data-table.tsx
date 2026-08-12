"use client";

import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";

interface DataTableShellProps {
  /** Optional toolbar rendered above the table (search, filters, actions). */
  toolbar?: ReactNode;
  /** Table markup (use ui/table primitives). */
  children: ReactNode;
  /** Optional footer, typically a TablePagination. */
  footer?: ReactNode;
  loading?: boolean;
  /** When true, replaces children with an empty state. */
  empty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: ReactNode;
  /** Number of skeleton rows while loading. */
  skeletonRows?: number;
  className?: string;
}

function TableSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-0 divide-y">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-[30%]" />
          <Skeleton className="h-4 w-[15%]" />
          <Skeleton className="h-4 w-[12%]" />
          <Skeleton className="ml-auto h-4 w-[10%]" />
        </div>
      ))}
    </div>
  );
}

export function DataTableShell({
  toolbar,
  children,
  footer,
  loading = false,
  empty = false,
  emptyTitle,
  emptyDescription,
  emptyIcon,
  skeletonRows = 8,
  className,
}: DataTableShellProps) {
  return (
    <Card
      className={cn(
        "gap-0 overflow-hidden rounded-lg py-0 shadow-none",
        className
      )}
    >
      {toolbar && (
        <div className="flex flex-wrap items-center gap-2 border-b bg-muted/30 px-4 py-3">
          {toolbar}
        </div>
      )}

      {loading ? (
        <TableSkeleton rows={skeletonRows} />
      ) : empty ? (
        <Empty className="border-0 py-14">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              {emptyIcon ?? <Inbox className="h-5 w-5" />}
            </EmptyMedia>
            {emptyTitle && <EmptyTitle>{emptyTitle}</EmptyTitle>}
            {emptyDescription && (
              <EmptyDescription>{emptyDescription}</EmptyDescription>
            )}
          </EmptyHeader>
        </Empty>
      ) : (
        children
      )}

      {footer && !loading && !empty && (
        <div className="border-t px-3 py-2.5">{footer}</div>
      )}
    </Card>
  );
}
