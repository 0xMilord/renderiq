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
   * Parse a prompt with mentions and extract version contexts - SMART and MINIMAL
   */
  async parsePromptWithMentions(
    prompt: string, 
    userRenders: Render[], 
    chainRenders?: Render[]
  ): Promise<{ success: boolean; data?: ParsedPrompt; error?: string }> {
    try {
      console.log('🔍 VersionContext: Parsing prompt with mentions:', prompt);

      const mentionedVersions: MentionedVersion[] = [];
      let userIntent = prompt;

      // Enhanced mention detection - support multiple formats
      const mentionPatterns = [
        /@version\s+(\d+)/g,           // @version 1
        /@(\d+)/g,                     // @1 (short format)
        /version\s+(\d+)/g,            // version 1
        /#(\d+)/g,                     // #1 (hash format)
        /@latest/g,                    // @latest
        /@previous/g,                  // @previous
        /@first/g                      // @first
      ];

      for (const pattern of mentionPatterns) {
        const matches = prompt.matchAll(pattern);
        
        for (const match of matches) {
          const fullMatch = match[0];
          let mentionText: string;
          let versionNumber: string | null = null;

          // Handle different mention formats
          if (fullMatch.includes('@latest')) {
            mentionText = 'latest version';
          } else if (fullMatch.includes('@previous')) {
            mentionText = 'previous version';
          } else if (fullMatch.includes('@first')) {
            mentionText = 'first version';
          } else if (match[1]) {
            versionNumber = match[1];
            mentionText = `version ${versionNumber}`;
          } else {
            continue; // Skip invalid matches
          }
          
          console.log('🔍 Found mention:', { fullMatch, mentionText, versionNumber });

          // Try to find the referenced render
          const referencedRender = this.findReferencedRender(mentionText, userRenders, chainRenders);
          
          if (referencedRender) {
            console.log('✅ Found referenced render:', referencedRender.id);
            
            // Get MINIMAL context for this render
            const context = await this.getMinimalVersionContext(referencedRender);
            
            mentionedVersions.push({
              mentionText,
              renderId: referencedRender.id,
              context
            });

            // Remove the mention from user intent
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
      }

      const parsedPrompt: ParsedPrompt = {
        originalPrompt: prompt,
        userIntent,
        mentionedVersions,
        hasMentions: mentionedVersions.length > 0
      };

      console.log('✅ VersionContext: Parsed prompt:', {
        userIntent,
        mentionsCount: mentionedVersions.length,
        hasMentions: parsedPrompt.hasMentions
      });

      return {
        success: true,
        data: parsedPrompt
      };

    } catch (error) {
      console.error('❌ VersionContext: Error parsing prompt:', error);
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
   * Get MINIMAL context for a render - only essential info
   */
  private async getMinimalVersionContext(render: Render): Promise<VersionContext> {
    console.log('🔍 VersionContext: Getting minimal context for render:', render.id);

    let imageData: string | undefined;

    // Only download image if absolutely necessary (for @ mentions)
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
        provider: 'unknown',
        quality: render.settings?.quality || 'standard',
        style: render.settings?.style || 'realistic',
        aspectRatio: render.settings?.aspectRatio || '16:9',
        imageType: render.settings?.imageType || '3d-mass'
      }
    };

    console.log('✅ VersionContext: Minimal context created:', {
      renderId: context.renderId,
      hasImageData: !!context.imageData,
      promptLength: context.prompt.length
    });

    return context;
  }

  /**
   * Get full context for a render including image data (DEPRECATED - use getMinimalVersionContext)
   */
  private async getVersionContext(render: Render): Promise<VersionContext> {
    return this.getMinimalVersionContext(render);
  }

  /**
   * Create a CLEAN prompt with version context for AI generation - MINIMAL NOISE
   */
  createContextualPrompt(parsedPrompt: ParsedPrompt): string {
    if (!parsedPrompt.hasMentions) {
      return parsedPrompt.userIntent;
    }

    // Extract clean user request
    let userRequest = parsedPrompt.userIntent;
    if (!userRequest || userRequest.trim() === '') {
      // Remove all mention patterns to get clean user request
      userRequest = parsedPrompt.originalPrompt
        .replace(/@version\s+\d+/g, '')
        .replace(/@\d+/g, '')
        .replace(/version\s+\d+/g, '')
        .replace(/#\d+/g, '')
        .replace(/@latest/g, '')
        .replace(/@previous/g, '')
        .replace(/@first/g, '')
        .trim();
    }

    // Build clean, minimal contextual prompt
    // Follow best practices: clear instructions, avoid redundancy
    let contextualPrompt = userRequest.trim();

    // Only add essential reference info if versions are mentioned
    // Keep it concise - the model understands references from context
    if (parsedPrompt.mentionedVersions.length > 0 && parsedPrompt.mentionedVersions.some(m => m.context)) {
      // Use simple, direct reference instruction
      const referenceCount = parsedPrompt.mentionedVersions.filter(m => m.context).length;
      if (referenceCount === 1) {
        contextualPrompt += `. Use the referenced version as a reference`;
      } else {
        contextualPrompt += `. Use the referenced versions as references`;
      }
    }

    console.log('🔍 VersionContext: Created clean contextual prompt:', {
      originalLength: parsedPrompt.originalPrompt.length,
      contextualLength: contextualPrompt.length,
      mentionsCount: parsedPrompt.mentionedVersions.length
    });

    return contextualPrompt;
  }
}
