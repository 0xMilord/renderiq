'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function ProjectChainsPage() {
  const params = useParams();
  const router = useRouter();
  const projectSlug = params.projectSlug as string;

  // Redirect to project page (which shows chains in a tab)
  useEffect(() => {
    router.replace(`/project/${projectSlug}`);
  }, [projectSlug, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="w-96">
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Redirecting...</p>
        </CardContent>
      </Card>
    </div>
  );
}


