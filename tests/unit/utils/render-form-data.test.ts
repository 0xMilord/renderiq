/**
 * Tests for render form data utility
 */

import { describe, it, expect } from 'vitest';
import { createRenderFormData } from '@/lib/utils/render-form-data';

describe('Render Form Data Utils', () => {
  it('should create form data with required fields', () => {
    const formData = createRenderFormData({
      prompt: 'Test prompt',
      quality: 'high',
      aspectRatio: '16:9',
      type: 'image',
      projectId: 'project-123',
      isPublic: true,
      temperature: '0.7',
    });

    expect(formData.get('prompt')).toBe('Test prompt');
    expect(formData.get('quality')).toBe('high');
    expect(formData.get('aspectRatio')).toBe('16:9');
    expect(formData.get('type')).toBe('image');
    expect(formData.get('projectId')).toBe('project-123');
    expect(formData.get('isPublic')).toBe('true');
  });

  it('should include optional chain ID', () => {
    const formData = createRenderFormData({
      prompt: 'Test',
      quality: 'standard',
      aspectRatio: '16:9',
      type: 'image',
      projectId: 'project-123',
      chainId: 'chain-123',
      isPublic: true,
      temperature: '0.7',
    });

    expect(formData.get('chainId')).toBe('chain-123');
  });

  it('should include reference render ID', () => {
    const formData = createRenderFormData({
      prompt: 'Test',
      quality: 'standard',
      aspectRatio: '16:9',
      type: 'image',
      projectId: 'project-123',
      referenceRenderId: 'render-123',
      isPublic: true,
      temperature: '0.7',
    });

    expect(formData.get('referenceRenderId')).toBe('render-123');
  });

  it('should handle video-specific fields', () => {
    const formData = createRenderFormData({
      prompt: 'Test video',
      quality: 'high',
      aspectRatio: '16:9',
      type: 'video',
      projectId: 'project-123',
      videoDuration: 8,
      isPublic: true,
      temperature: '0.7',
    });

    expect(formData.get('type')).toBe('video');
    expect(formData.get('duration')).toBe('8');
    expect(formData.get('resolution')).toBe('1080p');
  });

  it('should include uploaded image data', () => {
    const formData = createRenderFormData({
      prompt: 'Test',
      quality: 'standard',
      aspectRatio: '16:9',
      type: 'image',
      projectId: 'project-123',
      uploadedImageBase64: 'base64data',
      uploadedImageType: 'image/png',
      isPublic: true,
      temperature: '0.7',
    });

    expect(formData.get('uploadedImageData')).toBe('base64data');
    expect(formData.get('uploadedImageType')).toBe('image/png');
  });

  it('should include style transfer image', () => {
    const formData = createRenderFormData({
      prompt: 'Test',
      quality: 'standard',
      aspectRatio: '16:9',
      type: 'image',
      projectId: 'project-123',
      styleTransferBase64: 'stylebase64',
      styleTransferImageType: 'image/jpeg',
      isPublic: true,
      temperature: '0.7',
    });

    expect(formData.get('styleTransferImageData')).toBe('stylebase64');
    expect(formData.get('styleTransferImageType')).toBe('image/jpeg');
  });

  it('should handle environment and effect', () => {
    const formData = createRenderFormData({
      prompt: 'Test',
      quality: 'standard',
      aspectRatio: '16:9',
      type: 'image',
      projectId: 'project-123',
      environment: 'outdoor',
      effect: 'vibrant',
      isPublic: true,
      temperature: '0.7',
    });

    expect(formData.get('environment')).toBe('outdoor');
    expect(formData.get('effect')).toBe('vibrant');
  });

  it('should use effect as style when provided', () => {
    const formData = createRenderFormData({
      prompt: 'Test',
      quality: 'standard',
      aspectRatio: '16:9',
      type: 'image',
      projectId: 'project-123',
      effect: 'vibrant',
      isPublic: true,
      temperature: '0.7',
    });

    expect(formData.get('style')).toBe('vibrant');
  });

  it('should default to realistic style when effect is none', () => {
    const formData = createRenderFormData({
      prompt: 'Test',
      quality: 'standard',
      aspectRatio: '16:9',
      type: 'image',
      projectId: 'project-123',
      effect: 'none',
      isPublic: true,
      temperature: '0.7',
    });

    expect(formData.get('style')).toBe('realistic');
  });
});

