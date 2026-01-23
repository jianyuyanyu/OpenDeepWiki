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
import { useRouter } from "next/navigation";
import { useTranslations } from "@/hooks/use-translations";
import { useAuth } from "@/contexts/auth-context";

const itemKeys = [
    { key: "explore", url: "/", icon: Compass, requireAuth: false },
    { key: "recommend", url: "/recommend", icon: ThumbsUp, requireAuth: false },
    { key: "private", url: "/private", icon: GitFork, requireAuth: true },
    { key: "subscribe", url: "/subscribe", icon: Star, requireAuth: true },
    { key: "bookmarks", url: "/bookmarks", icon: Bookmark, requireAuth: true },
    { key: "organizations", url: "/organizations", icon: Building2, requireAuth: false },
];

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
    activeItem?: string;
    onItemClick?: (title: string) => void;
}

export function AppSidebar({ activeItem, onItemClick, ...props }: AppSidebarProps) {
    const t = useTranslations();
    const router = useRouter();
    const { isAuthenticated } = useAuth();

    const items = itemKeys.map(item => ({
        title: t(`sidebar.${item.key}`),
        url: item.url,
        icon: item.icon,
        requireAuth: item.requireAuth,
    }));

    const handleItemClick = (item: typeof items[0]) => {
        if (item.requireAuth && !isAuthenticated) {
            router.push("/auth");
            return;
        }
        onItemClick?.(item.title);
    };

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
                                        onClick={(e) => {
                                            if (item.requireAuth && !isAuthenticated) {
                                                e.preventDefault();
                                                handleItemClick(item);
                                            } else {
                                                onItemClick?.(item.title);
                                            }
                                        }}
                                    >
                                        <Link href={item.requireAuth && !isAuthenticated ? "#" : item.url}>
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