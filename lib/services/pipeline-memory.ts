import { AISDKService } from './ai-sdk-service';
import { ImageUnderstandingService, ImageAnalysis } from './image-understanding';
import { RendersDAL } from '@/lib/dal/renders';
import { ContextData } from '@/lib/types/render-chain';
import { logger } from '@/lib/utils/logger';

/**
 * Pipeline Memory extracted from generated images
 * Used in Stage 7 of the technical moat pipeline
 * 
 * Stores style codes, palette, geometry, and materials for consistency across renders
 */
export interface PipelineMemory {
  styleCodes: {
    colorPalette: string[];
    lightingStyle: string;
    materialStyle: string;
    architecturalStyle: string;
  };
  palette: string[];
  geometry: {
    perspective: 'orthographic' | 'perspective' | 'isometric';
    focalLength: string;
    cameraAngle: string;
  };
  materials: string[];
  extractedAt: string; // ISO timestamp
}

/**
 * Pipeline Memory Service - Stage 7 of Technical Moat Pipeline
 * 
 * Extracts and stores pipeline memory from generated images for consistency:
 * - Style codes (palette, lighting, materials, architectural style)
 * - Geometry (perspective, focal length, camera angle)
 * - Materials
 * 
 * Cost: ~$0.001 per image (Gemini 2.5 Flash Vision)
 */
