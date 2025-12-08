# Prompt & Settings Alignment Audit

## Executive Summary

**Status**: ⚠️ **Issues Found - Needs Optimization**

The system has good structure but has redundancy, missing style reference mentions, and some fluff in prompts.

---

## Findings

### ✅ **What's Working Well**

1. **Structured XML Prompts**: Tools use Gemini 3 best practices with `<role>`, `<task>`, `<constraints>`, `<output_requirements>`, `<context>` tags
2. **Settings Injection**: Custom tools (render-to-section-drawing, sketch-to-render) properly inject settings into prompts
3. **Style Reference Handling**: Style references correctly passed as images to API
4. **Tool Prompt Detection**: AI SDK correctly detects structured tool prompts and skips redundant modifiers

### ❌ **Critical Issues**

#### 1. **Style Reference Not Mentioned in Prompts**
- **Location**: `render-to-section-drawing.tsx`
- **Issue**: Style reference image is passed to API but NOT mentioned in the prompt
- **Impact**: Model may not understand the style reference is intentional
- **Fix**: Add style reference instruction to prompt when provided

#### 2. **Redundancy in Prompts**
- **Location**: `render-to-section-drawing.tsx` 
- **Issue**: Section cut direction and view type mentioned 4 times:
  - `<task>` section
  - `<constraints>` section (items 3 & 4)
  - `<output_requirements>` section
  - `<context>` section
- **Impact**: Token waste, potential confusion
- **Fix**: Mention once in `<task>`, reference in constraints/output

#### 3. **Base Tool Component - No Settings Injection**
- **Location**: `base-tool-component.tsx`
- **Issue**: Uses `tool.systemPrompt` directly without injecting quality/aspect ratio/model
- **Impact**: Generic tools don't benefit from settings in prompts
- **Note**: This is acceptable since quality/aspect ratio are API parameters, not prompt instructions

#### 4. **Fluff in Descriptions**
- **Location**: `render-to-section-drawing.tsx`
- **Issue**: Some descriptions are verbose:
  - "The input may show any architectural content: whole buildings (any type or style), building components, interior spaces, exterior views, or detail views."
  - "Work with any architectural content, building type, or style."
- **Impact**: Token waste
- **Fix**: Simplify to essential information

---

## Detailed Analysis

### Render-to-Section-Drawing Prompt

**Current Structure**:
```xml
<role>...</role>
<task>
  ${styleConfig.task}. The input may show any architectural content...
  Section Cut Direction: Create a ${cutDirectionDescriptions[sectionCutDirection]} section cut.
  Section View Type: Generate the section using ${viewTypeDescriptions[sectionViewType]}.
</task>
<constraints>
  1. Output format: ...
  2. Visual style: ${styleConfig.style}
  3. Section cut direction: ${cutDirectionDescriptions[sectionCutDirection]}  ← REDUNDANT
  4. Section view type: ${viewTypeDescriptions[sectionViewType]}  ← REDUNDANT
  ...
</constraints>
<output_requirements>
  - Section cut direction: ${cutDirectionDescriptions[sectionCutDirection]}  ← REDUNDANT
  - Section view type: ${viewTypeDescriptions[sectionViewType]}  ← REDUNDANT
  ...
</output_requirements>
<context>
  ... The section must be cut ${cutDirectionDescriptions[sectionCutDirection]} and displayed using ${viewTypeDescriptions[sectionViewType]}. ...  ← REDUNDANT
</context>
```

**Issues**:
1. Section cut/view type mentioned 4 times
2. Style reference not mentioned when provided
3. Verbose descriptions about "any architectural content"

**Recommended Fix**:
- Mention cut/view type once in `<task>`
- Reference in constraints as "As specified in task"
- Add style reference instruction when provided
- Remove verbose "any architectural content" fluff

---

## Recommendations

### Priority 1: High Impact

1. **Add Style Reference to Prompt** (render-to-section-drawing)
   - When style reference provided, add instruction in `<task>` or `<constraints>`
   - Example: "Match the visual style, linework characteristics, and presentation approach from the provided style reference image."

2. **Remove Redundancy** (render-to-section-drawing)
   - Mention section cut/view type once in `<task>`
   - In constraints, reference: "Section cut and view type: As specified in task"
   - Remove from `<output_requirements>` and simplify `<context>`

3. **Simplify Descriptions**
   - Remove "The input may show any architectural content: whole buildings..."
   - Remove "Work with any architectural content, building type, or style"
   - Keep only essential information

### Priority 2: Medium Impact

4. **Audit Other Tools**
   - Check sketch-to-render, presentation-board-maker for similar issues
   - Ensure style references are mentioned in prompts when used

5. **Consistent Style Reference Handling**
   - All tools should mention style reference in prompt when provided
   - Use consistent instruction format

---

## Implementation Plan

1. ✅ Fix render-to-section-drawing prompt:
   - Remove redundancy
   - Add style reference instruction
   - Simplify descriptions

2. ⏳ Audit other custom tools:
   - sketch-to-render
   - presentation-board-maker
   - render-to-cad
   - upholstery-change

3. ⏳ Create prompt template guidelines
   - Standardize structure
   - Define when to mention settings
   - Define style reference instruction format

---

## Settings Flow Diagram

```
User Settings → FormData → API Route → AI SDK Service → Gemini API
     ↓              ↓           ↓              ↓              ↓
  UI State    formData.append  Extract    generateImage   API Call
     ↓              ↓           ↓              ↓              ↓
  Prompt      Settings      Settings      Prompt +      Request
  Builder     (metadata)    (params)      Settings      (params)
```

**Key Insight**: 
- Settings like `quality`, `aspectRatio`, `model` are API parameters (correctly handled)
- Settings like `sectionType`, `cutDirection`, `viewType` are prompt instructions (correctly injected)
- Style reference is BOTH: image parameter AND should be mentioned in prompt

---

## Conclusion

The system is well-structured but needs optimization:
- ✅ Good: Structured XML prompts, proper settings injection
- ⚠️ Needs Fix: Redundancy, missing style reference mentions, fluff
- ✅ Correct: API parameter handling (quality, aspect ratio, model)

**Next Steps**: Implement Priority 1 fixes, then audit other tools.

