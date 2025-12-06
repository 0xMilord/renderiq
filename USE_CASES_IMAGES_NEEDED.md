# Use Cases Images Required

All images should be in **16:9 aspect ratio** and placed in the `public/use-cases/` directory.

## AI Architecture Workflows (First 6 items)

1. **concept-renders.png**
   - Title: "Concept Renders for Early Visualisation"
   - Should show: Early-stage architectural sketches being transformed into photorealistic renders
   - Suggested imagery: Sketch-to-render comparison or early concept visualization

2. **material-testing-built-spaces.png**
   - Title: "Material Testing in Built Spaces"
   - Should show: Material samples being tested in real architectural contexts
   - Suggested imagery: Before/after material applications or material comparison in space

3. **instant-floor-plan-renders.png**
   - Title: "Instant Floor Plan Renders"
   - Should show: 2D floor plans converting to 3D visualizations
   - Suggested imagery: Floor plan transforming to 3D render or side-by-side comparison

4. **style-testing-white-renders.png**
   - Title: "Style Testing with White Renders"
   - Should show: Clean white architectural renders focusing on form
   - Suggested imagery: Minimalist white architectural render or massing study

5. **rapid-concept-video.mp4** (VIDEO FILE)
   - Title: "Rapid Concept Video Generation"
   - Should show: Video animation of architectural renders
   - Suggested imagery: Animated walkthrough or style transition from architectural render
   - **Note**: This is a VIDEO file, not an image. It will autoplay and loop on the card.

6. **massing-testing.png**
   - Title: "Massing Testing"
   - Should show: Building massing studies or form exploration
   - Suggested imagery: Multiple massing options or building form studies

## Advanced Visualization Features (Next 4 items)

7. **2d-elevations-from-images.png**
   - Title: "2D Elevations from Images"
   - Should show: Photographs being converted to elevation drawings
   - Suggested imagery: Photo-to-elevation conversion or clean elevation drawings

8. **presentation-ready-graphics.png**
   - Title: "Presentation Ready Graphics"
   - Should show: High-quality professional architectural renders
   - Suggested imagery: Polished architectural visualization or presentation board

9. **social-media-content.png**
   - Title: "Social Media Content"
   - Should show: Architectural content formatted for social media
   - Suggested imagery: Square/portrait architectural renders or social media mockup

10. **matching-render-mood.png**
    - Title: "Matching Render Mood to References"
    - Should show: Style matching or mood transfer in renders
    - Suggested imagery: Reference image with matching render or style comparison

## File Specifications

### Images (PNG):
- **Format**: PNG (will be converted to WebP automatically)
- **Aspect Ratio**: 16:9 (e.g., 1920x1080, 1600x900, 1280x720)
- **Location**: `public/use-cases/`
- **Optimization**: Run `npm run optimize-use-cases` or `tsx scripts/optimize-use-cases-images.ts` to convert to WebP

### Video (MP4):
- **Format**: MP4
- **Aspect Ratio**: 16:9
- **Location**: `public/use-cases/`
- **Settings**: Should autoplay, loop, and be muted

## Optimization Script

After adding PNG images, run the optimization script to convert them to WebP:

```bash
npm run optimize-use-cases
# or
tsx scripts/optimize-use-cases-images.ts
```

The script will:
- Convert all PNG files in `public/use-cases/` to WebP format
- Use lossless compression (100% quality)
- Preserve original PNG files (as backup)

## Total Files Needed: 9 images (PNG) + 1 video (MP4)

All images should be professional architectural visualizations that represent each use case clearly and attractively.

