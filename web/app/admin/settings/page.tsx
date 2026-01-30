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

const categoryIcons: Record<string, React.ReactNode> = {
  general: <Globe className="h-4 w-4" />,
  ai: <Bot className="h-4 w-4" />,
  security: <Shield className="h-4 w-4" />,
};

const categoryLabels: Record<string, string> = {
  general: "通用设置",
  ai: "AI 设置",
  security: "安全设置",
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState("general");
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getSettings();
      setSettings(result);
      // 初始化编辑值
      const values: Record<string, string> = {};
      result.forEach((s) => {
        values[s.key] = s.value || "";
      });
      setEditedValues(values);
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      toast.error("获取系统设置失败");
    } finally {
      setLoading(false);
    }
  }, []);

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
        toast.info("没有需要保存的更改");
        setSaving(false);
        return;
      }

      await updateSettings(changedSettings);
      toast.success("保存成功");
      fetchData();
    } catch (error) {
      toast.error("保存失败");
    } finally {
      setSaving(false);
    }
  };

  const categories = [...new Set(settings.map((s) => s.category))];
  const filteredSettings = settings.filter((s) => s.category === activeCategory);

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
        <h1 className="text-2xl font-bold">系统设置</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            刷新
          </Button>
          <Button onClick={handleSave} disabled={saving || !hasChanges}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            保存更改
          </Button>
        </div>
      </div>

      {settings.length === 0 ? (
        <Card className="flex h-64 items-center justify-center">
          <div className="text-center">
            <Settings className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">暂无系统设置</p>
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
            保存更改
          </Button>
        </div>
      )}
    </div>
  );
}
