# SketchUp Plugin - Modern UI Migration Guide

## 🚨 Problem: Current UI is Severely Outdated

### Current Issues:
- ❌ **Uses `UI::WebDialog`** - Deprecated, uses Internet Explorer's Trident engine
- ❌ **Opens Internet Explorer** - Security risk, no modern web standards
- ❌ **Limited CSS/JS support** - Can't use modern frameworks
- ❌ **Looks like 2000s** - Outdated styling, no responsive design
- ❌ **No React/Vue support** - Stuck with vanilla HTML/JS

### Why This Matters:
- **Security**: IE is a massive security risk (no longer supported by Microsoft)
- **User Experience**: Modern users expect modern interfaces
- **Developer Experience**: Can't use modern frameworks (React, Vue, etc.)
- **Maintainability**: Hard to maintain and update

---

## ✅ Solution: Modern UI Stack

### Recommended Approach: HTMLDialog + Local Web Server

**What Tech Giants Use:**
- **VSCode Extensions**: Local web server + iframe
- **Figma Plugins**: React + HTMLDialog equivalent
- **Blender Add-ons**: Modern HTML5 UI with React/Vue
- **AutoCAD Plugins**: WPF (but SketchUp is Ruby-based)

**For SketchUp, the best approach is:**

1. **HTMLDialog** (SketchUp 2017+) - Modern Chromium-based dialog
2. **Local Web Server** - Run React/Vue app locally
3. **Modus Design System** - Trimble's official UI framework
4. **Modern Frontend** - React + TypeScript + Tailwind CSS

---

## Architecture: Modern Stack

```
┌─────────────────────────────────────────┐
│ SketchUp (Ruby Plugin)                  │
│  ├─ HTMLDialog (Chromium CEF)           │
│  │   └─ Loads: http://localhost:3000    │
│  ├─ Ruby Backend                        │
│  │   ├─ API Client                      │
│  │   ├─ Settings Manager                │
│  │   └─ Callback Bridge                 │
│  └─ Local Web Server (Node.js)          │
│      └─ React App (Modern UI)           │
│          ├─ React 18                    │
│          ├─ TypeScript                  │
│          ├─ Tailwind CSS                │
│          ├─ Modus Design System         │
│          └─ WebSocket Bridge            │
└─────────────────────────────────────────┘
```

---

## Technology Stack

### 1. HTMLDialog (SketchUp 2017+)

**Replaces:** `UI::WebDialog`

**Benefits:**
- ✅ Uses Chromium Embedded Framework (CEF)
- ✅ Modern web standards (ES6+, CSS3, HTML5)
- ✅ React/Vue/Any modern framework support
- ✅ Fast, secure, maintained
- ✅ No Internet Explorer!

**Usage:**
```ruby
# OLD (Deprecated):
dlg = UI::WebDialog.new(options)

# NEW (Modern):
dlg = UI::HtmlDialog.new(
  dialog_title: 'Renderiq',
  preferences_key: 'RenderIQ',
  scrollable: true,
  resizable: true,
  width: 800,
  height: 600,
  min_width: 400,
  min_height: 400,
  max_width: 1200,
  max_height: 800,
  style: UI::HtmlDialog::STYLE_DIALOG
)
```

### 2. Local Web Server

**Options:**
- **Node.js + Express** - Simple, fast
- **Python + Flask** - Lightweight
- **Ruby + Sinatra** - Native to SketchUp environment

**Architecture:**
- Server runs on `localhost:3000` (or random port)
- HTMLDialog loads `http://localhost:3000`
- React/Vue app served from server
- Bridge API for Ruby ↔ JavaScript communication

### 3. Modern Frontend Framework

**React + TypeScript** (Recommended):
```typescript
// Modern React component
import React, { useState } from 'react';
import { Button, Card, Input } from '@modus/react';

export const RenderDialog: React.FC = () => {
  const [quality, setQuality] = useState('high');
  
  return (
    <Card>
      <h2>Render with Renderiq</h2>
      <Select value={quality} onChange={setQuality}>
        <Option value="standard">Standard (5 credits)</Option>
        <Option value="high">High (10 credits)</Option>
        <Option value="ultra">Ultra (15 credits)</Option>
      </Select>
      <Button onClick={handleRender}>🎨 Render</Button>
    </Card>
  );
};
```

