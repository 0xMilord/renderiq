# PWA Assets Generation Guide

This guide helps you generate all missing PWA assets.

## Prerequisites

- Node.js installed
- Source logo/image (recommended: 1024x1024 PNG)

## Quick Start with PWA Asset Generator

### Install PWA Asset Generator

```bash
npm install -g pwa-asset-generator
```

### Generate All Assets

```bash
# Generate icons and splash screens from your logo
pwa-asset-generator logo.png public/icons public/splash \
  --background "#121212" \
  --icon-only \
  --splash-only \
  --favicon \
  --path-override "/icons" \
  --path-override-splash "/splash"
```

### Generate Windows Icons

You'll need to manually create Windows tile icons or use ImageMagick:

```bash
# Using ImageMagick (if installed)
magick convert logo.png -resize 310x310 public/icons/icon-310x310.png
magick convert logo.png -resize 310x150 public/icons/icon-310x150.png
magick convert logo.png -resize 150x150 public/icons/icon-150x150.png
magick convert logo.png -resize 70x70 public/icons/icon-70x70.png
```

## Manual Steps

### 1. Screenshots

1. Open your app in browser
2. Resize to 1280x720 for desktop screenshot
3. Take screenshot, save as `public/screenshots/desktop-1.png`
4. Resize to 750x1334 for mobile screenshot (or use mobile emulator)
5. Take screenshot, save as `public/screenshots/mobile-1.png`

### 2. Splash Screens

1. Create base design: centered logo on #121212 background
2. Export at all required sizes (see splash/README.md)
3. Save to `public/splash/` directory

### 3. Windows Icons

1. Create square icon (310x310) - centered logo
2. Create wide icon (310x150) - logo on left
3. Create medium icon (150x150) - centered logo
4. Create small icon (70x70) - centered logo
5. Save to `public/icons/` directory

## Verification

After generating assets, verify:
- All files exist in correct locations
- File names match exactly (case-sensitive)
- File dimensions are correct
- Manifest.json references are correct
- Layout.tsx splash screen links are correct



