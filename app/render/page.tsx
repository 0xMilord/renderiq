import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProjectsDAL } from '@/lib/dal/projects';
import { RenderChainsDAL } from '@/lib/dal/render-chains';
import { ChatPageClient } from '@/app/render/chat-client';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ChatPage() {
  try {
    const supabase = await createClient();
    
    if (!supabase) {
      console.error('❌ [ChatPage SSR] Failed to create Supabase client');
      redirect('/login');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('❌ [ChatPage SSR] Auth error:', authError);
      redirect('/login');
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
      <div className="flex items-center justify-center h-[calc(100vh-2.75rem)]">
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
