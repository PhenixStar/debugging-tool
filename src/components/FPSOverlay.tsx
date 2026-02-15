/**
 * FPS Overlay Component
 * Real-time frame rate and memory usage display
 */

import { useEffect, useRef, useState } from 'react'
import { cn, formatBytes, getFpsColor, POSITION_STYLES } from '../lib/utils'
import type { FPSOverlayOptions, PerformanceStats, ProcessInfo } from '../lib/types'

/**
 * FPS Overlay - Displays real-time FPS and memory statistics
 * 
 * @param position - Position of the overlay
 * @param showMemory - Whether to show memory stats
 * @param showProcessInfo - Whether to show expanded process memory
 * @param className - Additional CSS classes
 * @param getProcessInfo - Optional function to fetch backend process info
 */
export function FPSOverlay({
  position = 'top-right',
  showMemory = true,
  showProcessInfo = false,
  className,
  getProcessInfo,
}: FPSOverlayOptions) {
  const [stats, setStats] = useState<PerformanceStats>({
    fps: 0,
    frameTime: 0,
  })

  const [processInfo, setProcessInfo] = useState<ProcessInfo | null>(null)

  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(performance.now())
  const rafIdRef = useRef<number | null>(null)

  // Fetch process info periodically if backend function is provided
  useEffect(() => {
    if (!getProcessInfo || !showProcessInfo) {
      setProcessInfo(null)
      return
    }

    const fetchProcessInfo = async () => {
      try {
        const info = await getProcessInfo()
        setProcessInfo(info)
      } catch (error) {
        console.warn('[Debug] Failed to fetch process info:', error)
      }
    }

    fetchProcessInfo()
    const interval = setInterval(fetchProcessInfo, 2000)

    return () => clearInterval(interval)
  }, [getProcessInfo, showProcessInfo])

  // Measure FPS
  useEffect(() => {
    let frameCount = 0
    let lastTime = performance.now()

    const measureFPS = (currentTime: number) => {
      frameCount++

      const elapsed = currentTime - lastTime
      if (elapsed >= 1000) {
        const fps = Math.round((frameCount * 1000) / elapsed)
        const frameTime = elapsed / frameCount

        const memory = (performance as unknown as { memory?: PerformanceStats['memory'] }).memory
          ? {
              usedJSHeapSize: (performance as unknown as { memory: { usedJSHeapSize: number } }).memory.usedJSHeapSize,
              totalJSHeapSize: (performance as unknown as { memory: { totalJSHeapSize: number } }).memory.totalJSHeapSize,
              jsHeapSizeLimit: (performance as unknown as { memory: { jsHeapSizeLimit: number } }).memory.jsHeapSizeLimit,
            }
          : undefined

        setStats({ fps, frameTime, memory })

        frameCount = 0
        lastTime = currentTime
      }

      rafIdRef.current = requestAnimationFrame(measureFPS)
    }

    rafIdRef.current = requestAnimationFrame(measureFPS)

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [])

  return (
    <div
      className={cn(
        'fixed z-[9999] pointer-events-none',
        'bg-black/80 backdrop-blur-sm rounded-md px-2 py-1.5',
        'font-mono text-xs shadow-lg border border-white/10',
        POSITION_STYLES[position],
        className
      )}
    >
      {/* FPS Display */}
      <div className="flex items-center gap-2">
        <span className="text-gray-400">FPS:</span>
        <span className={cn('font-semibold', getFpsColor(stats.fps))}>
          {stats.fps}
        </span>
        <span className="text-gray-500 text-[10px]">
          ({stats.frameTime.toFixed(1)}ms)
        </span>
      </div>

      {/* Memory Display */}
      {showMemory && stats.memory && (
        <>
          {!showProcessInfo && (
            <div className="flex items-center gap-2 mt-0.5 text-[10px]">
              <span className="text-gray-400">MEM:</span>
              <span className="text-blue-400">
                {formatBytes(stats.memory.usedJSHeapSize)}
              </span>
              <span className="text-gray-500">
                / {formatBytes(stats.memory.totalJSHeapSize)}
              </span>
            </div>
          )}

          {/* Expanded process memory breakdown */}
          {showProcessInfo && (
            <div className="mt-1 border-t border-white/10 pt-1">
              <div className="text-[9px] text-gray-400 mb-1 flex items-center gap-1">
                <span>PROCESS MEMORY</span>
                {processInfo && (
                  <span className="text-white/40">PID: {processInfo.pid}</span>
                )}
              </div>

              {/* Renderer Process (JS Heap) */}
              <div className="flex justify-between text-[10px]">
                <span className="text-cyan-400">Renderer (JS)</span>
                <span className="text-cyan-300">
                  {formatBytes(stats.memory.usedJSHeapSize)}
                </span>
              </div>

              {/* Main Process (Node.js) */}
              {processInfo?.mainProcessMemory && (
                <div className="flex justify-between text-[10px]">
                  <span className="text-green-400">Main (Node)</span>
                  <span className="text-green-300">
                    {formatBytes(processInfo.mainProcessMemory.rss)}
                  </span>
                </div>
              )}

              {/* Total Memory */}
              {processInfo?.mainProcessMemory && (
                <div className="flex justify-between text-[10px] font-semibold border-t border-white/10 mt-0.5 pt-0.5">
                  <span className="text-white">Total</span>
                  <span className="text-yellow-400">
                    {formatBytes(
                      stats.memory.usedJSHeapSize + processInfo.mainProcessMemory.rss
                    )}
                  </span>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default FPSOverlay
