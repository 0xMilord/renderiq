import { redirect } from 'next/navigation';
import { getCachedUser } from '@/lib/services/auth-cache';
import { ProjectsDAL } from '@/lib/dal/projects';
import { RenderChainsDAL } from '@/lib/dal/render-chains';
import { ChatPageClient } from '@/app/render/chat-client';
import { logger } from '@/lib/utils/logger';
import { getRenderChain } from '@/lib/actions/projects.actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ChatPageProps {
  searchParams: Promise<{ chain?: string }>;
}

export default async function ChatPage({ searchParams }: ChatPageProps) {
  try {
    const { user } = await getCachedUser();

    if (!user) {
      console.error('❌ [ChatPage SSR] Auth error: No user');
      redirect('/login');
    }

    // ✅ FIXED: Handle chain query parameter - redirect to proper project/chain route
    const params = await searchParams;
    if (params.chain) {
      logger.log('🔍 [ChatPage SSR] Chain query parameter detected, redirecting:', params.chain);
      
      try {
        // Fetch chain to get projectId
        const chainResult = await getRenderChain(params.chain);
        
        if (chainResult.success && chainResult.data) {
          // Get project to get slug
          const project = await ProjectsDAL.getById(chainResult.data.projectId);
          
          if (project) {
            logger.log('✅ [ChatPage SSR] Redirecting to project/chain route:', {
              projectSlug: project.slug,
              chainId: params.chain
            });
            redirect(`/project/${project.slug}/chain/${params.chain}`);
          } else {
            logger.error('❌ [ChatPage SSR] Project not found for chain:', params.chain);
          }
        } else {
          logger.error('❌ [ChatPage SSR] Chain not found:', params.chain);
        }
      } catch (error) {
        logger.error('❌ [ChatPage SSR] Error fetching chain for redirect:', error);
        // Continue to render normal page if redirect fails
      }
    }

    logger.log('🚀 [ChatPage SSR] Fetching data for user:', user.id);
    const startTime = Date.now();

    // Batch fetch: Get all projects and chains with renders in minimal queries
    const [projects, chainsWithRenders] = await Promise.all([
      ProjectsDAL.getByUserId(user.id),
      RenderChainsDAL.getUserChainsWithRenders(user.id)
    ]);

    const endTime = Date.now();
    logger.log(`✅ [ChatPage SSR] Data fetched in ${endTime - startTime}ms`, {
      projects: projects.length,
      chains: chainsWithRenders.length,
      totalRenders: chainsWithRenders.reduce((sum, c) => sum + c.renders.length, 0)
    });

    return (
      <ChatPageClient
        initialProjects={projects}
        initialChains={chainsWithRenders}
      />
    );
  } catch (error) {
    console.error('❌ [ChatPage SSR] Fatal error:', error);
    // Return error state instead of throwing
    return (
      <div className="flex items-center justify-center h-[calc(100vh-var(--navbar-height))]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Error Loading Render</h2>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
          <a 
            href="/login" 
            className="text-primary hover:underline"
          >
            Return to Login
          </a>
        </div>
      </div>
    );
  }
}
