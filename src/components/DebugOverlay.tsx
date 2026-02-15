/**
 * Debug Overlay Component
 * Main container combining FPS, element inspector, and annotation features
 */

import { useCallback, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn, POSITION_STYLES } from '../lib/utils'
import { FPSOverlay } from './FPSOverlay'
import { ElementInspector } from './ElementInspector'
import { AnnotationSystem, createAnnotationsAtom, useDebugAnnotations } from './AnnotationSystem'
import type { DebugOverlayOptions, OverlayPosition, ProcessInfo } from '../lib/types'

import {
  Activity,
  MousePointer2,
  Move,
  X,
  Minimize2,
  Maximize2,
  RefreshCw,
  Power,
  Cpu,
  MessageSquare,
} from 'lucide-react'

// ============================================================================
// Types
// ============================================================================

interface MiniControlPanelProps {
  showFps: boolean
  showInspector: boolean
  showProcessInfo: boolean
  showAnnotations: boolean
  annotationCount: number
  position: OverlayPosition
  minimized: boolean
  onToggleFps: () => void
  onToggleInspector: () => void
  onToggleProcessInfo: () => void
  onToggleAnnotations: () => void
  onChangePosition: (pos: OverlayPosition) => void
  onToggleMinimize: () => void
  onClose: () => void
  onHotReload: () => void
  onColdReloadStart: () => void
  onColdReloadCancel: () => void
  coldReloadActive: boolean
  coldReloadProgress: number
}

// ============================================================================
// Mini Control Panel
// ============================================================================

