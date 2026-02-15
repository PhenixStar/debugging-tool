import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility function to merge class names with tailwind-merge support
 * @param inputs - ClassValue arguments to merge
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format bytes to human readable string
 * @param bytes - Number of bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Get color class based on FPS value
 * @param fps - Frames per second value
 * @returns Tailwind color class
 */
export function getFpsColor(fps: number): string {
  if (fps >= 55) return 'text-green-400'
  if (fps >= 30) return 'text-yellow-400'
  return 'text-red-400'
}

/**
 * Generate unique ID for annotations
 * @returns Unique ID string
 */
export function generateId(): string {
  return `anno-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Position styles for overlays
 */
export const POSITION_STYLES: Record<string, string> = {
  'top-left': 'top-2 left-2',
  'top-right': 'top-2 right-2',
  'bottom-left': 'bottom-2 left-2',
  'bottom-right': 'bottom-2 right-2',
}
