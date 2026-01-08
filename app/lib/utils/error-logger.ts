import { maskSensitiveData } from './encryption'

interface LogContext {
  userId?: string
  email?: string
  ip?: string
  userAgent?: string
  endpoint?: string
  method?: string
  timestamp?: Date
}

interface ErrorLogEntry {
  level: 'error' | 'warn' | 'info'
  message: string
  error?: Error
  context?: LogContext
  timestamp: Date
  sanitized: boolean
}

/**
 * Sensitive data patterns to mask in logs
 */
const SENSITIVE_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /key/i,
  /auth/i,
  /credit/i,
  /card/i,
  /ssn/i,
  /social/i,
  /phone/i,
  /address/i
]

/**
 * Email pattern for masking
 */
const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g

/**
 * Sanitize data by removing or masking sensitive information
 */
function sanitizeData(data: any): any {
  if (typeof data === 'string') {
    // Mask emails
    let sanitized = data.replace(EMAIL_PATTERN, (email) => {
      const [local, domain] = email.split('@')
      return `${maskSensitiveData(local, 2)}@${domain}`
    })
    
    // Check for sensitive patterns and mask if found
    for (const pattern of SENSITIVE_PATTERNS) {
      if (pattern.test(sanitized)) {
        return maskSensitiveData(sanitized, 4)
      }
    }
    
    return sanitized
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized: any = Array.isArray(data) ? [] : {}
    
    for (const [key, value] of Object.entries(data)) {
      // Check if key contains sensitive information
      const isSensitiveKey = SENSITIVE_PATTERNS.some(pattern => pattern.test(key))
      
      if (isSensitiveKey) {
        sanitized[key] = '[REDACTED]'
      } else {
        sanitized[key] = sanitizeData(value)
      }
    }
    
    return sanitized
  }
  
  return data
}

/**
 * Create sanitized context for logging
 */
function sanitizeContext(context: LogContext): LogContext {
  const sanitized: LogContext = {
    ...context,
    timestamp: context.timestamp || new Date()
  }
  
  // Mask email if present
  if (sanitized.email) {
    const [local, domain] = sanitized.email.split('@')
    sanitized.email = `${maskSensitiveData(local, 2)}@${domain}`
  }
  
  // Mask IP address partially
  if (sanitized.ip) {
    const parts = sanitized.ip.split('.')
    if (parts.length === 4) {
      sanitized.ip = `${parts[0]}.${parts[1]}.xxx.xxx`
    }
  }
  
  // Truncate user agent
  if (sanitized.userAgent && sanitized.userAgent.length > 100) {
    sanitized.userAgent = sanitized.userAgent.substring(0, 100) + '...'
  }
  
  return sanitized
}

/**
 * Log error with privacy protection
 */
export function logError(
  message: string, 
  error?: Error, 
  context?: LogContext
): void {
  try {
    const sanitizedContext = context ? sanitizeContext(context) : undefined
    
    const logEntry: ErrorLogEntry = {
      level: 'error',
      message: sanitizeData(message),
      error: error ? {
        name: error.name,
        message: sanitizeData(error.message),
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      } as Error : undefined,
      context: sanitizedContext,
      timestamp: new Date(),
      sanitized: true
    }
    
    // In production, you would send this to your logging service
    // For now, we'll use console.error with structured logging
    console.error('ERROR_LOG:', JSON.stringify(logEntry, null, 2))
    
    // In a real application, you might want to:
    // - Send to external logging service (e.g., Winston, Pino, DataDog)
    // - Store in database for analysis
    // - Send alerts for critical errors
    
  } catch (loggingError) {
    // Fallback logging if our privacy-aware logging fails
    console.error('Logging system error:', loggingError)
    console.error('Original error:', message, error)
  }
}

/**
 * Log warning with privacy protection
 */
export function logWarning(
  message: string, 
  context?: LogContext
): void {
  try {
    const sanitizedContext = context ? sanitizeContext(context) : undefined
    
    const logEntry: ErrorLogEntry = {
      level: 'warn',
      message: sanitizeData(message),
      context: sanitizedContext,
      timestamp: new Date(),
      sanitized: true
    }
    
    console.warn('WARNING_LOG:', JSON.stringify(logEntry, null, 2))
    
  } catch (loggingError) {
    console.warn('Logging system error:', loggingError)
    console.warn('Original warning:', message)
  }
}

/**
 * Log info with privacy protection
 */
export function logInfo(
  message: string, 
  context?: LogContext
): void {
  try {
    const sanitizedContext = context ? sanitizeContext(context) : undefined
    
    const logEntry: ErrorLogEntry = {
      level: 'info',
      message: sanitizeData(message),
      context: sanitizedContext,
      timestamp: new Date(),
      sanitized: true
    }
    
    console.info('INFO_LOG:', JSON.stringify(logEntry, null, 2))
    
  } catch (loggingError) {
    console.info('Logging system error:', loggingError)
    console.info('Original info:', message)
  }
}

/**
 * Extract context from Next.js request
 */
export function extractRequestContext(request: Request): LogContext {
  return {
    endpoint: new URL(request.url).pathname,
    method: request.method,
    userAgent: request.headers.get('user-agent') || undefined,
    ip: request.headers.get('x-forwarded-for') || 
        request.headers.get('x-real-ip') || 
        'unknown',
    timestamp: new Date()
  }
}