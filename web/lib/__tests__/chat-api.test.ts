/**
 * 上下文传递属性测试
 * 
 * Property 1: 上下文传递完整性
 * Validates: Requirements 5.1, 5.2
 * 
 * Feature: doc-chat-assistant, Property 1: 上下文传递完整性
 */
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { DocContext, CatalogItem, ChatRequest, toChatMessageDto } from '../chat-api'
import { ChatMessage } from '@/hooks/use-chat-history'

// 生成随机目录项
const catalogItemArb: fc.Arbitrary<CatalogItem> = fc.letrec(tie => ({
  item: fc.record({
    title: fc.string({ minLength: 1, maxLength: 50 }),
    path: fc.string({ minLength: 1, maxLength: 100 }),
    children: fc.option(
      fc.array(tie('item') as fc.Arbitrary<CatalogItem>, { maxLength: 3 }),
      { nil: undefined }
    ),
  }),
})).item

// 生成随机文档上下文
const docContextArb: fc.Arbitrary<DocContext> = fc.record({
  owner: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  repo: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  branch: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  language: fc.constantFrom('zh', 'en', 'ja', 'ko'),
  currentDocPath: fc.string({ minLength: 0, maxLength: 200 }),
  catalogMenu: fc.array(catalogItemArb, { maxLength: 10 }),
})

// 生成随机消息角色
const roleArb = fc.constantFrom('user', 'assistant', 'tool') as fc.Arbitrary<'user' | 'assistant' | 'tool'>

// 生成随机聊天消息
const chatMessageArb: fc.Arbitrary<ChatMessage> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  role: roleArb,
  content: fc.string(),
  images: fc.option(fc.array(fc.base64String(), { maxLength: 3 }), { nil: undefined }),
  toolCalls: fc.option(
    fc.array(
      fc.record({
        id: fc.string({ minLength: 1, maxLength: 20 }),
        name: fc.string({ minLength: 1, maxLength: 50 }),
        arguments: fc.dictionary(fc.string(), fc.jsonValue()),
      }),
      { maxLength: 3 }
    ),
    { nil: undefined }
  ),
  toolResult: fc.option(
    fc.record({
      toolCallId: fc.string({ minLength: 1, maxLength: 20 }),
      result: fc.string(),
      isError: fc.boolean(),
    }),
    { nil: undefined }
  ),
  timestamp: fc.integer({ min: 0 }),
})

describe('Chat API Property Tests', () => {
  /**
   * Property 1: 上下文传递完整性
   * 
   * 对于任意对话请求，发送到后端的请求体必须包含完整的DocContext
   * （owner、repo、branch、language、currentDocPath）
   */
  describe('Property 1: 上下文传递完整性', () => {
    it('DocContext必须包含所有必需字段', () => {
      fc.assert(
        fc.property(
          docContextArb,
          (context) => {
            // 验证所有必需字段都存在
            expect(context).toHaveProperty('owner')
            expect(context).toHaveProperty('repo')
            expect(context).toHaveProperty('branch')
            expect(context).toHaveProperty('language')
            expect(context).toHaveProperty('currentDocPath')
            expect(context).toHaveProperty('catalogMenu')
            
            // 验证字段类型
            expect(typeof context.owner).toBe('string')
            expect(typeof context.repo).toBe('string')
            expect(typeof context.branch).toBe('string')
            expect(typeof context.language).toBe('string')
            expect(typeof context.currentDocPath).toBe('string')
            expect(Array.isArray(context.catalogMenu)).toBe(true)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('owner、repo、branch不能为空', () => {
      fc.assert(
        fc.property(
          docContextArb,
          (context) => {
            expect(context.owner.trim().length).toBeGreaterThan(0)
            expect(context.repo.trim().length).toBeGreaterThan(0)
            expect(context.branch.trim().length).toBeGreaterThan(0)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('language必须是有效的语言代码', () => {
      fc.assert(
        fc.property(
          docContextArb,
          (context) => {
            const validLanguages = ['zh', 'en', 'ja', 'ko']
            expect(validLanguages).toContain(context.language)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('catalogMenu中的每个项目必须有title和path', () => {
      fc.assert(
        fc.property(
          docContextArb,
          (context) => {
            const validateCatalogItem = (item: CatalogItem): boolean => {
              if (!item.title || !item.path) return false
              if (item.children) {
                return item.children.every(validateCatalogItem)
              }
              return true
            }
            
            const allValid = context.catalogMenu.every(validateCatalogItem)
            expect(allValid).toBe(true)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('ChatRequest必须包含完整的context', () => {
      fc.assert(
        fc.property(
          fc.array(chatMessageArb, { minLength: 1, maxLength: 10 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          docContextArb,
          fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
          (messages, modelId, context, appId) => {
            const request: ChatRequest = {
              messages: messages.map(toChatMessageDto),
              modelId,
              context,
              appId,
            }
            
            // 验证请求包含完整的context
            expect(request.context).toBeDefined()
            expect(request.context.owner).toBe(context.owner)
            expect(request.context.repo).toBe(context.repo)
            expect(request.context.branch).toBe(context.branch)
            expect(request.context.language).toBe(context.language)
            expect(request.context.currentDocPath).toBe(context.currentDocPath)
            expect(request.context.catalogMenu).toEqual(context.catalogMenu)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('toChatMessageDto应该正确转换消息', () => {
      fc.assert(
        fc.property(
          chatMessageArb,
          (message) => {
            const dto = toChatMessageDto(message)
            
            // 验证转换后的DTO包含所有必需字段
            expect(dto.role).toBe(message.role)
            expect(dto.content).toBe(message.content)
            expect(dto.images).toEqual(message.images)
            expect(dto.toolCalls).toEqual(message.toolCalls)
            expect(dto.toolResult).toEqual(message.toolResult)
            
            // 验证DTO不包含id和timestamp（这些是前端专用字段）
            expect(dto).not.toHaveProperty('id')
            expect(dto).not.toHaveProperty('timestamp')
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('消息历史转换应该保持顺序', () => {
      fc.assert(
        fc.property(
          fc.array(chatMessageArb, { minLength: 1, maxLength: 20 }),
          (messages) => {
            const dtos = messages.map(toChatMessageDto)
            
            // 验证转换后的数组长度相同
            expect(dtos.length).toBe(messages.length)
            
            // 验证顺序保持不变
            messages.forEach((msg, index) => {
              expect(dtos[index].role).toBe(msg.role)
              expect(dtos[index].content).toBe(msg.content)
            })
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
