# Render Tools Refactor: Current State vs Requirements

## Executive Summary

This document outlines the required refactoring for render tools' inputs, dropdowns, and system prompts across the application. The refactor will standardize UI components, enhance functionality, and improve user experience across all render tools.

---

## 1. Render Effects

### Current State
- **Effect Type**: Dropdown (sketch, illustration, wireframe, watercolor, pencil) ✅
- **Effect Intensity**: Dropdown (subtle, medium, strong) ❌ **NEEDS CHANGE**
- **Style Reference**: Image upload/library selector ✅
- **Maintain Detail**: ❌ **MISSING**

### Requirements
- **Maintain Detail**: Slider (needs implementation)
- **Effect Intensity**: Convert to 5-point modifier (1-5 scale) instead of 3-point dropdown
- **Preset of Main Style from Library**: Needs library development

### Action Items
1. ❌ Add "Maintain Detail" slider component
2. ❌ Convert Effect Intensity from dropdown (subtle/medium/strong) to 5-point slider/modifier
3. ❌ Develop style preset library system
4. ❌ Update system prompt to include maintain detail parameter
5. ❌ Update system prompt to use 5-point intensity scale

---

## 2. Empty Floorplan to Furnished

### Current State
- **Furniture Style**: Dropdown (modern, traditional, minimalist, luxury) ✅
- **Room Type**: Dropdown (living-room, bedroom, kitchen, office, mixed) ❌ **INCOMPLETE**

### Requirements
- **Furniture Presentation Style**: Dropdown - Sketched outline / Solid Draft / Solid colours / Realistic plan ❌ **MISSING**
- **Room Types**: Add more options - Reception Lobby / Factory / Gym / Verandah ❌ **MISSING**
- **Toggle for Decorative Details**: Plants, Rugs, Lamps, table décor ❌ **MISSING**
- **LOD Dropdown**: Level of Detail selector ❌ **MISSING**
- **Shadows Toggle**: On/Off ❌ **MISSING**

### Action Items
1. ❌ Add "Furniture Presentation Style" dropdown with 4 options
2. ❌ Add new room types: Reception Lobby, Factory, Gym, Verandah
3. ❌ Add toggle/checkbox for Decorative Details (Plants, Rugs, Lamps, table décor)
4. ❌ Add LOD (Level of Detail) dropdown
5. ❌ Add Shadows toggle (On/Off)
6. ❌ Update system prompt to include all new parameters

---

## 3. Floorplan-to-3D

### Current State
- **Perspective Type**: Dropdown (isometric, axonometric, oblique) ✅
- **Wall Height**: Dropdown (low, medium, high) ✅

### Requirements
- **Furniture On/Off Toggle**: ❌ **MISSING**
- **Decoration Toggle**: Plants, painting, rugs, lamps, lights ❌ **MISSING**
- **Furniture & Decor Style**: Dropdown - Contemporary / Classical / Mid-century modern ❌ **MISSING**
- **Render Style**: Dropdown - Line drawing / Solid colours / Realistic ❌ **MISSING**

### Action Items
1. ❌ Add Furniture On/Off toggle
2. ❌ Add Decoration toggle (Plants, painting, rugs, lamps, lights)
3. ❌ Add "Furniture & Decor Style" dropdown (Contemporary, Classical, Mid-century modern)
4. ❌ Add "Render Style" dropdown (Line drawing, Solid colours, Realistic)
5. ❌ Update system prompt to include all new parameters

---

## 4. Floorplan Technical Diagrams

### Current State
- **Annotation Style**: Dropdown (minimal, standard, detailed) ✅
- **Include Dimensions**: Dropdown (yes, no) ✅

### Requirements
- **Line Weight Slider**: 5-point scale ❌ **MISSING**
- **Wall Fill**: Dropdown - Hatch / Empty / Solid ❌ **MISSING**
- **Bathroom & Kitchen Fixtures**: Toggle ❌ **MISSING**

### Action Items
1. ❌ Add "Line Weight" slider (5-point scale)
2. ❌ Add "Wall Fill" dropdown (Hatch, Empty, Solid)
3. ❌ Add "Bathroom & Kitchen Fixtures" toggle
4. ❌ Update system prompt to include all new parameters

