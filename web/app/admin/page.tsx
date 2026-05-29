"use client";

import { useEffect, useMemo, useState, type ElementType, type ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  getDashboardStatistics,
  getTokenUsageStatistics,
  getMcpUsageStatistics,
  DashboardStatistics,
  TokenUsageStatistics,
  McpUsageStatistics,
} from "@/lib/admin-api";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  BarChart3,
  Coins,
  Database,
  GitBranch,
  Globe2,
  Loader2,
  Percent,
  Server,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";
import { useLocale } from "next-intl";

const CHART_COLORS = {
  freshInput: "#2563eb",
  cacheCreation: "#f59e0b",
  cacheHit: "#059669",
  output: "#7c3aed",
  submitted: "#0284c7",
  processed: "#16a34a",
  users: "#db2777",
  requests: "#0f766e",
  errors: "#dc2626",
  rate: "var(--foreground)",
};

type Tone = "blue" | "green" | "violet" | "amber" | "cyan" | "rose";

type ChartDatum = Record<string, string | number>;

interface TooltipEntry {
  dataKey?: string | number;
  name?: string;
  value?: string | number;
  color?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
  totalLabel?: string;
  valueFormatter?: (value: number, dataKey?: string) => string;
  hideTotal?: boolean;
}

interface MetricTileProps {
  icon: ElementType;
  label: string;
  value: string;
  detail: string;
  tone: Tone;
  progress?: number;
}

interface LegendDotProps {
  color: string;
  label: string;
}

interface ChartPanelProps {
  title: string;
  description: string;
  meta?: string;
  children: ReactNode;
  className?: string;
}

interface BreakdownRowProps {
  label: string;
  value: string;
  detail: string;
  color: string;
}

function formatNumberWithUnits(value: number) {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  const formatCompact = (num: number, unit: "K" | "M" | "B") => {
    const fixed = num >= 100 ? num.toFixed(0) : num.toFixed(1);
    return `${sign}${fixed.replace(/\.0$/, "")}${unit}`;
  };

  if (abs >= 1_000_000_000) return formatCompact(abs / 1_000_000_000, "B");
  if (abs >= 1_000_000) return formatCompact(abs / 1_000_000, "M");
  if (abs >= 1_000) return formatCompact(abs / 1_000, "K");

  return value.toLocaleString();
}

function formatPercent(value: number) {
  return `${value.toFixed(value >= 10 ? 1 : 2).replace(/\.0$/, "")}%`;
}

function formatCurrency(value: number) {
  if (value <= 0) return "$0";
  if (value < 1) return `$${value.toFixed(4)}`;
  return `$${value.toFixed(2)}`;
}