**Vue 3 + TypeScript** (Alternative):
```vue
<template>
  <Card>
    <h2>Render with Renderiq</h2>
    <Select v-model="quality">
      <option value="standard">Standard</option>
      <option value="high">High</option>
    </Select>
    <Button @click="handleRender">Render</Button>
  </Card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
const quality = ref('high');
</script>
```

### 4. Modus Design System

**Official Trimble UI Framework:**
- Pre-built components (buttons, inputs, cards)
- Consistent with SketchUp's UI
- Accessible, responsive
- Modern design

**Installation:**
```bash
npm install @modus/react
# or
npm install @modus/vue
```

---

## Implementation Strategy

### Phase 1: Replace WebDialog with HTMLDialog

**Step 1: Update Dialog Creation**
```ruby
# sketchup-plugin/renderiq/ui/modern_dialog.rb
module Renderiq
  module ModernDialog
    def self.create_html_dialog(options = {})
      default_options = {
        dialog_title: 'Renderiq',
        preferences_key: 'RenderIQ_Dialog',
        scrollable: true,
        resizable: true,
        width: 800,
        height: 600,
        min_width: 400,
        min_height: 400,
        style: UI::HtmlDialog::STYLE_DIALOG
      }
      
      UI::HtmlDialog.new(default_options.merge(options))
    end
  end
end
```

### Phase 2: Set Up Local Web Server

**Option A: Node.js Server (Recommended)**

```ruby
# sketchup-plugin/renderiq/server/web_server.rb
require 'json'

module Renderiq
  module WebServer
    SERVER_PORT = 3000
    
    def self.start
      # Start Node.js server
      server_path = File.join(File.dirname(__FILE__), '..', '..', 'ui', 'server.js')
      system("node #{server_path} #{SERVER_PORT} &")
      
      # Wait for server to start
      sleep(2)
    end
    
    def self.url
      "http://localhost:#{SERVER_PORT}"
    end
  end
end
```

**Node.js Server (`ui/server.js`):**
```javascript
const express = require('express');
const path = require('path');

const app = express();
const port = process.argv[2] || 3000;

// Serve React build
app.use(express.static(path.join(__dirname, 'build')));

// API bridge endpoint
app.post('/api/bridge', express.json(), (req, res) => {
  // Handle Ruby → JavaScript communication
  const { action, data } = req.body;
  // Process and respond
  res.json({ success: true, result: data });
});

app.listen(port, () => {
  console.log(`Renderiq UI Server running on port ${port}`);
});
```

### Phase 3: Create Modern React UI

**Project Structure:**
```
sketchup-plugin/
├── renderiq/              # Ruby plugin code
│   ├── modern_dialog.rb   # HTMLDialog wrapper
│   └── server_bridge.rb   # Communication bridge
├── ui/                    # Modern frontend
│   ├── package.json
│   ├── src/
│   │   ├── components/
│   │   │   ├── RenderDialog.tsx
│   │   │   ├── LoginDialog.tsx
│   │   │   ├── SettingsDialog.tsx
│   │   │   └── CreditsDialog.tsx
│   │   ├── bridge/
│   │   │   └── sketchup-bridge.ts
│   │   └── App.tsx
│   ├── public/
│   └── build/             # Production build
└── package.json           # Root package.json
```

### Phase 4: Communication Bridge

**Ruby → JavaScript:**
```ruby
dlg.execute_script("window.sketchupBridge.handleAction(#{action_json});")
```

**JavaScript → Ruby:**
```javascript
// In React component
window.sketchup?.callback('action_name', JSON.stringify(data));
```

---

## Migration Checklist

### Immediate Actions:
- [ ] Replace all `UI::WebDialog` with `UI::HtmlDialog`
- [ ] Update dialog options (remove IE-specific workarounds)
- [ ] Test HTMLDialog in SketchUp 2017+

