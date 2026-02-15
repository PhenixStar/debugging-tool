/**
 * Annotations Dashboard Component
 * Displays all debug annotations with filtering, status tracking, and export
 */

import { useMemo, useState } from 'react'
import { cn } from '../lib/utils'
import type { AnnotationStatus, DebugAnnotation } from '../lib/types'

// ============================================================================
// Constants
// ============================================================================

const STATUS_OPTIONS = ['pending', 'in-progress', 'resolved', 'dismissed'] as const

const STATUS_CONFIG: Record<AnnotationStatus, { label: string; color: string; icon: string }> = {
  pending: { label: 'Pending', color: 'text-yellow-400 bg-yellow-500/10', icon: '⏳' },
  'in-progress': { label: 'In Progress', color: 'text-blue-400 bg-blue-500/10', icon: '🔧' },
  resolved: { label: 'Resolved', color: 'text-green-400 bg-green-500/10', icon: '✅' },
  dismissed: { label: 'Dismissed', color: 'text-zinc-400 bg-zinc-500/10', icon: '❌' },
}

const FILTER_OPTIONS = ['all', ...STATUS_OPTIONS] as const
type FilterOption = (typeof FILTER_OPTIONS)[number]

// ============================================================================
// Export Utilities
// ============================================================================

function exportAsJson(annotations: DebugAnnotation[]): string {
  return JSON.stringify(annotations, null, 2)
}

function exportAsMarkdown(annotations: DebugAnnotation[]): string {
  if (annotations.length === 0) return '# Debug Annotations\n\nNo annotations found.'
  let md = `# Debug Annotations\n\n_Exported: ${new Date().toLocaleString()}_\n_Total: ${annotations.length}_\n\n---\n\n`
  for (const anno of annotations) {
    const cfg = STATUS_CONFIG[anno.status]
    const date = new Date(anno.timestamp).toLocaleString()
    md += `## ${cfg.icon} ${anno.elementInfo.uniqueSelector}\n\n`
    md += `- **Status:** ${cfg.label}\n`
    md += `- **Component:** ${anno.elementInfo.componentName || 'Unknown'}\n`
    md += `- **Created:** ${date}\n\n`
    md += `> ${anno.comment}\n\n`
    if (anno.aiPrompt) md += '```\n' + anno.aiPrompt + '\n```\n\n'
    md += '---\n\n'
  }
  return md
}

// ============================================================================
// Dashboard Component
// ============================================================================

interface AnnotationsDashboardProps {
  annotations: Record<string, DebugAnnotation>
  onUpdateAnnotations: (annotations: Record<string, DebugAnnotation>) => void
  onToast?: (message: string, description?: string) => void
}

/**
 * AnnotationsDashboard - Manage and view all debug annotations
 * 
 * @param annotations - Current annotations object
 * @param onUpdateAnnotations - Callback to update annotations
 * @param onToast - Optional toast notification function
 */
export function AnnotationsDashboard({
  annotations,
  onUpdateAnnotations,
  onToast,
}: AnnotationsDashboardProps) {
  const [filter, setFilter] = useState<FilterOption>('all')

  const annotationList = useMemo(() => {
    const list = Object.values(annotations).sort((a, b) => b.timestamp - a.timestamp)
    if (filter === 'all') return list
    return list.filter((a) => a.status === filter)
  }, [annotations, filter])

  const counts = useMemo(() => {
    const all = Object.values(annotations)
    return {
      all: all.length,
      pending: all.filter((a) => a.status === 'pending').length,
      'in-progress': all.filter((a) => a.status === 'in-progress').length,
      resolved: all.filter((a) => a.status === 'resolved').length,
      dismissed: all.filter((a) => a.status === 'dismissed').length,
    }
  }, [annotations])

  const updateStatus = (id: string, status: AnnotationStatus) => {
    onUpdateAnnotations({
      ...annotations,
      [id]: { ...annotations[id], status },
    })
  }

  const deleteAnnotation = (id: string) => {
    const next = { ...annotations }
    delete next[id]
    onUpdateAnnotations(next)
    onToast?.('Annotation deleted')
  }

  const clearAll = () => {
    if (!confirm('Clear all annotations? This cannot be undone.')) return
    onUpdateAnnotations({})
    onToast?.('All annotations cleared')
  }

  const handleExport = (format: 'json' | 'markdown') => {
    const list = Object.values(annotations).sort((a, b) => b.timestamp - a.timestamp)
    const content = format === 'json' ? exportAsJson(list) : exportAsMarkdown(list)
    navigator.clipboard.writeText(content)
    onToast?.(`Copied ${format.toUpperCase()} to clipboard`, `${list.length} annotation(s) exported`)
  }

  if (Object.keys(annotations).length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <div className="text-2xl mb-2">📝</div>
        <p className="text-sm">No debug annotations yet</p>
        <p className="text-xs mt-1 text-gray-500">Enable Debug Mode (Ctrl+Shift+D) and use the annotation tool to add comments</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          <button 
            onClick={() => handleExport('json')} 
            className="text-[10px] px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 transition-colors text-white"
          >
            Export JSON
          </button>
          <button 
            onClick={() => handleExport('markdown')} 
            className="text-[10px] px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 transition-colors text-white"
          >
            Export MD
          </button>
        </div>
        <button 
          onClick={clearAll} 
          className="text-[10px] px-2 py-1 rounded text-red-400 hover:bg-red-500/10 transition-colors"
        >
          Clear All
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex gap-1 flex-wrap">
        {FILTER_OPTIONS.map((opt) => {
          const count = counts[opt as keyof typeof counts]
          return (
            <button
              key={opt}
              onClick={() => setFilter(opt)}
              className={cn(
                'text-[10px] px-2 py-1 rounded transition-colors',
                filter === opt 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600',
              )}
            >
              {opt === 'all' ? 'All' : STATUS_CONFIG[opt as AnnotationStatus].label} ({count})
            </button>
          )
        })}
      </div>

      {/* Annotation list */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        {annotationList.map((anno) => {
          const cfg = STATUS_CONFIG[anno.status]
          return (
            <div key={anno.id} className="rounded-lg border border-gray-700 bg-gray-800/50 p-3 space-y-2">
              {/* Top row: selector + status */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-mono text-[10px] text-yellow-300 truncate" title={anno.elementInfo.uniqueSelector}>
                    {anno.elementInfo.uniqueSelector}
                  </div>
                  {anno.elementInfo.componentName && (
                    <div className="text-[10px] text-cyan-400">{anno.elementInfo.componentName}</div>
                  )}
                </div>
                <select
                  value={anno.status}
                  onChange={(e) => updateStatus(anno.id, e.target.value as AnnotationStatus)}
                  className={cn('text-[10px] px-1.5 py-0.5 rounded border-0 cursor-pointer', cfg.color)}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{STATUS_CONFIG[s].icon} {STATUS_CONFIG[s].label}</option>
                  ))}
                </select>
              </div>

              {/* Comment */}
              <p className="text-xs text-gray-200">{anno.comment}</p>

              {/* Footer: date + delete */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-500">
                  {new Date(anno.timestamp).toLocaleDateString()} {new Date(anno.timestamp).toLocaleTimeString()}
                </span>
                <button
                  onClick={() => deleteAnnotation(anno.id)}
                  className="text-[10px] text-red-400/60 hover:text-red-400 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filtered empty state */}
      {annotationList.length === 0 && (
        <div className="text-center py-4 text-gray-500 text-xs">
          No annotations match "{filter}" filter
        </div>
      )}
    </div>
  )
}

export default AnnotationsDashboard