function toDateLabel(date: string, locale: string) {
  return new Date(date).toLocaleDateString(locale, { month: "short", day: "numeric" });
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function CustomTooltip({
  active,
  payload,
  label,
  totalLabel,
  valueFormatter,
  hideTotal,
}: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  const numericEntries = payload
    .filter((entry) => typeof entry.value === "number")
    .map((entry) => ({
      ...entry,
      value: entry.value as number,
      dataKey: entry.dataKey?.toString(),
    }));

  return (
    <div className="rounded-md border bg-background/95 p-4 shadow-lg backdrop-blur">
      <p className="mb-3 text-sm font-medium text-muted-foreground">{label}</p>
      <div className="space-y-2">
        {numericEntries.map((entry) => (
          <div key={`${entry.dataKey}-${entry.name}`} className="flex items-center justify-between gap-8">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-muted-foreground">{entry.name}</span>
            </div>
            <span className="text-sm font-semibold tabular-nums">
              {valueFormatter ? valueFormatter(entry.value, entry.dataKey) : entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
      {!hideTotal && numericEntries.length > 1 && (
        <div className="mt-3 flex items-center justify-between border-t pt-3">
          <span className="text-sm text-muted-foreground">{totalLabel}</span>
          <span className="text-sm font-bold tabular-nums">
            {formatNumberWithUnits(
              numericEntries
                .filter((entry) => entry.dataKey !== "hitRate")
                .reduce((sum, entry) => sum + entry.value, 0)
            )}
          </span>
        </div>
      )}
    </div>
  );
}

function MetricTile({ icon: Icon, label, value, detail, tone, progress }: MetricTileProps) {
  const toneClass = {
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    cyan: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
    rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  }[tone];

  return (
    <Card className="rounded-md p-5 shadow-none transition-colors hover:border-foreground/25">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 truncate text-2xl font-semibold tracking-normal tabular-nums">{value}</p>
        </div>
        <div className={cn("rounded-md p-2.5", toneClass)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 min-h-5 text-xs text-muted-foreground">{detail}</p>
      {typeof progress === "number" && (
        <Progress className="mt-4 h-1.5" value={clampPercent(progress)} />
      )}
    </Card>
  );
}

function LegendDot({ color, label }: LegendDotProps) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </div>
  );
}

function ChartPanel({ title, description, meta, children, className }: ChartPanelProps) {
  return (
    <Card className={cn("rounded-md p-5 shadow-none", className)}>
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        {meta && (
          <span className="rounded-md border px-2.5 py-1 text-xs text-muted-foreground">{meta}</span>
        )}
      </div>
      {children}
    </Card>
  );
}

function BreakdownRow({ label, value, detail, color }: BreakdownRowProps) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-1.5 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="font-semibold tabular-nums">{value}</p>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

function EmptyChartState({ label }: { label: string }) {
  return (
    <div className="flex h-[260px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
      {label}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [dashboardStats, setDashboardStats] = useState<DashboardStatistics | null>(null);
  const [tokenStats, setTokenStats] = useState<TokenUsageStatistics | null>(null);
  const [mcpStats, setMcpStats] = useState<McpUsageStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const t = useTranslations();
  const locale = useLocale();
  const dateLocale = locale === "zh" ? "zh-CN" : locale;

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [dashboard, token] = await Promise.all([
          getDashboardStatistics(days),
          getTokenUsageStatistics(days),
        ]);
        setDashboardStats(dashboard);
        setTokenStats(token);
        try {
          const mcp = await getMcpUsageStatistics(days);
          setMcpStats(mcp);
        } catch {
          setMcpStats(null);
        }
      } catch (error) {
        console.error("Failed to fetch statistics:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [days]);

  const repoChartData = useMemo(
    () =>
      dashboardStats?.repositoryStats.map((stat) => ({
        date: toDateLabel(stat.date, dateLocale),
        submitted: stat.submittedCount,
        processed: stat.processedCount,
      })) || [],
    [dashboardStats, dateLocale]
  );

  const userChartData = useMemo(
    () =>
      dashboardStats?.userStats.map((stat) => ({
        date: toDateLabel(stat.date, dateLocale),
        users: stat.newUserCount,
      })) || [],
    [dashboardStats, dateLocale]
  );

  const tokenChartData = useMemo(
    () =>
      tokenStats?.dailyUsages.map((stat) => {
        const cacheHitTokens = stat.cachedInputTokens ?? 0;
        const cacheCreationTokens = stat.cacheCreationInputTokens ?? 0;
        const freshInputTokens = Math.max(
          stat.inputTokens - cacheHitTokens - cacheCreationTokens,
          0
        );

        return {
          date: toDateLabel(stat.date, dateLocale),
          freshInputTokens,
          cacheCreationTokens,
          cacheHitTokens,
          outputTokens: stat.outputTokens,
          hitRate: (stat.inputCacheHitRate ?? 0) * 100,
        };
      }) || [],
    [tokenStats, dateLocale]
  );

  const mcpChartData = useMemo(
    () =>
      mcpStats?.dailyUsages.map((stat) => ({
        date: toDateLabel(stat.date, dateLocale),
        requests: stat.requestCount,
        errors: stat.errorCount,
      })) || [],
    [mcpStats, dateLocale]
  );

  const totalRepoSubmitted = dashboardStats?.repositoryStats.reduce((sum, s) => sum + s.submittedCount, 0) || 0;
  const totalRepoProcessed = dashboardStats?.repositoryStats.reduce((sum, s) => sum + s.processedCount, 0) || 0;
  const totalNewUsers = dashboardStats?.userStats.reduce((sum, s) => sum + s.newUserCount, 0) || 0;
  const repoCompletionRate = totalRepoSubmitted > 0 ? (totalRepoProcessed / totalRepoSubmitted) * 100 : 0;

  const totalInputTokens = tokenStats?.totalInputTokens ?? 0;
  const totalOutputTokens = tokenStats?.totalOutputTokens ?? 0;
  const totalCachedInputTokens = tokenStats?.totalCachedInputTokens ?? 0;
  const totalCacheCreationInputTokens = tokenStats?.totalCacheCreationInputTokens ?? 0;
  const totalFreshInputTokens = Math.max(
    totalInputTokens - totalCachedInputTokens - totalCacheCreationInputTokens,
    0
  );
  const inputCacheHitRate = (tokenStats?.inputCacheHitRate ?? 0) * 100;
  const totalTokens = tokenStats?.totalTokens ?? 0;
  const totalCost = tokenStats?.totalCost ?? 0;

  const totalMcpRequests = mcpStats?.totalRequests ?? 0;
  const totalMcpSuccessful = mcpStats?.totalSuccessful ?? 0;
  const totalMcpErrors = mcpStats?.totalErrors ?? 0;
  const mcpSuccessRate = totalMcpRequests > 0 ? (totalMcpSuccessful / totalMcpRequests) * 100 : 0;

  const updatedAt = new Date().toLocaleString(dateLocale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  if (loading) {
    return (
      <div className="flex h-[55vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">{t("admin.dashboard.loading")}</p>
      </div>
    );
  }

  const tokenValueFormatter = (value: number, dataKey?: string) =>
    dataKey === "hitRate" ? formatPercent(value) : formatNumberWithUnits(value);

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-5 border-b pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Activity className="h-4 w-4" />
            <span>{t("admin.dashboard.overview")}</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-normal">{t("admin.dashboard.title")}</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {t("admin.dashboard.subtitle", { days })}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="rounded-md border px-3 py-2 text-xs text-muted-foreground">
            <span className="mr-2 font-medium text-foreground">{t("admin.dashboard.updatedAt")}</span>
            {updatedAt}
          </div>
          <Tabs value={days.toString()} onValueChange={(value) => setDays(Number.parseInt(value, 10))}>
            <TabsList>
              <TabsTrigger value="7">{t("admin.dashboard.days7")}</TabsTrigger>
              <TabsTrigger value="14">{t("admin.dashboard.days14")}</TabsTrigger>
              <TabsTrigger value="30">{t("admin.dashboard.days30")}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <MetricTile
          icon={GitBranch}
          label={t("admin.dashboard.repoSubmit")}
          value={totalRepoSubmitted.toLocaleString()}
          detail={t("admin.dashboard.repoSubmitDetail", { count: totalRepoProcessed })}
          tone="blue"
          progress={repoCompletionRate}
        />
        <MetricTile
          icon={TrendingUp}
          label={t("admin.dashboard.processed")}
          value={totalRepoProcessed.toLocaleString()}
          detail={t("admin.dashboard.completionRate", { rate: formatPercent(repoCompletionRate) })}
          tone="green"
          progress={repoCompletionRate}
        />
        <MetricTile
          icon={Users}
          label={t("admin.dashboard.newUsers")}
          value={totalNewUsers.toLocaleString()}
          detail={t("admin.dashboard.newUsersDetail", { days })}
          tone="rose"
        />
        <MetricTile
          icon={Coins}
          label={t("admin.dashboard.tokenUsage")}
          value={formatNumberWithUnits(totalTokens)}
          detail={t("admin.dashboard.tokenUsageDetail", { cost: formatCurrency(totalCost) })}
          tone="amber"
        />
        <MetricTile
          icon={Percent}
          label={t("admin.dashboard.cacheHitRate")}
          value={formatPercent(inputCacheHitRate)}
          detail={t("admin.dashboard.cacheHitRateDetail", {
            count: formatNumberWithUnits(totalCachedInputTokens),
          })}
          tone="violet"
          progress={inputCacheHitRate}
        />
        <MetricTile
          icon={Globe2}
          label={t("admin.dashboard.mcpTotal")}
          value={totalMcpRequests.toLocaleString()}
          detail={t("admin.dashboard.mcpSuccessRate", { rate: formatPercent(mcpSuccessRate) })}
          tone="cyan"
          progress={mcpSuccessRate}
        />
      </section>

      <Card className="overflow-hidden rounded-md shadow-none">
        <div className="grid xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="p-5">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold">{t("admin.dashboard.tokenTrend")}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("admin.dashboard.tokenTrendDescription")}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <LegendDot color={CHART_COLORS.freshInput} label={t("admin.dashboard.freshInputToken")} />
                <LegendDot color={CHART_COLORS.cacheCreation} label={t("admin.dashboard.cacheCreationToken")} />
                <LegendDot color={CHART_COLORS.cacheHit} label={t("admin.dashboard.cacheHitToken")} />
                <LegendDot color={CHART_COLORS.output} label={t("admin.dashboard.outputToken")} />
                <LegendDot color="var(--foreground)" label={t("admin.dashboard.cacheHitRate")} />
              </div>
            </div>

            {tokenChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={360}>
                <ComposedChart data={tokenChartData as ChartDatum[]} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  />
                  <YAxis
                    yAxisId="tokens"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    tickFormatter={formatNumberWithUnits}
                  />
                  <YAxis
                    yAxisId="rate"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    tickFormatter={(value) => formatPercent(Number(value))}
                  />
                  <Tooltip
                    cursor={{ fill: "color-mix(in oklab, var(--muted) 72%, transparent)" }}
                    content={
                      <CustomTooltip
                        totalLabel={t("admin.dashboard.total")}
                        valueFormatter={tokenValueFormatter}
                      />
                    }
                  />
                  <Bar
                    yAxisId="tokens"
                    dataKey="freshInputTokens"
                    name={t("admin.dashboard.freshInputToken")}
                    stackId="tokens"
                    fill={CHART_COLORS.freshInput}
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    yAxisId="tokens"
                    dataKey="cacheCreationTokens"
                    name={t("admin.dashboard.cacheCreationToken")}
                    stackId="tokens"
                    fill={CHART_COLORS.cacheCreation}
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    yAxisId="tokens"
                    dataKey="cacheHitTokens"
                    name={t("admin.dashboard.cacheHitToken")}
                    stackId="tokens"
                    fill={CHART_COLORS.cacheHit}
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    yAxisId="tokens"
                    dataKey="outputTokens"
                    name={t("admin.dashboard.outputToken")}
                    stackId="tokens"
                    fill={CHART_COLORS.output}
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    yAxisId="rate"
                    type="monotone"
                    dataKey="hitRate"
                    name={t("admin.dashboard.cacheHitRate")}
                    stroke={CHART_COLORS.rate}
                    strokeWidth={2.5}
                    dot={{ r: 3, strokeWidth: 2 }}
                    activeDot={{ r: 5 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartState label={t("admin.dashboard.noData")} />
            )}
          </div>

          <aside className="border-t bg-muted/25 p-5 xl:border-l xl:border-t-0">
            <div className="mb-5 flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">{t("admin.dashboard.tokenComposition")}</h3>
            </div>
            <div className="space-y-5">
              <BreakdownRow
                color={CHART_COLORS.freshInput}
                label={t("admin.dashboard.freshInputToken")}
                value={formatNumberWithUnits(totalFreshInputTokens)}
                detail={t("admin.dashboard.freshInputTokenDetail")}
              />
              <BreakdownRow
                color={CHART_COLORS.cacheCreation}
                label={t("admin.dashboard.cacheCreationToken")}
                value={formatNumberWithUnits(totalCacheCreationInputTokens)}
                detail={t("admin.dashboard.cacheCreationTokenDetail")}
              />
              <BreakdownRow
                color={CHART_COLORS.cacheHit}
                label={t("admin.dashboard.cacheHitToken")}
                value={formatNumberWithUnits(totalCachedInputTokens)}
                detail={t("admin.dashboard.cacheHitTokenDetail")}
              />
              <BreakdownRow
                color={CHART_COLORS.output}
                label={t("admin.dashboard.outputToken")}
                value={formatNumberWithUnits(totalOutputTokens)}
                detail={t("admin.dashboard.outputTokenDetail")}
              />
            </div>

            <div className="mt-6 border-t pt-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("admin.dashboard.cacheHitRate")}</span>
                <span className="font-semibold tabular-nums">{formatPercent(inputCacheHitRate)}</span>
              </div>
              <Progress value={inputCacheHitRate} />
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                {t("admin.dashboard.cacheEfficiencyDescription")}
              </p>
            </div>
          </aside>
        </div>
      </Card>

      <section className="grid gap-6 xl:grid-cols-3">
        <ChartPanel
          title={t("admin.dashboard.repoStats")}
          description={t("admin.dashboard.repoStatsDescription")}
          meta={t("admin.dashboard.totalWithCount", { count: totalRepoSubmitted })}
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={repoChartData as ChartDatum[]} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              />
              <Tooltip
                cursor={{ fill: "color-mix(in oklab, var(--muted) 72%, transparent)" }}
                content={<CustomTooltip totalLabel={t("admin.dashboard.total")} />}
              />
              <Bar dataKey="submitted" name={t("admin.dashboard.submitCount")} fill={CHART_COLORS.submitted} radius={[4, 4, 0, 0]} />
              <Bar dataKey="processed" name={t("admin.dashboard.processed")} fill={CHART_COLORS.processed} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel
          title={t("admin.dashboard.userGrowth")}
          description={t("admin.dashboard.userGrowthDescription")}
          meta={t("admin.dashboard.totalWithCount", { count: totalNewUsers })}
        >
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={userChartData as ChartDatum[]} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              />
              <Tooltip
                cursor={{ fill: "color-mix(in oklab, var(--muted) 72%, transparent)" }}
                content={<CustomTooltip totalLabel={t("admin.dashboard.total")} />}
              />
              <Bar dataKey="users" name={t("admin.dashboard.newUsers")} fill={CHART_COLORS.users} radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="users" name={t("admin.dashboard.newUsers")} stroke="var(--foreground)" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel
          title={t("admin.dashboard.mcpTrend")}
          description={t("admin.dashboard.mcpTrendDescription")}
          meta={t("admin.dashboard.errorsWithCount", { count: totalMcpErrors })}
        >
          {mcpStats ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={mcpChartData as ChartDatum[]} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: "color-mix(in oklab, var(--muted) 72%, transparent)" }}
                  content={<CustomTooltip totalLabel={t("admin.dashboard.total")} />}
                />
                <Bar dataKey="requests" name={t("admin.dashboard.mcpRequests")} fill={CHART_COLORS.requests} radius={[4, 4, 0, 0]} />
                <Bar dataKey="errors" name={t("admin.dashboard.mcpErrors")} fill={CHART_COLORS.errors} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChartState label={t("admin.dashboard.mcpUnavailable")} />
          )}
        </ChartPanel>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-md border p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="h-4 w-4 text-amber-500" />
            {t("admin.dashboard.cacheCreationToken")}
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums">
            {formatNumberWithUnits(totalCacheCreationInputTokens)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{t("admin.dashboard.cacheCreationTokenDetail")}</p>
        </div>
        <div className="rounded-md border p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Zap className="h-4 w-4 text-emerald-500" />
            {t("admin.dashboard.cacheHitToken")}
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums">
            {formatNumberWithUnits(totalCachedInputTokens)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{t("admin.dashboard.cacheHitTokenDetail")}</p>
        </div>
        <div className="rounded-md border p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Server className="h-4 w-4 text-cyan-500" />
            {t("admin.dashboard.mcpRequests")}
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums">
            {totalMcpRequests.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("admin.dashboard.mcpRequestMix", {
              success: totalMcpSuccessful,
              errors: totalMcpErrors,
            })}
          </p>
        </div>
      </section>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <BarChart3 className="h-3.5 w-3.5" />
        <span>{t("admin.dashboard.windowHint", { days })}</span>
      </div>
    </div>
  );
}
