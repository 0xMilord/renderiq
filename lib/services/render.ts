import { AISDKService } from './ai-sdk-service';
import { StorageService } from './storage';
import { ProjectsDAL } from '@/lib/dal/projects';
import { RendersDAL as RendersDALNew } from '@/lib/dal/renders';
import { RenderChainService } from './render-chain';
import { RenderChainsDAL } from '@/lib/dal/render-chains';
import { db } from '@/lib/db';
import { renderVersions } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import type { CreateRenderData } from '@/lib/types';
import { logger } from '@/lib/utils/logger';

export class RenderService {
  private aiService: AISDKService;

  constructor() {
    this.aiService = AISDKService.getInstance();
  }

  async createProject(
    userId: string,
    file: File,
    projectName: string,
    description?: string,
    tags?: string[],
    isPublic?: boolean,
    platform: 'render' | 'tools' | 'canvas' = 'render'
  ) {
    try {
      logger.log('🚀 Starting project creation:', { userId, projectName, description });
      
      // ✅ OPTIMIZED: Upload file and create project in parallel where possible
      // Note: We need uploadResult.id for project creation, so we can't fully parallelize
      // But we can parallelize the file slug update with other operations
      logger.log('📤 Uploading original image...');
      const uploadResult = await StorageService.uploadFile(
        file,
        'uploads',
        userId,
        undefined, // fileName
        undefined  // projectSlug - will be generated after project creation
      );
      logger.log('✅ Image uploaded successfully:', { id: uploadResult.id, url: uploadResult.url });

      // Create project in database
      logger.log('💾 Creating project in database...');
      const project = await ProjectsDAL.create({
        userId,
        name: projectName,
        description,
        originalImageId: uploadResult.id, // Use the file ID from storage
        status: 'processing',
        isPublic: isPublic || false,
        tags: tags,
        platform: platform,
      });
      logger.log('✅ Project created successfully:', { id: project.id, slug: project.slug });

      // ✅ OPTIMIZED: Update file storage with project slug (fire-and-forget, non-blocking)
      // This doesn't need to block the response
      StorageService.updateFileProjectSlug(uploadResult.id, project.slug)
        .then(() => logger.log('✅ File storage updated with project slug'))
        .catch((updateError) => logger.warn('⚠️ Failed to update file storage with project slug:', updateError));

      return { success: true, data: project };
    } catch (error) {
      logger.error('❌ Project creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create project',
      };
    }
  }

