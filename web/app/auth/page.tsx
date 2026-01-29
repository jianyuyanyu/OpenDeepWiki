"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Github, Mail, BookOpen, Sparkles, Zap, ArrowLeft, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";

type AuthMode = "login" | "register";

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");
  const { login, register } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Login form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Register form
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const redirectAfterAuth = () => {
    if (returnUrl) {
      router.push(decodeURIComponent(returnUrl));
    } else {
      router.push("/");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login({ email, password });
      redirectAfterAuth();
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("两次密码输入不一致");
      return;
    }

    if (password.length < 6) {
      setError("密码长度至少6位");
      return;
    }

    setIsLoading(true);

    try {
      await register({ name, email, password, confirmPassword });
      redirectAfterAuth();
    } catch (err) {
      setError(err instanceof Error ? err.message : "注册失败");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = (provider: string) => {
    // TODO: Implement OAuth login
    console.log(`Login with ${provider}`);
  };

  const switchMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setError("");
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Brand Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 via-primary/5 to-background relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(white,transparent_85%)]" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              返回首页
            </Link>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                AI 驱动的知识库
              </div>
              <h1 className="text-5xl font-bold tracking-tight">OpenDeepWiki</h1>
              <p className="text-xl text-muted-foreground max-w-md">
                深度理解代码仓库，让知识触手可及
              </p>
            </div>

            <div className="space-y-6 max-w-md">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">智能文档生成</h3>
                  <p className="text-sm text-muted-foreground">
                    自动分析代码结构，生成清晰易懂的文档
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">快速搜索</h3>
                  <p className="text-sm text-muted-foreground">
                    通过关键词或 GitHub 链接，瞬间找到你需要的信息
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Github className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">GitHub 集成</h3>
                  <p className="text-sm text-muted-foreground">
                    无缝连接你的 GitHub 仓库，管理私人项目
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            © 2026 OpenDeepWiki. 开源知识库平台
          </div>
        </div>
      </div>

      {/* Right Side - Login/Register Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Header */}
          <div className="lg:hidden text-center space-y-2">
            <h1 className="text-3xl font-bold">OpenDeepWiki</h1>
            <p className="text-muted-foreground">深度理解代码仓库</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2 text-center lg:text-left">
              <h2 className="text-2xl font-bold tracking-tight">
                {mode === "login" ? "欢迎回来" : "创建账号"}
              </h2>
              <p className="text-muted-foreground">
                {mode === "login"
                  ? "登录以访问你的知识库和私人仓库"
                  : "注册以开始使用 OpenDeepWiki"}
              </p>
            </div>

            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/50 rounded-md">
                {error}
              </div>
            )}

            {mode === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    邮箱地址
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-sm font-medium">
                      密码
                    </label>
                    <Button variant="link" className="p-0 h-auto text-sm">
                      忘记密码?
                    </Button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-11"
                  />
                </div>
                <Button type="submit" className="w-full h-11" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      登录中...
                    </>
                  ) : (
                    "登录"
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    用户名
                  </label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="你的用户名"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-11"
                    minLength={2}
                    maxLength={50}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="reg-email" className="text-sm font-medium">
                    邮箱地址
                  </label>
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="reg-password" className="text-sm font-medium">
                    密码
                  </label>
                  <Input
                    id="reg-password"
                    type="password"
                    placeholder="至少6位字符"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-11"
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="confirm-password" className="text-sm font-medium">
                    确认密码
                  </label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="再次输入密码"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-11"
                  />
                </div>
                <Button type="submit" className="w-full h-11" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      注册中...
                    </>
                  ) : (
                    "注册"
                  )}
                </Button>
              </form>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  或使用第三方登录
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => handleOAuthLogin("github")}
                disabled={isLoading}
                className="gap-2 h-11"
              >
                <Github className="h-4 w-4" />
                GitHub
              </Button>
              <Button
                variant="outline"
                onClick={() => handleOAuthLogin("google")}
                disabled={isLoading}
                className="gap-2 h-11"
              >
                <Mail className="h-4 w-4" />
                Google
              </Button>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              {mode === "login" ? "还没有账号?" : "已有账号?"}{" "}
              <Button
                variant="link"
                className="p-0 h-auto font-normal text-primary"
                onClick={switchMode}
              >
                {mode === "login" ? "立即注册" : "立即登录"}
              </Button>
            </div>

            <div className="lg:hidden text-center">
              <Button variant="ghost" onClick={() => router.push("/")} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                返回首页
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
