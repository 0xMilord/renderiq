# PWA Image Assets Audit - Renderiq
## Comprehensive Report of Required Images, File Names, and Locations

**Audit Date:** 2025-01-27  
**Status:** ⚠️ **MISSING ASSETS IDENTIFIED**

---

## 📊 Executive Summary

This audit identifies all required PWA image assets for Windows, Apple (iOS), and Android platforms. Many assets are missing and need to be created.

### Current Status
- ✅ **Basic Icons:** Most standard sizes exist
- ❌ **Windows Icons:** Missing Windows-specific tile icons
- ❌ **Apple Splash Screens:** Missing all iOS splash screens
- ❌ **Screenshots:** Missing referenced screenshots
- ⚠️ **Apple Touch Icons:** Only one size exists, missing multiple sizes

---

## 📁 Directory Structure

```
public/
├── favicon.ico ✅
├── favicon.svg ✅
├── favicon.png ✅
├── apple-touch-icon.png ✅ (but only 180x180, missing other sizes)
├── icons/
│   ├── icon-16x16.png ✅
│   ├── icon-32x32.png ✅
│   ├── icon-72x72.png ✅
│   ├── icon-96x96.png ✅
│   ├── icon-128x128.png ✅
│   ├── icon-144x144.png ✅
│   ├── icon-152x152.png ✅
│   ├── icon-192x192.png ✅
│   ├── icon-384x384.png ✅
│   ├── icon-512x512.png ✅
│   ├── badge-72x72.png ✅
│   ├── shortcut-render.png ✅
│   ├── shortcut-gallery.png ✅
│   └── shortcut-dashboard.png ✅
├── screenshots/ ❌ (DIRECTORY MISSING)
│   ├── desktop-1.png ❌ (referenced in manifest)
│   └── mobile-1.png ❌ (referenced in manifest)
└── splash/ ❌ (DIRECTORY MISSING)
    └── [iOS splash screens] ❌ (all missing)
```

---

## 🔴 CRITICAL MISSING ASSETS

### 1. Screenshots Directory & Files ❌

**Status:** Directory doesn't exist, files referenced in manifest are missing

**Required Files:**
| File Name | Size | Location | Status | Referenced In |
|-----------|------|----------|--------|---------------|
| `desktop-1.png` | 1280x720 | `/public/screenshots/` | ❌ Missing | manifest.json |
| `mobile-1.png` | 750x1334 | `/public/screenshots/` | ❌ Missing | manifest.json |

**Action Required:**
1. Create `/public/screenshots/` directory
2. Create desktop screenshot (1280x720) showing desktop view
3. Create mobile screenshot (750x1334) showing mobile view

---

### 2. Apple iOS Splash Screens ❌

**Status:** All missing - No splash directory exists

**Required Files:**
| File Name | Size | Device | Location | Status |
|-----------|------|--------|----------|--------|
| `apple-splash-640x1136.png` | 640x1136 | iPhone SE (1st gen) | `/public/splash/` | ❌ Missing |
| `apple-splash-750x1334.png` | 750x1334 | iPhone 6/7/8 | `/public/splash/` | ❌ Missing |
| `apple-splash-828x1792.png` | 828x1792 | iPhone XR | `/public/splash/` | ❌ Missing |
| `apple-splash-1125x2436.png` | 1125x2436 | iPhone X/XS | `/public/splash/` | ❌ Missing |
| `apple-splash-1242x2208.png` | 1242x2208 | iPhone 6/7/8 Plus | `/public/splash/` | ❌ Missing |
| `apple-splash-1242x2688.png` | 1242x2688 | iPhone XS Max | `/public/splash/` | ❌ Missing |
| `apple-splash-1536x2048.png` | 1536x2048 | iPad Mini/Air | `/public/splash/` | ❌ Missing |
| `apple-splash-1668x2224.png` | 1668x2224 | iPad Pro 10.5" | `/public/splash/` | ❌ Missing |
| `apple-splash-1668x2388.png` | 1668x2388 | iPad Pro 11" | `/public/splash/` | ❌ Missing |
| `apple-splash-2048x2732.png` | 2048x2732 | iPad Pro 12.9" | `/public/splash/` | ❌ Missing |

**Action Required:**
1. Create `/public/splash/` directory
2. Generate all 10 splash screen images
3. Add `<link>` tags to `app/layout.tsx` for each splash screen

---

### 3. Windows PWA Icons ❌

**Status:** Missing Windows-specific tile icons

**Required Files:**
| File Name | Size | Purpose | Location | Status |
|-----------|------|---------|----------|--------|
| `icon-310x310.png` | 310x310 | Windows tile (small) | `/public/icons/` | ❌ Missing |
| `icon-310x150.png` | 310x150 | Windows tile (wide) | `/public/icons/` | ❌ Missing |
| `icon-150x150.png` | 150x150 | Windows tile (medium) | `/public/icons/` | ❌ Missing |
| `icon-70x70.png` | 70x70 | Windows tile (small square) | `/public/icons/` | ❌ Missing |

