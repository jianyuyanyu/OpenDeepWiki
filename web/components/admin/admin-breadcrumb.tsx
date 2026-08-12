"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { useTranslations } from "@/hooks/use-translations";

/** Maps admin route segments to i18n keys. */
const SEGMENT_LABEL_KEYS: Record<string, string> = {
  admin: "common.adminPanel",
  repositories: "common.admin.repositories",
  users: "common.admin.users",
  roles: "common.admin.roles",
  departments: "admin.departments.title",
  settings: "common.admin.settings",
  "api-keys": "admin.apiKeys.title",
  "chat-assistant": "admin.chatAssistant.title",
  "chat-providers": "admin.chatProviders.title",
  "mcp-providers": "admin.mcpProviders.title",
  tools: "common.admin.tools",
  mcps: "common.admin.mcps",
  skills: "common.admin.skills",
  "ai-providers": "admin.toolPages.aiProviders",
  models: "admin.toolPages.models",
  "model-configs": "admin.toolPages.modelConfigs",
  "github-import": "admin.githubImport.title",
};

/** Segments that have no standalone page and should not be links. */
const NON_LINK_SEGMENTS = new Set(["tools"]);

interface AdminBreadcrumbProps {
  /** Label to display for a trailing dynamic segment (e.g. repository name). */
  currentLabel?: string;
}

export function AdminBreadcrumb({ currentLabel }: AdminBreadcrumbProps) {
  const pathname = usePathname();
  const t = useTranslations();

  const segments = pathname.split("/").filter(Boolean);

  const items = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`;
    const isLast = index === segments.length - 1;
    const labelKey = SEGMENT_LABEL_KEYS[segment];
    let label: string;
    if (labelKey) {
      label = t(labelKey);
    } else if (isLast && currentLabel) {
      label = currentLabel;
    } else {
      // Truncate raw dynamic segments (e.g. UUIDs).
      label = segment.length > 12 ? `${segment.slice(0, 8)}…` : segment;
    }
    return {
      href,
      label,
      isLast,
      isLink: !isLast && !NON_LINK_SEGMENTS.has(segment),
    };
  });

  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex items-center gap-1 text-sm">
        {items.map((item) => (
          <Fragment key={item.href}>
            <li className="min-w-0">
              {item.isLink ? (
                <Link
                  href={item.href}
                  className="block max-w-[180px] truncate text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={
                    item.isLast
                      ? "block max-w-[240px] truncate font-medium text-foreground"
                      : "block max-w-[180px] truncate text-muted-foreground"
                  }
                >
                  {item.label}
                </span>
              )}
            </li>
            {!item.isLast && (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
            )}
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
