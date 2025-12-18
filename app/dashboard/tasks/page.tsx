import { Metadata } from 'next';
import { TasksPageClient } from '@/components/tasks/tasks-page-client';

export const metadata: Metadata = {
  title: 'Earn Credits | Renderiq',
  description: 'Complete tasks to earn credits. All tasks happen inside Renderiq.',
};

export default function TasksPage() {
  return <TasksPageClient />;
}

