export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl font-semibold">页面不存在</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        你访问的页面不存在或已被移动。
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
