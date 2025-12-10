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
  searchParams: Promise<{ chain?: string; prompt?: string; project?: string }>;
}

export default async function ChatPage({ searchParams }: ChatPageProps) {
  try {
    const { user } = await getCachedUser();

    if (!user) {
      logger.error('❌ [ChatPage SSR] Auth error: No user');
      redirect('/login');
    }

    // Handle chain query parameter - redirect to proper project/chain route
    // This is for backward compatibility with old URLs using ?chain=...
    const params = await searchParams;
    if (params.chain) {
      // Fetch chain to get projectId
      const chainResult = await getRenderChain(params.chain);
      
      if (chainResult.success && chainResult.data) {
        // Get project to get slug
        const project = await ProjectsDAL.getById(chainResult.data.projectId);
        
        if (project) {
          // Redirect to proper route structure: /project/{slug}/chain/{chainId}
          // Note: redirect() throws NEXT_REDIRECT which is expected behavior
          redirect(`/project/${project.slug}/chain/${params.chain}`);
        }
      }
      // If chain not found, continue to render normal page
    }

    logger.log('🚀 [ChatPage SSR] Fetching data for user:', user.id);
    const startTime = Date.now();

    // Batch fetch: Get render platform projects and chains with renders in minimal queries
    const [projects, chainsWithRenders] = await Promise.all([
      ProjectsDAL.getByUserId(user.id, 100, 0, 'render'),
      RenderChainsDAL.getUserChainsWithRenders(user.id)
    ]);

    const endTime = Date.now();
    logger.log(`✅ [ChatPage SSR] Data fetched in ${endTime - startTime}ms`, {
      projects: projects.length,
      chains: chainsWithRenders.length,
      totalRenders: chainsWithRenders.reduce((sum, c) => sum + c.renders.length, 0)
    });

    // Extract project slug from query params if present
    const projectSlug = params.project;

    return (
      <ChatPageClient
        initialProjects={projects}
        initialChains={chainsWithRenders}
        initialProjectSlug={projectSlug}
      />
    );
  } catch (error) {
    logger.error('❌ [ChatPage SSR] Fatal error:', error);
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
