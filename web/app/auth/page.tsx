"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Github, Mail, BookOpen, Sparkles, Zap, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AuthPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // TODO: Implement actual login logic
    setTimeout(() => {
      setIsLoading(false);
      router.push("/");
    }, 1000);
  };

  const handleOAuthLogin = (provider: string) => {
    setIsLoading(true);
    // TODO: Implement OAuth login
    console.log(`Login with ${provider}`);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Brand Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 via-primary/5 to-background relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(white,transparent_85%)]" />
        
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
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
              <h1 className="text-5xl font-bold tracking-tight">
                OpenDeepWiki
              </h1>
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

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Header */}
          <div className="lg:hidden text-center space-y-2">
            <h1 className="text-3xl font-bold">OpenDeepWiki</h1>
            <p className="text-muted-foreground">深度理解代码仓库</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2 text-center lg:text-left">
              <h2 className="text-2xl font-bold tracking-tight">欢迎回来</h2>
              <p className="text-muted-foreground">
                登录以访问你的知识库和私人仓库
              </p>
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-4">
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
              <Button 
                type="submit" 
                className="w-full h-11" 
                disabled={isLoading}
              >
                {isLoading ? "登录中..." : "登录"}
              </Button>
            </form>

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
              还没有账号?{" "}
              <Button variant="link" className="p-0 h-auto font-normal text-primary">
                立即注册
              </Button>
            </div>

            <div className="lg:hidden text-center">
              <Button 
                variant="ghost" 
                onClick={() => router.push("/")}
                className="gap-2"
              >
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
