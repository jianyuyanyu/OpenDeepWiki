import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'motion/react'
import { Loader2, List, X, Eye, EyeOff, Edit, Calendar } from 'lucide-react'
import { documentService, type DocumentResponse } from '@/services/documentService'
import { useRepositoryDetailStore } from '@/stores/repositoryDetail.store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import MarkdownRenderer from '@/components/common/MarkdownRenderer'
import TableOfContents from '@/components/common/TableOfContents'
import DocumentSkeleton from '@/components/common/DocumentSkeleton'
import { DocsBreadcrumb } from '@/components/common/DocsBreadcrumb'
import { DocsPager } from '@/components/common/DocsPager'
import { FadeIn, SlideIn, ZoomIn, StaggerContainer, StaggerItem } from '@/components/animate-ui'

interface DocumentPageProps {
  className?: string
  branch?: string
}

export default function DocumentPage({ className, branch }: DocumentPageProps) {
  const { owner, name, '*': path } = useParams<{ owner: string; name: string; '*': string }>()
  const [searchParams] = useSearchParams()
  const { t, i18n } = useTranslation()
  const { selectedBranch, documentNodes, repository } = useRepositoryDetailStore()
  const [loading, setLoading] = useState(true)
  const [documentData, setDocumentData] = useState<DocumentResponse | null>(null)
  const [error, setError] = useState<string>('')
  const [isMobileTocOpen, setIsMobileTocOpen] = useState(false)
  const [showMobileTocButton, setShowMobileTocButton] = useState(true)
  const [hasTocContent, setHasTocContent] = useState(false)
  const [forceShowToc, setForceShowToc] = useState(false)

  useEffect(() => {
    if (!owner || !name || !path) return

    const fetchDocument = async () => {
      try {
        setLoading(true)
        setError('')

        // 获取分支参数（优先级：URL 参数 > store 中的 selectedBranch > props > 默认 main）
        const urlBranch = searchParams.get('branch')
        const currentBranch = urlBranch || selectedBranch || branch || 'main'

        // 调用文档服务获取内容 - 使用 GetDocumentByIdAsync
        const response = await documentService.getDocument(
          owner,
          name,
          path,
          currentBranch,
          i18n.language
        )

        if (response) {
          setDocumentData(response)
        } else {
          setError(t('repository.document.notFound'))
        }
      } catch (err) {
        console.error('Failed to fetch document:', err)
        setError(t('repository.document.loadFailed'))
      } finally {
        setLoading(false)
      }
    }

    fetchDocument()
  }, [owner, name, path, branch, selectedBranch, searchParams, i18n.language])

  // 检测页面是否有足够的标题来显示 TOC
  useEffect(() => {
    // 延迟检测，确保 markdown 已经渲染
    const checkTocContent = () => {
      const headings = document.querySelectorAll('.markdown-content h1, .markdown-content h2, .markdown-content h3, .markdown-content h4, .markdown-content h5, .markdown-content h6')
      setHasTocContent(headings.length >= 2)
    }

    if (documentData?.content) {
      // 延迟检测以确保 markdown 已经渲染
      setTimeout(checkTocContent, 500)
    }
  }, [documentData?.content])

  // 监听滚动以智能显示/隐藏 TOC 按钮
  useEffect(() => {
    let lastScrollY = 0
    let ticking = false

    const handleScroll = () => {
      const currentScrollY = window.scrollY

      if (!ticking) {
        requestAnimationFrame(() => {
          // 向下滚动隐藏，向上滚动显示
          if (currentScrollY > lastScrollY && currentScrollY > 100) {
            setShowMobileTocButton(false)
          } else if (currentScrollY < lastScrollY || currentScrollY <= 100) {
            setShowMobileTocButton(true)
          }

          lastScrollY = currentScrollY
          ticking = false
        })

        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 键盘支持（ESC 关闭抽屉）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileTocOpen) {
        setIsMobileTocOpen(false)
      }
    }

    if (isMobileTocOpen) {
      document.addEventListener('keydown', handleKeyDown)
      // 防止背景滚动
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isMobileTocOpen])

  if (loading) {
    return <DocumentSkeleton />
  }

  if (error) {
    return (
      <FadeIn className="flex flex-col items-center justify-center h-full gap-4">
        <ZoomIn className="text-center space-y-2">
          <p className="text-lg text-muted-foreground">{error}</p>
          <p className="text-sm text-muted-foreground">
            {owner}/{name}/{path}
          </p>
        </ZoomIn>
      </FadeIn>
    )
  }

  const currentBranch = searchParams.get('branch') || selectedBranch || branch || 'main'

  return (
    <div className={cn("flex-1 grid grid-rows-[auto_1fr] h-full relative bg-background/60", className)}>
      <div className="grid lg:grid-cols-[minmax(0,1fr)_240px] gap-10 items-start h-full overflow-hidden">
        {/* 主要内容区域，带滚动条 */}
        <main 
          id="article-scroll-container"
          className="overflow-y-auto h-full px-6 py-8 lg:px-10 lg:py-10 scroll-smooth"
        >
          <article className="mx-auto min-h-full max-w-4xl">
            <div className="min-w-0">
              <StaggerContainer staggerDelay={0.08} className="space-y-6">
                
                {/* 面包屑导航 */}
                <StaggerItem>
                  <DocsBreadcrumb 
                    nodes={documentNodes} 
                    currentPath={path} 
                    owner={owner!} 
                    name={name!} 
                  />
                </StaggerItem>

                {/* 标题区域 */}
                <StaggerItem>
                  <div className="space-y-2 mb-8">
                     <h1 className="text-3xl font-bold tracking-tight text-foreground scroll-m-20">
                       {documentData?.title || path?.split('/').pop()?.replace('.md', '')}
                     </h1>
                     <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {documentData?.lastUpdate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Updated {new Date(documentData.lastUpdate).toLocaleDateString()}</span>
                          </div>
                        )}
                        {/* 这里可以加 Edit on GitHub 链接，如果有仓库地址 */}
                        {repository?.address && path && (
                          <a 
                            href={`${repository.address}/blob/${currentBranch}/${path}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:text-primary transition-colors"
                          >
                            <Edit className="h-3 w-3" />
                            <span>Edit on GitHub</span>
                          </a>
                        )}
                     </div>
                  </div>
                </StaggerItem>

                {/* 显示文档描述 */}
                {documentData?.description && (
                  <StaggerItem>
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground"
                    >
                      {documentData.description}
                    </motion.div>
                  </StaggerItem>
                )}

                {/* 显示源文件信息 */}
                {documentData?.fileSource && documentData.fileSource.length > 0 && (
                  <StaggerItem>
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3"
                    >
                      <details className="group">
                        <summary className="flex items-center gap-2 cursor-pointer font-medium text-sm text-foreground select-none">
                          <svg
                            className="w-4 h-4 transition-transform group-open:rotate-90 text-muted-foreground"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          {t('repository.document.relevantSourceFiles')}
                        </summary>
                        <div className="mt-3 max-h-48 overflow-y-auto space-y-2 pl-6 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                          {documentData.fileSource.map((source, index) => (
                            <a
                              key={index}
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-primary hover:underline hover:bg-muted/40 px-2 py-1 rounded transition-colors"
                            >
                              <svg className="w-4 h-4 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="truncate">{source.name}</span>
                            </a>
                          ))}
                        </div>
                      </details>
                    </motion.div>
                  </StaggerItem>
                )}

                {/* 渲染 Markdown 内容 */}
                <StaggerItem>
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="markdown-content"
                  >
                    <MarkdownRenderer content={documentData?.content || ''} />
                  </motion.div>
                </StaggerItem>

                {/* 分页导航 */}
                <StaggerItem>
                  <DocsPager 
                    nodes={documentNodes} 
                    currentPath={path} 
                    owner={owner!} 
                    name={name!} 
                    branch={currentBranch} 
                  />
                </StaggerItem>
              </StaggerContainer>
            </div>
            
            {/* Footer space */}
            <div className="h-20" />
          </article>
        </main>
        
        {/* 右侧 TOC（桌面） */}
        {(hasTocContent || forceShowToc) && (
          <motion.aside
            layout
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 18 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="hidden lg:block h-full overflow-y-auto py-10 pr-6 pl-2" // 让 TOC 区域自己滚动
          >
            <div className="text-sm font-semibold mb-4 text-foreground">{t('repository.document.tableOfContents')}</div>
            <TableOfContents className="p-0 border-0 shadow-none bg-transparent" />
          </motion.aside>
        )}
      </div>

      {/* 移动端 TOC 按钮 - 使用 motion */}
      <AnimatePresence>
        {(hasTocContent || forceShowToc) && showMobileTocButton && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.75, y: 20 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-6 right-6 z-40 lg:hidden"
          >
            <Button
              onClick={() => setIsMobileTocOpen(true)}
              className="h-12 w-12 rounded-full shadow-lg p-0"
              size="icon"
              aria-label="Open Table of Contents"
            >
              <List className="h-5 w-5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 移动端 TOC 显示按钮 - 使用 motion */}
      <AnimatePresence>
        {!hasTocContent && !forceShowToc && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="fixed bottom-6 right-6 z-40 lg:hidden"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => setForceShowToc(true)}
                className="h-12 px-4 rounded-full shadow-lg flex items-center gap-2"
                variant="outline"
                aria-label="Show Table of Contents"
              >
                <Eye className="h-4 w-4" />
                <span className="text-sm">TOC</span>
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 移动端 TOC 抽屉 - 使用 AnimatePresence */}
      <AnimatePresence>
        {(hasTocContent || forceShowToc) && isMobileTocOpen && (
          <>
            {/* 遮罩层 - motion 动画 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/50 z-50 lg:hidden"
              onClick={() => setIsMobileTocOpen(false)}
            />

            {/* TOC 抽屉 - motion 动画 */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 right-0 w-80 max-w-[85vw] bg-background border-l border-border z-50 lg:hidden shadow-2xl"
            >
            <div className="flex flex-col h-full">
              {/* 头部 */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="text-lg font-semibold">{t('repository.document.tableOfContents')}</h3>
                <Button
                  onClick={() => setIsMobileTocOpen(false)}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* TOC 内容 */}
              <div className="flex-1 overflow-y-auto p-4">
                {/* 手动显示提示 - 仅在内容不足时显示 */}
                {!hasTocContent && (
                  <div className="mb-4 p-3 bg-muted/30 rounded-lg border text-sm text-muted-foreground">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="h-4 w-4" />
                      <span className="font-medium">{t('repository.document.manualTocMode')}</span>
                    </div>
                    <p>{t('repository.document.manualTocDescription')}</p>
                  </div>
                )}
                <TableOfContents
                  className="max-h-none"
                  onItemClick={() => setIsMobileTocOpen(false)}
                />
              </div>
            </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}