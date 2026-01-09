import { useEffect, useRef, useState, useCallback } from 'react'
import mermaid from 'mermaid'
import * as Dialog from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'
import { Button as UiButton } from '@/components/ui/button'
import {
  Copy,
  Check,
  Maximize2,
  Download,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  X,
  RotateCcw
} from 'lucide-react'

interface MermaidEnhancedProps {
  code: string
  title?: string
  className?: string
}

const inferDiagramType = (code: string): string => {
  const trimmedCode = code.trim().toLowerCase()
  if (trimmedCode.includes('sequencediagram')) return 'Sequence'
  if (trimmedCode.includes('classdiagram')) return 'Class'
  if (trimmedCode.includes('gitgraph')) return 'Git Graph'
  if (trimmedCode.includes('gantt')) return 'Gantt'
  if (trimmedCode.includes('pie')) return 'Pie'
  if (trimmedCode.includes('journey')) return 'Journey'
  if (trimmedCode.includes('statediagram')) return 'State'
  if (trimmedCode.includes('erdiagram')) return 'ER'
  if (trimmedCode.includes('mindmap')) return 'Mindmap'
  if (trimmedCode.includes('timeline')) return 'Timeline'
  if (trimmedCode.includes('quadrantchart')) return 'Quadrant'
  if (trimmedCode.includes('flowchart')) return 'Flowchart'
  if (trimmedCode.includes('graph')) return 'Graph'
  return 'Diagram'
}

// Fumadocs-inspired Zinc Theme Configuration
const getMermaidTheme = (isDark: boolean) => {
  // Zinc Colors
  const zinc950 = '#09090b'
  const zinc900 = '#18181b'
  const zinc800 = '#27272a'
  const zinc700 = '#3f3f46'
  const zinc600 = '#52525b'
  const zinc500 = '#71717a'
  const zinc400 = '#a1a1aa'
  const zinc200 = '#e4e4e7'
  const zinc100 = '#f4f4f5'
  const zinc50 = '#fafafa'
  const white = '#ffffff'

  const primaryColor = isDark ? zinc100 : zinc900
  const secondaryColor = isDark ? zinc800 : zinc100
  const tertiaryColor = isDark ? zinc900 : zinc50
  
  const textColor = isDark ? '#e4e4e7' : '#18181b' // zinc-200 : zinc-900
  const lineColor = isDark ? '#a1a1aa' : '#52525b' // zinc-400 : zinc-600
  
  const baseVariables = {
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    fontSize: '14px',
    textColor: textColor,
    primaryColor: secondaryColor,
    primaryTextColor: textColor,
    primaryBorderColor: lineColor,
    lineColor: lineColor,
    secondaryColor: tertiaryColor,
    tertiaryColor: isDark ? zinc950 : white,
    noteBkgColor: isDark ? zinc900 : zinc50,
    noteTextColor: textColor,
    noteBorderColor: lineColor,
  }

  return {
    startOnLoad: false,
    theme: 'base', // Use base theme for full control
    themeVariables: {
      ...baseVariables,
      // Specific overrides for diagram types
      mainBkg: isDark ? zinc950 : white,
      nodeBorder: lineColor,
      clusterBkg: isDark ? zinc900 : zinc50,
      clusterBorder: lineColor,
      defaultLinkColor: lineColor,
      titleColor: textColor,
      edgeLabelBackground: isDark ? zinc800 : zinc100,
      actorBorder: lineColor,
      actorBkg: isDark ? zinc900 : white,
      labelBoxBkgColor: isDark ? zinc900 : white,
      signalColor: textColor,
      signalTextColor: textColor,
      loopTextColor: textColor,
      darkMode: isDark,
    },
    securityLevel: 'loose',
  }
}

