
import { useEffect, useState, useRef, useCallback } from 'react'

import { useParams, useSearchParams } from 'react-router-dom'

import { useTranslation } from 'react-i18next'

import { 

  Loader2, 

  AlertCircle, 

  RefreshCw, 

  Maximize, 

  Minimize, 

  Download, 

  Info,

  MousePointer2

} from 'lucide-react'

import { useRepositoryDetailStore } from '@/stores/repositoryDetail.store'

import { fetchService } from '@/services/fetch'

import { Button } from '@/components/ui/button'

import { Card, CardContent } from '@/components/ui/card'

import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'

import { cn } from '@/lib/utils'

import { useTheme } from '@/components/theme-provider'

import 'mind-elixir/style'



// --- Types ---



interface MiniMapResult {

  title: string

  url: string

  nodes: MiniMapResult[]

}



interface MindMapResponse {

  code: number

  message: string

  data: MiniMapResult

}



interface MindElixirNode {

  topic: string

  id: string

  root?: boolean

  expanded?: boolean

  hyperLink?: string

  children?: MindElixirNode[]

}



// --- Services ---



const fetchMindMapData = async (

  owner: string,

  repo: string,

  branch: string,

  languageCode?: string

): Promise<MindMapResult> => {

  const params = new URLSearchParams({ owner, name: repo })

  if (branch) params.append('branch', branch)

  if (languageCode) params.append('languageCode', languageCode)



  const response = await fetchService.get<MindMapResponse>(

    `/api/Warehouse/MiniMap?${params.toString()}`

  )



  if (response.code !== 200 || !response.data) {

    throw new Error(response.message || 'Failed to load mind map data')

  }



  return response.data

}



// --- Helpers ---



const convertToMindElixirData = (miniMapData: MiniMapResult): MindElixirNode => {

  let nodeIdCounter = 0



  const buildMindNode = (node: MiniMapResult, isRoot = false): MindElixirNode => {

    const mindNode: MindElixirNode = {

      topic: node.title,

      id: isRoot ? 'root' : `node_${nodeIdCounter++}`,

      hyperLink: node.url

    }



    if (isRoot) {

      mindNode.root = true

    }



    if (node.nodes && node.nodes.length > 0) {

      mindNode.expanded = true

      mindNode.children = node.nodes.map(child => buildMindNode(child))

    }



    return mindNode

  }



  return buildMindNode(miniMapData, true)

}



// --- Components ---



