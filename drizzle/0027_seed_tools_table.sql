-- Migration: Seed Tools Table with All Registered Tools
-- This migration populates the tools table with all 24 registered tools from the registry
-- Uses INSERT ... ON CONFLICT to make it idempotent (safe to run multiple times)

-- ============================================================================
-- TOOLS SEED DATA
-- ============================================================================

-- Category 1: Render Transformations
INSERT INTO tools (slug, name, description, category, system_prompt, input_type, output_type, priority, status, seo_metadata, is_active, created_at, updated_at)
VALUES 
  (
    'render-section-drawing',
    'Render to Section Drawing',
    'Convert renders to technical CAD sections, 3D cross-sections, or illustrated 2D drawings with text control and style references for construction docs',
    'transformation',
    'Transform this architectural render into a precise technical section drawing showing all structural elements, materials, and dimensions with architectural drafting standards',
    'image',
    'image',
    'high',
    'online',
    '{"title": "Render to Section Drawing Tool | AI Architectural Section Drawing", "description": "Transform architectural renders into precise technical section drawings with AI. Create professional section drawings with structural details and dimensions.", "keywords": ["architectural section drawing tool", "render to section", "AI section drawing", "technical section drawing"]}'::jsonb,
    true,
    NOW(),
    NOW()
  ),
  (
    'render-to-cad',
    'Render to CAD',
    'Generate floor plans, elevations, and sections in batch with CAD linework, dimensions, and annotations for permit applications and construction docs',
    'transformation',
    'Convert this photorealistic render into a clean 2D CAD-style technical drawing with precise linework, dimensions, and architectural annotations',
    'image',
    'image',
    'medium',
    'online',
    '{"title": "Render to CAD Converter | AI CAD Conversion Tool", "description": "Convert photorealistic renders into clean 2D CAD-style technical drawings with precise linework and dimensions.", "keywords": ["render to CAD", "AI CAD conversion", "photorealistic to technical drawing", "CAD converter"]}'::jsonb,
    true,
    NOW(),
    NOW()
  ),
  (
    'render-upscale',
    'Render Upscale',
    'Upscale renders 2x, 4x, or 8x with AI enhancement, sharpening edges, refining textures, and maintaining architectural accuracy for print-ready quality',
    'transformation',
    'Upscale and enhance this architectural render while maintaining quality, detail, and architectural accuracy',
    'image',
    'image',
    'high',
    'online',
    '{"title": "AI Render Upscaler | Architectural Image Enhancement", "description": "Upscale and enhance architectural renders with AI. Increase resolution while maintaining quality and detail.", "keywords": ["AI image upscaler", "render upscale", "architectural image enhancement", "image upscaling"]}'::jsonb,
    true,
    NOW(),
    NOW()
  ),
  (
    'render-effects',
    'Render Effects',
    'Apply sketch, illustration, wireframe, watercolor, or pencil effects with adjustable intensity while preserving architectural proportions and design intent',
    'transformation',
    'Apply creative effects to this architectural render while maintaining architectural accuracy and design intent',
    'image',
    'image',
    'low',
    'online',
    '{"title": "Render Effects Tool | AI Architectural Style Effects", "description": "Add creative effects to architectural renders. Transform renders with sketch, illustration, wireframe, and artistic styles.", "keywords": ["render effects", "architectural style effects", "AI render stylization", "render filters"]}'::jsonb,
    true,
    NOW(),
    NOW()
  ),

