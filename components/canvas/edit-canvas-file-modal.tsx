'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCanvasFileOperations } from '@/lib/hooks/use-canvas-files';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';
import type { CanvasFile } from '@/lib/db/schema';

interface EditCanvasFileModalProps {
  file: CanvasFile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFileUpdated?: () => void;
}

export function EditCanvasFileModal({ file, open, onOpenChange, onFileUpdated }: EditCanvasFileModalProps) {
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { updateFile } = useCanvasFileOperations();
  const [formData, setFormData] = useState({
    name: file.name || '',
    description: file.description || '',
  });

  useEffect(() => {
    if (file) {
      setFormData({
        name: file.name || '',
        description: file.description || '',
      });
    }
  }, [file]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    logger.log('🚀 [EditCanvasFileModal] Form submitted');
    
    const fileName = formData.name.trim();
    if (!fileName) {
      toast.error('Please enter a file name');
      return;
    }

    setLoading(true);
    try {
      const slug = generateSlug(fileName);
      
      const result = await updateFile(file.id, {
        name: fileName,
        slug,
        description: formData.description.trim() || undefined,
      });

      if (result.success) {
        logger.log('✅ [EditCanvasFileModal] File updated successfully');
        toast.success('Canvas file updated successfully');
        onOpenChange(false);
        if (formRef.current) {
          formRef.current.reset();
        }
        if (onFileUpdated) {
          onFileUpdated();
        }
      }
    } catch (error) {
      console.error('❌ [EditCanvasFileModal] Error:', error);
      toast.error('An error occurred while updating the canvas file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] w-[95vw] max-w-[95vw]" suppressHydrationWarning>
        <DialogHeader>
          <DialogTitle>Edit Canvas File</DialogTitle>
          <DialogDescription>
            Update the canvas file details.
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
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
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
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? 'Updating...' : 'Update File'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