**Action Required:**
1. Create Windows-specific tile icons
2. Add to manifest.json icons array
3. Consider adding Windows-specific manifest properties

---

### 4. Additional Apple Touch Icons ⚠️

**Status:** Only 180x180 exists, missing other sizes for better compatibility

**Current:** `apple-touch-icon.png` (180x180) ✅

**Recommended Additional Sizes:**
| File Name | Size | Location | Status | Priority |
|-----------|------|----------|--------|----------|
| `apple-touch-icon-57x57.png` | 57x57 | `/public/icons/` | ❌ Missing | 🟢 Low |
| `apple-touch-icon-60x60.png` | 60x60 | `/public/icons/` | ❌ Missing | 🟢 Low |
| `apple-touch-icon-72x72.png` | 72x72 | `/public/icons/` | ❌ Missing | 🟢 Low |
| `apple-touch-icon-76x76.png` | 76x76 | `/public/icons/` | ❌ Missing | 🟢 Low |
| `apple-touch-icon-114x114.png` | 114x114 | `/public/icons/` | ❌ Missing | 🟢 Low |
| `apple-touch-icon-120x120.png` | 120x120 | `/public/icons/` | ❌ Missing | 🟢 Low |
| `apple-touch-icon-144x144.png` | 144x144 | `/public/icons/` | ❌ Missing | 🟢 Low |
| `apple-touch-icon-152x152.png` | 152x152 | `/public/icons/` | ❌ Missing | 🟢 Low |

**Note:** The current 180x180 icon works for modern iOS devices, but additional sizes improve compatibility with older devices.

---

## ✅ EXISTING ASSETS (Verified)

### Standard PWA Icons ✅
All standard PWA icons exist in `/public/icons/`:
- ✅ `icon-16x16.png`
- ✅ `icon-32x32.png`
- ✅ `icon-72x72.png`
- ✅ `icon-96x96.png`
- ✅ `icon-128x128.png`
- ✅ `icon-144x144.png`
- ✅ `icon-152x152.png`
- ✅ `icon-192x192.png`
- ✅ `icon-384x384.png`
- ✅ `icon-512x512.png`

### Shortcut Icons ✅
All shortcut icons exist:
- ✅ `shortcut-render.png`
- ✅ `shortcut-gallery.png`
- ✅ `shortcut-dashboard.png`

### Badge Icon ✅
- ✅ `badge-72x72.png`

### Favicons ✅
- ✅ `favicon.ico`
- ✅ `favicon.svg`
- ✅ `favicon.png`

### Apple Touch Icon ✅
- ✅ `apple-touch-icon.png` (180x180)

---

## 📋 COMPLETE ASSET CHECKLIST

### Critical Priority (Must Have) 🔴

- [ ] Create `/public/screenshots/` directory
- [ ] Create `screenshots/desktop-1.png` (1280x720)
- [ ] Create `screenshots/mobile-1.png` (750x1334)
- [ ] Create `/public/splash/` directory
- [ ] Create all 10 iOS splash screens
- [ ] Add splash screen `<link>` tags to `app/layout.tsx`

### High Priority (Should Have) 🟡

- [ ] Create Windows tile icons (310x310, 310x150, 150x150, 70x70)
- [ ] Add Windows icons to manifest.json
- [ ] Test screenshots on installation prompts

### Low Priority (Nice to Have) 🟢

- [ ] Create additional Apple Touch icon sizes
- [ ] Add more screenshot variations
- [ ] Create Android-specific splash screens (if needed)

---

## 🔧 IMPLEMENTATION GUIDE

### Step 1: Create Screenshots

**Desktop Screenshot:**
1. Take a screenshot of your desktop view (1280x720)
2. Save as `/public/screenshots/desktop-1.png`
3. Should showcase main features/interface

**Mobile Screenshot:**
1. Take a screenshot of your mobile view (750x1334)
2. Save as `/public/screenshots/mobile-1.png`
3. Should showcase mobile-optimized interface

### Step 2: Create iOS Splash Screens

**Recommended Tool:** Use [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator) or similar tool

