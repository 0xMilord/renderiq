'use client';

import { Editor } from 'tldraw';
import { CONTEXT_TYPE_DEFINITIONS, ContextItem } from '@/agent-kit/shared/types/ContextItem';
import { RenderiqPromptTag } from './RenderiqPromptTag';
import { X } from 'lucide-react';

interface RenderiqContextItemTagProps {
  item: ContextItem;
  editor: Editor;
  onClick?: () => void;
}

/**
 * Styled ContextItemTag component matching Renderiq design
 */
export function RenderiqContextItemTag({
  item,
  editor,
  onClick,
}: RenderiqContextItemTagProps) {
  const definition = CONTEXT_TYPE_DEFINITIONS[item.type];
  const name = definition.name(item, editor);
  const icon = definition.icon;

  return (
    <RenderiqPromptTag
      text={name}
      icon={icon}
      onClick={onClick}
      showRemove={!!onClick}
    />
  );
}

