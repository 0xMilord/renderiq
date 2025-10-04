import { RendersDAL } from '@/lib/dal/renders';
import type { Render } from '@/lib/types/render';

export interface VersionContext {
  renderId: string;
  prompt: string;
  settings: any;
  outputUrl: string;
  type: 'image' | 'video';
  createdAt: Date;
  chainPosition?: number;
  imageData?: string; // Base64 encoded image
  metadata?: {
    processingTime?: number;
    provider?: string;
    quality?: string;
    style?: string;
    aspectRatio?: string;
    imageType?: string;
  };
}

export interface MentionedVersion {
  mentionText: string; // e.g., "version 6", "latest version"
  renderId?: string;
  context?: VersionContext;
}

export interface ParsedPrompt {
  originalPrompt: string;
  userIntent: string; // The actual request after removing mentions
  mentionedVersions: MentionedVersion[];
  hasMentions: boolean;
}

export class VersionContextService {
  private static instance: VersionContextService;

  static getInstance(): VersionContextService {
    if (!VersionContextService.instance) {
      VersionContextService.instance = new VersionContextService();
    }
    return VersionContextService.instance;
  }

  /**
   * Parse a prompt with mentions and extract version contexts
   */
  async parsePromptWithMentions(
    prompt: string, 
    userRenders: Render[], 
    chainRenders?: Render[]
  ): Promise<{ success: boolean; data?: ParsedPrompt; error?: string }> {
    try {
      console.log('🔍 VersionContextService: Parsing prompt with mentions:', prompt);

      const mentionedVersions: MentionedVersion[] = [];
      let userIntent = prompt;

      // Find all @ mentions in the prompt (capture version number only)
      const mentionRegex = /@version\s+(\d+)/g;
      const matches = prompt.matchAll(mentionRegex);

      for (const match of matches) {
        const fullMatch = match[0]; // e.g., "@version 1"
        const versionNumber = match[1]; // e.g., "1"
        const mentionText = `version ${versionNumber}`;
        
        console.log('🔍 Found mention:', { fullMatch, mentionText });

        // Try to find the referenced render
        const referencedRender = this.findReferencedRender(mentionText, userRenders, chainRenders);
        
        if (referencedRender) {
          console.log('✅ Found referenced render:', referencedRender.id);
          
          // Get full context for this render
          const context = await this.getVersionContext(referencedRender);
          
          mentionedVersions.push({
            mentionText,
            renderId: referencedRender.id,
            context
          });

          // Remove only the @version X part, keep the rest of the user's request
          userIntent = userIntent.replace(fullMatch, '').trim();
        } else {
          console.log('⚠️ Could not find render for mention:', mentionText);
          
          // Still add the mention but without context
          mentionedVersions.push({
            mentionText,
            renderId: undefined,
            context: undefined
          });
        }
      }

      const parsedPrompt: ParsedPrompt = {
        originalPrompt: prompt,
        userIntent,
        mentionedVersions,
        hasMentions: mentionedVersions.length > 0
      };

      console.log('✅ VersionContextService: Parsed prompt:', {
        userIntent,
        mentionsCount: mentionedVersions.length,
        hasMentions: parsedPrompt.hasMentions
      });

      return {
        success: true,
        data: parsedPrompt
      };

    } catch (error) {
      console.error('❌ VersionContextService: Error parsing prompt:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse prompt'
      };
    }
  }

  /**
   * Find the render referenced by a mention
   */
  private findReferencedRender(
    mentionText: string, 
    userRenders: Render[], 
    chainRenders?: Render[]
  ): Render | null {
    const text = mentionText.toLowerCase().trim();
    
    console.log('🔍 findReferencedRender: Looking for mention:', {
      mentionText,
      text,
      userRendersCount: userRenders.length,
      chainRendersCount: chainRenders?.length || 0
    });

    // Check for version number patterns
    const versionMatch = text.match(/version\s+(\d+)/);
    if (versionMatch) {
      const versionNumber = parseInt(versionMatch[1]);
      console.log('🔍 Found version number:', versionNumber);
      
      // First check chain renders (most recent context)
      if (chainRenders && chainRenders.length > 0) {
        const sortedChainRenders = [...chainRenders]
          .filter(r => r.status === 'completed')
          .sort((a, b) => (a.chainPosition || 0) - (b.chainPosition || 0));
        
        console.log('🔍 Chain renders available:', sortedChainRenders.map((r, i) => ({
          index: i + 1,
          id: r.id,
          chainPosition: r.chainPosition,
          status: r.status
        })));
        
        if (versionNumber <= sortedChainRenders.length) {
          const render = sortedChainRenders[versionNumber - 1];
          console.log('🔍 Found render in chain:', { versionNumber, renderId: render.id });
          return render;
        } else {
          console.log('⚠️ Version number too high for chain renders:', { versionNumber, available: sortedChainRenders.length });
        }
      }

      // Fallback to user renders
      const sortedUserRenders = [...userRenders]
        .filter(r => r.status === 'completed')
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      if (versionNumber <= sortedUserRenders.length) {
        const render = sortedUserRenders[versionNumber - 1];
        console.log('🔍 Found render in user renders:', { versionNumber, renderId: render.id });
        return render;
      }
    }

    // Check for special keywords
    if (text.includes('latest') || text.includes('last')) {
      // Get the most recent completed render
      const allRenders = [
        ...(chainRenders || []),
        ...userRenders
      ].filter(r => r.status === 'completed');
      
      if (allRenders.length > 0) {
        const latest = allRenders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
        console.log('🔍 Found latest render:', { renderId: latest.id });
        return latest;
      }
    }

    if (text.includes('first') || text.includes('original')) {
      // Get the first render
      const allRenders = [
        ...(chainRenders || []),
        ...userRenders
      ].filter(r => r.status === 'completed');
      
      if (allRenders.length > 0) {
        const first = allRenders.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
        console.log('🔍 Found first render:', { renderId: first.id });
        return first;
      }
    }

    if (text.includes('previous')) {
      // Get the second most recent render
      const allRenders = [
        ...(chainRenders || []),
        ...userRenders
      ].filter(r => r.status === 'completed');
      
      if (allRenders.length > 1) {
        const sorted = allRenders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        const previous = sorted[1];
        console.log('🔍 Found previous render:', { renderId: previous.id });
        return previous;
      }
    }

    return null;
  }

