/**
 * Utility functions for handling API errors consistently across the application
 */

export interface ApiError {
  response?: {
    data?: {
      error?: {
        message?: string;
        type?: string;
        status_code?: number;
      };
    };
    status?: number;
  };
}

/**
 * Get a user-friendly error message from an API error
 */
export const getErrorMessage = (error: ApiError, defaultMessage: string = 'An error occurred'): string => {
  if (error.response?.data?.error?.message) {
    const errorMessage = error.response.data.error.message;
    
    // Handle specific error messages
    if (errorMessage.includes('already enrolled')) {
      return 'This student is already enrolled in the course';
    } else if (errorMessage.includes('not enrolled')) {
      return 'This student is not enrolled in the course';
    } else if (errorMessage.includes('Course not found')) {
      return 'Course not found';
    } else if (errorMessage.includes('Access denied')) {
      return 'You do not have permission to perform this action';
    } else if (errorMessage.includes('User not found')) {
      return 'User not found';
    } else if (errorMessage.includes('Invalid credentials')) {
      return 'Invalid username or password';
    } else if (errorMessage.includes('Username already exists')) {
      return 'Username is already taken';
    } else if (errorMessage.includes('Email already exists')) {
      return 'Email is already registered';
    } else {
      return errorMessage;
    }
  }
  
  return defaultMessage;
};

/**
 * Get error type for specific handling
 */
export const getErrorType = (error: ApiError): string => {
  return error.response?.data?.error?.type || 'UNKNOWN_ERROR';
};

/**
 * Get HTTP status code
 */
export const getErrorStatus = (error: ApiError): number | undefined => {
  return error.response?.status || error.response?.data?.error?.status_code;
};
