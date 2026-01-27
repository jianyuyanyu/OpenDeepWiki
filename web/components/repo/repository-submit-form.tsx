"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useTranslations } from "@/hooks/use-translations";
import { submitRepository } from "@/lib/repository-api";
import type { RepositorySubmitRequest } from "@/types/repository";
import { Loader2, GitBranch, Globe, Lock, Link2, FolderGit2 } from "lucide-react";
import { toast } from "sonner";

interface RepositorySubmitFormProps {
  ownerUserId: string;
  onSuccess?: () => void;
}

const GIT_URL_REGEX = /^(https?:\/\/|git@)[\w.-]+[/:].+?(\.git)?$/i;

const SUPPORTED_LANGUAGES = [
  { code: "en", label: "languages.en" },
  { code: "zh", label: "languages.zh" },
  { code: "ja", label: "languages.ja" },
  { code: "ko", label: "languages.ko" },
];

function parseGitUrl(url: string): { orgName: string; repoName: string } | null {
  const httpsMatch = url.match(/https?:\/\/[^/]+\/([^/]+)\/([^/]+?)(?:\.git)?$/i);
  if (httpsMatch) {
    return { orgName: httpsMatch[1], repoName: httpsMatch[2] };
  }
  
  const sshMatch = url.match(/git@[^:]+:([^/]+)\/([^/]+?)(?:\.git)?$/i);
  if (sshMatch) {
    return { orgName: sshMatch[1], repoName: sshMatch[2] };
  }
  
  return null;
}

export function RepositorySubmitForm({ ownerUserId, onSuccess }: RepositorySubmitFormProps) {
  const t = useTranslations();
  
  const [gitUrl, setGitUrl] = useState("");
  const [branchName, setBranchName] = useState("main");
  const [languageCode, setLanguageCode] = useState("en");
  const [isPublic, setIsPublic] = useState(true);
  const [authAccount, setAuthAccount] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!gitUrl.trim()) {
      newErrors.gitUrl = t("home.repository.gitUrlRequired");
    } else if (!GIT_URL_REGEX.test(gitUrl.trim())) {
      newErrors.gitUrl = t("home.repository.gitUrlInvalid");
    }

    if (!branchName.trim()) {
      newErrors.branchName = t("home.repository.branchNameRequired");
    }

    if (!languageCode) {
      newErrors.languageCode = t("home.repository.languageRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const parsed = parseGitUrl(gitUrl.trim());
    if (!parsed) {
      setErrors({ gitUrl: t("home.repository.gitUrlInvalid") });
      return;
    }

    setIsSubmitting(true);

    try {
      // 如果设置了密码则 isPublic 为 false，否则为 true
      const effectiveIsPublic = !authPassword;

      const request: RepositorySubmitRequest = {
        ownerUserId,
        gitUrl: gitUrl.trim(),
        repoName: parsed.repoName,
        orgName: parsed.orgName,
        branchName: branchName.trim(),
        languageCode,
        isPublic: effectiveIsPublic,
        authAccount: authAccount.trim() || undefined,
        authPassword: authPassword || undefined,
      };

      await submitRepository(request);
      toast.success(t("home.repository.submitSuccess"));
      
      setGitUrl("");
      setBranchName("main");
      setLanguageCode("en");
      setIsPublic(true);
      setAuthAccount("");
      setAuthPassword("");
      setErrors({});
      
      onSuccess?.();
    } catch (error) {
      toast.error(t("home.repository.submitError"));
      console.error("Failed to submit repository:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 pb-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/25">
          <FolderGit2 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">{t("home.repository.submitTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("home.repository.submitDescription")}</p>
        </div>
      </div>

      {/* Git URL */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <Link2 className="h-4 w-4 text-muted-foreground" />
          {t("home.repository.gitUrl")}
        </label>
        <Input
          value={gitUrl}
          onChange={(e) => setGitUrl(e.target.value)}
          placeholder={t("home.repository.gitUrlPlaceholder")}
          aria-invalid={!!errors.gitUrl}
          className="h-11 bg-secondary/50 border-transparent focus:border-primary/50 transition-colors"
        />
        {errors.gitUrl && (
          <p className="text-sm text-destructive">{errors.gitUrl}</p>
        )}
      </div>

      {/* Branch Name */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-muted-foreground" />
          {t("home.repository.branchName")}
        </label>
        <Input
          value={branchName}
          onChange={(e) => setBranchName(e.target.value)}
          placeholder={t("home.repository.branchNamePlaceholder")}
          aria-invalid={!!errors.branchName}
          className="h-11 bg-secondary/50 border-transparent focus:border-primary/50 transition-colors"
        />
        {errors.branchName && (
          <p className="text-sm text-destructive">{errors.branchName}</p>
        )}
      </div>

      {/* Language */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          {t("home.repository.language")}
        </label>
        <Select value={languageCode} onValueChange={setLanguageCode}>
          <SelectTrigger className="w-full h-11 bg-secondary/50 border-transparent focus:border-primary/50 transition-colors">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                {t(`home.repository.${lang.label}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.languageCode && (
          <p className="text-sm text-destructive">{errors.languageCode}</p>
        )}
      </div>

      {/* Public/Private Toggle */}
      <div className="flex items-center justify-between rounded-xl bg-secondary/50 p-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${isPublic ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'}`}>
            {isPublic ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
          </div>
          <div>
            <p className="text-sm font-medium">{t("home.repository.isPublic")}</p>
            <p className="text-xs text-muted-foreground">
              {isPublic ? t("home.repository.publicDesc") : t("home.repository.privateDesc")}
            </p>
          </div>
        </div>
        <Switch checked={isPublic} onCheckedChange={setIsPublic} />
      </div>

      {/* Auth fields */}
      {!isPublic && (
        <div className="space-y-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
            {t("home.repository.authHint")}
          </p>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("home.repository.authAccount")}
            </label>
            <Input
              value={authAccount}
              onChange={(e) => setAuthAccount(e.target.value)}
              placeholder={t("home.repository.authAccountPlaceholder")}
              className="h-11 bg-background/50 border-transparent focus:border-primary/50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("home.repository.authPassword")}
            </label>
            <Input
              type="password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              placeholder={t("home.repository.authPasswordPlaceholder")}
              className="h-11 bg-background/50 border-transparent focus:border-primary/50"
            />
          </div>
        </div>
      )}

      {/* Submit Button */}
      <Button 
        type="submit" 
        className="w-full h-11 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white shadow-lg shadow-teal-500/25 transition-all hover:shadow-teal-500/40" 
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("home.repository.submitting")}
          </>
        ) : (
          t("home.repository.submit")
        )}
      </Button>
    </form>
  );
}
