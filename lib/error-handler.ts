/**
 * Comprehensive error handling and logging utility
 * Ready for integration with real error tracking services (Sentry, LogRocket, etc.)
 */

export interface ErrorContext {
  service?: string
  endpoint?: string
  method?: string
  userId?: string
  timestamp?: string
  environment?: string
}

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public context?: ErrorContext
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export const ErrorCodes = {
  // Authentication errors
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  
  // Validation errors
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_FIELDS: 'MISSING_FIELDS',
  
  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',
  
  // Service errors
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  PAYMENT_ERROR: 'PAYMENT_ERROR',
  EMAIL_ERROR: 'EMAIL_ERROR',
  FILE_UPLOAD_ERROR: 'FILE_UPLOAD_ERROR',
  
  // Server errors
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  TIMEOUT: 'TIMEOUT',
} as const

export function logError(
  error: Error | AppError,
  context?: ErrorContext
): void {
  const errorData = {
    timestamp: new Date().toISOString(),
    message: error.message,
    code: error instanceof AppError ? error.code : 'UNKNOWN_ERROR',
    stack: error.stack,
    context: {
      environment: process.env.NODE_ENV,
      ...context,
    },
  }

  // Log to console (development)
  if (process.env.NODE_ENV === 'development') {
    console.error('[ERROR]', JSON.stringify(errorData, null, 2))
  }

  // TODO: Integrate with real error tracking service
  // Examples:
  // - Sentry: Sentry.captureException(error, { contexts: { app: errorData } })
  // - LogRocket: logRocket.captureException(error)
  // - Custom API: fetch('/api/logs/errors', { method: 'POST', body: JSON.stringify(errorData) })
  
  // Placeholder for production error tracking
  if (process.env.NEXT_PUBLIC_ERROR_TRACKING_ENABLED === 'true') {
    // sendToErrorTrackingService(errorData)
  }
}

export function createErrorResponse(
  error: Error | AppError,
  context?: ErrorContext
) {
  logError(error, context)

  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
      },
    }
  }

  return {
    success: false,
    error: {
      code: ErrorCodes.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred',
      statusCode: 500,
    },
  }
}

export function handleAsyncError(
  fn: () => Promise<any>,
  errorContext?: ErrorContext
) {
  return async (...args: any[]) => {
    try {
      return await fn()
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), errorContext)
      throw error
    }
  }
}

/**
 * Validation utilities for input data
 */
export const Validators = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  password: (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = []
    if (password.length < 8) errors.push('Password must be at least 8 characters')
    if (!/[A-Z]/.test(password)) errors.push('Password must contain uppercase letter')
    if (!/[0-9]/.test(password)) errors.push('Password must contain number')
    return {
      valid: errors.length === 0,
      errors,
    }
  },

  phone: (phone: string): boolean => {
    const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/
    return phoneRegex.test(phone.replace(/\s/g, ''))
  },

  url: (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  },

  amount: (amount: any): boolean => {
    const num = Number(amount)
    return !isNaN(num) && num > 0 && num <= 999999999
  },
}

/**
 * Retry logic for external service calls
 */
export async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  options = {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
  }
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt < options.maxRetries) {
        const delayMs = Math.min(
          options.initialDelayMs * Math.pow(2, attempt),
          options.maxDelayMs
        )
        await new Promise(resolve => setTimeout(resolve, delayMs))
      }
    }
  }

  throw lastError || new Error('Max retries exceeded')
}
