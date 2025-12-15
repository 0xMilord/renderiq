/**
 * Tldraw Auto Layout System
 * Provides automatic shape positioning for tldraw canvas
 * Prevents overlapping and organizes renders efficiently
 * 
 * Algorithms:
 * - Spiral Layout: Best for many items (50+), creates a spiral pattern
 * - Grid Layout: Best for organized display, prevents overlap
 * - Force-Directed: Best for dynamic arrangement (future)
 */

import type { Editor } from '@tldraw/tldraw';
import { logger } from '@/lib/utils/logger';

export type TldrawLayoutAlgorithm = 'spiral' | 'grid' | 'force';

export interface TldrawLayoutOptions {
  algorithm?: TldrawLayoutAlgorithm;
  spacing?: number; // Minimum spacing between shapes
  startX?: number; // Starting X position (defaults to viewport center)
  startY?: number; // Starting Y position (defaults to viewport center)
  cols?: number; // Number of columns for grid layout
  maxWidth?: number; // Maximum width for grid (auto-calculates cols if not provided)
}

export interface ShapeBounds {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Tldraw Auto Layout - Automatically positions shapes on tldraw canvas
 */
export class TldrawAutoLayout {
  /**
   * Get bounds of all existing shapes on canvas
   */
  private static getExistingShapeBounds(editor: Editor): ShapeBounds[] {
    const shapes = editor.getCurrentPageShapes();
    return shapes.map((shape) => {
      const bounds = editor.getShapePageBounds(shape);
      return {
        id: shape.id,
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
      };
    });
  }

  /**
   * Check if a position overlaps with existing shapes
   */
  private static hasOverlap(
    x: number,
    y: number,
    width: number,
    height: number,
    existingBounds: ShapeBounds[],
    spacing: number
  ): boolean {
    for (const existing of existingBounds) {
      // Check if rectangles overlap (with spacing buffer)
      const left1 = x - spacing;
      const right1 = x + width + spacing;
      const top1 = y - spacing;
      const bottom1 = y + height + spacing;

      const left2 = existing.x;
      const right2 = existing.x + existing.width;
      const top2 = existing.y;
      const bottom2 = existing.y + existing.height;

      if (!(right1 < left2 || left1 > right2 || bottom1 < top2 || top1 > bottom2)) {
        return true; // Overlaps
      }
    }
    return false;
  }

  /**
   * Spiral Layout Algorithm
   * Creates a spiral pattern starting from center
   * Best for many items (50+)
   */
  static calculateSpiralPosition(
    index: number,
    width: number,
    height: number,
    existingBounds: ShapeBounds[],
    options: TldrawLayoutOptions = {}
  ): { x: number; y: number } {
    const {
      spacing = 100,
      startX = 0,
      startY = 0,
    } = options;

    // Spiral parameters
    const angleStep = Math.PI / 6; // 30 degrees per step
    const radiusStep = Math.max(width, height) + spacing;
    
    // Calculate spiral position
    let angle = index * angleStep;
    let radius = Math.floor(Math.sqrt(index)) * radiusStep;
    
    // Convert polar to cartesian
    let x = startX + radius * Math.cos(angle);
    let y = startY + radius * Math.sin(angle);

    // Try to find non-overlapping position by adjusting radius
    let attempts = 0;
    const maxAttempts = 50;
    while (
      this.hasOverlap(x, y, width, height, existingBounds, spacing) &&
      attempts < maxAttempts
    ) {
      radius += radiusStep * 0.5;
      angle += angleStep * 0.3;
      x = startX + radius * Math.cos(angle);
      y = startY + radius * Math.sin(angle);
      attempts++;
    }

    return { x, y };
  }

  /**
   * Grid Layout Algorithm
   * Organizes shapes in a grid pattern
   * Best for organized display, prevents overlap
   */
  static calculateGridPosition(
    index: number,
    width: number,
    height: number,
    existingBounds: ShapeBounds[],
    options: TldrawLayoutOptions = {}
  ): { x: number; y: number } {
    const {
      spacing = 100,
      startX = 0,
      startY = 0,
      cols,
      maxWidth = 5000,
    } = options;

    // Calculate number of columns
    let numCols = cols;
    if (!numCols) {
      // Auto-calculate columns based on maxWidth
      numCols = Math.floor((maxWidth - startX) / (width + spacing));
      numCols = Math.max(1, numCols); // At least 1 column
    }

    // Calculate grid position
    const col = index % numCols;
    const row = Math.floor(index / numCols);

    let x = startX + col * (width + spacing);
    let y = startY + row * (height + spacing);

    // Check for overlap and adjust if needed
    let attempts = 0;
    const maxAttempts = 10;
    while (
      this.hasOverlap(x, y, width, height, existingBounds, spacing) &&
      attempts < maxAttempts
    ) {
      // Move to next position
      x += width + spacing;
      if (x > startX + maxWidth) {
        x = startX;
        y += height + spacing;
      }
      attempts++;
    }

    return { x, y };
  }