-- Category 2: Floor Plan Tools
  (
    'floorplan-to-furnished',
    'Empty Floorplan to Furnished',
    'Add modern, traditional, minimalist, or luxury furniture to floor plans with proper scale, room-specific layouts, and CAD-style technical drawing quality',
    'floorplan',
    'Add appropriate furniture and interior elements to this floor plan in CAD architectural style, maintaining scale and proportions, showing furniture layout, fixtures, and spatial organization',
    'image',
    'image',
    'high',
    'online',
    '{"title": "Floor Plan to Furnished | AI Furniture Placement Tool", "description": "Transform empty floor plans into furnished layouts. Add furniture and interior elements with proper scale and proportions.", "keywords": ["floor plan furniture", "empty floor plan to furnished", "AI floor plan design", "furniture placement tool"]}'::jsonb,
    true,
    NOW(),
    NOW()
  ),
  (
    'floorplan-to-3d',
    'Floorplan to 3D Model',
    'Transform 2D plans into isometric, axonometric, or oblique 3D diagrams with adjustable wall heights (2.4m-3.6m) and technical accuracy',
    'floorplan',
    'Transform this 2D floor plan into a professional 3D axonometric diagram showing spatial relationships, volumes, and architectural elements with proper perspective and technical accuracy',
    'image',
    'image',
    'medium',
    'online',
    '{"title": "Floor Plan to 3D Converter | 2D to 3D Floor Plan Tool", "description": "Convert 2D floor plans into professional 3D axonometric diagrams. Visualize spatial relationships and volumes.", "keywords": ["floor plan to 3D", "2D to 3D floor plan", "axonometric diagram generator", "3D floor plan"]}'::jsonb,
    true,
    NOW(),
    NOW()
  ),
  (
    'floorplan-technical-diagrams',
    'Floorplan Technical Diagrams',
    'Create technical diagrams with minimal, standard, or detailed annotations, optional dimensions, room labels, and architectural symbols for documentation',
    'floorplan',
    'Convert this floor plan into a professional technical architectural diagram with proper annotations, dimensions, room labels, and architectural standards',
    'image',
    'image',
    'medium',
    'online',
    '{"title": "Floor Plan Technical Diagrams | Architectural Diagram Tool", "description": "Convert floor plans into professional technical diagrams with annotations, dimensions, and room labels.", "keywords": ["technical floor plan", "architectural diagram tool", "floor plan annotations", "technical diagrams"]}'::jsonb,
    true,
    NOW(),
    NOW()
  ),

-- Category 3: Diagram & Visualization Tools
  (
    'exploded-diagram',
    'Exploded Diagram',
    'Generate exploded axonometric views with tight, medium, or wide component spacing in vertical, horizontal, or diagonal orientations for assembly visualization',
    'diagram',
    'Create an exploded axonometric diagram from this architectural design, showing all components separated with proper spacing, maintaining architectural accuracy and technical drawing standards',
    'image',
    'image',
    'medium',
    'online',
    '{"title": "Exploded Diagram Generator | Architectural Axonometric Tool", "description": "Create exploded axonometric diagrams from architectural designs. Show components with proper spacing and technical accuracy.", "keywords": ["exploded diagram", "axonometric exploded view", "architectural diagram generator", "exploded view tool"]}'::jsonb,
    true,
    NOW(),
    NOW()
  ),
  (
    'multi-angle-view',
    'Multi Angle View',
    'Generate 2, 4, or 6 consistent camera angles (aerial, eye-level, or mixed) with matching lighting and materials for comprehensive design visualization',
    'diagram',
    'Generate multiple camera angle views of this architectural design, showing different perspectives (aerial, eye-level, close-up) with consistent lighting and materials',
    'image',
    'image',
    'low',
    'online',
    '{"title": "Multi Angle View Tool | Architectural Perspectives Generator", "description": "Generate multiple camera angle views of architectural designs. Create aerial, eye-level, and close-up perspectives.", "keywords": ["multi angle view", "architectural perspectives", "camera angle tool", "multiple views"]}'::jsonb,
    true,
    NOW(),
    NOW()
  ),

