"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getSettings,
  updateSettings,
  SystemSetting,
} from "@/lib/admin-api";
import {
  Loader2,
  RefreshCw,
  Save,
  Settings,
  Shield,
  Bot,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "@/hooks/use-translations";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState("general");
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const t = useTranslations();

  const categoryIcons: Record<string, React.ReactNode> = {
    general: <Globe className="h-4 w-4" />,
    ai: <Bot className="h-4 w-4" />,
    security: <Shield className="h-4 w-4" />,
  };

  const categoryLabels: Record<string, string> = {
    general: t('admin.settings.general'),
    ai: t('admin.settings.ai'),
    security: t('admin.settings.security'),
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getSettings();
      setSettings(result);
      const values: Record<string, string> = {};
      result.forEach((s) => {
        values[s.key] = s.value || "";
      });
      setEditedValues(values);
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      toast.error(t('admin.toast.fetchSettingsFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const changedSettings = settings
        .filter((s) => editedValues[s.key] !== (s.value || ""))
        .map((s) => ({ key: s.key, value: editedValues[s.key] }));

      if (changedSettings.length === 0) {
        toast.info(t('admin.settings.noChanges'));
        setSaving(false);
        return;
      }

      await updateSettings(changedSettings);
      toast.success(t('admin.toast.saveSuccess'));
      fetchData();
    } catch (error) {
      toast.error(t('admin.toast.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const categories = [...new Set(settings.map((s) => s.category))];

  const hasChanges = settings.some((s) => editedValues[s.key] !== (s.value || ""));

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('admin.settings.title')}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {t('admin.common.refresh')}
          </Button>
          <Button onClick={handleSave} disabled={saving || !hasChanges}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {t('admin.settings.saveChanges')}
          </Button>
        </div>
      </div>

      {settings.length === 0 ? (
        <Card className="flex h-64 items-center justify-center">
          <div className="text-center">
            <Settings className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">{t('admin.settings.noSettings')}</p>
          </div>
        </Card>
      ) : (
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList>
            {categories.map((cat) => (
              <TabsTrigger key={cat} value={cat} className="flex items-center gap-2">
                {categoryIcons[cat] || <Settings className="h-4 w-4" />}
                {categoryLabels[cat] || cat}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((cat) => (
            <TabsContent key={cat} value={cat}>
              <Card className="p-6">
                <div className="space-y-6">
                  {settings
                    .filter((s) => s.category === cat)
                    .map((setting) => (
                      <div key={setting.key} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">{setting.key}</label>
                          {setting.description && (
                            <span className="text-xs text-muted-foreground">
                              {setting.description}
                            </span>
                          )}
                        </div>
                        {(setting.value?.length || 0) > 100 || setting.key.toLowerCase().includes("template") ? (
                          <Textarea
                            value={editedValues[setting.key] || ""}
                            onChange={(e) =>
                              setEditedValues({
                                ...editedValues,
                                [setting.key]: e.target.value,
                              })
                            }
                            rows={4}
                            className="font-mono text-sm"
                          />
                        ) : setting.key.toLowerCase().includes("key") ||
                          setting.key.toLowerCase().includes("secret") ||
                          setting.key.toLowerCase().includes("password") ? (
                          <Input
                            type="password"
                            value={editedValues[setting.key] || ""}
                            onChange={(e) =>
                              setEditedValues({
                                ...editedValues,
                                [setting.key]: e.target.value,
                              })
                            }
                          />
                        ) : (
                          <Input
                            value={editedValues[setting.key] || ""}
                            onChange={(e) =>
                              setEditedValues({
                                ...editedValues,
                                [setting.key]: e.target.value,
                              })
                            }
                          />
                        )}
                      </div>
                    ))}
                </div>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      )}

      {hasChanges && (
        <div className="fixed bottom-6 right-6">
          <Button onClick={handleSave} disabled={saving} size="lg" className="shadow-lg">
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {t('admin.settings.saveChanges')}
          </Button>
        </div>
      )}
    </div>
  );
}