  /**
   * Calculate optimal position for a new shape
   * Uses the best algorithm based on number of existing shapes
   */
  static calculateOptimalPosition(
    editor: Editor,
    width: number,
    height: number,
    options: TldrawLayoutOptions = {}
  ): { x: number; y: number } {
    const {
      algorithm,
      startX,
      startY,
    } = options;

    // Get viewport center if start position not provided
    const viewportBounds = editor.getViewportPageBounds();
    const centerX = startX ?? (viewportBounds.x + viewportBounds.width / 2);
    const centerY = startY ?? (viewportBounds.y + viewportBounds.height / 2);

    // Get existing shapes
    const existingBounds = this.getExistingShapeBounds(editor);
    const shapeCount = existingBounds.length;

    // Determine algorithm
    let layoutAlgorithm: TldrawLayoutAlgorithm = algorithm || 'grid';
    
    // Auto-select algorithm based on shape count
    if (!algorithm) {
      if (shapeCount > 20) {
        layoutAlgorithm = 'spiral'; // Spiral for many items
      } else {
        layoutAlgorithm = 'grid'; // Grid for organized display
      }
    }

    // Calculate position based on algorithm
    let position: { x: number; y: number };

    if (layoutAlgorithm === 'spiral') {
      position = this.calculateSpiralPosition(
        shapeCount,
        width,
        height,
        existingBounds,
        {
          ...options,
          startX: centerX,
          startY: centerY,
        }
      );
    } else {
      // Grid layout (default)
      position = this.calculateGridPosition(
        shapeCount,
        width,
        height,
        existingBounds,
        {
          ...options,
          startX: centerX - width / 2, // Center first item
          startY: centerY - height / 2,
        }
      );
    }

    logger.log('📍 TldrawAutoLayout: Calculated position', {
      algorithm: layoutAlgorithm,
      shapeCount,
      position,
      width,
      height,
    });

    return position;
  }

  /**
   * Arrange multiple shapes at once
   * Useful for loading many renders onto canvas
   */
  static arrangeShapes(
    editor: Editor,
    shapes: Array<{ width: number; height: number }>,
    options: TldrawLayoutOptions = {}
  ): Array<{ x: number; y: number }> {
    const {
      algorithm = 'grid',
      spacing = 100,
      startX,
      startY,
    } = options;

    // Get viewport center if start position not provided
    const viewportBounds = editor.getViewportPageBounds();
    const centerX = startX ?? (viewportBounds.x + viewportBounds.width / 2);
    const centerY = startY ?? (viewportBounds.y + viewportBounds.height / 2);

    // Get existing shapes (before adding new ones)
    const existingBounds = this.getExistingShapeBounds(editor);

    // Calculate positions for all shapes
    const positions: Array<{ x: number; y: number }> = [];
    const allBounds: ShapeBounds[] = [...existingBounds];

    for (let i = 0; i < shapes.length; i++) {
      const shape = shapes[i];
      let position: { x: number; y: number };

      if (algorithm === 'spiral') {
        position = this.calculateSpiralPosition(
          existingBounds.length + i,
          shape.width,
          shape.height,
          allBounds,
          {
            ...options,
            startX: centerX,
            startY: centerY,
            spacing,
          }
        );
      } else {
        // Grid layout
        position = this.calculateGridPosition(
          existingBounds.length + i,
          shape.width,
          shape.height,
          allBounds,
          {
            ...options,
            startX: centerX - shape.width / 2,
            startY: centerY - shape.height / 2,
            spacing,
          }
        );
      }

      positions.push(position);

      // Add to bounds for next iteration
      allBounds.push({
        id: `temp-${i}`,
        x: position.x,
        y: position.y,
        width: shape.width,
        height: shape.height,
      });
    }

    logger.log('📍 TldrawAutoLayout: Arranged shapes', {
      algorithm,
      shapeCount: shapes.length,
      existingCount: existingBounds.length,
    });

    return positions;
  }
}





