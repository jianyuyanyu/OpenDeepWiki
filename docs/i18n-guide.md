# 国际化 (i18n) 使用指南

## 已配置的语言

- 🇨🇳 简体中文 (zh) - 默认
- 🇺🇸 English (en)
- 🇰🇷 한국어 (ko)
- 🇯🇵 日本語 (ja)

## 语言切换位置

语言切换按钮位于 Header 右上角，主题切换按钮旁边。

## 翻译文件结构

翻译文件按语言和功能模块组织：

```
i18n/
  messages/
    zh/                 # 简体中文
      ├── common.json   # 通用翻译（登录、保存、取消等）
      ├── theme.json    # 主题相关
      ├── sidebar.json  # 侧边栏导航
      └── auth.json     # 认证相关（登录、注册等）
    en/                 # 英文
    ko/                 # 韩文
    ja/                 # 日文
  request.ts            # i18n 配置
```

## 如何在组件中使用翻译

### 客户端组件

```tsx
"use client";
import { useTranslations } from '@/hooks/use-translations';

export function MyComponent() {
  const t = useTranslations('common');
  const tAuth = useTranslations('auth');
  
  return (
    <div>
      <h1>{t('login')}</h1>
      <p>{tAuth('welcomeBack')}</p>
    </div>
  );
}
```

### 服务端组件

```tsx
import { useTranslations } from 'next-intl';

export default function MyPage() {
  const t = useTranslations('common');
  return <h1>{t('login')}</h1>;
}
```

## 可用的命名空间

- **common**: 通用翻译（login, save, cancel, search 等）
- **theme**: 主题相关（light, dark, system）
- **sidebar**: 侧边栏导航（explore, recommend, bookmarks 等）
- **auth**: 认证相关（signIn, signUp, email, password 等）

## 添加新翻译

1. 在对应语言文件夹的 JSON 文件中添加新键
2. 确保所有语言文件都包含相同的键
3. 在组件中使用 `t('newKey')` 访问

## 技术栈

- next-intl: Next.js 国际化库
- Cookie 存储: 语言偏好保存在 `NEXT_LOCALE` cookie
- 无 URL 前缀: 语言切换不改变 URL 路径
- 模块化结构: 按功能拆分翻译文件
