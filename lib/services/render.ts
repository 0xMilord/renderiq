import { ImageGenerationService } from './image-generation';
import { StorageService } from './storage';
import { ProjectsDAL, RendersDAL } from '@/lib/dal/projects';
import { db } from '@/lib/db';
import { renderVersions } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import type { CreateRenderData } from '@/lib/types';

export class RenderService {
  private imageGenerationService: ImageGenerationService;

  constructor() {
    this.imageGenerationService = ImageGenerationService.getInstance();
  }

  async createProject(
    userId: string,
    file: File,
    projectName: string,
    description?: string
  ) {
    try {
      console.log('🚀 Starting project creation:', { userId, projectName, description });
      
      // Upload original image first
      console.log('📤 Uploading original image...');
      const uploadResult = await StorageService.uploadFile(
        file,
        'uploads',
        userId,
        undefined, // fileName
        undefined  // projectSlug - will be generated after project creation
      );
      console.log('✅ Image uploaded successfully:', { id: uploadResult.id, url: uploadResult.url });

      // Create project in database
      console.log('💾 Creating project in database...');
      const project = await ProjectsDAL.create({
        userId,
        name: projectName,
        description,
        originalImageId: uploadResult.id, // Use the file ID from storage
        status: 'processing',
      });
      console.log('✅ Project created successfully:', { id: project.id, slug: project.slug });

      // Update the file storage record with the project slug for better organization
      console.log('🔄 Updating file storage with project slug...');
      try {
        await StorageService.updateFileProjectSlug(uploadResult.id, project.slug);
        console.log('✅ File storage updated with project slug');
      } catch (updateError) {
        console.warn('⚠️ Failed to update file storage with project slug:', updateError);
        // Don't fail the entire operation for this
      }

      return { success: true, data: project };
    } catch (error) {
      console.error('❌ Project creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create project',
      };
    }
  }

  async createRender(renderData: CreateRenderData) {
    try {
      // Get project details
      const project = await ProjectsDAL.getById(renderData.projectId);
      if (!project) {
        return { success: false, error: 'Project not found' };
      }

      // Create render record
      const render = await RendersDAL.create({
        projectId: renderData.projectId,
        userId: project.userId,
        type: renderData.type,
        prompt: renderData.prompt,
        settings: renderData.settings,
        status: 'pending',
      });

      // Start background processing
      this.processRender(render.id, project.originalImageId, renderData);

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
    renderData: CreateRenderData
  ) {
    try {
      console.log('🎨 [processRender] Starting render processing:', { renderId, type: renderData.type });
      
      // Update status to processing
      await RendersDAL.updateStatus(renderId, 'processing');

      const startTime = Date.now();

      // Get project details to get userId
      const project = await ProjectsDAL.getById(renderData.projectId);
      if (!project) {
        throw new Error('Project not found during render processing');
      }

      // Get the original image URL from storage
      const originalImageUrl = await StorageService.getFileUrl(originalImageId);
      
      // Convert image URL to base64
      const imageBase64 = await this.convertImageToBase64(originalImageUrl);

      let result;
      if (renderData.type === 'image') {
        console.log('🖼️ [processRender] Generating image...');
        result = await this.imageGenerationService.generateImage({
          prompt: renderData.prompt,
          style: renderData.settings.style,
          quality: renderData.settings.quality,
          aspectRatio: renderData.settings.aspectRatio,
          type: 'image',
          uploadedImageData: imageBase64,
          uploadedImageType: 'image/jpeg',
        });
      } else {
        console.log('🎬 [processRender] Generating video...');
        result = await this.imageGenerationService.generateVideo({
          prompt: renderData.prompt,
          style: renderData.settings.style,
          quality: renderData.settings.quality,
          aspectRatio: renderData.settings.aspectRatio,
          duration: renderData.settings.duration || 5,
        });
      }

      const processingTime = Math.round((Date.now() - startTime) / 1000);

      if (result.success && result.data) {
        console.log('✅ [processRender] Generation successful, uploading result...');
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

        console.log('✅ [processRender] Upload successful, updating render status...');
        await RendersDAL.updateStatus(
          renderId,
          'completed',
          fileUrl,
          fileKey,
          undefined,
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
          console.warn('⚠️ Failed to create render version:', versionError);
          // Don't fail the entire operation for version creation
        }
        
        console.log('🎉 [processRender] Render completed successfully');
      } else {
        console.error('❌ [processRender] Generation failed:', result.error);
        await RendersDAL.updateStatus(
          renderId,
          'failed',
          undefined,
          undefined,
          result.error,
          processingTime
        );
      }
    } catch (error) {
      console.error('❌ [processRender] Processing failed:', error);
      await RendersDAL.updateStatus(
        renderId,
        'failed',
        undefined,
        undefined,
        error instanceof Error ? error.message : 'Processing failed',
        undefined
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
      const render = await RendersDAL.getById(renderId);
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
      const renders = await RendersDAL.getByProjectId(projectId);
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
    settings: Record<string, any>;
    outputFileId: string;
    changes: Record<string, any>;
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

      console.log('✅ Render version created:', version.id);
      return { success: true, data: version };
    } catch (error) {
      console.error('❌ Failed to create render version:', error);
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
