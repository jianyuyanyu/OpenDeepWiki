import { NextRequest, NextResponse } from 'next/server';
import { uiLocales, defaultUiLocale, resolveUiLocaleFromWikiLanguage } from './i18n/config';

const supportedLocales = uiLocales as readonly string[];
const defaultLocale = defaultUiLocale;

function resolveRequestLocale(lang: string | null | undefined): string | null {
  if (!lang) {
    return null;
  }
  if (supportedLocales.includes(lang)) {
    return lang;
  }
  return resolveUiLocaleFromWikiLanguage(lang);
}

export function middleware(request: NextRequest) {
  // 优先从 URL 查询参数获取语言设置（用于仓库文档页面）
  const urlLang = request.nextUrl.searchParams.get('lang');
  
  // 从 cookie 中获取语言设置
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  
  // Priority: URL `lang` > cookie > default `en`
  let locale: string = defaultLocale;
  const urlLocale = resolveRequestLocale(urlLang);
  const cookieResolved = resolveRequestLocale(cookieLocale);
  if (urlLocale) {
    locale = urlLocale;
  } else if (cookieResolved) {
    locale = cookieResolved;
  }
  
  // 将 locale 添加到请求头中，供 i18n 配置使用
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-next-intl-locale', locale);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (urlLocale) {
    response.cookies.set('NEXT_LOCALE', locale, {
      path: '/',
      sameSite: 'lax',
    });
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
