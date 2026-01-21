"use client";

import React, { useState, useEffect } from "react";
import { AppSidebar, items } from "./sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/animate-ui/components/radix/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Search, Plus, Flame, Puzzle } from "lucide-react";

export default function Home() {
  const [activeItem, setActiveItem] = useState("探索");
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      };
      setCurrentTime(now.toLocaleDateString('zh-CN', options));
    };

    updateTime();
  }, []);

  return (
    <SidebarProvider>
      <AppSidebar activeItem={activeItem} onItemClick={setActiveItem} />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <h2 className="text-sm font-semibold">{activeItem}</h2>
            </div>

            <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground hidden md:inline-block">
                    {currentTime}
                </span>
                <Button size="sm">登录</Button>
            </div>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center p-4">
          <div className="w-full max-w-2xl space-y-8">
            <h1 className="text-center text-4xl font-medium tracking-tight text-foreground">
              你想知道什么?
            </h1>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Search className="h-5 w-5" />
              </div>
              <Input
                placeholder="在这里粘贴Github仓库链接或者通过关键词搜索"
                className="h-14 rounded-full pl-12 text-lg shadow-sm transition-all hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary/20 bg-secondary/50 border-transparent"
              />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button variant="secondary" className="gap-2 rounded-full h-10 px-6 bg-teal-500/10 text-teal-500 hover:bg-teal-500/20 hover:text-teal-400 border border-teal-500/20">
                <Plus className="h-4 w-4" />
                添加私人仓库
              </Button>
              <Button variant="secondary" className="gap-2 rounded-full h-10 px-6 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 hover:text-blue-400 border border-blue-500/20">
                <Flame className="h-4 w-4" />
                探索本周的 热门仓库
              </Button>
            </div>
             <div className="flex justify-center">
                 <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
                    <Puzzle className="h-4 w-4" />
                    把 Zread MCP 接入你的开发工具 🔥
                </Button>
             </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
