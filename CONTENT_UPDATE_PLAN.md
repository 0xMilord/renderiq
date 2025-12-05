# Tool Content Update Plan

## Status: ✅ Render-to-Section-Drawing Complete

The render-to-section-drawing tool now has:
- ✅ Rich, specific "How It Works" steps with real details
- ✅ 5 comprehensive FAQs with SEO keywords
- ✅ 5 detailed use cases with specific scenarios
- ✅ 6 key features with technical details
- ✅ Enhanced "About" section with benefits

## Next Steps

All other 20 tools need similar content updates. The content system is in place:
- `lib/tools/tool-content.ts` - Content storage
- `components/tools/base-tool-component.tsx` - Uses content when available, falls back to defaults
- `components/tools/tools/render-to-section-drawing.tsx` - Example implementation

## Content Guidelines

Each tool should have:
1. **How It Works**: 4-6 specific steps with real details (software names, file sizes, workflows)
2. **FAQ**: 4-5 questions architects actually search for (permit applications, software compatibility, accuracy)
3. **Use Cases**: 4-5 specific scenarios with real-world applications
4. **Key Features**: 5-6 features with technical specifications
5. **About**: Enhanced description + 3-4 benefits

## SEO Keywords to Include

- Software names: Revit, SketchUp, AutoCAD, Lumion, Enscape, V-Ray, ArchiCAD
- Industry terms: BIM, LOD, construction documents, permit applications, design development
- Workflow terms: design visualization, client presentations, construction documentation
- Technical terms: 300 DPI, print-ready, high-resolution, architectural drafting standards

## Content Tone

- Specific, not generic
- Technical but accessible
- Real-world scenarios
- Natural, human-written (not AI-generated feeling)
- Action-oriented language

