/**
 * @auto-claude/debugging-tool
 * A comprehensive debugging toolkit for React applications
 * 
 * Features:
 * - FPS overlay with memory monitoring
 * - Element inspector with CSS selector generation
 * - Click-to-annotate system with localStorage persistence
 * - Annotations dashboard for management
 * 
 * @version 1.0.0
 */

// ============================================================================
// Main Exports
// ============================================================================

export { DebugOverlay, createAnnotationsAtom } from './components/DebugOverlay'
export { FPSOverlay } from './components/FPSOverlay'
export { ElementInspector } from './components/ElementInspector'
export { AnnotationSystem, useDebugAnnotations, createAnnotationsAtom as createDebugAnnotationsAtom } from './components/AnnotationSystem'
export { AnnotationsDashboard } from './components/AnnotationsDashboard'

// ============================================================================
// Types Exports
// ============================================================================

export type {
  OverlayPosition,
  AnnotationStatus,
  ElementInfo,
  DebugAnnotation,
  PerformanceStats,
  ProcessInfo,
  DebugModeConfig,
  FPSOverlayOptions,
  ElementInspectorOptions,
  AnnotationSystemOptions,
  DebugOverlayOptions,
} from './lib/types'