-- Category 4: Material & Texture Tools
  (
    'change-texture',
    'Change Texture',
    'Replace interior materials with wood, stone, metal, fabric, concrete, marble, tile, or plaster with subtle, medium, or strong intensity and lighting control',
    'material',
    'Modify the textures and materials in this interior space while maintaining lighting, proportions, and spatial relationships. Apply the specified material changes with photorealistic accuracy',
    'image',
    'image',
    'medium',
    'online',
    '{"title": "Change Texture Tool | AI Material Replacement", "description": "Modify textures and materials in interior spaces with AI. Replace materials while maintaining lighting and proportions.", "keywords": ["change texture", "material replacement", "interior texture tool", "texture modification"]}'::jsonb,
    true,
    NOW(),
    NOW()
  ),
  (
    'material-alteration',
    'Material Alteration',
    'Replace facade materials with brick, glass, concrete, metal, wood, stone, or composite with matte, glossy, textured, or satin finishes while preserving structure',
    'material',
    'Alter the building materials and facade finishes in this architectural render, replacing specified materials while maintaining structural integrity, lighting, and architectural proportions',
    'image',
    'image',
    'low',
    'online',
    '{"title": "Material Alteration Tool | Facade Material Replacement", "description": "Transform building materials and facade finishes with AI. Test different materials while maintaining structural integrity.", "keywords": ["material alteration", "facade material tool", "building material replacement", "material testing"]}'::jsonb,
    true,
    NOW(),
    NOW()
  ),
  (
    'change-lighting',
    'Change Lighting',
    'Transform interior lighting with natural, warm, cool, dramatic, soft, or studio styles for day, sunset, night, dawn, or golden hour while preserving materials',
    'material',
    'Modify the lighting conditions in this interior space, adjusting natural and artificial light sources to create the specified ambiance while maintaining material accuracy and spatial relationships',
    'image',
    'image',
    'medium',
    'online',
    '{"title": "Change Lighting Tool | Interior Lighting Simulation", "description": "Transform lighting conditions in interior spaces. Adjust natural and artificial light to create different ambiances.", "keywords": ["change lighting", "interior lighting tool", "lighting simulation", "lighting design"]}'::jsonb,
    true,
    NOW(),
    NOW()
  ),

-- Category 5: Interior Design Tools
  (
    'upholstery-change',
    'Upholstery Change',
    'Replace furniture upholstery with leather, fabric, velvet, linen, suede, or canvas in solid, striped, geometric, floral, or abstract patterns while maintaining form',
    'interior',
    'Change the upholstery patterns and materials on furniture in this interior render, applying the specified fabric, pattern, and color while maintaining furniture form and lighting',
    'image',
    'image',
    'low',
    'online',
    '{"title": "Upholstery Change Tool | Furniture Fabric Replacement", "description": "Transform furniture upholstery with different patterns and materials. Test fabric options while maintaining form.", "keywords": ["upholstery change", "furniture fabric tool", "interior design upholstery", "fabric replacement"]}'::jsonb,
    true,
    NOW(),
    NOW()
  ),
  (
    'product-placement',
    'Product Placement',
    'Place products into scenes with natural, prominent, or subtle positioning, auto/ preserve/fit scale adjustment, and optional lighting matching for realistic integration',
    'interior',
    'Place the specified product into this interior scene with proper scale, lighting, shadows, and perspective, making it appear naturally integrated into the space',
    'multiple',
    'image',
    'medium',
    'online',
    '{"title": "Product Placement Tool | Interior Product Visualization", "description": "Place products into interior scenes with AI. Integrate products with proper scale, lighting, and perspective.", "keywords": ["product placement", "interior product visualization", "furniture placement tool", "product integration"]}'::jsonb,
    true,
    NOW(),
    NOW()
  ),
  (
    'item-change',
    'Item Change',
    'Replace furniture, decor, fixtures, or artwork with style-matched, contrasting, or neutral alternatives while preserving or adjusting scale and lighting',
    'interior',
    'Replace the specified items in this interior space with alternative options, maintaining scale, lighting, shadows, and spatial relationships',
    'image',
    'image',
    'low',
    'online',
    '{"title": "Item Change Tool | Interior Item Replacement", "description": "Replace and swap items in interior spaces. Test different furniture and decor options with AI precision.", "keywords": ["item replacement", "interior item swap", "furniture replacement tool", "item swap"]}'::jsonb,
    true,
    NOW(),
    NOW()
  ),
  (
    'moodboard-to-render',
    'Moodboard to Render',
    'Convert moodboards into cohesive, eclectic, minimalist, or maximalist interior renders for living, bedroom, kitchen, office, dining, or bathroom with concept to complete detail',
    'interior',
    'Transform this moodboard into a photorealistic interior render that captures the mood, color palette, materials, and aesthetic of the moodboard while creating a cohesive, realistic space',
    'image',
    'image',
    'medium',
    'online',
    '{"title": "Moodboard to Render | Interior Design Visualization", "description": "Transform moodboards into photorealistic interior renders. Bring design concepts to life with AI.", "keywords": ["moodboard to render", "interior design visualization", "moodboard converter", "design visualization"]}'::jsonb,
    true,
    NOW(),
    NOW()
  ),

