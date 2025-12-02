import { createAvatar } from '@dicebear/core';
import { thumbs } from '@dicebear/collection';
import { logger } from '@/lib/utils/logger';

export interface AvatarOptions {
  seed?: string;
  size?: number;
  backgroundColor?: string[];
  backgroundType?: string[];
  eyes?: string[];
  eyesColor?: string[];
  face?: string[];
  mouth?: string[];
  mouthColor?: string[];
  shape?: string[];
  shapeColor?: string[];
  flip?: boolean;
  rotate?: number;
  scale?: number;
  radius?: number;
}

export class AvatarService {
  /**
   * Generate a unique avatar URL using DiceBear Thumbs style
   * @param userId - User ID to use as seed for consistent avatars
   * @param options - Optional avatar customization
   * @returns Avatar URL
   */
  static generateAvatarUrl(userId: string, options: AvatarOptions = {}): string {
    logger.log('🎨 AvatarService: Generating avatar for user:', userId);
    
    try {
      // Create URL parameters for DiceBear API
      const params = new URLSearchParams({
        seed: userId,
        size: (options.size || 128).toString(),
        backgroundColor: (options.backgroundColor || ['transparent']).join(','),
        backgroundType: (options.backgroundType || ['solid']).join(','),
        eyes: (options.eyes || ['variant1', 'variant2', 'variant3', 'variant4', 'variant5', 'variant6']).join(','),
        eyesColor: (options.eyesColor || ['4a90e2', '7b68ee', 'ff6b6b', '4ecdc4', '45b7d1', '96ceb4']).join(','),
        face: (options.face || ['variant1', 'variant2', 'variant3', 'variant4', 'variant5', 'variant6']).join(','),
        mouth: (options.mouth || ['variant1', 'variant2', 'variant3', 'variant4', 'variant5', 'variant6']).join(','),
        mouthColor: (options.mouthColor || ['f4a261', 'e76f51', 'd62828', 'f77f00', 'fcbf49']).join(','),
        shape: (options.shape || ['variant1', 'variant2', 'variant3', 'variant4', 'variant5', 'variant6']).join(','),
        shapeColor: (options.shapeColor || ['f4a261', 'e76f51', 'd62828', 'f77f00', 'fcbf49', 'e9c46a']).join(','),
        flip: (options.flip || false).toString(),
        rotate: (options.rotate || 0).toString(),
        scale: (options.scale || 100).toString(),
        radius: (options.radius || 0).toString(),
        translateX: '0',
        translateY: '0',
        clip: 'true',
        randomizeIds: 'true',
      });

      const avatarUrl = `https://api.dicebear.com/9.x/thumbs/svg?${params.toString()}`;
      
      logger.log('✅ AvatarService: Avatar URL generated:', avatarUrl);
      return avatarUrl;
    } catch (error) {
      logger.error('❌ AvatarService: Failed to generate avatar:', error);
      // Return a fallback avatar
      return this.getFallbackAvatar();
    }
  }

  /**
   * Generate avatar with random seed for variety
   * @param options - Optional avatar customization
   * @returns Avatar URL
   */
  static generateRandomAvatar(options: AvatarOptions = {}): string {
    logger.log('🎨 AvatarService: Generating random avatar');
    
    const randomSeed = Math.random().toString(36).substring(2, 15);
    return this.generateAvatarUrl(randomSeed, options);
  }

  /**
   * Generate avatar based on email for consistent avatars per email
   * @param email - User email to use as seed
   * @param options - Optional avatar customization
   * @returns Avatar URL
   */
  static generateAvatarFromEmail(email: string, options: AvatarOptions = {}): string {
    logger.log('🎨 AvatarService: Generating avatar from email:', email);
    
    // Use email as seed for consistent avatars
    const emailSeed = email.toLowerCase().replace(/[^a-z0-9]/g, '');
    return this.generateAvatarUrl(emailSeed, options);
  }