---

## 5. Exploded Diagram

### Current State
- **Component Spacing**: Dropdown (tight, medium, wide) ✅
- **Explosion Orientation**: Dropdown (vertical, horizontal, diagonal) ❌ **INCOMPLETE**

### Requirements
- **Rendering Style**: Dropdown - Linework / Solid colours / Physical model / Shaded ❌ **MISSING**
- **Reference Image**: ❌ **MISSING** (may already exist in base component)
- **Annotation**: Toggle ❌ **MISSING**
- **Explosion Orientation**: Add Custom option with X-axis, Y-axis, Z-axis selection ❌ **MISSING**

### Action Items
1. ❌ Add "Rendering Style" dropdown (Linework, Solid colours, Physical model, Shaded)
2. ❌ Verify/add Reference Image upload capability
3. ❌ Add "Annotation" toggle
4. ❌ Extend "Explosion Orientation" to include Custom with X/Y/Z axis selectors
5. ❌ Update system prompt to include all new parameters

---

## 6. Multi Angle View

### Current State
- **Number of Views**: Dropdown (2, 4, 6) ✅
- **View Type**: Dropdown (aerial, eye-level, mixed) ✅

### Requirements
- **Shot Distance**: Dropdown - Close / Mid / Wide shot / Multi ❌ **MISSING**
- **Rotation (Coverage Angle)**: Slider ❌ **MISSING**
- **Rotation Type**: Dropdown - Hor. Turn / Vert. Tilt / Turn + Tilt ❌ **MISSING**
- **Lighting Variation**: Toggle ❌ **MISSING**

### Action Items
1. ❌ Add "Shot Distance" dropdown (Close, Mid, Wide shot, Multi)
2. ❌ Add "Rotation (Coverage Angle)" slider
3. ❌ Add "Rotation Type" dropdown (Hor. Turn, Vert. Tilt, Turn + Tilt)
4. ❌ Add "Lighting Variation" toggle
5. ❌ Update system prompt to include all new parameters

---

## 7. Change Texture

### Current State
- **Material Type**: Dropdown (wood, stone, metal, fabric, concrete, marble, tile, plaster) ✅
- **Texture Intensity**: Dropdown (subtle, medium, strong) ✅
- **Preserve Original Lighting**: Dropdown (yes, no) ✅
- **Style Reference**: Image upload/library selector ✅

### Requirements
- **Texture Scale Slider**: ❌ **MISSING**
- **Text Input**: For specifying which finish has to change ❌ **MISSING**
- **Surface**: Dropdown - Floor / Wall / Ceiling / Countertop / Furniture ❌ **MISSING**
- **Gloss Level**: Dropdown - Matte / Semi / Glossy ❌ **MISSING**

### Action Items
1. ❌ Add "Texture Scale" slider
2. ❌ Add text input field for specifying finish to change
3. ❌ Add "Surface" dropdown (Floor, Wall, Ceiling, Countertop, Furniture)
4. ❌ Add "Gloss Level" dropdown (Matte, Semi, Glossy)
5. ❌ Update system prompt to include all new parameters

---

## 8. Change Lighting

### Current State
- **Lighting Type**: Dropdown (natural, warm, cool, dramatic, soft, studio) ✅
- **Time of Day**: Dropdown (day, sunset, night, dawn, golden-hour) ✅

### Requirements
- **Presets**: Library to be created ❌ **MISSING**
- **Time of Day**: Use specific options - Early Morning / Midday / Golden Hour / Dawn / Night (Artificial Lighting) ❌ **NEEDS UPDATE**
- **Lighting Type**: Checkbox - Natural & Artificial ❌ **NEEDS CHANGE**
- **Lighting Temp**: Natural, soft etc (as per you) ❌ **MISSING**
- **Sunlight Direction**: ❌ **MISSING**

### Action Items
1. ❌ Develop lighting presets library system
2. ❌ Update "Time of Day" dropdown to: Early Morning, Midday, Golden Hour, Dawn, Night (Artificial Lighting)
3. ❌ Change "Lighting Type" from dropdown to checkbox (Natural & Artificial - can select both)
4. ❌ Add "Lighting Temp" dropdown/selector
5. ❌ Add "Sunlight Direction" control (slider or dropdown)
6. ❌ Update system prompt to include all new parameters