-- Category 6: 3D & Model Tools
  (
    '3d-to-render',
    '3D to Render',
    'Convert 3D model screenshots to photorealistic renders with natural/dramatic/soft/studio lighting, urban/natural/minimal environments, and eye-level/aerial/low-angle/close-up cameras',
    '3d',
    'Transform this 3D model into a photorealistic architectural render with realistic materials, lighting, environment, and camera composition suitable for presentation',
    'image',
    'image',
    'high',
    'online',
    '{"title": "3D to Render Converter | Model Visualization Tool", "description": "Transform 3D models into photorealistic renders. Create presentation-ready visualizations with realistic materials and lighting.", "keywords": ["3D to render", "model visualization", "3D model rendering", "3D visualization"]}'::jsonb,
    true,
    NOW(),
    NOW()
  ),
  (
    'sketch-to-render',
    'Sketch to Render',
    'Transform sketches to photorealistic renders with preserve/enhance/transform style options and sunny/overcast/sunset/night environments while maintaining design intent',
    '3d',
    'Transform this architectural sketch into a photorealistic render, maintaining the design intent, proportions, and key elements while adding realistic materials, lighting, and environmental context',
    'image',
    'image',
    'high',
    'online',
    '{"title": "Sketch to Render | Architectural Sketch Visualization", "description": "Transform architectural sketches into photorealistic renders. Bring hand drawings to life with AI.", "keywords": ["sketch to render", "architectural sketch visualization", "hand drawing to render", "sketch converter"]}'::jsonb,
    true,
    NOW(),
    NOW()
  ),

-- Category 7: Presentation & Portfolio Tools
  (
    'presentation-board-maker',
    'Presentation Board Maker',
    'Create A3/A2/A1/A0 presentation boards with grid/masonry/linear/asymmetric/magazine layouts, light/dark/neutral/custom colors, and optional annotations for client meetings',
    'presentation',
    'Create a professional architectural presentation board layout with these images, arranging them with proper visual hierarchy, spacing, annotations, and design elements suitable for client presentations or portfolio display',
    'multiple',
    'image',
    'high',
    'online',
    '{"title": "Presentation Board Maker | Architectural Board Layout Tool", "description": "Create professional architectural presentation boards. Design layouts with proper visual hierarchy, spacing, and annotations.", "keywords": ["presentation board maker", "architectural board layout", "portfolio board tool", "presentation board software"]}'::jsonb,
    true,
    NOW(),
    NOW()
  ),
  (
    'portfolio-layout-generator',
    'Portfolio Layout Generator',
    'Generate portfolio layouts with grid/masonry/linear/magazine/editorial styles, light/dark/neutral/minimal colors, minimal/elegant/bold typography, and balanced/large/small image emphasis',
    'presentation',
    'Generate a professional architectural portfolio layout that showcases these project images with proper typography, spacing, visual hierarchy, and design elements suitable for online or print portfolios',
    'multiple',
    'image',
    'medium',
    'online',
    '{"title": "Portfolio Layout Generator | Architect Portfolio Tool", "description": "Generate professional portfolio layouts for architectural projects. Create stunning portfolio pages with proper typography and spacing.", "keywords": ["portfolio layout generator", "architect portfolio tool", "portfolio design software", "architectural portfolio maker"]}'::jsonb,
    true,
    NOW(),
    NOW()
  ),
  (
    'presentation-sequence-creator',
    'Presentation Sequence Creator',
    'Create linear/comparison/progressive/narrative sequences with horizontal/vertical/diagonal flow, smooth/clear/dramatic transitions, and minimal/detailed/no annotations for storytelling',
    'presentation',
    'Create a sequential presentation layout that tells a visual story with these architectural images, arranging them in a logical flow with proper transitions, annotations, and narrative structure for client presentations',
    'multiple',
    'image',
    'medium',
    'online',
    '{"title": "Presentation Sequence Creator | Client Presentation Tool", "description": "Create sequential presentation layouts for client meetings. Tell visual stories with proper flow and narrative structure.", "keywords": ["presentation sequence", "architectural presentation layout", "client presentation tool", "design review presentation"]}'::jsonb,
    true,
    NOW(),
    NOW()
  ),

