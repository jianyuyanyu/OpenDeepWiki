# 需求文档

## 简介

本功能旨在优化 OpenDeepWiki 系统中的 Wiki 生成提示词（prompts），包括目录生成器（catalog-generator）、内容生成器（content-generator）和增量更新器（incremental-updater）三个核心提示词。优化目标是提升 AI 代理的执行效率、输出质量和错误处理能力。

## 术语表

- **Prompt_System**: Wiki 生成提示词系统，包含三个核心提示词文件
- **Catalog_Generator**: 目录生成器提示词，负责分析仓库结构并生成 Wiki 目录
- **Content_Generator**: 内容生成器提示词，负责为每个目录项生成文档内容
- **Incremental_Updater**: 增量更新器提示词，负责根据代码变更更新文档
- **GitTool**: Git 工具，提供文件读取、搜索和列表功能
- **CatalogTool**: 目录工具，提供目录结构的读写和编辑功能
- **DocTool**: 文档工具，提供文档内容的读写和编辑功能
- **AI_Agent**: AI 代理，执行提示词并调用工具完成任务

## 需求

### 需求 1：工具使用指导优化

**用户故事：** 作为 AI 代理，我需要清晰的工具使用指导，以便正确高效地调用可用工具完成任务。

#### 验收标准

1. THE Prompt_System SHALL 为每个工具提供明确的功能描述和使用场景
2. THE Prompt_System SHALL 为每个工具方法提供参数说明和返回值描述
3. WHEN AI_Agent 需要读取文件时，THE Catalog_Generator SHALL 指导使用 GitTool.Read 方法
4. WHEN AI_Agent 需要搜索代码时，THE Prompt_System SHALL 指导使用 GitTool.Grep 方法并说明正则表达式支持
5. WHEN AI_Agent 需要列出文件时，THE Prompt_System SHALL 指导使用 GitTool.ListFiles 方法并说明文件模式过滤
6. THE Prompt_System SHALL 提供工具调用的最佳实践和常见模式示例

### 需求 2：输出格式规范化

**用户故事：** 作为系统开发者，我需要 AI 代理生成格式一致的输出，以便系统能够正确解析和存储生成的内容。

#### 验收标准

1. THE Catalog_Generator SHALL 定义完整的 JSON Schema 用于目录结构验证
2. WHEN 生成目录结构时，THE Catalog_Generator SHALL 确保每个节点包含 title、path、order、children 字段
3. THE Content_Generator SHALL 定义 Markdown 文档的标准结构模板
4. WHEN 生成文档内容时，THE Content_Generator SHALL 确保包含标题、概述、详细内容和相关链接
5. THE Incremental_Updater SHALL 定义变更分析报告的标准格式
6. THE Prompt_System SHALL 提供输出格式的验证规则和错误示例

### 需求 3：错误处理增强

**用户故事：** 作为 AI 代理，我需要明确的错误处理指导，以便在遇到问题时能够优雅地处理并继续执行。

#### 验收标准

1. WHEN GitTool.Read 返回文件不存在错误时，THE Prompt_System SHALL 指导 AI_Agent 跳过该文件并记录警告
2. WHEN GitTool.Grep 搜索无结果时，THE Prompt_System SHALL 指导 AI_Agent 尝试替代搜索策略
3. WHEN CatalogTool.Write 验证失败时，THE Prompt_System SHALL 指导 AI_Agent 修正格式错误后重试
4. WHEN DocTool.Edit 找不到要替换的内容时，THE Prompt_System SHALL 指导 AI_Agent 使用 Write 方法重写
5. IF 遇到二进制文件或超大文件，THEN THE Prompt_System SHALL 指导 AI_Agent 跳过并记录
6. THE Prompt_System SHALL 提供常见错误场景的处理流程图

### 需求 4：多语言支持优化

**用户故事：** 作为国际用户，我需要系统能够生成高质量的多语言文档，以便不同语言的用户都能理解项目。

#### 验收标准

1. THE Prompt_System SHALL 根据 {{language}} 参数调整输出语言
2. WHEN language 为中文时，THE Prompt_System SHALL 使用中文术语和表达习惯
3. WHEN language 为英文时，THE Prompt_System SHALL 使用英文术语和表达习惯
4. THE Prompt_System SHALL 保持代码示例中的标识符不翻译
5. THE Prompt_System SHALL 提供多语言术语对照表
6. WHEN 生成文档时，THE Content_Generator SHALL 根据目标语言调整文档风格和格式

### 需求 5：执行效率优化

**用户故事：** 作为系统运维人员，我需要 AI 代理高效执行任务，以便减少 API 调用成本和处理时间。

#### 验收标准

1. THE Catalog_Generator SHALL 指导 AI_Agent 先使用 ListFiles 获取文件列表再选择性读取
2. THE Prompt_System SHALL 指导 AI_Agent 批量处理相关文件而非逐个处理
3. WHEN 分析大型仓库时，THE Catalog_Generator SHALL 指导 AI_Agent 优先分析关键文件（README、配置文件等）
4. THE Incremental_Updater SHALL 指导 AI_Agent 仅更新受影响的文档而非全量重新生成
5. THE Prompt_System SHALL 提供文件优先级排序规则
6. THE Prompt_System SHALL 限制单次工具调用的数据量以避免超时

### 需求 6：内容质量提升

**用户故事：** 作为文档读者，我需要高质量的 Wiki 文档，以便快速理解和使用项目。

#### 验收标准

1. THE Content_Generator SHALL 指导 AI_Agent 从代码中提取实际的使用示例
2. THE Content_Generator SHALL 指导 AI_Agent 解释代码的设计意图而非仅描述功能
3. WHEN 生成 API 文档时，THE Content_Generator SHALL 包含参数类型、返回值和异常说明
4. THE Content_Generator SHALL 指导 AI_Agent 添加代码块的语法高亮标识
5. THE Content_Generator SHALL 指导 AI_Agent 使用表格展示配置选项和 API 参考
6. THE Prompt_System SHALL 提供文档质量检查清单

### 需求 7：提示词结构一致性

**用户故事：** 作为系统维护者，我需要三个提示词保持一致的结构和风格，以便于维护和扩展。

#### 验收标准

1. THE Prompt_System SHALL 为所有提示词使用统一的章节结构
2. THE Prompt_System SHALL 为所有提示词使用统一的变量命名规范（{{variable_name}}）
3. THE Prompt_System SHALL 为所有提示词提供相同格式的工具说明部分
4. THE Prompt_System SHALL 为所有提示词提供相同格式的示例部分
5. THE Prompt_System SHALL 为所有提示词提供相同格式的质量检查清单
6. WHEN 添加新提示词时，THE Prompt_System SHALL 遵循已建立的模板结构
