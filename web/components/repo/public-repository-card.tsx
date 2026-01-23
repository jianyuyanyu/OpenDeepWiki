"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslations } from "@/hooks/use-translations";
import type { RepositoryItemResponse, RepositoryStatus } from "@/types/repository";
import {
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  GitBranch,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<RepositoryStatus, {
  icon: typeof Clock;
  className: string;
  labelKey: string;
}> = {
  Pending: {
    icon: Clock,
    className: "text-yellow-500 bg-yellow-500/10",
    labelKey: "pending",
  },
  Processing: {
    icon: Loader2,
    className: "text-blue-500 bg-blue-500/10",
    labelKey: "processing",
  },
  Completed: {
    icon: CheckCircle2,
    className: "text-green-500 bg-green-500/10",
    labelKey: "completed",
  },
  Failed: {
    icon: XCircle,
    className: "text-red-500 bg-red-500/10",
    labelKey: "failed",
  },
};

function StatusBadge({ status }: { status: RepositoryStatus }) {
  const t = useTranslations();
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        config.className
      )}
    >
      <Icon
        className={cn("h-3.5 w-3.5", status === "Processing" && "animate-spin")}
      />
      {t(`home.repository.status.${config.labelKey}`)}
    </span>
  );
}

interface PublicRepositoryCardProps {
  repository: RepositoryItemResponse;
}

export function PublicRepositoryCard({ repository }: PublicRepositoryCardProps) {
  const t = useTranslations();
  const createdDate = new Date(repository.createdAt).toLocaleDateString();

  return (
    <Link href={`/${repository.orgName}/${repository.repoName}`}>
      <Card className="h-full transition-all hover:shadow-md hover:border-primary/50 cursor-pointer">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <GitBranch className="h-4 w-4 text-muted-foreground shrink-0" />
                <h3 className="font-medium truncate">
                  {repository.orgName}/{repository.repoName}
                </h3>
              </div>
              <StatusBadge status={repository.statusName} />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>{t("home.repository.createdAt")}: {createdDate}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
