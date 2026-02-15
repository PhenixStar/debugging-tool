import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: [
    'react',
    'react-dom',
    'jotai',
    'jotai/utils',
    'lucide-react',
    'clsx',
    'tailwind-merge',
    'class-variance-authority'
  ],
  banner: {
    js: `/**
 * @auto-claude/debugging-tool
 * A comprehensive debugging toolkit for React applications
 * 
 * @version 1.0.0
 */
`
  }
})
