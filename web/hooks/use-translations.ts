"use client";

import { useTranslations as useNextIntlTranslations } from 'next-intl';

export function useTranslations() {
  const common = useNextIntlTranslations('common');
  const theme = useNextIntlTranslations('theme');
  const sidebar = useNextIntlTranslations('sidebar');
  const auth = useNextIntlTranslations('auth');
  const home = useNextIntlTranslations('home');

  // 创建一个函数来访问所有命名空间的翻译
  const t = (key: string) => {
    const parts = key.split('.');
    
    if (parts.length < 2) {
      return key;
    }
    
    const namespace = parts[0];
    const translationKey = parts.slice(1).join('.');
    
    try {
      switch (namespace) {
        case 'common':
          return common(translationKey);
        case 'theme':
          return theme(translationKey);
        case 'sidebar':
          return sidebar(translationKey);
        case 'auth':
          return auth(translationKey);
        case 'home':
          return home(translationKey);
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
