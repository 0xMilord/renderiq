# Modern UI Quick Start Guide

## 🎯 Immediate Fix: Replace WebDialog NOW

### Step 1: Update Dialog Creation (5 minutes)

**File: `renderiq/main_dialog.rb`**

Replace this:
```ruby
dlg = UI::WebDialog.new(options)
```

With this:
```ruby
# Check if HTMLDialog is available (SketchUp 2017+)
if UI::HtmlDialog.respond_to?(:new)
  dlg = UI::HtmlDialog.new(
    dialog_title: options[:dialog_title] || 'Renderiq',
    preferences_key: options[:preferences_key] || 'RenderIQ',
    scrollable: options[:scrollable] != false,
    resizable: options[:resizable] != false,
    width: options[:width] || 800,
    height: options[:height] || 600,
    style: UI::HtmlDialog::STYLE_DIALOG
  )
else
  # Fallback for older SketchUp versions
  dlg = UI::WebDialog.new(options)
end
```

**That's it!** Your plugin will now use Chromium instead of Internet Explorer.

### Step 2: Update HTML for Modern Standards

**Update your HTML to use modern CSS:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
                   'Helvetica Neue', Arial, sans-serif;
      background: #f5f5f5;
      padding: 24px;
    }
    
    .card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      max-width: 500px;
      margin: 0 auto;
    }
    
    h2 {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 16px;
      color: #1a1a1a;
    }
    
    button {
      background: #0078d4;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      width: 100%;
      margin-top: 16px;
      transition: background 0.2s;
    }
    
    button:hover {
      background: #106ebe;
    }
    
    button:active {
      background: #005a9e;
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

## 🚀 Full Modern Stack Setup (Recommended)

### Prerequisites

1. **Node.js 18+** installed
2. **SketchUp 2017+** (for HTMLDialog support)

### Step 1: Initialize React Project

```bash
cd sketchup-plugin/ui
npm init -y
npm install react react-dom
npm install -D vite @vitejs/plugin-react typescript @types/react @types/react-dom
```

### Step 2: Create Vite Config

**File: `ui/vite.config.ts`**
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
    host: '127.0.0.1'
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});
```

### Step 3: Create React App

**File: `ui/src/App.tsx`**
```tsx
import React from 'react';
import { RenderDialog } from './components/RenderDialog';

function App() {
  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <RenderDialog />
    </div>
  );
}

export default App;
```

### Step 4: Build and Test

```bash
npm run build
npm run server  # In separate terminal
```

### Step 5: Update Ruby Plugin

Use `MainDialogModern.show` instead of `MainDialog.show`

---

## 📋 Migration Checklist

### Quick Win (Do This Now):
- [x] Replace `UI::WebDialog` with `UI::HtmlDialog`
- [ ] Update HTML with modern CSS
- [ ] Test in SketchUp 2017+

### Full Migration (Next Sprint):
- [ ] Set up Node.js server
- [ ] Create React UI
- [ ] Build communication bridge
- [ ] Test all features
- [ ] Deploy new version

---

## 🔥 Why This Matters

**Before (WebDialog):**
- ❌ Uses Internet Explorer
- ❌ Security vulnerabilities
- ❌ No modern JavaScript
- ❌ Ugly UI

**After (HTMLDialog + React):**
- ✅ Modern Chromium engine
- ✅ Secure, maintained
- ✅ React/Vue/Any framework
- ✅ Beautiful, professional UI

**This is the difference between looking like a 2000s plugin and a 2024 professional tool.**


