/**
 * Canvas Keyboard Shortcuts
 * Handles keyboard shortcuts for canvas operations
 */

export type ShortcutAction =
  | 'add-text-node'
  | 'add-image-node'
  | 'add-variants-node'
  | 'add-style-node'
  | 'add-material-node'
  | 'add-output-node'
  | 'delete-selected'
  | 'copy-selected'
  | 'paste'
  | 'undo'
  | 'redo'
  | 'save'
  | 'select-all'
  | 'deselect-all'
  | 'zoom-in'
  | 'zoom-out'
  | 'fit-view';

export interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: ShortcutAction;
  description: string;
}

export const CANVAS_SHORTCUTS: Shortcut[] = [
  // ✅ FIXED: All node creation shortcuts now require Ctrl to prevent triggering while typing
  {
    key: 't',
    ctrl: true,
    action: 'add-text-node',
    description: 'Add Text Node (Ctrl+T)',
  },
  {
    key: 'i',
    ctrl: true,
    action: 'add-image-node',
    description: 'Add Image Node (Ctrl+I)',
  },
  {
    key: 'v',
    ctrl: true,
    shift: true,
    action: 'add-variants-node',
    description: 'Add Variants Node (Ctrl+Shift+V)',
  },
  {
    key: 's',
    ctrl: true,
    shift: true,
    action: 'add-style-node',
    description: 'Add Style Node (Ctrl+Shift+S)',
  },
  {
    key: 'm',
    ctrl: true,
    action: 'add-material-node',
    description: 'Add Material Node (Ctrl+M)',
  },
  {
    key: 'o',
    ctrl: true,
    action: 'add-output-node',
    description: 'Add Output Node (Ctrl+O)',
  },
  // Delete operations (no modifier needed, but only when not in input)
  {
    key: 'Delete',
    action: 'delete-selected',
    description: 'Delete Selected Nodes',
  },
  {
    key: 'Backspace',
    action: 'delete-selected',
    description: 'Delete Selected Nodes',
  },
  // Standard editing shortcuts
  {
    key: 'c',
    ctrl: true,
    action: 'copy-selected',
    description: 'Copy Selected Nodes (Ctrl+C)',
  },
  {
    key: 'v',
    ctrl: true,
    action: 'paste',
    description: 'Paste Nodes (Ctrl+V)',
  },
  {
    key: 'z',
    ctrl: true,
    action: 'undo',
    description: 'Undo (Ctrl+Z)',
  },
  {
    key: 'y',
    ctrl: true,
    action: 'redo',
    description: 'Redo (Ctrl+Y)',
  },
  {
    key: 'z',
    ctrl: true,
    shift: true,
    action: 'redo',
    description: 'Redo Alternative (Ctrl+Shift+Z)',
  },
  {
    key: 's',
    ctrl: true,
    action: 'save',
    description: 'Save Canvas (Ctrl+S)',
  },
  {
    key: 'a',
    ctrl: true,
    action: 'select-all',
    description: 'Select All Nodes (Ctrl+A)',
  },
  {
    key: 'Escape',
    action: 'deselect-all',
    description: 'Deselect All (Esc)',
  },
  // Zoom shortcuts
  {
    key: '=',
    ctrl: true,
    action: 'zoom-in',
    description: 'Zoom In (Ctrl+=)',
  },
  {
    key: '+',
    ctrl: true,
    action: 'zoom-in',
    description: 'Zoom In (Ctrl++)',
  },
  {
    key: '-',
    ctrl: true,
    action: 'zoom-out',
    description: 'Zoom Out (Ctrl+-)',
  },
  {
    key: '0',
    ctrl: true,
    action: 'fit-view',
    description: 'Fit View (Ctrl+0)',
  },
];

export class ShortcutHandler {
  private handlers: Map<ShortcutAction, () => void> = new Map();

  /**
   * Register a handler for a shortcut action
   */
  on(action: ShortcutAction, handler: () => void): void {
    this.handlers.set(action, handler);
  }

  /**
   * Unregister a handler
   */
  off(action: ShortcutAction): void {
    this.handlers.delete(action);
  }

  /**
   * Handle keyboard event
   * ✅ FIXED: Improved input detection to prevent shortcuts while typing
   */
  handleKeyDown(event: KeyboardEvent): boolean {
    const target = event.target as HTMLElement;
    
    // ✅ FIXED: Comprehensive check for input fields - don't trigger shortcuts when typing
    const isInputField = 
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      target?.isContentEditable ||
      target?.closest('input, textarea, select, [contenteditable="true"]') !== null ||
      target?.tagName === 'INPUT' ||
      target?.tagName === 'TEXTAREA' ||
      target?.tagName === 'SELECT';

    if (isInputField) {
      // Only allow certain shortcuts in input fields (Escape, Delete, Backspace)
      // And Ctrl+ combinations that are safe (like Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+Z)
      const allowedInInput = ['Escape', 'Delete', 'Backspace'];
      const safeCtrlShortcuts = ['a', 'c', 'v', 'x', 'z', 'y']; // Standard editing shortcuts
      
      const isSafeCtrlShortcut = (event.ctrlKey || event.metaKey) && 
        safeCtrlShortcuts.includes(event.key.toLowerCase());
      
      if (!allowedInInput.includes(event.key) && !isSafeCtrlShortcut) {
        return false; // Block shortcut when typing in input
      }
    }

    const shortcut = this.findShortcut(event);
    if (!shortcut) {
      return false;
    }

    const handler = this.handlers.get(shortcut.action);
    if (handler) {
      event.preventDefault();
      event.stopPropagation();
      handler();
      return true;
    }

    return false;
  }

  /**
   * Find matching shortcut for keyboard event
   */
  private findShortcut(event: KeyboardEvent): Shortcut | null {
    return CANVAS_SHORTCUTS.find(shortcut => {
      const keyMatch = shortcut.key.toLowerCase() === event.key.toLowerCase();
      const ctrlMatch = !!shortcut.ctrl === (event.ctrlKey || event.metaKey);
      const shiftMatch = !!shortcut.shift === event.shiftKey;
      const altMatch = !!shortcut.alt === event.altKey;

      return keyMatch && ctrlMatch && shiftMatch && altMatch;
    }) || null;
  }

  /**
   * Get shortcuts for display
   */
  getShortcuts(): Shortcut[] {
    return CANVAS_SHORTCUTS;
  }
}









