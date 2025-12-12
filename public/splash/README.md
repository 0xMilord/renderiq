# iOS Splash Screens Directory

This directory contains iOS splash screens for various Apple devices.

## Required Files

All splash screens should have:
- **Background Color:** #121212 (matches manifest background_color)
- **Format:** PNG
- **Design:** Centered logo or app name, minimal design

### iPhone Splash Screens

| File Name | Size | Device |
|-----------|------|--------|
| `apple-splash-640x1136.png` | 640x1136 | iPhone SE (1st gen) |
| `apple-splash-750x1334.png` | 750x1334 | iPhone 6/7/8 |
| `apple-splash-828x1792.png` | 828x1792 | iPhone XR |
| `apple-splash-1125x2436.png` | 1125x2436 | iPhone X/XS |
| `apple-splash-1242x2208.png` | 1242x2208 | iPhone 6/7/8 Plus |
| `apple-splash-1242x2688.png` | 1242x2688 | iPhone XS Max |

### iPad Splash Screens

| File Name | Size | Device |
|-----------|------|--------|
| `apple-splash-1536x2048.png` | 1536x2048 | iPad Mini/Air |
| `apple-splash-1668x2224.png` | 1668x2224 | iPad Pro 10.5" |
| `apple-splash-1668x2388.png` | 1668x2388 | iPad Pro 11" |
| `apple-splash-2048x2732.png` | 2048x2732 | iPad Pro 12.9" |

## Generation Instructions

### Using PWA Asset Generator (Recommended)

```bash
npx pwa-asset-generator logo.png public/splash --splash-only --background "#121212"
```

### Manual Creation

1. Create base design with centered logo on #121212 background
2. Generate all 10 sizes listed above
3. Save as PNG format
4. Ensure exact pixel dimensions (no scaling)

## Status

⚠️ **PLACEHOLDER** - Actual splash screen images need to be created and added to this directory.



