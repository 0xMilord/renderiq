/**
 * Helper functions for use case and tool integration
 */

import { primaryUseCases } from '@/lib/data/use-cases';
import { getToolBySlug, type ToolConfig } from '@/lib/tools/registry';

/**
 * Get related tools for a use case by slug
 */
export function getRelatedToolsForUseCase(useCaseSlug: string): ToolConfig[] {
  const useCase = primaryUseCases.find(uc => uc.slug === useCaseSlug);
  if (!useCase || !('relatedTools' in useCase)) {
    return [];
  }

  const relatedToolSlugs = (useCase as any).relatedTools || [];
  return relatedToolSlugs
    .map((slug: string) => getToolBySlug(slug))
    .filter((tool): tool is ToolConfig => tool !== undefined && tool.status === 'online');
}

/**
 * Get all use cases that use a specific tool
 */
export function getUseCasesForTool(toolSlug: string): typeof primaryUseCases[number][] {
  return primaryUseCases.filter(useCase => {
    if (!('relatedTools' in useCase)) return false;
    const relatedTools = (useCase as any).relatedTools || [];
    return relatedTools.includes(toolSlug);
  });
}

