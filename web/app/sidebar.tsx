"use client";

import {
    Compass,
    ThumbsUp,
    GitFork,
    Star,
    Bookmark,
    Building2,
    Github
} from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/animate-ui/components/radix/sidebar";
import React from "react";
import Link from "next/link";

export const items = [
    { title: "探索", url: "/", icon: Compass },
    { title: "推荐", url: "/recommend", icon: ThumbsUp },
    { title: "私有仓库", url: "/private", icon: GitFork },
    { title: "订阅", url: "/subscribe", icon: Star },
    { title: "收藏夹", url: "/bookmarks", icon: Bookmark },
    { title: "机构目录", url: "/organizations", icon: Building2 },
];

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
    activeItem?: string;
    onItemClick?: (title: string) => void;
}

export function AppSidebar({ activeItem, onItemClick, ...props }: AppSidebarProps) {
    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Menu</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        tooltip={item.title}
                                        isActive={activeItem === item.title}
                                        onClick={() => onItemClick?.(item.title)}
                                    >
                                        <Link href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip="GitHub">
                            <Link href="https://github.com" target="_blank">
                                <Github />
                                <span>GitHub</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}