export default function MermaidEnhanced({
  code,
  title,
  className
}: MermaidEnhancedProps) {
  const diagramTitle = title || inferDiagramType(code)
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGElement | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCopied, setIsCopied] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [scale, setScale] = useState(1)
  const [modalScale, setModalScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    const checkDarkMode = () => document.documentElement.classList.contains('dark')
    setIsDarkMode(checkDarkMode())
    const observer = new MutationObserver(() => setIsDarkMode(checkDarkMode()))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }, [code])

  const exportPNG = useCallback(async () => {
    if (isExporting || !svgRef.current) return
    try {
      setIsExporting(true)
      const svgElement = svgRef.current
      const bbox = svgElement.getBBox()
      const svgClone = svgElement.cloneNode(true) as SVGElement
      
      // Ensure dimensions
      svgClone.setAttribute('width', String(bbox.width * 2))
      svgClone.setAttribute('height', String(bbox.height * 2))
      
      // Add background for PNG transparency
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      rect.setAttribute('width', '100%')
      rect.setAttribute('height', '100%')
      rect.setAttribute('fill', isDarkMode ? '#09090b' : '#ffffff')
      svgClone.insertBefore(rect, svgClone.firstChild)

      const svgString = new XMLSerializer().serializeToString(svgClone)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const img = new Image()
      img.onload = () => {
        canvas.width = bbox.width * 2
        canvas.height = bbox.height * 2
        ctx.drawImage(img, 0, 0)
        canvas.toBlob(blob => {
          if (!blob) return
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${diagramTitle}.png`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          setIsExporting(false)
        }, 'image/png')
      }
      img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`
    } catch (e) {
      console.error(e)
      setIsExporting(false)
    }
  }, [isExporting, diagramTitle, isDarkMode])

  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current) return
      try {
        setIsLoading(true)
        setError(null)
        containerRef.current.innerHTML = ''
        
        mermaid.initialize(getMermaidTheme(isDarkMode))
        const id = `mermaid-${Date.now()}`
        const { svg } = await mermaid.render(id, code)
        
        if (containerRef.current) {
          containerRef.current.innerHTML = svg
          const svgElement = containerRef.current.querySelector('svg')
          if (svgElement) {
            svgRef.current = svgElement
            svgElement.style.maxWidth = '100%'
            svgElement.style.height = 'auto'
            // Ensure font inheritance
            svgElement.style.fontFamily = 'inherit'
          }
        }
        setIsLoading(false)
      } catch (err) {
        console.error(err)
        setError('Failed to render diagram')
        setIsLoading(false)
      }
    }
    renderDiagram()
  }, [code, isDarkMode])

  const ActionButton = ({ onClick, title, children, disabled }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
      title={title}
    >
      {children}
    </button>
  )

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }
  }, [position])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
    }
  }, [isDragging, dragStart])

  return (
    <>
      <div className="my-6 overflow-hidden rounded-lg border border-border bg-card">
        {/* Header / Toolbar */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/20">
          <span className="text-xs font-medium text-muted-foreground select-none flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary/20"></span>
            {diagramTitle}
          </span>
          
          <div className="flex items-center gap-0.5">
            <ActionButton onClick={() => setScale(s => Math.max(0.5, s - 0.1))} title="Zoom Out">
              <ZoomOut className="h-3.5 w-3.5" />
            </ActionButton>
            <span className="text-[10px] text-muted-foreground w-8 text-center tabular-nums">
              {Math.round(scale * 100)}%
            </span>
            <ActionButton onClick={() => setScale(s => Math.min(3, s + 0.1))} title="Zoom In">
              <ZoomIn className="h-3.5 w-3.5" />
            </ActionButton>
            <div className="w-px h-3 bg-border mx-1"></div>
            <ActionButton onClick={handleCopy} title="Copy Code">
              {isCopied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
            </ActionButton>
            <ActionButton onClick={exportPNG} title="Download PNG" disabled={isExporting}>
              {isExporting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            </ActionButton>
            <ActionButton onClick={() => setIsFullscreen(true)} title="Fullscreen">
              <Maximize2 className="h-3.5 w-3.5" />
            </ActionButton>
          </div>
        </div>

        {/* Diagram Area */}
        <div className="relative p-4 bg-background min-h-[150px] flex items-center justify-center overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
              <div className="flex flex-col items-center gap-2">
                <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Rendering...</span>
              </div>
            </div>
          )}

          {error ? (
            <div className="text-sm text-destructive flex items-center gap-2">
              <X className="h-4 w-4" />
              <span>{error}</span>
            </div>
          ) : (
            <div
              ref={containerRef}
              className="transition-transform duration-200 ease-out origin-center"
              style={{ transform: `scale(${scale})` }}
            />
          )}
        </div>
      </div>

      {/* Fullscreen Modal */}
      <Dialog.Root open={isFullscreen} onOpenChange={setIsFullscreen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm animate-in fade-in-0" />
          <Dialog.Content className="fixed inset-4 z-50 flex flex-col rounded-xl border border-border bg-card shadow-2xl outline-none animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="font-medium text-sm">{diagramTitle} Preview</span>
              <div className="flex items-center gap-2">
                <UiButton variant="outline" size="sm" onClick={() => { setModalScale(1); setPosition({x:0,y:0}) }}>
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  Reset
                </UiButton>
                <UiButton variant="ghost" size="icon" onClick={() => setIsFullscreen(false)}>
                  <X className="h-4 w-4" />
                </UiButton>
              </div>
            </div>

            {/* Modal Body */}
            <div 
              className="flex-1 overflow-hidden relative cursor-grab active:cursor-grabbing bg-muted/10"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
              onWheel={(e) => {
                e.preventDefault();
                setModalScale(s => Math.max(0.1, Math.min(5, s + (e.deltaY > 0 ? -0.1 : 0.1))))
              }}
            >
              <div 
                className="absolute w-full h-full flex items-center justify-center transition-transform duration-75"
                style={{ 
                  transform: `translate(${position.x}px, ${position.y}px) scale(${modalScale})` 
                }}
              >
                <div dangerouslySetInnerHTML={{ __html: svgRef.current?.outerHTML || '' }} />
              </div>
              
              {/* Floating Controls */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1 rounded-full border border-border bg-background shadow-lg">
                <UiButton variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setModalScale(s => Math.max(0.1, s - 0.2))}>
                  <ZoomOut className="h-4 w-4" />
                </UiButton>
                <span className="text-xs font-mono w-12 text-center">{Math.round(modalScale * 100)}%</span>
                <UiButton variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setModalScale(s => Math.min(5, s + 0.2))}>
                  <ZoomIn className="h-4 w-4" />
                </UiButton>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
