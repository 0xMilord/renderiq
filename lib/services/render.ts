import { NanoBananaService } from './nano-banana';
import { StorageService } from './storage';
import { ProjectsDAL, RendersDAL } from '@/lib/dal/projects';
import { UsersDAL } from '@/lib/dal/users';
import type { CreateRenderData, RenderSettings } from '@/lib/types';

export class RenderService {
  private nanoBanana: NanoBananaService;

  constructor() {
    this.nanoBanana = new NanoBananaService();
  }

  async createProject(
    userId: string,
    file: File,
    projectName: string,
    description?: string
  ) {
    try {
      // Upload original image
      const uploadResult = await StorageService.uploadFile(
        file,
        'projects',
        userId
      );

      // Create project in database
      const project = await ProjectsDAL.create({
        userId,
        name: projectName,
        description,
        originalImageUrl: uploadResult.url,
        originalImageKey: uploadResult.key,
        status: 'processing',
      });

      return { success: true, data: project };
    } catch (error) {
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
        type: renderData.type,
        prompt: renderData.prompt,
        settings: renderData.settings,
        status: 'pending',
      });

      // Start background processing
      this.processRender(render.id, project.originalImageUrl, renderData);

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
    originalImageUrl: string,
    renderData: CreateRenderData
  ) {
    try {
      // Update status to processing
      await RendersDAL.updateStatus(renderId, 'processing');

      const startTime = Date.now();

      // Convert image URL to base64
      const imageBase64 = await this.convertImageToBase64(originalImageUrl);

      let result;
      if (renderData.type === 'image') {
        result = await this.nanoBanana.generateImage({
          image: imageBase64,
          prompt: renderData.prompt,
          style: renderData.settings.style,
          quality: renderData.settings.quality,
          aspectRatio: renderData.settings.aspectRatio,
        });
      } else {
        // For video, we'll use the same image multiple times
        // In a real implementation, you might have multiple frames
        result = await this.nanoBanana.generateVideo({
          images: [imageBase64],
          prompt: renderData.prompt,
          style: renderData.settings.style,
          quality: renderData.settings.quality,
          duration: renderData.settings.duration,
        });
      }

      const processingTime = Math.round((Date.now() - startTime) / 1000);

      if (result.success && result.data) {
        // Download and upload the result to our storage
        const response = await fetch(result.data.url);
        const blob = await response.blob();
        const file = new File([blob], `render-${renderId}.${renderData.type === 'video' ? 'mp4' : 'jpg'}`);

        const uploadResult = await StorageService.uploadFile(
          file,
          'renders',
          renderData.type
        );

        await RendersDAL.updateStatus(
          renderId,
          'completed',
          uploadResult.url,
          uploadResult.key,
          undefined,
          processingTime
        );
      } else {
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
}
