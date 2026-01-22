# i18n 快速开始指南 🚀

## 5 分钟上手

### 1️⃣ 在组件中使用翻译

```tsx
"use client";
import { useTranslations } from '@/hooks/use-translations';

export function MyButton() {
  const t = useTranslations('common');
  
  return <button>{t('save')}</button>;
  // 中文: 保存
  // English: Save
  // 한국어: 저장
  // 日本語: 保存
}
```

### 2️⃣ 使用多个命名空间

```tsx
"use client";
import { useTranslations } from '@/hooks/use-translations';

export function LoginForm() {
  const tCommon = useTranslations('common');
  const tAuth = useTranslations('auth');
  
  return (
    <form>
      <h1>{tAuth('welcomeBack')}</h1>
      <input placeholder={tAuth('email')} />
      <input placeholder={tAuth('password')} />
      <button>{tCommon('login')}</button>
    </form>
  );
}
```

### 3️⃣ 添加新翻译

在所有语言文件中添加相同的键：

```json
// i18n/messages/zh/common.json
{
  "save": "保存",
  "myNewKey": "我的新文本"
}

// i18n/messages/en/common.json
{
  "save": "Save",
  "myNewKey": "My New Text"
}
```

## 📋 可用的命名空间

| 命名空间 | 用途 | 示例键 |
|---------|------|--------|
| `common` | 通用操作 | login, save, cancel, search |
| `theme` | 主题相关 | light, dark, system |
| `sidebar` | 侧边栏 | explore, recommend, bookmarks |
| `auth` | 认证流程 | signIn, signUp, email, password |

## 🎯 常见场景

### 场景 1: 按钮文本
```tsx
const t = useTranslations('common');
<button>{t('save')}</button>
<button>{t('cancel')}</button>
<button>{t('delete')}</button>
```

### 场景 2: 表单标签
```tsx
const t = useTranslations('auth');
<label>{t('email')}</label>
<label>{t('password')}</label>
```

### 场景 3: 导航菜单
```tsx
const t = useTranslations('sidebar');
<nav>
  <a>{t('explore')}</a>
  <a>{t('bookmarks')}</a>
</nav>
```

## ⚡ 提示和技巧

### 提示 1: 使用有意义的变量名
```tsx
// ✅ 好
const tCommon = useTranslations('common');
const tAuth = useTranslations('auth');

// ❌ 不好
const t1 = useTranslations('common');
const t2 = useTranslations('auth');
```

### 提示 2: 服务端组件使用不同的导入
```tsx
// 客户端组件
import { useTranslations } from '@/hooks/use-translations';

// 服务端组件
import { useTranslations } from 'next-intl';
```

## 🐛 常见问题

### Q: 翻译不显示？
A: 检查：
1. 键名是否正确
2. 命名空间是否正确
3. 所有语言文件是否都有该键

### Q: 如何切换语言？
A: 点击 Header 右上角的语言图标（🌐）

## 📚 更多资源

- `i18n-guide.md` - 完整使用指南
- `i18n-structure.md` - 文件结构说明
