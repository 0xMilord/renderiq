import { redirect } from 'next/navigation';
import { getCachedUser } from '@/lib/services/auth-cache';
import { getUserRendersByProject } from '@/lib/actions/library.actions';
import { LibraryClient } from './library-client';
import type { Metadata } from 'next';

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Library | All Renders | Dashboard | Renderiq',
  description: 'View all your renders organized by project in your library.',
};

export default async function LibraryPage() {
  const { user } = await getCachedUser();

  if (!user) {
    redirect('/login');
  }

  const result = await getUserRendersByProject();
  const rendersByProject = result.success ? result.data || [] : [];

  return <LibraryClient rendersByProject={rendersByProject} />;
}

