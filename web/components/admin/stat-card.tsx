"use client";

import type { ElementType } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export type StatTone =
  | "blue"
  | "green"
  | "violet"
  | "amber"
  | "cyan"
  | "rose"
  | "neutral";

const TONE_ICON_CLASS: Record<StatTone, string> = {
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  cyan: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  neutral: "bg-muted text-muted-foreground",
};

const TONE_SPARK_COLOR: Record<StatTone, string> = {
  blue: "#2563eb",
  green: "#059669",
  violet: "#7c3aed",
  amber: "#d97706",
  cyan: "#0891b2",
  rose: "#e11d48",
  neutral: "#71717a",
};

interface StatCardProps {
  icon: ElementType;
  label: string;
  value: string;
  detail?: string;
  tone?: StatTone;
  progress?: number;
  sparkline?: number[];
  className?: string;
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

export function StatCard({
  icon: Icon,
  label,
  value,
  detail,
  tone = "neutral",
  progress,
  sparkline,
  className,
}: StatCardProps) {
  const sparkData = sparkline?.map((v, i) => ({ i, v }));
  const hasSpark = sparkData && sparkData.length > 1;
  const sparkColor = TONE_SPARK_COLOR[tone];

  return (
    <Card
      className={cn(
        "relative gap-0 overflow-hidden rounded-lg p-4 shadow-none transition-colors hover:border-foreground/20",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-muted-foreground">
            {label}
          </p>
          <p className="mt-1.5 truncate text-2xl font-semibold tabular-nums">
            {value}
          </p>
        </div>
        <div className={cn("rounded-md p-2", TONE_ICON_CLASS[tone])}>
          <Icon className="h-4 w-4" />
        </div>
      </div>

      {hasSpark && (
        <div className="pointer-events-none mt-2 h-9">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={sparkData}
              margin={{ top: 2, right: 0, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id={`spark-${tone}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={sparkColor} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={sparkColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={sparkColor}
                strokeWidth={1.5}
                fill={`url(#spark-${tone})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {detail && (
        <p className="mt-2 truncate text-xs text-muted-foreground">{detail}</p>
      )}

      {typeof progress === "number" && (
        <Progress className="mt-3 h-1" value={clampPercent(progress)} />
      )}
    </Card>
  );
}
