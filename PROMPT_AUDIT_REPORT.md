# Prompt Engineering Audit Report: Render to Section Drawing Tool

## Executive Summary

The system prompt for the "Render to Section Drawing" tool has been audited against Google Gemini 3 AI prompt engineering best practices and significantly improved. The original prompt was too vague and lacked structure, which could lead to inconsistent results.

## Issues Found in Original Prompt

### 1. **Lack of Structure**
- ❌ No clear delimiters or XML tags
- ❌ Instructions were not separated from context
- ❌ No clear role definition

### 2. **Vague Instructions**
- ❌ "Transform this architectural render into..." - too generic
- ❌ "showing all structural elements" - unclear what "all" means
- ❌ No specific constraints on what to include/exclude

### 3. **Missing Context**
- ❌ No explanation of architectural drafting standards
- ❌ No definition of LOD levels
- ❌ No specification of output format requirements

### 4. **No Constraints**
- ❌ Didn't specify what NOT to do
- ❌ No format requirements
- ❌ No quality standards

### 5. **Not Following Gemini 3 Best Practices**
- ❌ Not using structured format (XML tags)
- ❌ Not being precise and direct
- ❌ Not defining parameters explicitly
- ❌ Not controlling output verbosity

## Improvements Made

### 1. **Structured Format (XML Tags)**
Following Gemini 3 best practices, the prompt now uses clear XML-style tags:
- `<role>` - Defines the AI's expertise
- `<task>` - Clear, direct instruction
- `<constraints>` - Explicit do's and don'ts
- `<output_requirements>` - Detailed specifications
- `<context>` - Background information

### 2. **Precise and Direct Instructions**
- ✅ Clear task definition: "Transform the provided architectural render image into [specific type]"
- ✅ Explicit detail level: "with [level] level of detail ([specific description])"
- ✅ Specific style requirements for each section type

### 3. **Comprehensive Constraints**
- ✅ 8 explicit constraints covering format, style, detail level, inclusions, exclusions
- ✅ Clear "Do not" section to prevent unwanted outputs
- ✅ Professional quality requirements

### 4. **Detailed Parameter Definitions**
Each section type and LOD level now has:
- **Type definition**: What kind of drawing
- **Style specification**: How it should look
- **Elements to include**: Specific components
- **Level of detail**: Exact detail requirements
- **Inclusions/Exclusions**: Clear boundaries

### 5. **Context and Standards**
- ✅ Explanation of architectural drafting standards
- ✅ Purpose clarification (documentation, construction, design communication)
- ✅ Professional quality requirements

## Technical Implementation

### Section Type Configurations

**Technical CAD:**
- Style: Technical linework with precise measurements
- Elements: Structural elements, materials, dimensions, annotations

**3D Cross Section:**
- Style: Three-dimensional perspective
- Elements: 3D structural elements, material textures, depth cues

**Illustrated 2D:**
- Style: Stylized architectural illustration
- Elements: Visual styling with technical accuracy

### LOD Level Definitions

**LOD 100 (Conceptual):**
- Basic shapes and volumes
- Overall building form
- Excludes: Specific materials, detailed dimensions

**LOD 200 (Approximate):**
- Generic elements with approximate sizes
- Basic material indications
- Excludes: Specific products, exact measurements

**LOD 300 (Precise):**
- Specific elements with exact dimensions
- Material specifications
- Detailed annotations
- Excludes: Fabrication details

**LOD 400 (Fabrication):**
- Complete specifications
- Assembly details
- Fabrication-ready information

## Expected Improvements

### 1. **Consistency**
- More consistent outputs due to explicit constraints
- Clear boundaries prevent model interpretation issues

### 2. **Quality**
- Professional quality requirements ensure high standards
- Architectural drafting standards maintain accuracy

### 3. **Relevance**
- LOD-specific inclusions/exclusions ensure appropriate detail level
- Section type specifications ensure correct style

### 4. **Reliability**
- Structured format helps Gemini 3 parse instructions correctly
- Clear constraints reduce unwanted outputs

## Gemini 3 Best Practices Applied

✅ **Be precise and direct**: Clear task definition
✅ **Use consistent structure**: XML tags for organization
✅ **Define parameters**: Explicit LOD and section type definitions
✅ **Control output verbosity**: Specific format requirements
✅ **Prioritize critical instructions**: Constraints at the beginning
✅ **Structure for clarity**: Clear delimiters between sections

## Recommendations

1. **Monitor Results**: Test the improved prompt with various inputs to ensure consistency
2. **Iterate Based on Feedback**: Adjust constraints if needed based on actual outputs
3. **Apply to Other Tools**: Use this structured approach for other tool prompts
4. **Add Few-Shot Examples**: Consider adding example outputs for even better results (future enhancement)

## Conclusion

The improved prompt follows Google Gemini 3 best practices and should provide more consistent, high-quality results. The structured format, explicit constraints, and detailed parameter definitions ensure the AI model understands exactly what is required for each section type and LOD level.

