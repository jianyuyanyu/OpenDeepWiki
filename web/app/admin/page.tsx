"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getDashboardStatistics,
  getTokenUsageStatistics,
  DashboardStatistics,
  TokenUsageStatistics,
} from "@/lib/admin-api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { Loader2, GitBranch, Users, Coins, TrendingUp } from "lucide-react";

export default function AdminDashboardPage() {
  const [dashboardStats, setDashboardStats] = useState<DashboardStatistics | null>(null);
  const [tokenStats, setTokenStats] = useState<TokenUsageStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

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
      } catch (error) {
        console.error("Failed to fetch statistics:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [days]);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const repoChartData = dashboardStats?.repositoryStats.map((stat) => ({
    date: new Date(stat.date).toLocaleDateString("zh-CN", { month: "short", day: "numeric" }),
    提交数: stat.submittedCount,
    处理完成: stat.processedCount,
  })) || [];

  const userChartData = dashboardStats?.userStats.map((stat) => ({
    date: new Date(stat.date).toLocaleDateString("zh-CN", { month: "short", day: "numeric" }),
    新增用户: stat.newUserCount,
  })) || [];

  const tokenChartData = tokenStats?.dailyUsages.map((stat) => ({
    date: new Date(stat.date).toLocaleDateString("zh-CN", { month: "short", day: "numeric" }),
    输入Token: stat.inputTokens,
    输出Token: stat.outputTokens,
  })) || [];

  const totalRepoSubmitted = dashboardStats?.repositoryStats.reduce((sum, s) => sum + s.submittedCount, 0) || 0;
  const totalRepoProcessed = dashboardStats?.repositoryStats.reduce((sum, s) => sum + s.processedCount, 0) || 0;
  const totalNewUsers = dashboardStats?.userStats.reduce((sum, s) => sum + s.newUserCount, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">仪表盘</h1>
        <Tabs value={days.toString()} onValueChange={(v) => setDays(parseInt(v))}>
          <TabsList>
            <TabsTrigger value="7">7天</TabsTrigger>
            <TabsTrigger value="14">14天</TabsTrigger>
            <TabsTrigger value="30">30天</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
              <GitBranch className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">仓库提交</p>
              <p className="text-2xl font-bold">{totalRepoSubmitted}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">处理完成</p>
              <p className="text-2xl font-bold">{totalRepoProcessed}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900">
              <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">新增用户</p>
              <p className="text-2xl font-bold">{totalNewUsers}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-orange-100 p-3 dark:bg-orange-900">
              <Coins className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Token 消耗</p>
              <p className="text-2xl font-bold">{(tokenStats?.totalTokens || 0).toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* 图表区域 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 仓库统计图表 */}
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold">仓库统计</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={repoChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="提交数" fill="#3b82f6" />
              <Bar dataKey="处理完成" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* 用户增长图表 */}
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold">用户增长</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="新增用户" stroke="#8b5cf6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Token 消耗图表 */}
        <Card className="p-6 lg:col-span-2">
          <h3 className="mb-4 text-lg font-semibold">Token 消耗趋势</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={tokenChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="输入Token" fill="#f97316" />
              <Bar dataKey="输出Token" fill="#eab308" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
