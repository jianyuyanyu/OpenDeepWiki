"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw, XCircle, Play, FileText, Ban } from "lucide-react";
import {
  enqueueBranchFullGeneration,
  retryBranchGenerationTask,
  cancelBranchGenerationTask,
  getBranchGenerationTask,
} from "@/lib/repository-api";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import type { BranchGenerationTaskResponse } from "@/types/repository";

interface BranchGenerationStatusProps {
  repositoryId: string;
  branchId?: string;
  branchName: string;
  generationStatus?: string;
  lastGenerationTaskId?: string;
  lastGenerationError?: string;
}

export function BranchGenerationStatus({
  repositoryId,
  branchId,
  branchName,
  generationStatus,
  lastGenerationTaskId,
  lastGenerationError,
}: BranchGenerationStatusProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [task, setTask] = useState<BranchGenerationTaskResponse | null>(null);

  const displayStatus = task?.status ?? generationStatus;
  const displayTaskId = task?.taskId ?? lastGenerationTaskId;
  const displayError = task?.errorMessage ?? lastGenerationError;

  useEffect(() => {
    if (!lastGenerationTaskId) {
      setTask(null);
      return;
    }

    let cancelled = false;
    const loadTask = async () => {
      const result = await getBranchGenerationTask(lastGenerationTaskId);
      if (!cancelled && result.success && "taskId" in result) {
        setTask(result);
      }
    };

    void loadTask().catch(() => undefined);
    if (generationStatus !== "Pending" && generationStatus !== "Processing") {
      return () => {
        cancelled = true;
      };
    }

    const intervalId = window.setInterval(() => {
      void loadTask().catch(() => undefined);
    }, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [generationStatus, lastGenerationTaskId]);

  const isPendingOrProcessing = displayStatus === "Pending" || displayStatus === "Processing";
  const isFailed = displayStatus === "Failed";
  const isCancelled = displayStatus === "Cancelled";

  const shortTaskId = useMemo(() => {
    if (!displayTaskId) return null;
    return displayTaskId.length > 12 ? `${displayTaskId.slice(0, 8)}...` : displayTaskId;
  }, [displayTaskId]);

  if (!branchId) return null;

  const handleAction = async (actionType: "generate" | "retry" | "cancel") => {
    setIsSubmitting(true);
    setErrorText(null);
    try {
      let result;
      if (actionType === "generate") {
        result = await enqueueBranchFullGeneration(repositoryId, branchId);
      } else if (actionType === "retry" && displayTaskId) {
        result = await retryBranchGenerationTask(displayTaskId);
      } else if (actionType === "cancel" && displayTaskId) {
        result = await cancelBranchGenerationTask(displayTaskId);
      } else {
        return;
      }
      
      if (!result.success && 'error' in result) {
        setErrorText(result.error || "Action failed");
      } else {
        if ("taskId" in result) {
          setTask(result);
        }
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setErrorText("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-4 flex flex-col gap-2 rounded-md border p-3 text-xs">
      <div className="flex items-center justify-between font-medium">
        <span>Branch Generation</span>
        {isPendingOrProcessing && <Loader2 className="h-3 w-3 animate-spin text-sky-500" />}
        {isFailed && <XCircle className="h-3 w-3 text-red-500" />}
      </div>
      
      {displayStatus && (
        <div className="text-muted-foreground flex items-center justify-between">
          <span>Status:</span>
          <span>{displayStatus}</span>
        </div>
      )}
      {shortTaskId && (
        <div className="text-muted-foreground flex items-center justify-between">
          <span>Task:</span>
          <span className="font-mono" title={displayTaskId ?? undefined}>{shortTaskId}</span>
        </div>
      )}

      {(isFailed || isCancelled) && displayError && (
        <div className="text-red-500 mt-1 line-clamp-2" title={displayError}>
          {displayError}
        </div>
      )}

      {errorText && (
        <div className="text-red-500 mt-1 border-l-2 border-red-500 pl-2">
          {errorText}
        </div>
      )}

      <div className="mt-2 flex flex-col gap-2">
        {!isPendingOrProcessing && !isFailed && !isCancelled && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-xs h-7"
            onClick={() => handleAction("generate")}
            disabled={isSubmitting}
          >
            <Play className="mr-1 h-3 w-3" /> Generate Full Wiki
          </Button>
        )}

        {(isFailed || isCancelled) && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-xs h-7"
            onClick={() => handleAction("retry")}
            disabled={isSubmitting}
          >
            <RefreshCw className="mr-1 h-3 w-3" /> Retry Generation
          </Button>
        )}

        {displayStatus === "Pending" && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-xs h-7"
            onClick={() => handleAction("cancel")}
            disabled={isSubmitting}
          >
            <Ban className="mr-1 h-3 w-3" /> Cancel
          </Button>
        )}
      </div>

      {displayTaskId && (
        <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-muted-foreground">
          <FileText className="h-3 w-3" />
          <span>Logs: filter by branch {branchName} / task {shortTaskId}</span>
        </div>
      )}
    </div>
  );
}
