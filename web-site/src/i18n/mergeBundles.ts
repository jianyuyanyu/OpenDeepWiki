/**
 * i18n 翻译合并脚本
 * 用途：将分散的 admin 翻译文件合并为完整的补充翻译文件
 * 运行：npm run merge-i18n 或 node src/i18n/mergeBundles.ts
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface AdminTranslation {
  admin?: Record<string, any>
  [key: string]: any
}

interface CompleteBundle {
  admin: Record<string, any>
  [key: string]: any
}

const localesDir = path.join(__dirname, 'locales')
const outputDir = path.join(__dirname, '../../') // web-site 根目录

// 支持的语言列表
const languages = [
  { code: 'zh-CN', name: '中文' },
  { code: 'en-US', name: 'English' },
  { code: 'ja-JP', name: '日本語' },
  { code: 'ko-KR', name: '한국어' }
]

/**
 * 从 admin 目录读取翻译文件
 */
function readAdminTranslation(languageCode: string): AdminTranslation {
  try {
    const filePath = path.join(localesDir, 'admin', `${languageCode}.json`)
    const content = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    console.warn(`⚠️  无法读取 ${languageCode} admin 翻译文件:`, error)
    return { admin: {} }
  }
}

/**
 * 生成完整的补充翻译文件
 */
function generateCompleteSupplementFile(languageCode: string): void {
  const adminData = readAdminTranslation(languageCode)
  
  const completeBundle: CompleteBundle = {
    admin: adminData.admin || {}
  }

  const outputFileName = `i18n-complete-supplement-${languageCode}.json`
  const outputPath = path.join(outputDir, outputFileName)

  try {
    fs.writeFileSync(
      outputPath,
      JSON.stringify(completeBundle, null, 2),
      'utf-8'
    )
    console.log(`✅ 已生成: ${outputFileName}`)
  } catch (error) {
    console.error(`❌ 生成 ${outputFileName} 失败:`, error)
  }
}

/**
 * 主函数
 */
function main(): void {
  console.log('📦 开始生成 i18n 完整补充翻译文件...\n')

  languages.forEach(lang => {
    generateCompleteSupplementFile(lang.code)
  })

  console.log('\n✨ 翻译文件生成完成！')
  console.log(`📁 输出位置: ${outputDir}`)
}

// 执行
main()
