import { Metadata } from 'next';
import { PromptGalleryPage } from '@/components/prompts/prompt-gallery-page';

export const metadata: Metadata = {
  title: 'Prompt Gallery | Renderiq',
  description: 'Browse ready-made prompts optimized for architectural visualization and AI rendering',
};

export default function PromptsPage() {
  return <PromptGalleryPage />;
}




