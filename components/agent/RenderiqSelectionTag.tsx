'use client';

import { RenderiqPromptTag } from './RenderiqPromptTag';

interface RenderiqSelectionTagProps {
  onClick?: () => void;
}

/**
 * Styled SelectionTag component matching Renderiq design
 */
export function RenderiqSelectionTag({ onClick }: RenderiqSelectionTagProps) {
  return (
    <RenderiqPromptTag
      text="Selection"
      icon="cursor"
      onClick={onClick}
      showRemove={!!onClick}
    />
  );
}

