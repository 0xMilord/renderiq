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
  {
    key: 't',
    action: 'add-text-node',
    description: 'Add Text Node',
  },
  {
    key: 'i',
    action: 'add-image-node',
    description: 'Add Image Node',
  },
  {
    key: 'v',
    action: 'add-variants-node',
    description: 'Add Variants Node',
  },
  {
    key: 's',
    action: 'add-style-node',
    description: 'Add Style Node',
  },
  {
    key: 'm',
    action: 'add-material-node',
    description: 'Add Material Node',
  },
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
  {
    key: 'c',
    ctrl: true,
    action: 'copy-selected',
    description: 'Copy Selected Nodes',
  },
  {
    key: 'v',
    ctrl: true,
    action: 'paste',
    description: 'Paste Nodes',
  },
  {
    key: 'z',
    ctrl: true,
    action: 'undo',
    description: 'Undo',
  },
  {
    key: 'y',
    ctrl: true,
    action: 'redo',
    description: 'Redo',
  },
  {
    key: 'z',
    ctrl: true,
    shift: true,
    action: 'redo',
    description: 'Redo (Alternative)',
  },
  {
    key: 's',
    ctrl: true,
    action: 'save',
    description: 'Save Canvas',
  },
  {
    key: 'a',
    ctrl: true,
    action: 'select-all',
    description: 'Select All Nodes',
  },
  {
    key: 'Escape',
    action: 'deselect-all',
    description: 'Deselect All',
  },
  {
    key: '=',
    ctrl: true,
    action: 'zoom-in',
    description: 'Zoom In',
  },
  {
    key: '-',
    ctrl: true,
    action: 'zoom-out',
    description: 'Zoom Out',
  },
  {
    key: '0',
    ctrl: true,
    action: 'fit-view',
    description: 'Fit View',
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
   */
  handleKeyDown(event: KeyboardEvent): boolean {
    // Don't handle shortcuts when typing in inputs
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      (event.target as HTMLElement)?.isContentEditable
    ) {
      // Allow some shortcuts even in inputs
      const allowedInInput = ['Escape', 'Delete', 'Backspace'];
      if (!allowedInInput.includes(event.key)) {
        return false;
      }
    }

    const shortcut = this.findShortcut(event);
    if (!shortcut) {
      return false;
    }

    const handler = this.handlers.get(shortcut.action);
    if (handler) {
      event.preventDefault();
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