export default function MindMapPage({ className }: { className?: string }) {

  const { owner, name } = useParams<{ owner: string; name: string }>()

  const [searchParams] = useSearchParams()

  const { t, i18n } = useTranslation()

  const { selectedBranch } = useRepositoryDetailStore()

    const { theme: appTheme } = useTheme()

    

    const [loading, setLoading] = useState(true)

    const [error, setError] = useState<string>('')

    const [isFullscreen, setIsFullscreen] = useState(false)

    const [mindData, setMindData] = useState<MindElixirNode | null>(null)

    

    // Refs

    const containerRef = useRef<HTMLDivElement>(null)

    const mindRef = useRef<any>(null)

    const panCleanupRef = useRef<(() => void) | null>(null)

  

    const branch = searchParams.get('branch') || selectedBranch || 'main'

  

    // Determine actual theme (dark/light)

    const isDark = 

      appTheme === 'dark' || 

      (appTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  

    const loadData = useCallback(async () => {

      if (!owner || !name) return

  

      setLoading(true)

      setError('')

      // Clear previous data to ensure loading state shows

      setMindData(null) 

      try {

        const data = await fetchMindMapData(owner, name, branch, i18n.language)

        const convertedData = convertToMindElixirData(data)

        // Set data to trigger render effect

        setMindData(convertedData)

      } catch (err: any) {

        console.error('Failed to fetch mind map:', err)

        setError(err?.message || t('repository.mindMap.loadFailed'))

      } finally {

        setLoading(false)

      }

    }, [owner, name, branch, i18n.language, t])

  

    // Initialize Mind Elixir

    const initMindElixir = useCallback(async (data: MindElixirNode) => {

      if (!containerRef.current) return

  

      // Dynamic import

      const MindElixir = (await import('mind-elixir')).default

  

      // Cleanup previous instance

      if (panCleanupRef.current) panCleanupRef.current()

      if (mindRef.current) {

        try { mindRef.current.destroy?.() } catch (e) { console.warn(e) }

      }

  

      // Theme Configuration

      const themeConfig = {

        name: 'Koala Theme',

        palette: isDark 

          ? ['#e4e4e7', '#d4d4d8', '#a1a1aa', '#71717a', '#52525b'] // Zinc 200-600 (Dark Mode)

          : ['#18181b', '#27272a', '#3f3f46', '#52525b', '#71717a'], // Zinc 900-500 (Light Mode)

        cssVar: {

          '--main-color': isDark ? '#fafafa' : '#09090b', // Zinc 50 / Zinc 950

          '--main-bgcolor': isDark ? '#27272a' : '#f4f4f5', // Zinc 800 / Zinc 100

          '--color': isDark ? '#e4e4e7' : '#27272a', // Zinc 200 / Zinc 800

          '--bgcolor': isDark ? '#18181b' : '#ffffff', // Zinc 900 / White

          '--panel-color': isDark ? '255, 255, 255' : '9, 9, 11',

          '--panel-bgcolor': isDark ? '39, 39, 42' : '255, 255, 255',

        },

      }

  

      const options = {

        el: containerRef.current,

        direction: MindElixir.SIDE,

        draggable: true,

        contextMenu: true,

        toolBar: false, // We use our own toolbar

        nodeMenu: true,

        keypress: true,

        locale: 'en' as const,

        overflowHidden: false,

        mainLinkStyle: 2,

        mouseSelectionButton: 0 as const,

        allowFreeTransform: true,

        mouseMoveThreshold: 5,

        primaryLinkStyle: 1,

        primaryNodeHorizontalGap: 65,

        primaryNodeVerticalGap: 25,

        theme: themeConfig

      }

  

      const mind = new MindElixir(options)

      

      mind.init({

        nodeData: data,

        linkData: {}

      })

  

      const ensureFit = () => {

        try {

          mind.scaleFit()

          mind.toCenter()

        } catch (e) {

          console.warn('Mind map fit error:', e)

        }

      }

  

      // Ensure fit after render

      requestAnimationFrame(ensureFit)

      setTimeout(ensureFit, 300)

  

      // Setup Custom Pan/Zoom behaviors

      setupInteractions(mind)

  

      mind.bus.addListener('selectNode', (node: any) => {

        if (node.hyperLink) {

          window.open(node.hyperLink, '_blank')

        }

      })

  

      mindRef.current = mind

    }, [isDark])

  

    // Setup interactions (Pan, etc.)

    const setupInteractions = (mind: any) => {

      const panState = { isPanning: false, lastX: 0, lastY: 0 }

      

      const isNodeElement = (target: EventTarget | null) => {

        if (!(target instanceof HTMLElement)) return false

        return Boolean(

          target.closest('me-root') ||

          target.closest('me-parent') ||

          target.closest('me-tpc') ||

          target.closest('#input-box')

        )

      }

  

      const handleMouseDown = (event: MouseEvent) => {

        if (event.button !== 0 || isNodeElement(event.target)) return

        

        panState.isPanning = true

        panState.lastX = event.clientX

        panState.lastY = event.clientY

        

        if (mind.container) {

          mind.container.style.cursor = 'grabbing'

          mind.container.classList.add('grabbing')

        }

        event.preventDefault()

      }

  

      const handleMouseMove = (event: MouseEvent) => {

        if (!panState.isPanning) return

        

        const dx = event.clientX - panState.lastX

        const dy = event.clientY - panState.lastY

        

        if (dx !== 0 || dy !== 0) {

          mind.move(dx, dy)

          panState.lastX = event.clientX

          panState.lastY = event.clientY

        }

      }

  

      const stopPanning = () => {

        if (!panState.isPanning) return

        panState.isPanning = false

        if (mind.container) {

          mind.container.style.cursor = 'grab'

          mind.container.classList.remove('grabbing')

        }

      }

  

      mind.container?.addEventListener('mousedown', handleMouseDown)

      window.addEventListener('mousemove', handleMouseMove)

      window.addEventListener('mouseup', stopPanning)

      mind.container?.addEventListener('mouseleave', stopPanning)

  

      // Save cleanup function

      panCleanupRef.current = () => {

        mind.container?.removeEventListener('mousedown', handleMouseDown)

        window.removeEventListener('mousemove', handleMouseMove)

        window.removeEventListener('mouseup', stopPanning)

        mind.container?.removeEventListener('mouseleave', stopPanning)

      }

  

      // Set initial cursor

      if (mind.container) {

        mind.container.style.cursor = 'grab'

      }

    }

  

    // Handle Resize

    useEffect(() => {

      const handleResize = () => {

        if (mindRef.current && containerRef.current) {

          mindRef.current.refresh()

        }

      }

      window.addEventListener('resize', handleResize)

      return () => window.removeEventListener('resize', handleResize)

    }, [])

  

    // Initial Load

    useEffect(() => {

      loadData()

    }, [loadData])

  

    // Core Rendering Effect: This initializes or re-initializes the mind map

    // whenever the data is loaded/changed or the theme is switched.

    useEffect(() => {

      if (mindData) {

        initMindElixir(mindData)

      }

    }, [mindData, initMindElixir])

  

    // Cleanup

    useEffect(() => {

      return () => {

        if (panCleanupRef.current) panCleanupRef.current()

        if (mindRef.current) try { mindRef.current.destroy?.() } catch {}

      }

    }, [])

  

    // Actions

    const toggleFullscreen = () => {

      setIsFullscreen(!isFullscreen)

      setTimeout(() => {

        mindRef.current?.refresh()

        mindRef.current?.toCenter()

      }, 100)

    }

  

    const exportImage = async () => {

      if (!mindRef.current) return

      try {

        const blob = await mindRef.current.exportPng()

        if (blob) {

          const url = URL.createObjectURL(blob)

          const a = document.createElement('a')

          a.href = url

          a.download = `${owner}-${name}-mindmap.png`

          document.body.appendChild(a)

          a.click()

          document.body.removeChild(a)

          URL.revokeObjectURL(url)

        }

      } catch (error) {

        console.error('Export error:', error)

      }

    }

  

    // --- Render ---

  

    if (loading || !mindData) {

      return (

        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">

          <Loader2 className="w-10 h-10 animate-spin text-primary" />

          <p className="text-muted-foreground animate-pulse">{t('common.loading')}</p>

        </div>

      )

    }

  

    if (error) {

      return (

        <div className="flex flex-col items-center justify-center h-[60vh] gap-6 p-6">

          <div className="bg-destructive/10 p-4 rounded-full">

            <AlertCircle className="h-10 w-10 text-destructive" />

          </div>

          <div className="text-center space-y-2 max-w-md">

            <h3 className="text-lg font-semibold">{t('repository.mindMap.error')}</h3>

            <p className="text-sm text-muted-foreground bg-muted p-2 rounded break-all">{error}</p>

          </div>

          <Button onClick={loadData} variant="default" className="gap-2">

            <RefreshCw className="h-4 w-4" />

            {t('common.retry')}

          </Button>

        </div>

      )

    }

  

    return (

      <TooltipProvider>

        <div className={cn("flex flex-col h-[calc(100vh-140px)] w-full gap-4", className)}>

          <Card className={cn(

            "flex-1 flex flex-col overflow-hidden border-border/60 shadow-sm transition-all duration-300",

            isFullscreen && "fixed inset-0 z-[50] rounded-none h-screen border-0"

          )}>

            {/* Toolbar Overlay */}

            <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-background/80 backdrop-blur-sm p-1.5 rounded-lg border shadow-sm">

              <ActionBtn 

                icon={<RefreshCw className="h-4 w-4" />} 

                label={t('repository.mindMap.refresh')} 

                onClick={loadData} 

              />

              <ActionBtn 

                icon={<Download className="h-4 w-4" />} 

                label={t('repository.mindMap.exportImage')} 

                onClick={exportImage} 

              />

              <div className="w-px h-4 bg-border mx-1" />

              <ActionBtn 

                icon={isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />} 

                label={isFullscreen ? t('repository.mindMap.fullscreenExit') : t('repository.mindMap.fullscreenEnter')} 

                onClick={toggleFullscreen} 

              />

            </div>

  

            {/* Helper / Info Overlay */}

            <div className="absolute bottom-4 right-4 z-10">

              <Tooltip>

                <TooltipTrigger asChild>

                  <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full border shadow-sm text-xs text-muted-foreground cursor-help hover:bg-accent transition-colors">

                    <MousePointer2 className="h-3 w-3" />

                    <span>{t('repository.mindMap.helpText')}</span>

                    <Info className="h-3 w-3 ml-1" />

                  </div>

                </TooltipTrigger>

                <TooltipContent side="left">

                  <p className="max-w-xs">{t('repository.mindMap.helpDetail') || 'Use mouse to drag canvas. Click nodes to expand/collapse.'}</p>

                </TooltipContent>

              </Tooltip>

            </div>

  

            <CardContent className="flex-1 p-0 relative w-full h-full bg-zinc-50 dark:bg-zinc-950">

              <div

                ref={containerRef}

                className="w-full h-full relative"

                onContextMenu={(e) => e.preventDefault()}

              />

            </CardContent>

          </Card>

  

          {/* Scoped Styles for Mind Elixir */}

          <style>{`

            .mind-elixir {

              --gap: 20px;

            }

            

            /* Custom Scrollbars for the container */

            .mind-elixir ::-webkit-scrollbar {

              width: 8px;

              height: 8px;

            }

            .mind-elixir ::-webkit-scrollbar-track {

              background: transparent;

            }

            .mind-elixir ::-webkit-scrollbar-thumb {

              background-color: var(--border, #a1a1aa);

              border-radius: 4px;

            }

  

            /* Node Styling Override */

            .mind-elixir .node {

              transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

            }

            .mind-elixir .node:hover {

              transform: scale(1.02);

              box-shadow: 0 4px 12px rgba(0,0,0,0.1);

            }

            

            /* Root Node */

            .mind-elixir .root {

              font-size: 1.1rem !important;

              padding: 12px 24px !important;

              border-radius: 8px !important;

              font-weight: 700 !important;

            }

  

            /* Context Menu */

            .mind-elixir-plugin-context-menu {

              border-radius: 8px;

              overflow: hidden;

              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);

              background: var(--popover, white);

              border: 1px solid var(--border, #e4e4e7);

              padding: 4px;

            }

            .mind-elixir-plugin-context-menu li {

              border-radius: 4px;

              padding: 6px 12px;

              font-size: 14px;

              color: var(--foreground, #27272a);

            }

            .mind-elixir-plugin-context-menu li:hover {

              background-color: var(--accent, #f4f4f5);

              color: var(--accent-foreground, #18181b);

            }

          `}</style>

        </div>

      </TooltipProvider>

    )

  }

  

  function ActionBtn({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {

    return (

      <Tooltip>

        <TooltipTrigger asChild>

          <Button

            variant="ghost"

            size="icon"

            onClick={onClick}

            className="h-8 w-8 hover:bg-accent text-muted-foreground hover:text-foreground"

          >

            {icon}

          </Button>

        </TooltipTrigger>

        <TooltipContent>

          <p>{label}</p>

        </TooltipContent>

      </Tooltip>

    )

  }

  
