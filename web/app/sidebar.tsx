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
import { useTranslations } from "@/hooks/use-translations";

const itemKeys = [
    { key: "explore", url: "/", icon: Compass },
    { key: "recommend", url: "/recommend", icon: ThumbsUp },
    { key: "private", url: "/private", icon: GitFork },
    { key: "subscribe", url: "/subscribe", icon: Star },
    { key: "bookmarks", url: "/bookmarks", icon: Bookmark },
    { key: "organizations", url: "/organizations", icon: Building2 },
];

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
    activeItem?: string;
    onItemClick?: (title: string) => void;
}

export function AppSidebar({ activeItem, onItemClick, ...props }: AppSidebarProps) {
    const t = useTranslations();

    const items = itemKeys.map(item => ({
        title: t(`sidebar.${item.key}`),
        url: item.url,
        icon: item.icon,
    }));

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>
                        OpenDeepWiki
                    </SidebarGroupLabel>
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
                        <SidebarMenuButton asChild tooltip={t("sidebar.github")}>
                            <Link href="https://github.com/AIDotNet/OpenDeepWiki" target="_blank">
                                <Github />
                                <span>{t("sidebar.github")}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}