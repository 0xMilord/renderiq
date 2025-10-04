import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProjectsDAL } from '@/lib/dal/projects';
import { RenderChainsDAL } from '@/lib/dal/render-chains';
import { ChatPageClient } from '@/app/chat/chat-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ChatPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  console.log('🚀 [ChatPage SSR] Fetching data for user:', user.id);
  const startTime = Date.now();

  // Batch fetch: Get all projects and chains with renders in minimal queries
  const [projects, chainsWithRenders] = await Promise.all([
    ProjectsDAL.getByUserId(user.id),
    RenderChainsDAL.getUserChainsWithRenders(user.id)
  ]);

  const endTime = Date.now();
  console.log(`✅ [ChatPage SSR] Data fetched in ${endTime - startTime}ms`, {
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
}
