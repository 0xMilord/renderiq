'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Share2, Image as ImageIcon, FileText } from 'lucide-react';
import { logger } from '@/lib/utils/logger';
import Image from 'next/image';

export default function SharePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // Handle shared content from Web Share Target API
    const handleShare = async () => {
      try {
        // Check if we're receiving shared content
        if (typeof window !== 'undefined' && 'navigator' in window && 'share' in navigator) {
          // Get shared data from URL (POST data would be handled server-side)
          const urlParams = new URLSearchParams(window.location.search);
          const sharedTitle = urlParams.get('title') || '';
          const sharedText = urlParams.get('text') || '';
          const sharedUrl = urlParams.get('url') || '';

          setTitle(sharedTitle);
          setText(sharedText);
          setUrl(sharedUrl);
          setLoading(false);

          logger.log('📤 Shared content received:', {
            title: sharedTitle,
            text: sharedText,
            url: sharedUrl,
          });
        } else {
          setLoading(false);
        }
      } catch (error) {
        logger.error('❌ Error handling share:', error);
        setLoading(false);
      }
    };

    handleShare();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleProcessShare = async () => {
    setProcessing(true);
    try {
      // If there are files, redirect to render page
      if (files.length > 0) {
        router.push('/render');
      } else if (text || title) {
        // If there's text, create a new render with it as prompt
        router.push(`/render?prompt=${encodeURIComponent(text || title)}`);
      } else {
        router.push('/render');
      }
    } catch (error) {
      logger.error('❌ Error processing share:', error);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Processing shared content...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Shared Content
          </CardTitle>
          <CardDescription>
            Content shared to Renderiq
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {title && (
            <div>
              <Label>Title</Label>
              <p className="text-sm font-medium mt-1">{title}</p>
            </div>
          )}

          {text && (
            <div>
              <Label>Text</Label>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Shared text..."
                className="mt-1"
              />
            </div>
          )}

          {url && (
            <div>
              <Label>URL</Label>
              <p className="text-sm text-muted-foreground mt-1 break-all">{url}</p>
            </div>
          )}

          <div>
            <Label htmlFor="files">Images</Label>
            <input
              id="files"
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="mt-1 block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
            {files.length > 0 && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                {files.map((file, index) => (
                  <div key={index} className="relative aspect-square rounded-md overflow-hidden bg-muted">
                    <Image
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleProcessShare}
              disabled={processing || (!text && !title && files.length === 0)}
              className="flex-1"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Create Render
                </>
              )}
            </Button>
            <Button onClick={() => router.push('/')} variant="outline">
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}











