"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/animate-ui/components/radix/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useTranslations } from "@/hooks/use-translations";

interface HeaderProps {
  title: string;
  currentWeekday: string;
  isAuthenticated?: boolean;
  user?: {
    name: string;
    avatar?: string;
    email?: string;
  };
}

export function Header({ title, currentWeekday, isAuthenticated = false, user }: HeaderProps) {
  const router = useRouter();
  const t = useTranslations();

  const handleLogin = () => {
    router.push("/auth");
  };

  const handleLogout = () => {
    // TODO: Implement logout logic
    console.log("Logout");
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground hidden md:inline-block">
          {currentWeekday}
        </span>
        
        <div className="flex items-center gap-1">
          <LanguageToggle />
          <ThemeToggle />
        </div>
        
        {isAuthenticated && user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  {user.email && (
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>{t("common.profile")}</DropdownMenuItem>
              <DropdownMenuItem>{t("common.settings")}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                {t("common.logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button size="sm" onClick={handleLogin}>
            {t("common.login")}
          </Button>
        )}
      </div>
    </header>
  );
}