---

## Base Component & System Architecture

### Current State
- **BaseToolComponent**: Handles common functionality (file upload, quality, aspect ratio, model selection) ✅
- **Custom Settings**: Tools can inject custom settings via `customSettings` prop ✅
- **System Prompts**: Each tool builds custom system prompts ✅

### Required Changes
1. ❌ Standardize slider components across all tools
2. ❌ Create reusable toggle/checkbox components
3. ❌ Develop style preset library infrastructure
4. ❌ Create lighting preset library infrastructure
5. ❌ Standardize 5-point modifier components
6. ❌ Update base component to support new input types if needed

---

## Implementation Priority

### High Priority (Core Functionality)
1. **Render Effects**: Maintain Detail slider, 5-point intensity
2. **Empty Floorplan to Furnished**: All missing features (presentation style, room types, decorative details, LOD, shadows)
3. **Floorplan-to-3D**: All missing features (furniture toggle, decoration, style, render style)
4. **Change Texture**: Surface selector, gloss level, texture scale
5. **Change Lighting**: Updated time of day, lighting type checkboxes, sunlight direction

### Medium Priority (Enhanced Features)
1. **Floorplan Technical Diagrams**: Line weight, wall fill, fixtures toggle
2. **Exploded Diagram**: Rendering style, annotation, custom orientation
3. **Multi Angle View**: Shot distance, rotation controls, lighting variation

### Low Priority (Libraries & Presets)
1. Style preset library development
2. Lighting preset library development

---

## Technical Notes

### Slider Components
- Need to implement consistent slider components for:
  - Maintain Detail (Render Effects)
  - Line Weight (Floorplan Technical Diagrams)
  - Texture Scale (Change Texture)
  - Rotation/Coverage Angle (Multi Angle View)
  - Sunlight Direction (Change Lighting)

### 5-Point Modifiers
- Effect Intensity (Render Effects) needs conversion from 3-point to 5-point scale
- Consider creating reusable `FivePointModifier` component

### Toggle Components
- Need consistent toggle/checkbox components for:
  - Decorative Details (Empty Floorplan to Furnished)
  - Furniture On/Off (Floorplan-to-3D)
  - Decoration (Floorplan-to-3D)
  - Shadows (Empty Floorplan to Furnished)
  - Bathroom & Kitchen Fixtures (Floorplan Technical Diagrams)
  - Annotation (Exploded Diagram)
  - Lighting Variation (Multi Angle View)
  - Natural & Artificial Lighting (Change Lighting - checkbox)

### Library Systems
- Style Preset Library: Needs database schema, storage, and UI for managing presets
- Lighting Preset Library: Needs database schema, storage, and UI for managing presets

---

## System Prompt Updates Required

All tools will need system prompt updates to incorporate new parameters. The current system prompts follow Gemini 3 best practices with structured XML-like format. Updates should maintain this structure while adding:

1. New parameter descriptions
2. New constraint definitions
3. New output requirements
4. Updated context sections

---

## Testing Requirements

After refactoring, each tool should be tested for:
1. ✅ All new inputs render correctly
2. ✅ All new inputs pass values correctly to system prompts
3. ✅ System prompts generate correctly with all parameters
4. ✅ UI/UX consistency across all tools
5. ✅ Validation and error handling for new inputs
6. ✅ Backward compatibility with existing renders

---

## Summary Statistics

### Tools Requiring Refactoring: 8
### Total Missing Features: ~35
### Total Features Needing Updates: ~5
### New Component Types Needed: 4 (Sliders, 5-point modifiers, Toggles, Library selectors)

---

## Next Steps

1. **Phase 1**: Create reusable UI components (sliders, toggles, 5-point modifiers)
2. **Phase 2**: Implement high-priority tool updates
3. **Phase 3**: Implement medium-priority tool updates
4. **Phase 4**: Develop library systems (style presets, lighting presets)
5. **Phase 5**: Testing and refinement

---

*Document created: [Current Date]*
*Last updated: [Current Date]*

