import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // 从 cookie 中获取语言设置
  const locale = request.cookies.get('NEXT_LOCALE')?.value || 'zh';
  
  // 将 locale 添加到请求头中，供 i18n 配置使用
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-next-intl-locale', locale);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
