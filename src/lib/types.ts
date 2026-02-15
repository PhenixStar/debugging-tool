/**
 * Position options for debug overlays
 */
export type OverlayPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

/**
 * Annotation status options
 */
export type AnnotationStatus = 'pending' | 'in-progress' | 'resolved' | 'dismissed'

/**
 * Element information extracted by the inspector
 */
export interface ElementInfo {
  tagName: string
  id?: string
  classList: string[]
  dimensions: { width: number; height: number }
  position: { x: number; y: number }
  componentName?: string
  npComment?: string
  uniqueSelector: string
  domPath: string[]
  ariaLabel?: string
  textContent?: string
  role?: string
  dataTestId?: string
}

/**
 * Debug annotation stored in localStorage
 */
export interface DebugAnnotation {
  id: string
  selector: string
  elementInfo: {
    tagName: string
    id?: string
    uniqueSelector: string
    componentName?: string
    textContent?: string
  }
  comment: string
  aiPrompt?: string
  timestamp: number
  status: AnnotationStatus
}

/**
 * Performance statistics from FPS monitor
 */
export interface PerformanceStats {
  fps: number
  frameTime: number
  memory?: {
    usedJSHeapSize: number
    totalJSHeapSize: number
    jsHeapSizeLimit: number
  }
}

/**
 * Process information from backend
 */
export interface ProcessInfo {
  pid: number
  platform: string
  mainProcessMemory?: {
    rss: number
    heapTotal: number
    heapUsed: number
    external: number
  }
}

/**
 * Debug mode configuration options
 */
export interface DebugModeConfig {
  enabled: boolean
  showFpsOverlay: boolean
  showElementInspector: boolean
  showAnnotations: boolean
  overlayPosition: OverlayPosition
}

/**
 * Hook options for FPS overlay
 */
export interface FPSOverlayOptions {
  position?: OverlayPosition
  showMemory?: boolean
  showProcessInfo?: boolean
  className?: string
  /**
   * Optional function to fetch process info from backend
   * If not provided, only browser memory is shown
   */
  getProcessInfo?: () => Promise<ProcessInfo | null>
}

/**
 * Hook options for Element Inspector
 */
export interface ElementInspectorOptions {
  enabled: boolean
  onElementSelect?: (element: HTMLElement, info: ElementInfo) => void
  onDisable?: () => void
  className?: string
}

/**
 * Hook options for Annotation System
 */
export interface AnnotationSystemOptions {
  enabled: boolean
  onAnnotationCountChange?: (count: number) => void
  /**
   * Custom storage key for localStorage
   * @default "debug:annotations"
   */
  storageKey?: string
}

/**
 * Debug overlay hook options
 */
export interface DebugOverlayOptions {
  className?: string
  /**
   * Callback when debug mode should be disabled
   * If not provided, DebugOverlay manages its own state
   */
  onClose?: () => void
  /**
   * Optional function to get process info (for FPS overlay)
   */
  getProcessInfo?: () => Promise<ProcessInfo | null>
}