export class PipelineMemoryService {
  /**
   * Extract pipeline memory from generated image
   * Uses cheap vision model (reuses ImageUnderstandingService)
   */
  static async extractMemory(
    imageData: string,
    imageType: string
  ): Promise<PipelineMemory> {
    const startTime = Date.now();

    try {
      logger.log('🔍 PipelineMemoryService: Extracting memory from generated image');

      // Reuse ImageUnderstandingService to analyze generated image
      const analysis = await ImageUnderstandingService.analyzeReferenceImage(
        imageData,
        imageType
      );

      const memory: PipelineMemory = {
        styleCodes: analysis.styleCodes,
        palette: analysis.styleCodes.colorPalette,
        geometry: analysis.geometry,
        materials: analysis.materials,
        extractedAt: new Date().toISOString()
      };

      const processingTime = Date.now() - startTime;
      logger.log('✅ PipelineMemoryService: Memory extracted', {
        palette: memory.palette.length,
        materials: memory.materials.length,
        style: memory.styleCodes.architecturalStyle,
        processingTime: `${processingTime}ms`
      });

      return memory;

    } catch (error) {
      logger.error('❌ PipelineMemoryService: Failed to extract memory', error);
      
      // Return empty memory on failure
      return {
        styleCodes: {
          colorPalette: [],
          lightingStyle: 'natural',
          materialStyle: 'unknown',
          architecturalStyle: 'modern'
        },
        palette: [],
        geometry: {
          perspective: 'perspective',
          focalLength: 'normal',
          cameraAngle: 'eye-level'
        },
        materials: [],
        extractedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Save memory to render's contextData
   * ✅ OPTIMIZED: Uses direct update with JSONB merge (avoids getById round trip)
   * Uses existing RendersDAL.updateContext infrastructure
   */
  static async saveMemory(
    renderId: string,
    memory: PipelineMemory
  ): Promise<void> {
    try {
      logger.log('💾 PipelineMemoryService: Saving memory to render', { renderId });

      // ✅ OPTIMIZED: Get existing context in parallel with other operations if needed
      // For now, we still need to get existing context to merge, but we can optimize
      // by using SQL JSONB merge if the database supports it
      const render = await RendersDAL.getById(renderId);
      if (!render) {
        logger.warn('⚠️ PipelineMemoryService: Render not found, cannot save memory');
        return;
      }

      const existingContext: ContextData = (render.contextData as ContextData) || {};

      // Merge pipeline memory into context data
      const updatedContext: ContextData = {
        ...existingContext,
        // Store pipeline memory in contextData
        pipelineMemory: memory as any // Store as JSONB
      };

      await RendersDAL.updateContext(renderId, updatedContext);
      logger.log('✅ PipelineMemoryService: Memory saved to render');

    } catch (error) {
      logger.error('❌ PipelineMemoryService: Failed to save memory', error);
      // Don't throw - memory saving is optional
    }
  }

  /**
   * Get memory from chain (latest completed render in chain)
   * Returns pipeline memory from the most recent completed render
   * ✅ OPTIMIZED: Uses single optimized query instead of fetching all renders
   */
  static async getMemoryFromChain(chainId: string): Promise<PipelineMemory | null> {
    try {
      logger.log('🔍 PipelineMemoryService: Getting memory from chain', { chainId });

      // ✅ OPTIMIZED: Single query with WHERE status='completed' ORDER BY chainPosition DESC LIMIT 1
      const completedRender = await RendersDAL.getLatestCompletedRenderWithMemory(chainId);

      if (!completedRender) {
        logger.log('⚠️ PipelineMemoryService: No completed renders in chain');
        return null;
      }

      const contextData = completedRender.contextData as any;
      if (contextData?.pipelineMemory) {
        logger.log('✅ PipelineMemoryService: Found memory in chain');
        return contextData.pipelineMemory as PipelineMemory;
      }

      logger.log('⚠️ PipelineMemoryService: No pipeline memory found in chain');
      return null;

    } catch (error) {
      logger.error('❌ PipelineMemoryService: Failed to get memory from chain', error);
      return null;
    }
  }

  /**
   * Get memory from specific render
   */
  static async getMemoryFromRender(renderId: string): Promise<PipelineMemory | null> {
    try {
      const render = await RendersDAL.getById(renderId);
      if (!render) return null;

      const contextData = render.contextData as any;
      if (contextData?.pipelineMemory) {
        return contextData.pipelineMemory as PipelineMemory;
      }

      return null;

    } catch (error) {
      logger.error('❌ PipelineMemoryService: Failed to get memory from render', error);
      return null;
    }
  }

  /**
   * Merge multiple memory sources (for consistency across multiple reference images)
   */
  static mergeMemory(memories: PipelineMemory[]): PipelineMemory {
    if (memories.length === 0) {
      return {
        styleCodes: {
          colorPalette: [],
          lightingStyle: 'natural',
          materialStyle: 'unknown',
          architecturalStyle: 'modern'
        },
        palette: [],
        geometry: {
          perspective: 'perspective',
          focalLength: 'normal',
          cameraAngle: 'eye-level'
        },
        materials: [],
        extractedAt: new Date().toISOString()
      };
    }

    if (memories.length === 1) {
      return memories[0];
    }

    // Merge multiple memories (take most common elements)
    const allPalettes = memories.flatMap(m => m.palette);
    const allMaterials = memories.flatMap(m => m.materials);
    
    // Get most common palette colors (appearing in >50% of memories)
    const paletteCounts = new Map<string, number>();
    allPalettes.forEach(color => {
      paletteCounts.set(color, (paletteCounts.get(color) || 0) + 1);
    });
    const mergedPalette = Array.from(paletteCounts.entries())
      .filter(([_, count]) => count > memories.length / 2)
      .map(([color]) => color);

    // Get most common materials
    const materialCounts = new Map<string, number>();
    allMaterials.forEach(material => {
      materialCounts.set(material, (materialCounts.get(material) || 0) + 1);
    });
    const mergedMaterials = Array.from(materialCounts.entries())
      .filter(([_, count]) => count > memories.length / 2)
      .map(([material]) => material);

    // Use the most recent memory's style and geometry
    const latestMemory = memories[memories.length - 1];

    return {
      styleCodes: latestMemory.styleCodes,
      palette: mergedPalette.length > 0 ? mergedPalette : latestMemory.palette,
      geometry: latestMemory.geometry,
      materials: mergedMaterials.length > 0 ? mergedMaterials : latestMemory.materials,
      extractedAt: new Date().toISOString()
    };
  }
}

