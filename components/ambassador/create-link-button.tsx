'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CreateCustomLinkDialog } from './create-custom-link-dialog';

export function CreateLinkButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm" className="flex items-center gap-2">
        <Plus className="h-4 w-4" />
        <span>Create Link</span>
      </Button>
      <CreateCustomLinkDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

