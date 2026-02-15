# @auto-claude/debugging-tool

A comprehensive debugging toolkit for React applications with FPS monitoring, element inspection, and annotation features.

## Features

- **FPS Overlay** - Real-time frame rate and memory usage monitoring
- **Element Inspector** - Hover over elements to see detailed info, React component names, and generated CSS selectors
- **Annotation System** - Click elements to add persistent notes with AI prompt generation
- **Annotations Dashboard** - Manage, filter, and export annotations

## Installation

```bash
npm install @auto-claude/debugging-tool
# or
yarn add @auto-claude/debugging-tool
```

## Peer Dependencies

This package requires the following peer dependencies:

```bash
npm install react react-dom jotai jotai/utils lucide-react clsx tailwind-merge class-variance-authority
```

## Quick Start

```tsx
import { DebugOverlay } from '@auto-claude/debugging-tool'
import '@auto-claude/debugging-tool/styles' // Optional: minimal styles

function App() {
  return (
    <>
      <YourApp />
      <DebugOverlay />
    </>
  )
}
```

## Usage

### Basic Usage

Simply drop the `DebugOverlay` component anywhere in your app:

```tsx
import { DebugOverlay } from '@auto-claude/debugging-tool'

function App() {
  return (
    <>
      <YourApp />
      <DebugOverlay />
    </>
  )
}
```

### With Custom Process Info (for Electron apps)

```tsx
import { DebugOverlay } from '@auto-claude/debugging-tool'

function App() {
  // Optional: fetch process info from backend
  const getProcessInfo = async () => {
    const response = await fetch('/api/process-info')
    return response.json()
  }

  return (
    <>
      <YourApp />
      <DebugOverlay getProcessInfo={getProcessInfo} />
    </>
  )
}
```

### Using Individual Components

Import only what you need:

```tsx
import { 
  FPSOverlay, 
  ElementInspector, 
  AnnotationSystem,
  AnnotationsDashboard,
  useDebugAnnotations 
} from '@auto-claude/debugging-tool'

function CustomDebugPanel() {
  const [annotations, setAnnotations] = useDebugAnnotations()
  
  return (
    <>
      <FPSOverlay position="top-right" />
      <ElementInspector 
        enabled={inspectorEnabled} 
        onElementSelect={(el, info) => console.log(info)}
      />
      <AnnotationSystem enabled={annotationMode} />
      <AnnotationsDashboard 
        annotations={annotations} 
        onUpdateAnnotations={setAnnotations}
      />
    </>
  )
}
```

### Using Custom Storage Key

```tsx
import { createAnnotationsAtom } from '@auto-claude/debugging-tool'
import { useAtom } from 'jotai'

// Create a custom atom with your own storage key
const myAnnotationsAtom = createAnnotationsAtom('my-app:debug-notes')

function MyComponent() {
  const [annotations, setAnnotations] = useAtom(myAnnotationsAtom)
  
  return <AnnotationsDashboard annotations={annotations} onUpdateAnnotations={setAnnotations} />
}
```

## Components

### DebugOverlay

The main component that combines all features.

```tsx
<DebugOverlay 
  className="optional-css-class"
  onClose={() => console.log('Closed')}
  getProcessInfo={() => Promise.resolve({ pid: 123, mainProcessMemory: { rss: 100000000 } })}
/>
```

### FPSOverlay

Real-time performance monitoring.

```tsx
<FPSOverlay 
  position="top-right"  // default
  showMemory={true}     // show JS heap memory
  showProcessInfo={false} // show backend process memory
  getProcessInfo={async () => ({ pid: 123, mainProcessMemory: { rss: 100000000 } })}
/>
```

### ElementInspector

DOM element inspection with hover highlighting.

```tsx
<ElementInspector 
  enabled={true}
  onElementSelect={(element, info) => {
    console.log('Selected:', info.uniqueSelector)
    console.log('Component:', info.componentName)
  }}
  onDisable={() => setInspectorEnabled(false)}
/>
```

### AnnotationSystem

Click-to-annotate functionality.

```tsx
<AnnotationSystem 
  enabled={annotationMode}
  onAnnotationCountChange={(count) => console.log(count)}
  storageKey="my-app:annotations" // optional custom key
/>
```

### AnnotationsDashboard

Manage all annotations with filtering and export.

```tsx
import { useDebugAnnotations } from '@auto-claude/debugging-tool'

function SettingsPage() {
  const [annotations, setAnnotations] = useDebugAnnotations()
  
  return (
    <AnnotationsDashboard 
      annotations={annotations}
      onUpdateAnnotations={setAnnotations}
      onToast={(msg, desc) => toast(msg, { description: desc })}
    />
  )
}
```

## Keyboard Shortcuts

- `Ctrl+Shift+D` - Toggle debug overlay (when used within DebugOverlay)

## Styling

The components use Tailwind CSS classes. Make sure Tailwind is configured in your project.

For dark mode support, the components are designed to work with the default Tailwind dark mode.

## TypeScript

Full TypeScript support is included. All props are typed.

## License

MIT
