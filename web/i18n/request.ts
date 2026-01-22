import { getRequestConfig } from 'next-intl/server';

export const locales = ['zh', 'en', 'ko', 'ja'] as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  zh: '简体中文',
  en: 'English',
  ko: '한국어',
  ja: '日本語',
};

// 动态加载所有翻译文件
async function loadMessages(locale: Locale) {
  const common = (await import(`./messages/${locale}/common.json`)).default;
  const theme = (await import(`./messages/${locale}/theme.json`)).default;
  const sidebar = (await import(`./messages/${locale}/sidebar.json`)).default;
  const auth = (await import(`./messages/${locale}/auth.json`)).default;
  const home = (await import(`./messages/${locale}/home.json`)).default;

  return {
    common,
    theme,
    sidebar,
    auth,
    home,
  };
}

export default getRequestConfig(async ({ requestLocale }) => {
  // 从 requestLocale 获取 locale，如果没有则使用默认值
  let locale = await requestLocale;
  
  if (!locale || !locales.includes(locale as Locale)) {
    locale = 'zh';
  }

  return {
    locale,
    messages: await loadMessages(locale as Locale),
  };
});
