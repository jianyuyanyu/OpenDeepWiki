"use client";

import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { useTranslations } from "@/hooks/use-translations";

export type StatusTone = "neutral" | "info" | "success" | "danger" | "warning";

const TONE_CLASS: Record<StatusTone, string> = {
  neutral: "border-border bg-muted/60 text-muted-foreground",
  info: "border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  success:
    "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  danger: "border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-400",
  warning:
    "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400",
};

const TONE_DOT_CLASS: Record<StatusTone, string> = {
  neutral: "bg-slate-400",
  info: "bg-blue-500",
  success: "bg-emerald-500",
  danger: "bg-red-500",
  warning: "bg-amber-500",
};

interface StatusBadgeProps {
  tone: StatusTone;
  label: string;
  /** Show an animated spinner instead of the static dot. */
  pulse?: boolean;
  className?: string;
}

export function StatusBadge({ tone, label, pulse, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        TONE_CLASS[tone],
        className
      )}
    >
      {pulse ? (
        <Loader2 className="h-2.5 w-2.5 animate-spin" />
      ) : (
        <span
          className={cn("h-1.5 w-1.5 rounded-full", TONE_DOT_CLASS[tone])}
        />
      )}
      {label}
    </span>
  );
}

/** Maps the repository status enum (0-3) to a tone. */
export const REPO_STATUS_TONE: Record<number, StatusTone> = {
  0: "neutral",
  1: "info",
  2: "success",
  3: "danger",
};

/** Repository status badge bound to admin i18n labels. */
export function RepoStatusBadge({
  status,
  className,
}: {
  status: number;
  className?: string;
}) {
  const t = useTranslations();
  const labels: Record<number, string> = {
    0: t("admin.repositories.pending"),
    1: t("admin.repositories.processing"),
    2: t("admin.repositories.completed"),
    3: t("admin.repositories.failed"),
  };
  return (
    <StatusBadge
      tone={REPO_STATUS_TONE[status] ?? "neutral"}
      label={labels[status] ?? String(status)}
      pulse={status === 1}
      className={className}
    />
  );
}
