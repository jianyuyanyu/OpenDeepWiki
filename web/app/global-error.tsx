"use client";

export default function GlobalError() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl font-semibold">页面加载失败</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        发生了未预期的错误，请稍后重试。
      </p>
      <a
        href="/"
        className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        返回首页
      </a>
    </main>
  );
}
