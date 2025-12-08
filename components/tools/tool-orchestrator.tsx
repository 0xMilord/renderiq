'use client';

import { ToolConfig } from '@/lib/tools/registry';
import { RenderToSectionDrawing } from './tools/render-to-section-drawing';
import { SketchToRender } from './tools/sketch-to-render';
import { FloorplanToFurnished } from './tools/floorplan-to-furnished';
import { RenderUpscale } from './tools/render-upscale';
import { PresentationBoardMaker } from './tools/presentation-board-maker';
import { ThreeDToRender } from './tools/3d-to-render';
import { RenderToCAD } from './tools/render-to-cad';
import { RenderEffects } from './tools/render-effects';
import { FloorplanTo3D } from './tools/floorplan-to-3d';
import { FloorplanTechnicalDiagrams } from './tools/floorplan-technical-diagrams';
import { ExplodedDiagram } from './tools/exploded-diagram';
import { MultiAngleView } from './tools/multi-angle-view';
import { ChangeTexture } from './tools/change-texture';
import { MaterialAlteration } from './tools/material-alteration';
import { ChangeLighting } from './tools/change-lighting';
import { UpholsteryChange } from './tools/upholstery-change';
import { ProductPlacement } from './tools/product-placement';
import { ItemChange } from './tools/item-change';
import { MoodboardToRender } from './tools/moodboard-to-render';
import { PortfolioLayoutGenerator } from './tools/portfolio-layout-generator';
import { PresentationSequenceCreator } from './tools/presentation-sequence-creator';
import { RenderToVideo } from './tools/render-to-video';
import { TextToVideoWalkthrough } from './tools/text-to-video-walkthrough';
import { KeyframeSequenceVideo } from './tools/keyframe-sequence-video';
import { GenericTool } from './tools/generic-tool';

interface ToolOrchestratorProps {
  tool: ToolConfig;
  projectId?: string | null;
  onHintChange?: (hint: string | null) => void;
  hintMessage?: string | null;
}

// Tool component mapping - All 21 tools mapped
// Sophisticated components can be swapped in as they're built
const TOOL_COMPONENTS: Record<string, React.ComponentType<{ tool: ToolConfig; projectId?: string | null; onHintChange?: (hint: string | null) => void; hintMessage?: string | null }>> = {
  // Sophisticated components (custom UI)
  'render-section-drawing': RenderToSectionDrawing,
  'sketch-to-render': SketchToRender,
  'floorplan-to-furnished': FloorplanToFurnished,
  'render-upscale': RenderUpscale,
  'presentation-board-maker': PresentationBoardMaker,
  '3d-to-render': ThreeDToRender,
  
  // Generic components (using GenericTool - can be upgraded later)
  'render-to-cad': RenderToCAD,
  'render-effects': RenderEffects,
  'floorplan-to-3d': FloorplanTo3D,
  'floorplan-technical-diagrams': FloorplanTechnicalDiagrams,
  'exploded-diagram': ExplodedDiagram,
  'multi-angle-view': MultiAngleView,
  'change-texture': ChangeTexture,
  'material-alteration': MaterialAlteration,
  'change-lighting': ChangeLighting,
  'upholstery-change': UpholsteryChange,
  'product-placement': ProductPlacement,
  'item-change': ItemChange,
  'moodboard-to-render': MoodboardToRender,
  'portfolio-layout-generator': PortfolioLayoutGenerator,
  'presentation-sequence-creator': PresentationSequenceCreator,
  
  // Video tools
  'render-to-video': RenderToVideo,
  'text-to-video-walkthrough': TextToVideoWalkthrough,
  'keyframe-sequence-video': KeyframeSequenceVideo,
};

export function ToolOrchestrator({ tool, projectId, onHintChange, hintMessage }: ToolOrchestratorProps) {
  const ToolComponent = TOOL_COMPONENTS[tool.id];

  // Use specific component if available, otherwise use generic
  if (ToolComponent) {
    return <ToolComponent tool={tool} projectId={projectId} onHintChange={onHintChange} hintMessage={hintMessage} />;
  }

  // Fallback to generic component
  return <GenericTool tool={tool} projectId={projectId} onHintChange={onHintChange} hintMessage={hintMessage} />;
}