  async createRender(renderData: CreateRenderData & { chainId?: string; referenceRenderId?: string }) {
    try {
      // Get project details
      const project = await ProjectsDAL.getById(renderData.projectId);
      if (!project) {
        return { success: false, error: 'Project not found' };
      }

      // ✅ CENTRALIZED: Get or create chain for this project using centralized service
      let chainId = renderData.chainId;
      
      if (!chainId) {
        logger.log('🔗 [createRender] No chain specified, getting or creating default chain');
        const defaultChain = await RenderChainService.getOrCreateDefaultChain(
          renderData.projectId,
          project.name
        );
        chainId = defaultChain.id;
      }

      // ✅ CENTRALIZED: Get chain position using centralized method
      const chainPosition = await RenderChainService.getNextChainPosition(chainId);

      // Upload original image if provided
      let uploadedImageUrl: string | undefined = undefined;
      let uploadedImageKey: string | undefined = undefined;
      let uploadedImageId: string | undefined = undefined;

      if (renderData.uploadedImageData && renderData.uploadedImageType) {
        logger.log('📤 [createRender] Uploading original image to storage');
        try {
          const buffer = Buffer.from(renderData.uploadedImageData, 'base64');
          const uploadedImageFile = new File([buffer], `upload_${Date.now()}.${renderData.uploadedImageType.split('/')[1] || 'png'}`, { type: renderData.uploadedImageType });
          
          const uploadResult = await StorageService.uploadFile(
            uploadedImageFile,
            'uploads',
            project.userId,
            undefined,
            project.slug
          );

          uploadedImageUrl = uploadResult.url;
          uploadedImageKey = uploadResult.key;
          uploadedImageId = uploadResult.id;
          
          logger.log('✅ [createRender] Original image uploaded:', uploadResult.url);
        } catch (error) {
          logger.error('❌ [createRender] Failed to upload original image:', error);
          // Continue without uploaded image rather than failing the entire request
        }
      }

      // Create render record with chain info
      const render = await RendersDALNew.create({
        projectId: renderData.projectId,
        userId: project.userId,
        type: renderData.type,
        prompt: renderData.prompt,
        settings: renderData.settings,
        status: 'pending',
        chainId: chainId,
        chainPosition: chainPosition,
        referenceRenderId: renderData.referenceRenderId,
        uploadedImageUrl,
        uploadedImageKey,
        uploadedImageId,
      });

      logger.log('✅ [createRender] Render created with chain:', { 
        renderId: render.id, 
        chainId,
        chainPosition 
      });

      // Start background processing
      this.processRender(render.id, project.originalImageId, renderData, {
        uploadedImageData: renderData.uploadedImageData,
        uploadedImageType: renderData.uploadedImageType
      });

      return { success: true, data: render };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create render',
      };
    }
  }

  private async processRender(
    renderId: string,
    originalImageId: string,
    renderData: CreateRenderData,
    uploadedImageData?: { uploadedImageData?: string; uploadedImageType?: string }
  ) {
    try {
      logger.log('🎨 [processRender] Starting render processing:', { renderId, type: renderData.type });
      
      // Update status to processing
      await RendersDALNew.updateStatus(renderId, 'processing');

      const startTime = Date.now();

      // ✅ OPTIMIZED: Parallelize independent operations (project fetch and storage fetch)
      const [project, originalImageUrl] = await Promise.all([
        ProjectsDAL.getById(renderData.projectId),
        StorageService.getFileUrl(originalImageId),
      ]);

      if (!project) {
        throw new Error('Project not found during render processing');
      }
      
      // Convert image URL to base64
      const imageBase64 = await this.convertImageToBase64(originalImageUrl);

      let result;
      if (renderData.type === 'image') {
        logger.log('🖼️ [processRender] Generating image with Google Generative AI...');
        result = await this.aiService.generateImage({
          prompt: renderData.prompt,
          aspectRatio: renderData.settings.aspectRatio || '16:9',
          uploadedImageData: uploadedImageData?.uploadedImageData || imageBase64,
          uploadedImageType: uploadedImageData?.uploadedImageType || 'image/jpeg',
        });
      } else {
        logger.log('🎬 [processRender] Generating video with Google Generative AI...');
        // Map aspect ratios to supported values
        const aspectRatio = renderData.settings.aspectRatio || '16:9';
        const supportedAspectRatio: '16:9' | '9:16' | '1:1' = 
          aspectRatio === '1:1' ? '1:1' :
          '16:9'; // Default to 16:9 for 4:3, 21:9, etc. (9:16 not in source type)
        
        result = await this.aiService.generateVideo({
          prompt: renderData.prompt,
          duration: renderData.settings.duration || 5,
          aspectRatio: supportedAspectRatio,
        });
      }

      const processingTime = Math.round((Date.now() - startTime) / 1000);

      if (result.success && result.data) {
        logger.log('✅ [processRender] Generation successful, uploading result...');
        // Handle the result based on type
        let fileUrl: string;
        let fileKey: string;
        
        if (renderData.type === 'image') {
          // For images, we get either imageUrl or imageData
          if (result.data.imageUrl) {
            // Download from URL
            const response = await fetch(result.data.imageUrl);
            const blob = await response.blob();
            const file = new File([blob], `render-${renderId}.jpg`);
            
            const uploadResult = await StorageService.uploadFile(
              file,
              'renders',
              project.userId
            );
            fileUrl = uploadResult.url;
            fileKey = uploadResult.key;
          } else if (result.data.imageData) {
            // Handle base64 data directly
            const base64Data = result.data.imageData.replace(/^data:image\/[a-z]+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            const file = new File([buffer], `render-${renderId}.jpg`, { type: 'image/jpeg' });
            
            const uploadResult = await StorageService.uploadFile(
              file,
              'renders',
              project.userId
            );
            fileUrl = uploadResult.url;
            fileKey = uploadResult.key;
          } else {
            throw new Error('No image data received from generation service');
          }
        } else {
          // For videos
          if (result.data.videoUrl) {
            const response = await fetch(result.data.videoUrl);
            const blob = await response.blob();
            const file = new File([blob], `render-${renderId}.mp4`);
            
            const uploadResult = await StorageService.uploadFile(
              file,
              'renders',
              project.userId
            );
            fileUrl = uploadResult.url;
            fileKey = uploadResult.key;
          } else {
            throw new Error('No video data received from generation service');
          }
        }

        logger.log('✅ [processRender] Upload successful, updating render status...');
        await RendersDALNew.updateOutput(
          renderId,
          fileUrl,
          fileKey,
          'completed',
          processingTime
        );
        
        // Create render version - we'll need to get the file storage ID
        // For now, we'll create a placeholder version
        try {
          await this.createRenderVersion(renderId, {
            prompt: renderData.prompt,
            settings: renderData.settings,
            outputFileId: '', // This would need to be the actual file storage ID
            changes: {
              type: 'initial_generation',
              timestamp: new Date().toISOString()
            }
          });
        } catch (versionError) {
          logger.warn('⚠️ Failed to create render version:', versionError);
          // Don't fail the entire operation for version creation
        }
        
        logger.log('🎉 [processRender] Render completed successfully');
      } else {
        logger.error('❌ [processRender] Generation failed:', result.error);
        await RendersDALNew.updateStatus(
          renderId,
          'failed',
          result.error
        );
      }
    } catch (error) {
      logger.error('❌ [processRender] Processing failed:', error);
      await RendersDALNew.updateStatus(
        renderId,
        'failed',
        error instanceof Error ? error.message : 'Processing failed'
      );
    }
  }

  private async convertImageToBase64(imageUrl: string): Promise<string> {
    try {
      const response = await fetch(imageUrl);
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      return `data:image/jpeg;base64,${base64}`;
    } catch (error) {
      throw new Error(`Failed to convert image to base64: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getRenderStatus(renderId: string) {
    try {
      const render = await RendersDALNew.getById(renderId);
      if (!render) {
        return { success: false, error: 'Render not found' };
      }

      return { success: true, data: render };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get render status',
      };
    }
  }

  async getProjectRenders(projectId: string) {
    try {
      const renders = await RendersDALNew.getByProjectId(projectId);
      return { success: true, data: renders };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get renders',
      };
    }
  }

  async createRenderVersion(renderId: string, versionData: {
    prompt: string;
    settings: Record<string, unknown>;
    outputFileId: string;
    changes: Record<string, unknown>;
  }) {
    try {
      // Get the current version number
      const existingVersions = await db
        .select()
        .from(renderVersions)
        .where(eq(renderVersions.renderId, renderId))
        .orderBy(desc(renderVersions.version));

      const nextVersion = existingVersions.length > 0 ? existingVersions[0].version + 1 : 1;

      const [version] = await db
        .insert(renderVersions)
        .values({
          renderId,
          version: nextVersion,
          prompt: versionData.prompt,
          settings: versionData.settings,
          outputFileId: versionData.outputFileId,
          changes: versionData.changes,
        })
        .returning();

      logger.log('✅ Render version created:', version.id);
      return { success: true, data: version };
    } catch (error) {
      logger.error('❌ Failed to create render version:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create render version',
      };
    }
  }

  async getRenderVersions(renderId: string) {
    try {
      const versions = await db
        .select()
        .from(renderVersions)
        .where(eq(renderVersions.renderId, renderId))
        .orderBy(desc(renderVersions.version));

      return { success: true, data: versions };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get render versions',
      };
    }
  }
}