**Manual Creation:**
1. Create base splash screen design (centered logo, background color: #121212)
2. Generate all 10 sizes listed above
3. Save to `/public/splash/` directory

**Add to `app/layout.tsx`:**
```tsx
{/* iOS Splash Screens */}
<link rel="apple-touch-startup-image" href="/splash/apple-splash-640x1136.png" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)" />
<link rel="apple-touch-startup-image" href="/splash/apple-splash-750x1334.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" />
<link rel="apple-touch-startup-image" href="/splash/apple-splash-828x1792.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)" />
<link rel="apple-touch-startup-image" href="/splash/apple-splash-1125x2436.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" />
<link rel="apple-touch-startup-image" href="/splash/apple-splash-1242x2208.png" media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)" />
<link rel="apple-touch-startup-image" href="/splash/apple-splash-1242x2688.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)" />
<link rel="apple-touch-startup-image" href="/splash/apple-splash-1536x2048.png" media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)" />
<link rel="apple-touch-startup-image" href="/splash/apple-splash-1668x2224.png" media="(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2)" />
<link rel="apple-touch-startup-image" href="/splash/apple-splash-1668x2388.png" media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)" />
<link rel="apple-touch-startup-image" href="/splash/apple-splash-2048x2732.png" media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)" />
```

### Step 3: Create Windows Icons

**Windows Tile Icons:**
1. Create square icon (310x310) - main tile
2. Create wide icon (310x150) - wide tile
3. Create medium icon (150x150) - medium tile
4. Create small icon (70x70) - small tile
5. Save to `/public/icons/`

**Add to `manifest.json`:**
```json
{
  "icons": [
    // ... existing icons ...
    {
      "src": "/icons/icon-310x310.png",
      "sizes": "310x310",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-310x150.png",
      "sizes": "310x150",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-150x150.png",
      "sizes": "150x150",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-70x70.png",
      "sizes": "70x70",
      "type": "image/png",
      "purpose": "any"
    }
  ]
}
```

---

## 📐 DESIGN SPECIFICATIONS

### Screenshot Guidelines

**Desktop Screenshot (1280x720):**
- Aspect Ratio: 16:9
- Should show main dashboard or key feature
- Include UI elements that showcase app functionality
- Use high-quality, clear images

**Mobile Screenshot (750x1334):**
- Aspect Ratio: 9:16 (portrait)
- Should show mobile-optimized interface
- Include key mobile features
- Match iPhone 6/7/8 screen size

### Splash Screen Guidelines

**Design Elements:**
- Background Color: `#121212` (matches manifest background_color)
- Centered logo or app name
- Minimal design (no text, just logo)
- Should match app theme

**Technical Requirements:**
- PNG format
- Exact pixel dimensions (no scaling)
- Optimized file sizes
- Transparent or solid background

### Windows Tile Guidelines

**Design Elements:**
- Square icons should have centered logo
- Wide icons (310x150) should have logo on left, text optional
- Use brand colors
- Ensure visibility at small sizes

---

## 🛠️ RECOMMENDED TOOLS

### For Generating Assets

1. **PWA Asset Generator**
   - Tool: [pwa-asset-generator](https://github.com/onderceylan/pwa-asset-generator)
   - Generates all icons and splash screens from single source
   - Command: `npx pwa-asset-generator logo.png public/icons public/splash`

2. **ImageMagick**
   - Resize and convert images
   - Batch processing capabilities

3. **Online Tools**
   - [RealFaviconGenerator](https://realfavicongenerator.net/)
   - [PWA Builder](https://www.pwabuilder.com/imageGenerator)

---

## 📊 SUMMARY BY PLATFORM

### Windows PWA Assets
- **Status:** ⚠️ Partial
- **Missing:** Tile icons (310x310, 310x150, 150x150, 70x70)
- **Priority:** 🟡 High

### Apple iOS Assets
- **Status:** ⚠️ Partial
- **Missing:** All splash screens (10 files)
- **Missing:** Additional Apple Touch icon sizes (8 files)
- **Priority:** 🔴 Critical (splash screens)

### Android Assets
- **Status:** ✅ Complete
- **Missing:** None (uses standard PWA icons)
- **Priority:** ✅ Done

### Screenshots
- **Status:** ❌ Missing
- **Missing:** Desktop and mobile screenshots
- **Priority:** 🔴 Critical

---

## ✅ VERIFICATION CHECKLIST

After creating all assets, verify:

- [ ] All files exist in correct locations
- [ ] File names match exactly (case-sensitive)
- [ ] File sizes are correct (check dimensions)
- [ ] Manifest.json references are correct
- [ ] HTML `<link>` tags are added for splash screens
- [ ] Test on Windows (Edge/Chrome)
- [ ] Test on iOS (Safari)
- [ ] Test on Android (Chrome)
- [ ] Verify screenshots appear in install prompts
- [ ] Verify splash screens appear on app launch
- [ ] Check Lighthouse PWA audit (should pass icon checks)

---

## 📝 NOTES

1. **File Naming:** All file names are case-sensitive. Use exact names listed.
2. **File Formats:** Use PNG for all icons and splash screens (except favicon.ico)
3. **Optimization:** Compress images to reduce file sizes while maintaining quality
4. **Testing:** Always test on actual devices, not just emulators
5. **Updates:** Keep this audit updated as new requirements emerge

---

## 🎯 PRIORITY ACTION ITEMS

### Immediate (This Week)
1. ✅ Create screenshots directory and files
2. ✅ Create splash directory and all iOS splash screens
3. ✅ Add splash screen links to layout.tsx

### Soon (Next Week)
4. ✅ Create Windows tile icons
5. ✅ Add Windows icons to manifest
6. ✅ Test on all platforms

### Later (Nice to Have)
7. ✅ Add more screenshot variations
8. ✅ Create additional Apple Touch icon sizes
9. ✅ Optimize all image file sizes

---

**Last Updated:** 2025-01-27  
**Next Review:** After asset creation  
**Status:** ⚠️ **ACTION REQUIRED**