### Phase 1: Basic HTMLDialog
- [ ] Create `modern_dialog.rb` wrapper
- [ ] Migrate existing HTML to work in HTMLDialog
- [ ] Test all dialogs work correctly

### Phase 2: Local Web Server
- [ ] Set up Node.js server
- [ ] Create server startup in Ruby
- [ ] Create API bridge endpoints
- [ ] Test server communication

### Phase 3: React UI
- [ ] Initialize React + TypeScript project
- [ ] Install Modus design system
- [ ] Create component library
- [ ] Build production bundle
- [ ] Integrate with HTMLDialog

### Phase 4: Modern Features
- [ ] Real-time updates (WebSocket)
- [ ] Offline support
- [ ] Modern animations
- [ ] Responsive design
- [ ] Accessibility improvements

---

## Quick Start: Minimal Modern Dialog

**Step 1: Replace WebDialog**
```ruby
# OLD
dlg = UI::WebDialog.new(options)

# NEW
dlg = UI::HtmlDialog.new(
  dialog_title: 'Renderiq',
  preferences_key: 'RenderIQ',
  scrollable: true,
  resizable: true,
  width: 800,
  height: 600,
  style: UI::HtmlDialog::STYLE_DIALOG
)
```

**Step 2: Use Modern HTML/CSS**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/modern-css-reset@1.4.0/dist/reset.min.css">
  <style>
    :root {
      --primary: #0078d4;
      --background: #f3f3f3;
      --card: #ffffff;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--background);
      padding: 24px;
    }
    
    .card {
      background: var(--card);
      border-radius: 8px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    button {
      background: var(--primary);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
    }
    
    button:hover {
      opacity: 0.9;
    }
  </style>
</head>
<body>
  <div class="card">
    <h2>Render with Renderiq</h2>
    <button onclick="sketchup.callback('render');">🎨 Render</button>
  </div>
</body>
</html>
```

---

## Recommended: Full Modern Stack

### Frontend Stack:
- **React 18** + TypeScript
- **Vite** (fast build tool)
- **Tailwind CSS** (utility-first CSS)
- **Modus Components** (Trimble's design system)
- **Zustand** (state management)

### Backend Bridge:
- **Express.js** (Node.js server)
- **WebSocket** (real-time communication)
- **REST API** (for actions)

### Benefits:
- ✅ Modern, maintainable code
- ✅ Fast development
- ✅ Professional UI
- ✅ Easy to update
- ✅ No Internet Explorer!

---

## Example: Modern Render Dialog

**React Component:**
```tsx
import React, { useState } from 'react';
import { Card, Button, Select, ProgressBar } from '@modus/react';
import { useSketchupBridge } from '../bridge/sketchup-bridge';

export const RenderDialog: React.FC = () => {
  const { sendAction } = useSketchupBridge();
  const [quality, setQuality] = useState('high');
  const [loading, setLoading] = useState(false);
  
  const handleRender = async () => {
    setLoading(true);
    await sendAction('render', { quality });
    setLoading(false);
  };
  
  return (
    <Card className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Render with Renderiq</h2>
      
      <Select 
        value={quality} 
        onChange={setQuality}
        className="mb-4"
      >
        <option value="standard">Standard (5 credits)</option>
        <option value="high">High (10 credits)</option>
        <option value="ultra">Ultra (15 credits)</option>
      </Select>
      
      {loading && <ProgressBar className="mb-4" />}
      
      <Button 
        onClick={handleRender} 
        disabled={loading}
        className="w-full"
      >
        🎨 Render
      </Button>
    </Card>
  );
};
```

---

## Next Steps

1. **Immediate**: Replace `UI::WebDialog` with `UI::HtmlDialog`
2. **Short-term**: Set up local web server
3. **Medium-term**: Build React UI with Modus
4. **Long-term**: Add advanced features (WebSocket, offline, etc.)

This migration will bring the SketchUp plugin into 2024 with a modern, maintainable, and professional UI.


