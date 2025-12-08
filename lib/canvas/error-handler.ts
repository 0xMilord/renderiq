/**
 * Canvas Error Handler
 * Centralized error handling for canvas operations
 */

export class CanvasError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'CanvasError';
  }
}

export class NodeError extends CanvasError {
  constructor(
    message: string,
    public nodeId: string,
    context?: Record<string, any>
  ) {
    super(message, 'NODE_ERROR', { nodeId, ...context });
    this.name = 'NodeError';
  }
}

export class ConnectionError extends CanvasError {
  constructor(
    message: string,
    public connectionId?: string,
    context?: Record<string, any>
  ) {
    super(message, 'CONNECTION_ERROR', { connectionId, ...context });
    this.name = 'ConnectionError';
  }
}

export class ValidationError extends CanvasError {
  constructor(
    message: string,
    public field?: string,
    context?: Record<string, any>
  ) {
    super(message, 'VALIDATION_ERROR', { field, ...context });
    this.name = 'ValidationError';
  }
}

export interface ErrorContext {
  nodeId?: string;
  connectionId?: string;
  field?: string;
  [key: string]: any;
}

export class CanvasErrorHandler {
  private errorListeners: Array<(error: CanvasError) => void> = [];

  /**
   * Register error listener
   */
  onError(listener: (error: CanvasError) => void): () => void {
    this.errorListeners.push(listener);
    return () => {
      this.errorListeners = this.errorListeners.filter(l => l !== listener);
    };
  }

  /**
   * Handle error
   */
  handleError(error: CanvasError | Error | unknown): void {
    let canvasError: CanvasError;

    if (error instanceof CanvasError) {
      canvasError = error;
    } else if (error instanceof Error) {
      canvasError = new CanvasError(error.message, 'UNKNOWN_ERROR', { originalError: error });
    } else {
      canvasError = new CanvasError('An unknown error occurred', 'UNKNOWN_ERROR', { error });
    }

    // Notify listeners
    this.errorListeners.forEach(listener => {
      try {
        listener(canvasError);
      } catch (e) {
        console.error('Error in error listener:', e);
      }
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Canvas Error:', canvasError);
    }
  }

  /**
   * Create node error
   */
  createNodeError(message: string, nodeId: string, context?: ErrorContext): NodeError {
    return new NodeError(message, nodeId, context);
  }

  /**
   * Create connection error
   */
  createConnectionError(message: string, connectionId?: string, context?: ErrorContext): ConnectionError {
    return new ConnectionError(message, connectionId, context);
  }

  /**
   * Create validation error
   */
  createValidationError(message: string, field?: string, context?: ErrorContext): ValidationError {
    return new ValidationError(message, field, context);
  }
}

// Singleton instance
export const canvasErrorHandler = new CanvasErrorHandler();








