'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';

interface CreateCanvasFileModalProps {
  projectId: string;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onFileCreated?: (data: { name: string; slug: string; description?: string }) => Promise<void>;
}

export function CreateCanvasFileModal({ 
  projectId, 
  children, 
  open: controlledOpen, 
  onOpenChange, 
  onFileCreated 
}: CreateCanvasFileModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    logger.log('🚀 [CreateCanvasFileModal] Form submitted');
    
    const fileName = name.trim();
    if (!fileName) {
      toast.error('Please enter a file name');
      return;
    }

    setLoading(true);
    try {
      const slug = generateSlug(fileName);
      
      if (onFileCreated) {
        await onFileCreated({
          name: fileName,
          slug,
          description: description.trim() || undefined,
        });
      }

      setOpen(false);
      if (formRef.current) {
        formRef.current.reset();
      }
      setName('');
      setDescription('');
    } catch (error) {
      console.error('❌ [CreateCanvasFileModal] Error:', error);
      toast.error('An error occurred while creating the canvas file');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild suppressHydrationWarning>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] w-[95vw] max-w-[95vw]" suppressHydrationWarning>
        <DialogHeader>
          <DialogTitle>Create New Canvas File</DialogTitle>
          <DialogDescription>
            Create a new canvas file to start building your node workflow.
          </DialogDescription>
        </DialogHeader>
        
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fileName">File Name</Label>
              <Input
                id="fileName"
                name="fileName"
                placeholder="Enter file name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Enter file description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                className="w-full"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? 'Creating...' : 'Create File'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

