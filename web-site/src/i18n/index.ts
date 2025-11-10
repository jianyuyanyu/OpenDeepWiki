// i18n 配置和初始化

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// 导入语言资源
import enUS from './locales/en-US.json'
import zhCN from './locales/zh-CN.json'
import jaJP from './locales/ja-JP.json'
import koKR from './locales/ko-KR.json'

const resources = {
  'en-US': {
    translation: enUS,
  },
  'zh-CN': {
    translation: zhCN,
  },
  'ja-JP': {
    translation: jaJP,
  },
  'ko-KR': {
    translation: koKR,
  },
}

i18n
  // 检测用户语言
  .use(LanguageDetector)
  // 传递 i18n 实例给 react-i18next
  .use(initReactI18next)
  // 初始化 i18next
  .init({
    resources,
    fallbackLng: 'zh-CN',
    debug: import.meta.env.DEV,

    // 语言检测选项
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false, // React 已经默认转义了
    },

    // 支持的语言
    supportedLngs: ['en-US', 'zh-CN', 'ja-JP', 'ko-KR'],

    // 命名空间
    ns: ['translation'],
    defaultNS: 'translation',
  })

export default i18n

// 导出语言列表
export const languages = [
  {
    code: 'zh-CN',
    name: '中文(简体)',
    flag: '🇨🇳',
  },
  {
    code: 'en-US',
    name: 'English',
    flag: '🇺🇸',
  },
  {
    code: 'ja-JP',
    name: '日本語',
    flag: '🇯🇵',
  },
  {
    code: 'ko-KR',
    name: '한국어',
    flag: '🇰🇷',
  },
]

// 获取当前语言
export const getCurrentLanguage = () => i18n.language

// 切换语言
export const changeLanguage = (lng: string) => {
  return i18n.changeLanguage(lng)
}