  /**
   * Get full context for a render including image data
   */
  private async getVersionContext(render: Render): Promise<VersionContext> {
    console.log('🔍 VersionContextService: Getting context for render:', render.id);

    let imageData: string | undefined;

    // Download and encode the image if it exists
    if (render.outputUrl) {
      try {
        console.log('📸 Downloading reference image...');
        const response = await fetch(render.outputUrl);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          imageData = Buffer.from(arrayBuffer).toString('base64');
          console.log('✅ Image downloaded and encoded');
        } else {
          console.log('⚠️ Failed to download image');
        }
      } catch (error) {
        console.log('❌ Error downloading image:', error);
      }
    }

    const context: VersionContext = {
      renderId: render.id,
      prompt: render.prompt || '',
      settings: render.settings || {},
      outputUrl: render.outputUrl || '',
      type: render.type,
      createdAt: render.createdAt,
      chainPosition: render.chainPosition || undefined,
      imageData,
      metadata: {
        processingTime: render.processingTime,
        provider: 'unknown', // Could be enhanced to track provider
        quality: render.settings?.quality || 'standard',
        style: render.settings?.style || 'realistic',
        aspectRatio: render.settings?.aspectRatio || '16:9',
        imageType: render.settings?.imageType || '3d-mass'
      }
    };

    console.log('✅ VersionContextService: Context created:', {
      renderId: context.renderId,
      hasImageData: !!context.imageData,
      promptLength: context.prompt.length,
      settingsKeys: Object.keys(context.settings)
    });

    return context;
  }

  /**
   * Create a comprehensive prompt with version context for AI generation
   */
  createContextualPrompt(parsedPrompt: ParsedPrompt): string {
    if (!parsedPrompt.hasMentions) {
      return parsedPrompt.userIntent;
    }

    // If userIntent is empty, extract it from the original prompt by removing mentions
    let userRequest = parsedPrompt.userIntent;
    if (!userRequest || userRequest.trim() === '') {
      // Remove @version X patterns from the original prompt to get the user's request
      userRequest = parsedPrompt.originalPrompt.replace(/@version\s+\d+/g, '').trim();
    }

    let contextualPrompt = `User Request: ${userRequest}\n\n`;

    // Add context from each mentioned version
    for (const mention of parsedPrompt.mentionedVersions) {
      if (mention.context) {
        contextualPrompt += `Reference from @${mention.mentionText}:\n`;
        contextualPrompt += `- Original prompt: "${mention.context.prompt}"\n`;
        contextualPrompt += `- Style: ${mention.context.metadata?.style || 'realistic'}\n`;
        contextualPrompt += `- Quality: ${mention.context.metadata?.quality || 'standard'}\n`;
        contextualPrompt += `- Aspect ratio: ${mention.context.metadata?.aspectRatio || '16:9'}\n`;
        contextualPrompt += `- Image type: ${mention.context.metadata?.imageType || '3d-mass'}\n`;
        
        if (mention.context.metadata?.processingTime) {
          contextualPrompt += `- Processing time: ${mention.context.metadata.processingTime}s\n`;
        }
        
        contextualPrompt += '\n';
      }
    }

    contextualPrompt += `Please generate a new image based on the user request, using the referenced version(s) as context. `;
    contextualPrompt += `Maintain consistency with the referenced styles and settings where appropriate, but prioritize the user's specific request.`;

    console.log('🔍 VersionContextService: Created contextual prompt:', contextualPrompt.substring(0, 200) + '...');

    return contextualPrompt;
  }
}
