/**
 * Canvas History Management
 * Provides undo/redo functionality for canvas operations
 */

import { Node, Edge } from '@xyflow/react';

export interface HistoryState {
  nodes: Node[];
  edges: Edge[];
  timestamp: number;
}

export class CanvasHistory {
  private history: HistoryState[] = [];
  private currentIndex: number = -1;
  private maxHistorySize: number = 50;

  /**
   * Add a new state to history
   */
  pushState(nodes: Node[], edges: Edge[]): void {
    // Remove any states after current index (when undoing and then making new changes)
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    // Add new state
    const newState: HistoryState = {
      nodes: JSON.parse(JSON.stringify(nodes)), // Deep clone
      edges: JSON.parse(JSON.stringify(edges)), // Deep clone
      timestamp: Date.now(),
    };

    this.history.push(newState);
    this.currentIndex = this.history.length - 1;

    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.currentIndex--;
    }
  }

  /**
   * Undo to previous state
   */
  undo(): HistoryState | null {
    if (this.currentIndex <= 0) {
      return null; // No history to undo
    }

    this.currentIndex--;
    return this.getCurrentState();
  }

  /**
   * Redo to next state
   */
  redo(): HistoryState | null {
    if (this.currentIndex >= this.history.length - 1) {
      return null; // No history to redo
    }

    this.currentIndex++;
    return this.getCurrentState();
  }

  /**
   * Get current state
   */
  getCurrentState(): HistoryState | null {
    if (this.currentIndex < 0 || this.currentIndex >= this.history.length) {
      return null;
    }

    return {
      nodes: JSON.parse(JSON.stringify(this.history[this.currentIndex].nodes)),
      edges: JSON.parse(JSON.stringify(this.history[this.currentIndex].edges)),
      timestamp: this.history[this.currentIndex].timestamp,
    };
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * Clear history
   */
  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }

  /**
   * Get history size
   */
  getSize(): number {
    return this.history.length;
  }

  /**
   * Initialize with initial state
   */
  initialize(nodes: Node[], edges: Edge[]): void {
    this.clear();
    this.pushState(nodes, edges);
  }
}







