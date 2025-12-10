/**
 * Comprehensive tests for type schemas and validations
 */

import { describe, it, expect } from 'vitest';
import { 
  uploadSchema, 
  createRenderSchema, 
  renderSettingsSchema 
} from '@/lib/types';

describe('Type Schemas', () => {
  describe('uploadSchema', () => {
    it('should validate valid upload data', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const validData = {
        file,
        projectName: 'Test Project',
        description: 'Test description',
      };
      
      const result = uploadSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.projectName).toBe('Test Project');
        expect(result.data.description).toBe('Test description');
      }
    });

    it('should validate upload data without description', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const validData = {
        file,
        projectName: 'Test Project',
      };
      
      const result = uploadSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty project name', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const invalidData = {
        file,
        projectName: '',
      };
      
      const result = uploadSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing file', () => {
      const invalidData = {
        projectName: 'Test Project',
      };
      
      const result = uploadSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing project name', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const invalidData = {
        file,
      };
      
      const result = uploadSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('renderSettingsSchema', () => {
    it('should validate valid render settings', () => {
      const validSettings = {
        style: 'photorealistic',
        quality: 'high',
        aspectRatio: '16:9',
      };
      
      const result = renderSettingsSchema.safeParse(validSettings);
      expect(result.success).toBe(true);
    });

    it('should validate render settings with duration for video', () => {
      const validSettings = {
        style: 'architectural',
        quality: 'ultra',
        aspectRatio: '21:9',
        duration: 30,
      };
      
      const result = renderSettingsSchema.safeParse(validSettings);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.duration).toBe(30);
      }
    });

    it('should reject invalid style', () => {
      const invalidSettings = {
        style: 'invalid-style',
        quality: 'high',
        aspectRatio: '16:9',
      };
      
      const result = renderSettingsSchema.safeParse(invalidSettings);
      expect(result.success).toBe(false);
    });

    it('should reject invalid quality', () => {
      const invalidSettings = {
        style: 'photorealistic',
        quality: 'invalid-quality',
        aspectRatio: '16:9',
      };
      
      const result = renderSettingsSchema.safeParse(invalidSettings);
      expect(result.success).toBe(false);
    });

    it('should reject invalid aspect ratio', () => {
      const invalidSettings = {
        style: 'photorealistic',
        quality: 'high',
        aspectRatio: 'invalid',
      };
      
      const result = renderSettingsSchema.safeParse(invalidSettings);
      expect(result.success).toBe(false);
    });

    it('should reject duration less than 1', () => {
      const invalidSettings = {
        style: 'photorealistic',
        quality: 'high',
        aspectRatio: '16:9',
        duration: 0,
      };
      
      const result = renderSettingsSchema.safeParse(invalidSettings);
      expect(result.success).toBe(false);
    });

    it('should reject duration greater than 60', () => {
      const invalidSettings = {
        style: 'photorealistic',
        quality: 'high',
        aspectRatio: '16:9',
        duration: 61,
      };
      
      const result = renderSettingsSchema.safeParse(invalidSettings);
      expect(result.success).toBe(false);
    });

    it('should accept all valid style values', () => {
      const styles = ['photorealistic', 'architectural', 'modern', 'classic', 'futuristic'];
      
      for (const style of styles) {
        const settings = {
          style,
          quality: 'high',
          aspectRatio: '16:9',
        };
        
        const result = renderSettingsSchema.safeParse(settings);
        expect(result.success).toBe(true);
      }
    });

    it('should accept all valid quality values', () => {
      const qualities = ['standard', 'high', 'ultra'];
      
      for (const quality of qualities) {
        const settings = {
          style: 'photorealistic',
          quality,
          aspectRatio: '16:9',
        };
        
        const result = renderSettingsSchema.safeParse(settings);
        expect(result.success).toBe(true);
      }
    });

    it('should accept all valid aspect ratio values', () => {
      const aspectRatios = ['16:9', '4:3', '1:1', '21:9'];
      
      for (const aspectRatio of aspectRatios) {
        const settings = {
          style: 'photorealistic',
          quality: 'high',
          aspectRatio,
        };
        
        const result = renderSettingsSchema.safeParse(settings);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('createRenderSchema', () => {
    it('should validate valid render data', () => {
      const validData = {
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'image',
        prompt: 'A beautiful landscape',
        settings: {
          style: 'photorealistic',
          quality: 'high',
          aspectRatio: '16:9',
        },
      };
      
      const result = createRenderSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate render data with optional fields', () => {
      const validData = {
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'image',
        prompt: 'A beautiful landscape',
        settings: {
          style: 'photorealistic',
          quality: 'high',
          aspectRatio: '16:9',
        },
        uploadedImageData: 'base64data',
        uploadedImageType: 'image/jpeg',
      };
      
      const result = createRenderSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate video render data', () => {
      const validData = {
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'video',
        prompt: 'A beautiful landscape video',
        settings: {
          style: 'photorealistic',
          quality: 'high',
          aspectRatio: '16:9',
          duration: 30,
        },
      };
      
      const result = createRenderSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID for projectId', () => {
      const invalidData = {
        projectId: 'invalid-uuid',
        type: 'image',
        prompt: 'Test prompt',
        settings: {
          style: 'photorealistic',
          quality: 'high',
          aspectRatio: '16:9',
        },
      };
      
      const result = createRenderSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid type', () => {
      const invalidData = {
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'invalid-type',
        prompt: 'Test prompt',
        settings: {
          style: 'photorealistic',
          quality: 'high',
          aspectRatio: '16:9',
        },
      };
      
      const result = createRenderSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject empty prompt', () => {
      const invalidData = {
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'image',
        prompt: '',
        settings: {
          style: 'photorealistic',
          quality: 'high',
          aspectRatio: '16:9',
        },
      };
      
      const result = createRenderSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing prompt', () => {
      const invalidData = {
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'image',
        settings: {
          style: 'photorealistic',
          quality: 'high',
          aspectRatio: '16:9',
        },
      };
      
      const result = createRenderSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing settings', () => {
      const invalidData = {
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'image',
        prompt: 'Test prompt',
      };
      
      const result = createRenderSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept both image and video types', () => {
      const types = ['image', 'video'];
      
      for (const type of types) {
        const data = {
          projectId: '123e4567-e89b-12d3-a456-426614174000',
          type,
          prompt: 'Test prompt',
          settings: {
            style: 'photorealistic',
            quality: 'high',
            aspectRatio: '16:9',
          },
        };
        
        const result = createRenderSchema.safeParse(data);
        expect(result.success).toBe(true);
      }
    });
  });
});

