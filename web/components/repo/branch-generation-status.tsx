"use client";

import * as React from "react";
import { CheckCircle2, FileText, Loader2, XCircle } from "lucide-react";

interface BranchGenerationStatusProps {
  branchId?: string;
  branchName: string;
  generationStatus?: string;
  lastGenerationTaskId?: string;
  lastGenerationError?: string;
}

export function BranchGenerationStatus({
  branchId,
  branchName,
  generationStatus,
  lastGenerationTaskId,
  lastGenerationError,
}: BranchGenerationStatusProps) {
  const isPendingOrProcessing = generationStatus === "Pending" || generationStatus === "Processing";
  const isFailed = generationStatus === "Failed";
  const isCompleted = generationStatus === "Completed";
  const shortTaskId = lastGenerationTaskId
    ? lastGenerationTaskId.length > 12
      ? `${lastGenerationTaskId.slice(0, 8)}...`
      : lastGenerationTaskId
    : null;

  if (!branchId) return null;

  return (
    <div className="mt-4 flex flex-col gap-2 rounded-md border p-3 text-xs">
      <div className="flex items-center justify-between font-medium">
        <span>Branch Generation</span>
        {isPendingOrProcessing && <Loader2 className="h-3 w-3 animate-spin text-sky-500" />}
        {isFailed && <XCircle className="h-3 w-3 text-red-500" />}
        {isCompleted && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
      </div>
      
      {generationStatus && (
        <div className="text-muted-foreground flex items-center justify-between">
          <span>Status:</span>
          <span>{generationStatus}</span>
        </div>
      )}
      {shortTaskId && (
        <div className="text-muted-foreground flex items-center justify-between">
          <span>Task:</span>
          <span className="font-mono" title={lastGenerationTaskId}>{shortTaskId}</span>
        </div>
      )}

      {isFailed && lastGenerationError && (
        <div className="text-red-500 mt-1 line-clamp-2" title={lastGenerationError}>
          {lastGenerationError}
        </div>
      )}

      {lastGenerationTaskId && (
        <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-muted-foreground">
          <FileText className="h-3 w-3" />
          <span>Logs: filter by branch {branchName} / task {shortTaskId}</span>
        </div>
      )}
    </div>
  );
}
