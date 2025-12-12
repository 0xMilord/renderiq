# Renderiq SketchUp Plugin - Modern UI

Modern React-based UI for the Renderiq SketchUp plugin, replacing the deprecated WebDialog (Internet Explorer) with HTMLDialog (Chromium).

## Tech Stack

- **React 18** - Modern UI framework
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **Modern CSS** - Professional styling

## Quick Start

### 1. Install Dependencies

```bash
cd ui
npm install
```

### 2. Development

```bash
# Start dev server
npm run dev

# In another terminal, start the bridge server
npm run server
```

### 3. Build for Production

```bash
npm run build
```

The build output will be in `dist/` directory.

## Architecture

```
┌─────────────────────────────────┐
│ SketchUp (Ruby Plugin)          │
│  └─ HTMLDialog                  │
│     └─ Loads: localhost:3000    │
│                                 │
│  └─ Node.js Server              │
│     └─ Serves React App         │
│     └─ Bridge API               │
└─────────────────────────────────┘
```

## Communication Bridge

### Ruby → JavaScript

```ruby
dialog.execute_script("window.sketchupBridge.handleAction(#{json_data});")
```

### JavaScript → Ruby

```javascript
window.sketchup?.callback('action_name', JSON.stringify(data));
```

## Components

- `RenderDialog` - Main render interface
- `LoginDialog` - Authentication (to be added)
- `SettingsDialog` - Settings (to be added)
- `CreditsDialog` - Credits display (to be added)

## Deployment

1. Build the React app: `npm run build`
2. The Ruby plugin will serve files from `dist/` directory
3. Server auto-starts when plugin loads


