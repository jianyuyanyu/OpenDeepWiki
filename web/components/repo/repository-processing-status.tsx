"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Clock, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";
import type { RepositoryStatus } from "@/types/repository";

interface RepositoryProcessingStatusProps {
  owner: string;
  repo: string;
  status: RepositoryStatus;
  onRefresh?: () => void;
}

const statusConfig = {
  Pending: {
    icon: Clock,
    colorClass: "text-yellow-500",
    bgClass: "bg-yellow-500/10",
    borderClass: "border-yellow-500/20",
  },
  Processing: {
    icon: Loader2,
    colorClass: "text-blue-500",
    bgClass: "bg-blue-500/10",
    borderClass: "border-blue-500/20",
  },
  Completed: {
    icon: CheckCircle2,
    colorClass: "text-green-500",
    bgClass: "bg-green-500/10",
    borderClass: "border-green-500/20",
  },
  Failed: {
    icon: XCircle,
    colorClass: "text-red-500",
    bgClass: "bg-red-500/10",
    borderClass: "border-red-500/20",
  },
};

export function RepositoryProcessingStatus({
  owner,
  repo,
  status,
  onRefresh,
}: RepositoryProcessingStatusProps) {
  const t = useTranslations();
  const [dots, setDots] = useState("");

  // 自动刷新页面
  useEffect(() => {
    if (status === "Processing" || status === "Pending") {
      const refreshInterval = setInterval(() => {
        window.location.reload();
      }, 10000); // 每10秒刷新一次
      return () => clearInterval(refreshInterval);
    }
  }, [status]);

  useEffect(() => {
    if (status === "Processing" || status === "Pending") {
      const interval = setInterval(() => {
        setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [status]);

  const config = statusConfig[status];
  const Icon = config.icon;
  const isProcessing = status === "Processing" || status === "Pending";

  const handleRetry = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <div
        className={`max-w-md w-full rounded-lg border ${config.borderClass} ${config.bgClass} p-8 text-center`}
      >
        <div className="flex justify-center mb-6">
          <div className={`rounded-full p-4 ${config.bgClass}`}>
            <Icon
              className={`h-12 w-12 ${config.colorClass} ${status === "Processing" ? "animate-spin" : ""}`}
            />
          </div>
        </div>

        <h2 className="text-xl font-semibold mb-2">
          {owner}/{repo}
        </h2>

        <p className={`text-lg font-medium ${config.colorClass} mb-4`}>
          {t(`home.repository.status.${status.toLowerCase()}`)}
          {isProcessing && dots}
        </p>

        <p className="text-muted-foreground text-sm mb-6">
          {t(`home.repository.status.${status.toLowerCase()}Description`)}
        </p>

        {isProcessing && (
          <div className="space-y-4">
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className={`h-full ${status === "Processing" ? "bg-blue-500" : "bg-yellow-500"} animate-pulse`}
                style={{ width: status === "Processing" ? "60%" : "20%" }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {t("home.repository.status.autoRefreshHint")}
            </p>
          </div>
        )}

        {status === "Failed" && (
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            {t("home.repository.status.retry")}
          </button>
        )}
      </div>
    </div>
  );
}
