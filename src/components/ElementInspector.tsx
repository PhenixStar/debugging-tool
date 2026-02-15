/**
 * Element Inspector Component
 * Hover highlighting and element info display for DOM inspection
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../lib/utils'
import type { ElementInfo, ElementInspectorOptions } from '../lib/types'

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Extract React component name from fiber internals
 */
function getReactFiberName(element: HTMLElement): string | undefined {
  const fiberKey = Object.keys(element).find(
    (key) => key.startsWith('__reactFiber$') || key.startsWith('__reactInternalInstance$')
  )

  if (!fiberKey) return undefined

  try {
    let fiber = (element as unknown as Record<string, unknown>)[fiberKey]
    while (fiber) {
      const name = (fiber as { type?: { displayName?: string; name?: string } }).type?.displayName || (fiber as { type?: { name?: string } }).type?.name
      if (name && !name.startsWith('_') && name !== 'div' && name !== 'span') {
        return name
      }
      fiber = (fiber as { return?: unknown }).return as typeof fiber
    }
  } catch {
    // Ignore errors
  }

  return undefined
}

/**
 * Extract #NP comments from element
 */
function extractNPComment(element: HTMLElement): string | undefined {
  const npData = (element as HTMLElement & { dataset?: Record<string, string> }).dataset?.np || element.getAttribute('data-np')
  if (npData) return npData

  let parent = element.parentElement
  let depth = 0
  while (parent && depth < 3) {
    const parentNp = (parent as HTMLElement & { dataset?: Record<string, string> }).dataset?.np || parent.getAttribute('data-np')
    if (parentNp) return parentNp
    parent = parent.parentElement
    depth++
  }

  return undefined
}

/**
 * Generate unique CSS selector for an element
 */
function generateUniqueSelector(element: HTMLElement): string {
  if (element.id) {
    return `#${element.id}`
  }

  const testId = element.getAttribute('data-testid')
  if (testId) {
    return `[data-testid="${testId}"]`
  }

  const npData = (element as HTMLElement & { dataset?: Record<string, string> }).dataset?.np
  if (npData) {
    return `[data-np="${npData}"]`
  }

  const path: string[] = []
  let current: HTMLElement | null = element

  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase()

    if (current.id) {
      selector = `#${current.id}`
      path.unshift(selector)
      break
    }

    if (current.className && typeof current.className === 'string') {
      const classes = Array.from(current.classList)
      if (classes.length > 0) {
        selector += '.' + classes.slice(0, 2).join('.')
      }
    }

    const siblings = Array.from(current.parentElement?.children || [])
    const index = siblings.indexOf(current)
    if (index >= 0) {
      selector += `:nth-child(${index + 1})`
    }

    path.unshift(selector)
    current = current.parentElement

    if (path.length > 10) break
  }

  return path.join(' > ')
}

/**
 * Extract DOM path for element
 */
function getDomPath(element: HTMLElement): string[] {
  const path: string[] = []
  let current: HTMLElement | null = element

  while (current && current !== document.body) {
    let part = current.tagName.toLowerCase()
    if (current.id) {
      part += `#${current.id}`
    }
    path.unshift(part)
    current = current.parentElement

    if (path.length > 8) break
  }

  return path
}

/**
 * Extract text content for interactive elements
 */
function extractTextContent(element: HTMLElement): string | undefined {
  const text = element.textContent?.trim()
  if (!text) return undefined
  if (text.length > 50) {
    return text.slice(0, 47) + '...'
  }
  return text
}

/**
 * Get comprehensive element information
 */
function getElementInfo(element: HTMLElement): ElementInfo {
  const rect = element.getBoundingClientRect()

  return {
    tagName: element.tagName.toLowerCase(),
    id: element.id || undefined,
    classList: Array.from(element.classList),
    dimensions: {
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    },
    position: {
      x: Math.round(rect.left),
      y: Math.round(rect.top),
    },
    componentName: getReactFiberName(element),
    npComment: extractNPComment(element),
    uniqueSelector: generateUniqueSelector(element),
    domPath: getDomPath(element),
    ariaLabel: element.getAttribute('aria-label') || undefined,
    textContent: extractTextContent(element),
    role: element.getAttribute('role') || undefined,
    dataTestId: element.getAttribute('data-testid') || undefined,
  }
}

// ============================================================================
// Element Inspector Component
// ============================================================================

/**
 * ElementInspector - Inspect DOM elements with hover highlighting
 * 
 * @param enabled - Whether the inspector is active
 * @param onElementSelect - Callback when element is clicked
 * @param onDisable - Callback when inspector should be disabled (ESC key)
 * @param className - Additional CSS classes
 */