-- Category 8: Video Generation Tools
  (
    'render-to-video',
    'Render to Video',
    'Animate architectural renders with smooth, cinematic motion. Create walkthrough videos, time-lapses, and dynamic presentations with camera movements, lighting changes, and environmental effects',
    'video',
    'Animate this architectural render with smooth, cinematic motion. Create a professional walkthrough video with appropriate camera movements, lighting transitions, and environmental effects that showcase the architectural space',
    'image',
    'video',
    'high',
    'online',
    '{"title": "Render to Video | Animate Architectural Renders", "description": "Transform static architectural renders into dynamic videos. Create walkthroughs, time-lapses, and animated presentations with AI.", "keywords": ["render to video", "animate renders", "architectural video", "walkthrough video", "image animation"]}'::jsonb,
    true,
    NOW(),
    NOW()
  ),
  (
    'text-to-video-walkthrough',
    'Text to Video Walkthrough',
    'Generate architectural walkthrough videos from text descriptions. Create virtual property tours, construction sequences, design presentations, and marketing videos with synchronized audio',
    'video',
    'Generate a professional architectural walkthrough video based on this description. Create a cinematic video that showcases the architectural space with appropriate camera movements, lighting, and environmental details',
    'image+text',
    'video',
    'high',
    'online',
    '{"title": "Text to Video Walkthrough | AI Architectural Video Generator", "description": "Generate architectural walkthrough videos from text. Create virtual tours, construction sequences, and design presentations with AI video generation.", "keywords": ["text to video", "architectural walkthrough", "virtual tour generator", "AI video generation", "property tour video"]}'::jsonb,
    true,
    NOW(),
    NOW()
  ),
  (
    'keyframe-sequence-video',
    'Keyframe Sequence Video',
    'Create smooth video transitions between multiple keyframe images (2-3 images). Perfect for showing design evolution, before/after sequences, and design variations with seamless transitions',
    'video',
    'Create a smooth video transition between these keyframe images, showing a seamless progression that maintains architectural accuracy and visual continuity',
    'multiple',
    'video',
    'medium',
    'online',
    '{"title": "Keyframe Sequence Video | Design Transition Tool", "description": "Create smooth video transitions between design keyframes. Show design evolution and variations with seamless AI-generated transitions.", "keywords": ["keyframe video", "design transition", "before after video", "design evolution video", "sequence video"]}'::jsonb,
    true,
    NOW(),
    NOW()
  )

ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  system_prompt = EXCLUDED.system_prompt,
  input_type = EXCLUDED.input_type,
  output_type = EXCLUDED.output_type,
  priority = EXCLUDED.priority,
  status = EXCLUDED.status,
  seo_metadata = EXCLUDED.seo_metadata,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify all 24 tools were inserted/updated
DO $$
DECLARE
  tool_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO tool_count FROM tools;
  
  IF tool_count < 24 THEN
    RAISE WARNING 'Expected 24 tools, but found % tools', tool_count;
  ELSE
    RAISE NOTICE '✅ Successfully seeded % tools', tool_count;
  END IF;
END $$;