function MiniControlPanel({
  showFps,
  showInspector,
  showProcessInfo,
  showAnnotations,
  annotationCount,
  position,
  minimized,
  onToggleFps,
  onToggleInspector,
  onToggleProcessInfo,
  onToggleAnnotations,
  onChangePosition,
  onToggleMinimize,
  onClose,
  onHotReload,
  onColdReloadStart,
  onColdReloadCancel,
  coldReloadActive,
  coldReloadProgress,
}: MiniControlPanelProps) {
  const positions: OverlayPosition[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right']
  const currentIndex = positions.indexOf(position)

  const cyclePosition = () => {
    const nextIndex = (currentIndex + 1) % positions.length
    onChangePosition(positions[nextIndex])
  }

  if (minimized) {
    return (
      <div className="fixed bottom-2 right-2 z-[9999]">
        <button
          onClick={onToggleMinimize}
          className="bg-black/80 backdrop-blur-sm rounded-md p-2 shadow-lg border border-white/10 hover:bg-black/90 transition-colors"
          title="Expand debug panel"
        >
          <Maximize2 className="w-4 h-4 text-white/70" />
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-2 right-2 z-[9999] bg-black/80 backdrop-blur-sm rounded-lg shadow-xl border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-1 border-b border-white/10">
        <span className="text-[10px] font-mono text-gray-400">DEBUG</span>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleMinimize}
            className="p-0.5 hover:bg-white/10 rounded transition-colors"
            title="Minimize"
          >
            <Minimize2 className="w-3 h-3 text-white/50" />
          </button>
          <button
            onClick={onClose}
            className="p-0.5 hover:bg-white/10 rounded transition-colors"
            title="Close debug mode"
          >
            <X className="w-3 h-3 text-white/50" />
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="p-2 space-y-1">
        {/* FPS Toggle */}
        <button
          onClick={onToggleFps}
          className={cn(
            'flex items-center gap-2 w-full px-2 py-1 rounded text-xs transition-colors',
            showFps
              ? 'bg-green-500/20 text-green-400'
              : 'hover:bg-white/10 text-white/70'
          )}
        >
          <Activity className="w-3 h-3" />
          <span>FPS Overlay</span>
          <span className="ml-auto text-[10px] opacity-60">{showFps ? 'ON' : 'OFF'}</span>
        </button>

        {/* Inspector Toggle */}
        <button
          onClick={onToggleInspector}
          className={cn(
            'flex items-center gap-2 w-full px-2 py-1 rounded text-xs transition-colors',
            showInspector
              ? 'bg-blue-500/20 text-blue-400'
              : 'hover:bg-white/10 text-white/70'
          )}
        >
          <MousePointer2 className="w-3 h-3" />
          <span>Element Inspector</span>
          <span className="ml-auto text-[10px] opacity-60">{showInspector ? 'ON' : 'OFF'}</span>
        </button>

        {/* Process Info Toggle */}
        <button
          onClick={onToggleProcessInfo}
          className={cn(
            'flex items-center gap-2 w-full px-2 py-1 rounded text-xs transition-colors',
            showProcessInfo
              ? 'bg-purple-500/20 text-purple-400'
              : 'hover:bg-white/10 text-white/70'
          )}
        >
          <Cpu className="w-3 h-3" />
          <span>Process Memory</span>
          <span className="ml-auto text-[10px] opacity-60">{showProcessInfo ? 'ON' : 'OFF'}</span>
        </button>

        {/* Annotation Mode Toggle */}
        <button
          onClick={onToggleAnnotations}
          className={cn(
            'flex items-center gap-2 w-full px-2 py-1 rounded text-xs transition-colors',
            showAnnotations
              ? 'bg-pink-500/20 text-pink-400'
              : 'hover:bg-white/10 text-white/70'
          )}
          title="Click elements to add session-only annotations"
        >
          <MessageSquare className="w-3 h-3" />
          <span>Annotations</span>
          <span className="ml-auto flex items-center gap-1">
            {annotationCount > 0 && (
              <span className="bg-pink-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px]">
                {annotationCount}
              </span>
            )}
            <span className="text-[10px] opacity-60">{showAnnotations ? 'ON' : 'OFF'}</span>
          </span>
        </button>

        {/* Position Cycle */}
        <button
          onClick={cyclePosition}
          className="flex items-center gap-2 w-full px-2 py-1 rounded text-xs hover:bg-white/10 text-white/70 transition-colors"
        >
          <Move className="w-3 h-3" />
          <span>Position</span>
          <span className="ml-auto text-[10px] opacity-60">{position}</span>
        </button>

        {/* Divider */}
        <div className="border-t border-white/10 my-1" />

        {/* Hot Reload Button */}
        <button
          onClick={onHotReload}
          className="flex items-center gap-2 w-full px-2 py-1 rounded text-xs
                         bg-orange-500/20 text-orange-400
                         hover:bg-orange-500/30 transition-colors"
          title="Hot reload (refresh current page)"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Hot Reload</span>
        </button>

        {/* Cold Reload Button */}
        <button
          onMouseDown={onColdReloadStart}
          onMouseUp={onColdReloadCancel}
          onMouseLeave={onColdReloadCancel}
          className={cn(
            'flex items-center gap-2 w-full px-2 py-1 rounded text-xs transition-colors',
            coldReloadActive
              ? 'bg-red-500 text-white animate-pulse'
              : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
          )}
          title="Cold reload (press and hold 2s for full restart)"
        >
          <Power className="w-3 h-3" />
          <span>{coldReloadActive ? `${coldReloadProgress}%` : 'Cold Reload'}</span>
        </button>
      </div>

      {/* Keyboard Shortcut Hint */}
      <div className="px-2 py-1 border-t border-white/10 text-[9px] text-gray-500">
        Ctrl+Shift+D to toggle
      </div>
    </div>
  )
}

// ============================================================================
// Main Debug Overlay Component
// ============================================================================

// Internal state interface
interface DebugOverlayState {
  enabled: boolean
  showFps: boolean
  showInspector: boolean
  showAnnotations: boolean
  position: OverlayPosition
}

/**
 * DebugOverlay - Complete debugging toolkit with FPS, element inspector, and annotations
 * 
 * @param className - Additional CSS classes
 * @param onClose - Callback when debug mode is closed
 * @param getProcessInfo - Optional function to fetch backend process info
 * 
 * @example
 * ```tsx
 * import { DebugOverlay } from '@auto-claude/debugging-tool'
 * 
 * function App() {
 *   return (
 *     <>
 *       <YourApp />
 *       <DebugOverlay />
 *     </>
 *   )
 * }
 * ```
 */
export function DebugOverlay({ className, onClose, getProcessInfo }: DebugOverlayOptions) {
  // Internal state (can be controlled via external state management if needed)
  const [state, setState] = useState<DebugOverlayState>({
    enabled: true,
    showFps: false,
    showInspector: false,
    showAnnotations: false,
    position: 'top-right',
  })
  
  const [minimized, setMinimized] = useState(false)
  const [showProcessInfo, setShowProcessInfo] = useState(false)
  const [coldReloadActive, setColdReloadActive] = useState(false)
  const [coldReloadProgress, setColdReloadProgress] = useState(0)
  const coldReloadTimeoutRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [annotationCount, setAnnotationCount] = useState(0)

  // Get annotations for the count
  const [annotations] = useDebugAnnotations()

  // Update annotation count from annotations
  useState(() => {
    setAnnotationCount(Object.keys(annotations).length)
  })

  const handleClose = useCallback(() => {
    setState((prev) => ({ ...prev, enabled: false }))
    onClose?.()
  }, [onClose])

  const handleToggleFps = useCallback(() => {
    setState((prev) => ({ ...prev, showFps: !prev.showFps }))
  }, [])

  const handleToggleInspector = useCallback(() => {
    setState((prev) => ({ ...prev, showInspector: !prev.showInspector }))
  }, [])

  const handleToggleAnnotations = useCallback(() => {
    setState((prev) => ({ ...prev, showAnnotations: !prev.showAnnotations }))
  }, [])

  const handleChangePosition = useCallback((pos: OverlayPosition) => {
    setState((prev) => ({ ...prev, position: pos }))
  }, [])

  const handleToggleProcessInfo = useCallback(() => {
    setShowProcessInfo((prev) => !prev)
  }, [])

  const handleHotReload = useCallback(() => {
    // Try Vite HMR first, fallback to window reload
    if ((import.meta as { hot?: { invalidate?: () => void } }).hot) {
      (import.meta as { hot: { invalidate: () => void } }).hot.invalidate()
    } else {
      window.location.reload()
    }
  }, [])

  const handleColdReloadStart = useCallback(() => {
    setColdReloadActive(true)
    let progress = 0
    const interval = setInterval(() => {
      progress += 10
      setColdReloadProgress(progress)
      if (progress >= 100) {
        clearInterval(interval)
        window.location.reload()
      }
    }, 200)
    coldReloadTimeoutRef.current = interval
  }, [])

  const handleColdReloadCancel = useCallback(() => {
    if (coldReloadTimeoutRef.current) {
      clearInterval(coldReloadTimeoutRef.current)
      coldReloadTimeoutRef.current = null
    }
    setColdReloadActive(false)
    setColdReloadProgress(0)
  }, [])

  const handleElementSelect = useCallback(
    (element: HTMLElement, info: unknown) => {
      console.log('[Debug] Selected element:', element)
      console.log('[Debug] Element info:', info)
    },
    []
  )

  // Don't render if not enabled
  if (!state.enabled) {
    return null
  }

  return createPortal(
    <div className={cn('debug-overlay', className)} data-debug-overlay>
      {/* FPS Overlay */}
      {state.showFps && (
        <FPSOverlay
          position={state.position}
          showMemory={true}
          showProcessInfo={showProcessInfo}
          getProcessInfo={getProcessInfo}
        />
      )}

      {/* Element Inspector */}
      <ElementInspector
        enabled={state.showInspector}
        onElementSelect={handleElementSelect}
        onDisable={() => setState((prev) => ({ ...prev, showInspector: false }))}
      />

      {/* Mini Control Panel */}
      <MiniControlPanel
        showFps={state.showFps}
        showInspector={state.showInspector}
        showProcessInfo={showProcessInfo}
        showAnnotations={state.showAnnotations}
        annotationCount={Object.keys(annotations).length}
        position={state.position}
        minimized={minimized}
        onToggleFps={handleToggleFps}
        onToggleInspector={handleToggleInspector}
        onToggleProcessInfo={handleToggleProcessInfo}
        onToggleAnnotations={handleToggleAnnotations}
        onChangePosition={handleChangePosition}
        onToggleMinimize={() => setMinimized(!minimized)}
        onClose={handleClose}
        onHotReload={handleHotReload}
        onColdReloadStart={handleColdReloadStart}
        onColdReloadCancel={handleColdReloadCancel}
        coldReloadActive={coldReloadActive}
        coldReloadProgress={coldReloadProgress}
      />

      {/* Annotation System */}
      <AnnotationSystem
        enabled={state.showAnnotations}
        onAnnotationCountChange={setAnnotationCount}
      />
    </div>,
    document.body
  )
}

export default DebugOverlay

// Export utilities
export { createAnnotationsAtom }
