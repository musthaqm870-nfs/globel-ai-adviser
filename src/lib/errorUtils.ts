/**
 * Utility functions for safe error handling
 * Prevents exposure of internal system details to users
 */

/**
 * Maps internal error messages to user-friendly messages
 * Logs the original error for debugging while returning safe messages
 */
export const getSafeErrorMessage = (error: any, context?: string): string => {
  // Log the full error for debugging (only in development or server-side)
  console.error(`[${context || 'Error'}]:`, error);

  const message = error?.message?.toLowerCase() || '';

  // Session/Auth errors
  if (message.includes('jwt') || message.includes('token')) {
    return 'Your session has expired. Please sign in again.';
  }

  // Permission errors  
  if (message.includes('row-level security') || message.includes('permission denied')) {
    return 'You do not have permission to perform this action.';
  }

  // Validation errors
  if (message.includes('violates') || message.includes('constraint')) {
    return 'The provided data is invalid. Please check your input.';
  }

  // Network errors
  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return 'Unable to connect. Please check your internet connection.';
  }

  // Rate limiting
  if (message.includes('rate limit') || message.includes('too many requests')) {
    return 'Too many requests. Please wait a moment and try again.';
  }

  // Not found
  if (message.includes('not found') || message.includes('does not exist')) {
    return 'The requested resource could not be found.';
  }

  // Authentication required
  if (message.includes('authentication') || message.includes('unauthorized')) {
    return 'Please sign in to continue.';
  }

  // Default safe message
  return 'An error occurred. Please try again later.';
};
