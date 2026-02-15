/**
 * Annotation System Component
 * Persistent element comments stored in localStorage
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { cn, generateId } from '../lib/utils'
import type { AnnotationSystemOptions, DebugAnnotation } from '../lib/types'

// ============================================================================
// Types
// ============================================================================

interface AnnotationDialogProps {
  element: HTMLElement
  elementInfo: {
    tagName: string
    id?: string
    uniqueSelector: string
    componentName?: string
    textContent?: string
  }
  onSave: (annotation: DebugAnnotation) => void
  onClose: () => void
}

// ============================================================================
// Utility Functions
// ============================================================================

function generateAIPrompt(elementInfo: AnnotationDialogProps['elementInfo'], comment: string): string {
  return `// #NP-DEBUG - Session-only fix request
// Element: ${elementInfo.uniqueSelector}
// React Component: ${elementInfo.componentName || 'Unknown'}
// Text Content: ${elementInfo.textContent || 'N/A'}

// User Request:
// ${comment}

// Generated AI Task:
// Fix the behavior of the component at "${elementInfo.uniqueSelector}".
// Current issue: ${comment}
// Expected behavior: [To be implemented]

/* #NP-DEBUG-START
This is a session-only annotation. Changes should be tested in current session
before committing to main codebase.
#NP-DEBUG-END */`
}

function formatExport(annotations: DebugAnnotation[]): string {
  let output = `// Debug Annotations Export - ${new Date().toISOString()}\n`
  output += `// Total annotations: ${annotations.length}\n\n`

  annotations.forEach((anno, index) => {
    output += `// [${index + 1}] ${anno.selector}\n`
    output += `// Component: ${anno.elementInfo.componentName || 'Unknown'}\n`
    output += `// Comment: ${anno.comment}\n`
    output += `// Generated Prompt:\n${anno.aiPrompt}\n`
    output += `// ----------------------------------------\n\n`
  })

  return output
}

// ============================================================================
// Annotation Dialog Component
// ============================================================================