  /**
   * Generate avatar with specific style variations
   * @param userId - User ID to use as seed
   * @param style - Style name for different looks
   * @returns Avatar URL
   */
  static generateStyledAvatar(userId: string, style: 'professional' | 'casual' | 'colorful' | 'minimal' = 'professional'): string {
    logger.log('🎨 AvatarService: Generating styled avatar:', style);
    
    const styleOptions: Record<string, AvatarOptions> = {
      professional: {
        backgroundColor: ['f8f9fa'],
        backgroundType: ['solid'],
        eyesColor: ['2c3e50'],
        mouthColor: ['34495e'],
        shapeColor: ['3498db', '2980b9'],
        radius: 8,
      },
      casual: {
        backgroundColor: ['ecf0f1'],
        backgroundType: ['gradientLinear'],
        eyesColor: ['e74c3c', 'f39c12', '27ae60'],
        mouthColor: ['e67e22', 'f1c40f'],
        shapeColor: ['e67e22', 'f39c12', 'e74c3c'],
        radius: 20,
      },
      colorful: {
        backgroundColor: ['ff6b6b', '4ecdc4', '45b7d1', '96ceb4', 'feca57'],
        backgroundType: ['gradientLinear'],
        eyesColor: ['ff6b6b', '4ecdc4', '45b7d1', '96ceb4', 'feca57'],
        mouthColor: ['ff6b6b', '4ecdc4', '45b7d1', '96ceb4', 'feca57'],
        shapeColor: ['ff6b6b', '4ecdc4', '45b7d1', '96ceb4', 'feca57'],
        radius: 15,
      },
      minimal: {
        backgroundColor: ['ffffff'],
        backgroundType: ['solid'],
        eyesColor: ['2c3e50'],
        mouthColor: ['34495e'],
        shapeColor: ['95a5a6'],
        radius: 0,
        scale: 80,
      },
    };

    const options = styleOptions[style] || styleOptions.professional;
    return this.generateAvatarUrl(userId, options);
  }

  /**
   * Get fallback avatar when generation fails
   * @returns Fallback avatar URL
   */
  private static getFallbackAvatar(): string {
    // Simple fallback avatar using DiceBear API
    return 'https://api.dicebear.com/9.x/thumbs/svg?seed=fallback&backgroundColor=transparent&backgroundType=solid&eyes=variant1&eyesColor=6c757d&face=variant1&mouth=variant1&mouthColor=6c757d&shape=variant1&shapeColor=e9ecef&size=128';
  }

  /**
   * Generate multiple avatar options for user to choose from
   * @param userId - User ID to use as seed
   * @param count - Number of avatars to generate
   * @returns Array of avatar URLs
   */
  static generateAvatarOptions(userId: string, count: number = 4): string[] {
    logger.log('🎨 AvatarService: Generating avatar options:', count);
    
    const avatars: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const seed = `${userId}-${i}`;
      const options: AvatarOptions = {
        backgroundColor: ['transparent'],
        backgroundType: ['solid'],
        eyesColor: ['4a90e2', '7b68ee', 'ff6b6b', '4ecdc4', '45b7d1', '96ceb4'],
        mouthColor: ['f4a261', 'e76f51', 'd62828', 'f77f00', 'fcbf49'],
        shapeColor: ['f4a261', 'e76f51', 'd62828', 'f77f00', 'fcbf49', 'e9c46a'],
        radius: i * 5, // Vary the radius for different looks
        rotate: i * 15, // Slight rotation variation
      };
      
      avatars.push(this.generateAvatarUrl(seed, options));
    }
    
    logger.log('✅ AvatarService: Generated avatar options:', avatars.length);
    return avatars;
  }

  /**
   * Validate if an avatar URL is valid
   * @param avatarUrl - Avatar URL to validate
   * @returns True if valid, false otherwise
   */
  static isValidAvatarUrl(avatarUrl: string): boolean {
    try {
      // Check if it's a DiceBear URL
      if (avatarUrl.startsWith('https://api.dicebear.com/9.x/thumbs/svg')) {
        return true;
      }
      
      // Check if it's a data URL (legacy support)
      if (avatarUrl.startsWith('data:image/svg+xml;base64,')) {
        const base64Content = avatarUrl.replace('data:image/svg+xml;base64,', '');
        const decoded = Buffer.from(base64Content, 'base64').toString('utf-8');
        return decoded.includes('<svg') && decoded.includes('</svg>');
      }
      
      return false;
    } catch (error) {
      logger.error('❌ AvatarService: Invalid avatar URL:', error);
      return false;
    }
  }
}
