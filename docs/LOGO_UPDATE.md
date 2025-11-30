# Logo Update to Neon Green Theme

## Updated Files

### ✅ SVG Logo
- **File:** `public/logo.svg`
- **Status:** Updated to neon green (#D1F24A)
- **Changes:**
  - Main "R" shape: Changed from `#D97757` (orange) to `#D1F24A` (neon green)
  - Dark accents: Changed from `#1C1C1C` to `#0A0A0A` (purer black)

### ✅ SVG Favicon
- **File:** `public/favicon.svg`
- **Status:** Created with neon green theme
- **Usage:** Modern browsers support SVG favicons

### ✅ Utility SVG Icons
- **File:** `public/file.svg`
  - **Status:** Updated to neon green (#D1F24A)
  - **Change:** Changed from gray (#666) to neon green
  
- **File:** `public/globe.svg`
  - **Status:** Updated to neon green (#D1F24A)
  - **Change:** Changed from gray (#666) to neon green
  
- **File:** `public/window.svg`
  - **Status:** Updated to neon green (#D1F24A)
  - **Change:** Changed from gray (#666) to neon green

### ⚠️ Brand Logos (Not Changed)
- **File:** `public/next.svg` - Next.js brand logo (left unchanged)
- **File:** `public/vercel.svg` - Vercel brand logo (left unchanged)

## Files That Need Manual Regeneration

The following raster image files need to be regenerated from the updated `logo.svg`:

### PNG Logo
- **File:** `public/logo.png`
- **Action Required:** Export from `logo.svg` at various sizes:
  - 24x24 (navbar)
  - 32x32 (footer)
  - 120x120 (full size)

### Favicon Files
- **File:** `public/favicon.ico`
- **File:** `app/favicon.ico`
- **Action Required:** Generate from `logo.svg` or `favicon.svg`
  - 16x16
  - 32x32
  - 48x48

### Apple Touch Icon
- **File:** `public/apple-touch-icon.png`
- **Action Required:** Generate 180x180 PNG from `logo.svg`

### Icon Files (if they exist)
- **Files:** `public/icons/icon-32x32.png`, `public/icons/icon-16x16.png`
- **Action Required:** Generate from `logo.svg` at specified sizes

### Open Graph Image
- **File:** `public/og-image.png`
- **Action Required:** Regenerate with neon green theme for social media sharing
- **Usage:** Used in `app/layout.tsx` and SEO metadata
- **Recommended Size:** 1200x630px (Open Graph standard)

## How to Regenerate

### Option 1: Online Tools
1. Use [CloudConvert](https://cloudconvert.com/svg-to-png) or similar
2. Upload `logo.svg`
3. Export at required sizes
4. Save to appropriate locations

### Option 2: Design Software
1. Open `logo.svg` in Figma, Adobe Illustrator, or Inkscape
2. Export at required sizes
3. For favicon.ico, use [favicon.io](https://favicon.io/favicon-converter/) or similar

### Option 3: Command Line (ImageMagick)
```bash
# Generate PNG from SVG
convert -background none -resize 32x32 public/logo.svg public/icons/icon-32x32.png
convert -background none -resize 16x16 public/logo.svg public/icons/icon-16x16.png

# Generate favicon.ico
convert -background none -resize 16x16 public/logo.svg public/favicon-16.png
convert -background none -resize 32x32 public/logo.svg public/favicon-32.png
convert public/favicon-16.png public/favicon-32.png public/favicon.ico
```

## Color Reference

- **Neon Green:** `#D1F24A` (HSL: 72, 87%, 62%)
- **Dark Accent:** `#0A0A0A` (Pure black for contrast)

## Current Usage

The logo is used in:
- `components/navbar.tsx` - 24x24 size
- `components/footer.tsx` - 32x32 size
- Various SEO and metadata files

All references use `/logo.svg`, so the SVG update is immediately effective.