export function ElementInspector({
  enabled,
  onElementSelect,
  onDisable,
  className,
}: ElementInspectorOptions) {
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null)
  const [elementInfo, setElementInfo] = useState<ElementInfo | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const overlayRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!enabled) return

      const elementsAtPoint = document.elementsFromPoint(e.clientX, e.clientY)
      const targetElement = elementsAtPoint.find(
        (el) =>
          !el.closest('[data-debug-inspector]') &&
          el !== document.documentElement &&
          el !== document.body
      ) as HTMLElement | undefined

      if (targetElement && targetElement !== hoveredElement) {
        setHoveredElement(targetElement)
        setElementInfo(getElementInfo(targetElement))
      }

      setTooltipPosition({
        x: e.clientX + 15,
        y: e.clientY + 15,
      })
    },
    [enabled, hoveredElement]
  )

  const handleClick = useCallback(
    (e: MouseEvent) => {
      if (!enabled || !hoveredElement || !elementInfo) return

      e.preventDefault()
      e.stopPropagation()

      onElementSelect?.(hoveredElement, elementInfo)
    },
    [enabled, hoveredElement, elementInfo, onElementSelect]
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && enabled) {
        setHoveredElement(null)
        setElementInfo(null)
        onDisable?.()
      }
    },
    [enabled, onDisable]
  )

  useEffect(() => {
    if (!enabled) {
      setHoveredElement(null)
      setElementInfo(null)
      return
    }

    document.addEventListener('mousemove', handleMouseMove, true)
    document.addEventListener('click', handleClick, true)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove, true)
      document.removeEventListener('click', handleClick, true)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [enabled, handleMouseMove, handleClick, handleKeyDown])

  if (!enabled) return null

  const rect = hoveredElement?.getBoundingClientRect()

  return createPortal(
    <div data-debug-inspector className={className}>
      {/* Highlight Overlay */}
      {hoveredElement && rect && (
        <div
          ref={overlayRef}
          className="fixed pointer-events-none z-[9998] border-2 border-blue-500 bg-blue-500/10"
          style={{
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
          }}
        >
          <div className="absolute -top-5 left-0 bg-blue-500 text-white text-[10px] px-1 rounded-sm whitespace-nowrap">
            {elementInfo?.dimensions.width} × {elementInfo?.dimensions.height}
          </div>
        </div>
      )}

      {/* Element Info Tooltip */}
      {hoveredElement && elementInfo && (
        <div
          className="fixed z-[9999] pointer-events-none bg-black/90 backdrop-blur-sm rounded-lg p-2 shadow-xl border border-white/10 max-w-xs"
          style={{
            left: Math.min(tooltipPosition.x, window.innerWidth - 280),
            top: Math.min(tooltipPosition.y, window.innerHeight - 200),
          }}
        >
          {/* Tag Name */}
          <div className="font-mono text-xs">
            <span className="text-purple-400">&lt;{elementInfo.tagName}</span>
            {elementInfo.id && (
              <span className="text-yellow-400"> id="{elementInfo.id}"</span>
            )}
            <span className="text-purple-400">&gt;</span>
          </div>

          {/* React Component Name */}
          {elementInfo.componentName && (
            <div className="text-xs mt-1">
              <span className="text-gray-400">Component: </span>
              <span className="text-cyan-400">{elementInfo.componentName}</span>
            </div>
          )}

          {/* Classes */}
          {elementInfo.classList.length > 0 && (
            <div className="text-[10px] mt-1 text-gray-500 truncate max-w-[260px]">
              .{elementInfo.classList.slice(0, 5).join(' .')}
              {elementInfo.classList.length > 5 && ` (+${elementInfo.classList.length - 5})`}
            </div>
          )}

          {/* NP Comment */}
          {elementInfo.npComment && (
            <div className="text-[10px] mt-1 text-green-400 border-t border-white/10 pt-1">
              #NP: {elementInfo.npComment}
            </div>
          )}

          {/* Unique Selector */}
          <div className="text-[9px] mt-1 border-t border-white/10 pt-1">
            <div className="text-gray-500 mb-0.5">Selector:</div>
            <div className="font-mono text-yellow-300 break-all">
              {elementInfo.uniqueSelector}
            </div>
          </div>

          {/* Text Content */}
          {elementInfo.textContent && (
            <div className="text-[10px] mt-1">
              <span className="text-gray-400">Text: </span>
              <span className="text-white/80">"{elementInfo.textContent}"</span>
            </div>
          )}

          {/* Accessibility Info */}
          {(elementInfo.ariaLabel || elementInfo.role) && (
            <div className="text-[10px] mt-1 text-gray-500">
              {elementInfo.role && <span>Role: {elementInfo.role}</span>}
              {elementInfo.ariaLabel && (
                <span title={elementInfo.ariaLabel}>
                  {elementInfo.role ? ' • ' : ''}Label: "{elementInfo.ariaLabel.slice(0, 20)}{elementInfo.ariaLabel.length > 20 ? '...' : ''}"
                </span>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="text-[10px] mt-2 text-gray-500 border-t border-white/10 pt-1">
            Click to select • ESC to cancel
          </div>
        </div>
      )}
    </div>,
    document.body
  )
}

export default ElementInspector
