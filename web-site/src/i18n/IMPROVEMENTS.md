# OpenDeepWiki i18n 改进建议文档

## 📋 翻译质量改进对照表

### 示例 1: Common 模块

| 键名 | 原英文 | 改进英文 | 说明 |
|------|--------|----------|------|
| `submitting` | Submitting... | Please wait... | 更友好的用户提示 |
| `next` | Next Page | Next | 更简洁 |
| `prev` | Previous Page | Previous | 更简洁 |
| `time.justNow` | Just now | Just now | ✓ 正确 |
| `time.minutesAgo` | {{count}} minutes ago | {{count}} min ago | 更简洁 |
| `time.yearsAgo` | {{count}} years ago | {{count}} yr ago | 更简洁 |

### 示例 2: Home 模块

| 键名 | 原英文 | 改进英文 |
|------|--------|----------|
| `home.title` | AI-Powered Code Knowledge Base | AI-Powered Code Knowledge Base |
| `home.subtitle` | AI-driven code knowledge base supporting... | Your AI-powered knowledge base for code analysis, documentation, and knowledge graphs |
| `home.add_repository` | Add Repository | Add Repository |
| `home.repository_list.empty` | No repository data available | No repositories found |
| `home.repository_card.status.0` | Pending | Queued |

### 示例 3: Repository 模块

| 键名 | 原英文 | 改进英文 |
|------|--------|----------|
| `repository.form.title` | Add Repository | Add Repository |
| `repository.form.description` | Add a Git repository or upload local files to create a knowledge base | Import a Git repository or upload files to create your knowledge base |
| `repository.layout.mindMap` | Mind Map | Knowledge Graph |
| `repository.layout.mindMapDescription` | Visually display the knowledge structure... | Visualize code relationships and knowledge structure |

## 🇯🇵 日文改进建议

### 敬语和表达优化

| 键名 | 原日文 | 改进日文 | 说明 |
|------|--------|----------|------|
| `time.justNow` | 今すぐ | たった今 | 更自然的时间表达 |
| `common.expand` | 展開 | 展開する | 添加动词使其更明确 |
| `common.collapse` | 折りたたむ | 折りたたむ | ✓ 正确 |
| `login.form.remember_me` | ログイン状態を保持する | 次回から自動的にログイン | 更符合日本习惯 |
| `repository.form.title` | リポジトリを追加 | リポジトリを追加する | 更明确 |
| `home.repository_list.empty` | リポジトリデータはありません | リポジトリが見つかりません | 更自然 |

## 🇰🇷 韩文改进建议

### 技术术语本土化

| 键名 | 原韩文 | 改进韩文 | 说明 |
|------|--------|----------|------|
| `common.search` | 검색 | 검색 | ✓ 正确 |
| `common.loading` | 로딩 중... | 불러오는 중... | 更自然的表达 |
| `repository.layout.mindMap` | 마인드 맵 | 지식 그래프 | 更符合技术术语 |
| `admin.repositories.status.pending` | 대기 중 | 처리 대기 중 | 更明确 |
| `settings.ai.modelProvider` | 모델 제공자 | AI 모델 공급자 | 更准确 |

## 🏗️ 结构优化建议

### 1. settings 模块拆分

当前 `settings` 模块过大（584行），建议拆分：

```
settings/
├── profile.json       # 个人资料相关（200行）
├── security.json      # 安全设置（150行）
├── ai.json           # AI配置（150行）
├── storage.json      # 存储配置（100行）
└── system.json       # 系统设置（200行）
```

### 2. 补充文件优化

当前补充文件系统复杂，建议：
- 合并到主文件
- 或使用更清晰的命名规范

### 3. 翻译键命名规范

建议统一使用：
- 驼峰命名: `submitSuccess`
- 或下划线: `submit_success`
- **当前项目中混用，建议统一**

## 📊 翻译完整度检查

### 当前状态

| 模块 | zh-CN | en-US | ja-JP | ko-KR |
|------|-------|-------|-------|-------|
| common | ✓ | ✓ | ⚠️ | ⚠️ |
| nav | ✓ | ✓ | ✓ | ✓ |
| home | ✓ | ✓ | ⚠️ | ⚠️ |
| login | ✓ | ✓ | ✓ | ✓ |
| register | ✓ | ✓ | ✓ | ✓ |
| repository | ✓ | ✓ | ⚠️ | ⚠️ |
| admin | ✓ | ✓ | ⚠️ | ⚠️ |
| settings | ✓ | ✓ | ⚠️ | ⚠️ |
| profile | ✓ | ✓ | ⚠️ | ⚠️ |

**图例**: ✓ 完整且准确 | ⚠️ 需要改进

## 🎯 优先级建议

### 高优先级（影响用户体验）
1. Home 页面文案
2. Repository 相关文案
3. 错误和提示信息
4. 按钮和操作文案

### 中优先级
1. Settings 各项说明
2. Admin 管理界面
3. 表单验证信息

### 低优先级
1. 页脚信息
2. 版权声明
3. 调试信息

## 🚀 实施建议

### 方案 A: 渐进式改进（推荐）
1. 先优化高优先级模块
2. 逐步改进其他模块
3. 按需回应用户反馈

### 方案 B: 全面重写
1. 一次性重写所有翻译
2. 风险较大，可能引入新问题
3. 需要大量测试

### 方案 C: 混合方案
1. 高优先级模块全面重写
2. 其他模块渐进式改进
3. 建立翻译规范文档

## 📚 参考资料

### 英文写作参考
- [Microsoft Writing Style Guide](https://docs.microsoft.com/en-us/style-guide/)
- [Google Developer Documentation Style Guide](https://developers.google.com/tech-writing/one)

### 日文敬语参考
- [日本語の敬語 - 文化庁](https://www.bunka.go.jp/kokugo_nihongo/sisaku/joho/joho/kakuki/09_kyouiku_kyoukasyo_kijyun/02.pdf)

### 韩文技术术语参考
- [정보통신용어사전 - NIA](https://www.word.nia.or.kr/)

---

**文档版本**: 1.0
**创建日期**: 2025-01-15
**最后更新**: 2025-01-15
