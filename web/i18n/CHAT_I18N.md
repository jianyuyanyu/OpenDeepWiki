# Chat 组件国际化文档

## 概述

本文档说明了Chat相关组件的国际化(i18n)实现。所有用户可见的文本都已从硬编码转换为使用`next-intl`的翻译系统。

## 支持的语言

- 中文 (zh) - `web/i18n/messages/zh/chat.json`
- 英文 (en) - `web/i18n/messages/en/chat.json`
- 日语 (ja) - `web/i18n/messages/ja/chat.json`
- 韩语 (ko) - `web/i18n/messages/ko/chat.json`

## 翻译键结构

翻译文件按功能模块组织：

### assistant
- `title` - 助手标题
- `greeting` - 欢迎语
- `greetingSubtitle` - 欢迎语副标题
- `disabled` - 功能禁用提示
- `noModels` - 无可用模型提示
- `thinking` - 思考中提示
- `selectModel` - 选择模型提示
- `loadConfigFailed` - 配置加载失败提示

### panel
- `clearHistory` - 清空历史按钮
- `close` - 关闭按钮
- `inputPlaceholder` - 输入框占位符
- `uploadImage` - 上传图片按钮
- `send` - 发送按钮
- `retry` - 重试按钮
- `closeError` - 关闭错误提示按钮

### message
- `thinking` - 思考过程标题
- `toolCall` - 工具调用标题
- `toolResult` - 工具结果标题
- `toolError` - 工具错误标题
- `uploadedImage` - 上传图片标题
- `quotedFrom` - 引用来源标签
- `currentPage` - 当前页面标签
- `tokens` - Token单位
- `inputTokens` - 输入Token标签
- `outputTokens` - 输出Token标签

### image
- `upload` - 上传图片按钮文本
- `supportedFormats` - 支持格式提示（支持{maxImages}参数）
- `unsupportedFormat` - 不支持的格式错误
- `sizeTooLarge` - 文件过大错误
- `preview` - 图片预览标签（支持{index}参数）
- `remove` - 移除图片标签（支持{index}参数）
- `invalidFormat` - 无效格式错误
- `readFailed` - 读取失败错误

### error
- `chatFailed` - 对话失败错误
- `configMissing` - 配置缺失错误
- `modelUnavailable` - 模型不可用错误
- `requestTimeout` - 请求超时错误
- `connectionFailed` - 连接失败错误
- `sendFailed` - 发送失败错误
- `loadConfigFailed` - 配置加载失败错误
- `noResponse` - 无响应错误

### embed
- `title` - 嵌入式助手标题
- `greeting` - 嵌入式欢迎语
- `greetingSubtitle` - 嵌入式欢迎语副标题
- `inputPlaceholder` - 嵌入式输入框占位符
- `configInvalid` - 配置验证失败提示
- `loadConfigFailed` - 配置加载失败提示

### model
- `selector` - 模型选择器标签
- `noModels` - 无可用模型提示
- `provider` - 提供商标签

### quote
- `icon` - 引用图标
- `label` - 引用标签
- `remove` - 移除引用标签

## 已更新的组件

### web/components/chat/
- `chat-assistant.tsx` - 主助手组件
- `chat-panel.tsx` - 对话面板
- `chat-message.tsx` - 消息显示组件
- `model-selector.tsx` - 模型选择器
- `floating-ball.tsx` - 悬浮球组件
- `embed-chat-widget.tsx` - 嵌入式对话组件
- `image-upload.tsx` - 图片上传组件

### web/lib/
- `image-validation.ts` - 图片验证工具函数（支持i18n）

## 使用方式

在组件中使用翻译：

```typescript
import { useTranslations } from "next-intl"

export function MyComponent() {
  const t = useTranslations("chat")
  
  return (
    <div>
      <h1>{t("assistant.title")}</h1>
      <p>{t("image.supportedFormats", { maxImages: 5 })}</p>
    </div>
  )
}
```

## 参数化翻译

某些翻译键支持参数：

- `image.supportedFormats` - 支持 `{maxImages}` 参数
- `image.preview` - 支持 `{index}` 参数
- `image.remove` - 支持 `{index}` 参数

## 添加新翻译

1. 在所有语言的 `chat.json` 文件中添加新的键值对
2. 在组件中使用 `t("chat.newKey")` 调用
3. 确保所有4种语言都有对应的翻译

## 注意事项

- 所有硬编码的中文字符串都已替换为翻译键
- 验证函数在 `image-validation.ts` 中实现，支持可选的翻译函数参数
- 使用 `useTranslations("chat")` 获取chat命名空间的翻译函数
- 参数化翻译使用 `{key}` 语法，在调用时传入对象参数
