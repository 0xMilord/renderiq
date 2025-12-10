'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';
import type { CanvasFile } from '@/lib/db/schema';

interface DuplicateCanvasFileModalProps {
  file: CanvasFile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFileDuplicated?: (newName?: string) => Promise<void>;
}

export function DuplicateCanvasFileModal({ file, open, onOpenChange, onFileDuplicated }: DuplicateCanvasFileModalProps) {
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [fileName, setFileName] = useState('');

  useEffect(() => {
    if (open && file) {
      setFileName(`${file.name} (Copy)`);
    }
  }, [open, file]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    logger.log('🚀 [DuplicateCanvasFileModal] Form submitted');
    
    const name = fileName.trim();
    if (!name) {
      toast.error('Please enter a file name');
      return;
    }

    setLoading(true);
    try {
      logger.log('📝 [DuplicateCanvasFileModal] Duplicating file:', file.id);

      if (onFileDuplicated) {
        await onFileDuplicated(name);
      }

      logger.log('✅ [DuplicateCanvasFileModal] File duplicated successfully');
      toast.success('Canvas file duplicated successfully');
      onOpenChange(false);
      setFileName('');
      if (formRef.current) {
        formRef.current.reset();
      }
    } catch (error) {
      console.error('❌ [DuplicateCanvasFileModal] Error:', error);
      toast.error('An error occurred while duplicating the canvas file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] w-[95vw] max-w-[95vw]" suppressHydrationWarning>
        <DialogHeader>
          <DialogTitle>Duplicate Canvas File</DialogTitle>
          <DialogDescription>
            Create a copy of &quot;{file.name}&quot;. You can change the name if needed.
          </DialogDescription>
        </DialogHeader>
        
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fileName">New File Name</Label>
              <Input
                id="fileName"
                name="fileName"
                placeholder="Enter file name"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                required
                maxLength={100}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                This will create a copy of the canvas file with all its nodes, connections, and workflow data.
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? 'Duplicating...' : 'Duplicate File'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