function AnnotationDialog({
  element,
  elementInfo,
  onSave,
  onClose,
}: AnnotationDialogProps) {
  const [comment, setComment] = useState('')
  const [copied, setCopied] = useState(false)

  const aiPrompt = useMemo(
    () => (comment ? generateAIPrompt(elementInfo, comment) : ''),
    [elementInfo, comment]
  )

  const handleSave = () => {
    if (!comment.trim()) return

    onSave({
      id: generateId(),
      selector: elementInfo.uniqueSelector,
      elementInfo,
      comment,
      aiPrompt,
      timestamp: Date.now(),
      status: 'pending',
    })
  }

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(aiPrompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return createPortal(
    <div
      data-debug-annotation
      className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-black/95 rounded-lg p-4 shadow-2xl border border-blue-500/50 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-blue-400">
            Add Debug Annotation
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded transition-colors text-white/60 hover:text-white"
            title="Close (ESC)"
          >
            ✕
          </button>
        </div>

        {/* Element Info */}
        <div className="bg-white/5 rounded p-2 mb-3">
          <div className="text-[10px] text-gray-400 mb-1">
            Element Selector:
          </div>
          <div className="font-mono text-[9px] text-yellow-300 break-all">
            {elementInfo.uniqueSelector}
          </div>
          {elementInfo.componentName && (
            <div className="text-[10px] text-gray-400 mt-1">
              Component: <span className="text-cyan-400">{elementInfo.componentName}</span>
            </div>
          )}
        </div>

        {/* Comment Input */}
        <div className="mb-3">
          <label className="text-[10px] text-gray-400 mb-1 block">
            Describe the issue or desired change:
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="e.g., This button should be disabled when form is invalid..."
            className="w-full bg-white/5 rounded p-2 text-xs border border-white/10
                       focus:border-blue-500/50 focus:outline-none resize-none
                       focus:bg-white/10 transition-colors text-white"
            rows={3}
            autoFocus
          />
        </div>

        {/* Generated AI Prompt */}
        {comment && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <div className="text-[10px] text-gray-400">
                Generated AI Prompt:
              </div>
              <button
                onClick={handleCopyPrompt}
                className={cn(
                  'text-[9px] px-2 py-0.5 rounded transition-colors',
                  copied
                    ? 'bg-green-500 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                )}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="text-[9px] bg-white/5 rounded p-2 overflow-auto max-h-32 text-green-300 border border-white/10">
              {aiPrompt}
            </pre>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={!comment.trim()}
            className={cn(
              'flex-1 px-3 py-2 text-xs rounded transition-colors',
              comment.trim()
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-white/10 text-white/40 cursor-not-allowed'
            )}
          >
            Save for Session
          </button>
          <button
            onClick={() => {
              const exportText = formatExport([
                {
                  id: 'temp',
                  selector: elementInfo.uniqueSelector,
                  elementInfo,
                  comment,
                  aiPrompt,
                  timestamp: Date.now(),
                  status: 'pending',
                },
              ])
              navigator.clipboard.writeText(exportText)
              setCopied(true)
              setTimeout(() => setCopied(false), 1500)
            }}
            disabled={!comment.trim()}
            className={cn(
              'flex-1 px-3 py-2 text-xs rounded transition-colors',
              comment.trim()
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-white/10 text-white/40 cursor-not-allowed'
            )}
            title="Copy formatted annotation to send to developer"
          >
            {copied ? 'Copied!' : 'Export'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-white/60 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>

        {/* Hint */}
        <div className="text-[9px] text-gray-500 text-center mt-3">
          Annotations persist across sessions via localStorage
        </div>
      </div>
    </div>,
    document.body
  )
}

// ============================================================================
// Annotation Badge Component
// ============================================================================

interface AnnotationBadgeProps {
  count: number
  position: { x: number; y: number; width: number }
}

function AnnotationBadge({ count, position }: AnnotationBadgeProps) {
  return (
    <div
      data-debug-annotation
      className="fixed z-[9997] pointer-events-none bg-blue-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold shadow-lg"
      style={{
        left: position.x + position.width - 12,
        top: position.y - 8,
      }}
    >
    {count}
    </div>
  )
}

// ============================================================================
// Main Annotation System Component
// ============================================================================

/**
 * Create a custom annotations atom with configurable storage key
 */
export function createAnnotationsAtom(storageKey: string) {
  return atomWithStorage<Record<string, DebugAnnotation>>(
    storageKey,
    {},
    undefined,
    { getOnInit: true }
  )
}

// Default storage key
const DEFAULT_STORAGE_KEY = 'debug:annotations'

// Default atom (created lazily)
let defaultAnnotationsAtom: ReturnType<typeof createAnnotationsAtom> | null = null

function getDefaultAnnotationsAtom() {
  if (!defaultAnnotationsAtom) {
    defaultAnnotationsAtom = createAnnotationsAtom(DEFAULT_STORAGE_KEY)
  }
  return defaultAnnotationsAtom
}

/**
 * Hook to access debug annotations
 * @param customAtom - Optional custom atom (for using custom storage key)
 */
export function useDebugAnnotations(customAtom?: ReturnType<typeof createAnnotationsAtom>) {
  const atom = customAtom || getDefaultAnnotationsAtom()
  return useAtom(atom)
}

/**
 * AnnotationSystem - Click-to-annotate functionality
 * 
 * @param enabled - Whether annotation mode is active
 * @param onAnnotationCountChange - Callback when annotation count changes
 * @param storageKey - Custom localStorage key
 * @param customAtom - Custom Jotai atom (bypasses storageKey if provided)
 */
export function AnnotationSystem({
  enabled,
  onAnnotationCountChange,
  storageKey,
  customAtom,
}: AnnotationSystemOptions & { customAtom?: ReturnType<typeof createAnnotationsAtom> }) {
  // Use custom atom if provided, otherwise create/use default
  const [annotations, setAnnotations] = useDebugAnnotations(
    customAtom || (storageKey ? createAnnotationsAtom(storageKey) : undefined)
  )
  
  const [dialogElement, setDialogElement] = useState<HTMLElement | null>(null)
  const [dialogElementInfo, setDialogElementInfo] = useState<
    AnnotationDialogProps['elementInfo'] | null
  >(null)

  const handleClick = useCallback(
    (e: MouseEvent) => {
      if (!enabled) return

      const target = e.target as HTMLElement
      if (!target || target.closest('[data-debug-annotation]')) return

      const elementInfo = {
        tagName: target.tagName.toLowerCase(),
        id: target.id || undefined,
        uniqueSelector: target.id
          ? `#${target.id}`
          : `${target.tagName.toLowerCase()}${target.className ? '.' + Array.from(target.classList).slice(0, 2).join('.') : ''}`,
        componentName: undefined,
        textContent: target.textContent?.trim()?.slice(0, 50) || undefined,
      }

      setDialogElement(target)
      setDialogElementInfo(elementInfo)
    },
    [enabled]
  )

  const handleSaveAnnotation = useCallback(
    (annotation: DebugAnnotation) => {
      setAnnotations((prev) => {
        const next = { ...prev, [annotation.id]: annotation }
        onAnnotationCountChange?.(Object.keys(next).length)
        return next
      })
      setDialogElement(null)
      setDialogElementInfo(null)
    },
    [setAnnotations, onAnnotationCountChange]
  )

  useEffect(() => {
    if (!enabled) {
      setDialogElement(null)
      setDialogElementInfo(null)
      return
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [enabled, handleClick])

  const annotationCounts = useMemo(() => {
    const counts = new Map<string, number>()
    Object.values(annotations).forEach((anno) => {
      const count = counts.get(anno.selector) || 0
      counts.set(anno.selector, count + 1)
    })
    return counts
  }, [annotations])

  return (
    <>
      {/* Annotation Dialog */}
      {enabled && dialogElement && dialogElementInfo && (
        <AnnotationDialog
          element={dialogElement}
          elementInfo={dialogElementInfo}
          onSave={handleSaveAnnotation}
          onClose={() => {
            setDialogElement(null)
            setDialogElementInfo(null)
          }}
        />
      )}

      {/* Annotation Badges */}
      {enabled &&
        Array.from(annotationCounts.entries()).map(([selector, count]) => {
          const element = document.querySelector(selector) as HTMLElement
          if (!element) return null
          const rect = element.getBoundingClientRect()
          return (
            <AnnotationBadge
              key={selector}
              count={count}
              position={{ x: rect.left, y: rect.top, width: rect.width }}
            />
          )
        })}
    </>
  )
}

export default AnnotationSystem
