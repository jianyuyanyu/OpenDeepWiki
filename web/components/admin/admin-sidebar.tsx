"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  GitBranch,
  Settings,
  Shield,
  Users,
  Cog,
  Wrench,
  ChevronLeft,
  Building2,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api-client";

const navItems = [
  {
    href: "/admin",
    icon: LayoutDashboard,
    label: "仪表盘",
  },
  {
    href: "/admin/repositories",
    icon: GitBranch,
    label: "仓库管理",
  },
  {
    label: "工具配置",
    icon: Wrench,
    children: [
      { href: "/admin/tools/mcps", label: "MCPs 管理" },
      { href: "/admin/tools/skills", label: "Skills 管理" },
      { href: "/admin/tools/models", label: "模型配置" },
    ],
  },
  {
    href: "/admin/roles",
    icon: Shield,
    label: "角色管理",
  },
  {
    href: "/admin/departments",
    icon: Building2,
    label: "部门管理",
  },
  {
    href: "/admin/users",
    icon: Users,
    label: "用户管理",
  },
  {
    href: "/admin/chat-assistant",
    icon: MessageCircle,
    label: "对话助手",
  },
  {
    href: "/admin/settings",
    icon: Cog,
    label: "系统设置",
  },
];

interface VersionInfo {
  version: string;
  assemblyVersion: string;
  productName: string;
}

export function AdminSidebar() {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = React.useState<string[]>(["工具配置"]);
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);

  useEffect(() => {
    api.get<{ success: boolean; data: VersionInfo }>("/api/system/version", { skipAuth: true })
      .then((res) => {
        if (res.success) {
          setVersionInfo(res.data);
        }
      })
      .catch(() => {
        // 忽略版本获取失败
      });
  }, []);

  const isPreview = versionInfo?.version?.toLowerCase().includes("preview");

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  return (
    <aside className="w-64 border-r bg-card flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">管理后台</h1>
          <Link href="/">
            <Button variant="ghost" size="icon" title="返回首页">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          if (item.children) {
            const isExpanded = expandedItems.includes(item.label);
            const isChildActive = item.children.some((child) =>
              pathname.startsWith(child.href)
            );

            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleExpand(item.label)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isChildActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="flex-1 text-left">{item.label}</span>
                  <Settings
                    className={cn(
                      "h-4 w-4 transition-transform",
                      isExpanded && "rotate-90"
                    )}
                  />
                </button>
                {isExpanded && (
                  <div className="ml-7 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "block px-3 py-2 rounded-md text-sm transition-colors",
                          pathname === child.href
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {versionInfo && (
        <div className="p-4 border-t">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            {isPreview ? (
              <Badge className="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/30">
                v{versionInfo.version.split('+')[0]}
              </Badge>
            ) : (
              <span>v{versionInfo.version.split('+')[0]}</span>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
