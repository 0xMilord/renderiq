'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, FileImage, AlertCircle } from 'lucide-react';
import { logger } from '@/lib/utils/logger';

export default function OpenFilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Handle file from file handler API
    const handleFile = async () => {
      try {
        // Check if we're being opened via file handler
        if ('launchQueue' in window && 'files' in (window as any).launchQueue) {
          const launchQueue = (window as any).launchQueue;
          
          launchQueue.setConsumer(async (launchParams: any) => {
            if (launchParams.files && launchParams.files.length > 0) {
              const fileHandle = launchParams.files[0];
              const file = await fileHandle.getFile();
              setFile(file);
              setLoading(false);
              
              logger.log('📁 File opened via file handler:', {
                name: file.name,
                type: file.type,
                size: file.size,
              });
              
              // Redirect to render page with file
              router.push(`/render?file=${encodeURIComponent(file.name)}`);
            }
          });
        } else {
          // Fallback: check URL parameters
          const fileUrl = searchParams.get('url');
          if (fileUrl) {
            // Handle shared file URL
            const response = await fetch(fileUrl);
            const blob = await response.blob();
            const fileName = fileUrl.split('/').pop() || 'shared-file';
            const file = new File([blob], fileName, { type: blob.type });
            setFile(file);
            setLoading(false);
            router.push(`/render?file=${encodeURIComponent(fileName)}`);
          } else {
            setLoading(false);
            setError('No file provided');
          }
        }
      } catch (err) {
        logger.error('❌ Error handling file:', err);
        setError(err instanceof Error ? err.message : 'Failed to open file');
        setLoading(false);
      }
    };

    handleFile();
  }, [router, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Opening file...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Error Opening File
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/')} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (file) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileImage className="h-5 w-5" />
              File Opened
            </CardTitle>
            <CardDescription>
              {file.name} ({file.type})
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>File size: {(file.size / 1024).toFixed(2)} KB</p>
              <p>Type: {file.type}</p>
            </div>
            <Button onClick={() => router.push('/render')} className="w-full">
              Open in Render
            </Button>
            <Button onClick={() => router.push('/')} variant="outline" className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}

