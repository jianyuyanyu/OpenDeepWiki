"use client";

import { useTranslations as useNextIntlTranslations } from 'next-intl';

type TranslationValues = Record<string, string | number | boolean | Date | null | undefined>;

export function useTranslations() {
  const common = useNextIntlTranslations('common');
  const theme = useNextIntlTranslations('theme');
  const sidebar = useNextIntlTranslations('sidebar');
  const auth = useNextIntlTranslations('auth');
  const home = useNextIntlTranslations('home');

  // 创建一个函数来访问所有命名空间的翻译
  const t = (key: string, params?: TranslationValues): string => {
    const parts = key.split('.');
    
    if (parts.length < 2) {
      return key;
    }
    
    const namespace = parts[0];
    const translationKey = parts.slice(1).join('.');
    
    try {
      switch (namespace) {
        case 'common':
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return common.raw(translationKey) ? common(translationKey as any, params as any) : key;
        case 'theme':
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return theme.raw(translationKey) ? theme(translationKey as any, params as any) : key;
        case 'sidebar':
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return sidebar.raw(translationKey) ? sidebar(translationKey as any, params as any) : key;
        case 'auth':
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return auth.raw(translationKey) ? auth(translationKey as any, params as any) : key;
        case 'home':
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return home.raw(translationKey) ? home(translationKey as any, params as any) : key;
        default:
          return key;
      }
    } catch (error) {
      console.error(`Translation error for key: ${key}`, error);
      return key;
    }
  };

  return t;
}
