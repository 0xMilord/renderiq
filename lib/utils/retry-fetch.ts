import { logger } from './logger';

export interface RetryFetchOptions extends RequestInit {
  maxAttempts?: number;
  retryDelay?: number;
  shouldRetry?: (error: Error, attempt: number) => boolean;
}

/**
 * Utility function to retry fetch requests with exponential backoff
 * Handles network errors, timeouts, and other retryable errors
 */
export async function retryFetch(
  url: string,
  options: RetryFetchOptions = {}
): Promise<Response> {
  const {
    maxAttempts = 3,
    retryDelay = 1000,
    shouldRetry,
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      logger.log(`🔄 retryFetch: Attempt ${attempt}/${maxAttempts} for ${url}`);
      
      const response = await fetch(url, {
        ...fetchOptions,
        // Add timeout signal for mobile networks
        signal: AbortSignal.timeout(300000), // 5 minutes timeout
      });
      
      // Check response status before returning
      if (!response.ok) {
        let errorText: string = '';
        let errorJson: any = null;
        
        try {
          // ✅ FIXED: Clone response before reading to avoid consuming the body
          const clonedResponse = response.clone();
          errorText = await clonedResponse.text();
          
          // ✅ FIXED: Handle empty response body
          if (!errorText || errorText.trim() === '') {
            errorText = `HTTP ${response.status} ${response.statusText} - Empty response body`;
            logger.error(`❌ retryFetch: API returned error status ${response.status} with empty body`);
          } else {
            logger.error(`❌ retryFetch: API returned error status ${response.status}:`, errorText.substring(0, 200));
            
            // Try to parse error JSON if available
            try {
              errorJson = JSON.parse(errorText);
              if (errorJson.refunded) {
                logger.log('✅ Credits were refunded by server');
              }
            } catch {
              // Not JSON, use text error
            }
          }
        } catch (readError) {
          // If reading response fails, create a descriptive error
          errorText = `HTTP ${response.status} ${response.statusText} - Failed to read response body`;
          logger.error(`❌ retryFetch: Failed to read error response:`, readError);
        }
        
        // ✅ FIXED: Create error with more context
        const errorMessage = errorJson?.error || errorText || `API request failed: ${response.status} ${response.statusText}`;
        const error = new Error(errorMessage);
        
        // Attach response details to error for better debugging
        (error as any).status = response.status;
        (error as any).statusText = response.statusText;
        (error as any).responseBody = errorText;
        (error as any).errorJson = errorJson;
        
        // Don't retry on 413 Payload Too Large - it won't succeed
        if (response.status === 413) {
          throw error;
        }
        
        // Check if we should retry
        if (shouldRetry) {
          if (!shouldRetry(error, attempt)) {
            throw error;
          }
        } else {
          // Default: don't retry on HTTP errors (except network errors)
          throw error;
        }
      }
      
      return response;
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logger.error(`❌ retryFetch: Attempt ${attempt} failed:`, lastError);
      
      // Check if we should retry
      // Don't retry on 413 Payload Too Large or other client errors (4xx)
      const isClientError = lastError.message.includes('413') || 
                           lastError.message.includes('Payload Too Large') ||
                           lastError.message.includes('FUNCTION_PAYLOAD_TOO_LARGE') ||
                           (lastError as any).status >= 400 && (lastError as any).status < 500;
      
      const shouldRetryError = !isClientError && (
        shouldRetry 
          ? shouldRetry(lastError, attempt)
          : (
              lastError.message.includes('aborted') || 
              lastError.message.includes('timeout') ||
              lastError.message.includes('network') ||
              lastError.message.includes('Failed to fetch') ||
              lastError.message.includes('ERR_')
            )
      );
      
      if (attempt < maxAttempts && shouldRetryError) {
        // Wait before retry (exponential backoff)
        const delay = retryDelay * attempt;
        logger.log(`⏳ retryFetch: Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      } else {
        // Don't retry on other errors or if max attempts reached
        throw lastError;
      }
    }
  }
  
  throw lastError || new Error('Failed to get response from API');
}

