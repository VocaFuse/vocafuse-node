/**
 * Context information for errors to aid debugging
 */
export interface ErrorContext {
  resourceType?: string;
  resourceId?: string;
  endpoint?: string;
  suggestion?: string;
}

/**
 * Base error class for all VocaFuse SDK errors
 *
 * Provides rich context including resource IDs, endpoints, and actionable suggestions.
 */
export class VocaFuseError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly errorCode?: string,
    public readonly details?: Record<string, unknown>,
    public readonly context?: ErrorContext
  ) {
    super(message);
    this.name = 'VocaFuseError';
    Object.setPrototypeOf(this, VocaFuseError.prototype);
  }

  /**
   * Get a user-friendly error message with context and suggestions
   */
  get friendlyMessage(): string {
    let msg = this.message;

    if (this.context?.resourceId) {
      msg += ` (${this.context.resourceType || 'resource'}: ${this.context.resourceId})`;
    }

    if (this.context?.suggestion) {
      msg += `. ${this.context.suggestion}`;
    }

    return msg;
  }

  /**
   * Convert error to JSON for structured logging
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      friendlyMessage: this.friendlyMessage,
      statusCode: this.statusCode,
      errorCode: this.errorCode,
      details: this.details,
      context: this.context
    };
  }
}

/**
 * Authentication error (401)
 *
 * Thrown when API credentials are invalid or missing.
 */
export class AuthenticationError extends VocaFuseError {
  constructor(
    message: string,
    errorCode?: string,
    details?: Record<string, unknown>,
    context?: ErrorContext
  ) {
    super(message, 401, errorCode, details, {
      ...context,
      suggestion:
        context?.suggestion || 'Verify your API key and secret are correct and not expired.'
    });
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Authorization error (403)
 *
 * Thrown when the API key lacks required permissions.
 */
export class AuthorizationError extends VocaFuseError {
  constructor(
    message: string,
    errorCode?: string,
    details?: Record<string, unknown>,
    context?: ErrorContext
  ) {
    super(message, 403, errorCode, details, {
      ...context,
      suggestion:
        context?.suggestion ||
        'Check that your API key has the required permissions for this operation.'
    });
    this.name = 'AuthorizationError';
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

/**
 * Validation error (400)
 *
 * Thrown when request parameters are invalid.
 */
export class ValidationError extends VocaFuseError {
  constructor(
    message: string,
    errorCode?: string,
    details?: Record<string, unknown>,
    context?: ErrorContext
  ) {
    super(message, 400, errorCode, details, context);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Not found error (404)
 *
 * Thrown when a requested resource does not exist.
 */
export class NotFoundError extends VocaFuseError {
  constructor(
    message: string,
    errorCode?: string,
    details?: Record<string, unknown>,
    context?: ErrorContext
  ) {
    super(message, 404, errorCode, details, context);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Conflict error (409)
 *
 * Thrown when a resource conflict occurs.
 */
export class ConflictError extends VocaFuseError {
  constructor(
    message: string,
    errorCode?: string,
    details?: Record<string, unknown>,
    context?: ErrorContext
  ) {
    super(message, 409, errorCode, details, context);
    this.name = 'ConflictError';
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * Rate limit error (429)
 *
 * Thrown when API rate limits are exceeded.
 */
export class RateLimitError extends VocaFuseError {
  public readonly retryAfter?: number;

  constructor(
    message: string,
    errorCode?: string,
    details?: Record<string, unknown>,
    context?: ErrorContext,
    retryAfter?: number
  ) {
    super(message, 429, errorCode, details, {
      ...context,
      suggestion:
        context?.suggestion ||
        (retryAfter
          ? `Rate limit exceeded. Retry after ${retryAfter} seconds.`
          : 'Rate limit exceeded. Please reduce request frequency.')
    });
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * Server error (5xx)
 *
 * Thrown when a server-side error occurs.
 */
export class ServerError extends VocaFuseError {
  constructor(
    message: string,
    statusCode: number,
    errorCode?: string,
    details?: Record<string, unknown>,
    context?: ErrorContext
  ) {
    super(message, statusCode, errorCode, details, {
      ...context,
      suggestion:
        context?.suggestion ||
        'This is a server-side issue. Please try again later or contact support if it persists.'
    });
    this.name = 'ServerError';
    Object.setPrototypeOf(this, ServerError.prototype);
  }
}

// Resource-specific errors with contextual suggestions

/**
 * Voicenote not found error
 *
 * Thrown when a voicenote does not exist or is inaccessible.
 */
export class VoicenoteNotFoundError extends NotFoundError {
  constructor(
    message: string,
    errorCode?: string,
    details?: Record<string, unknown>,
    voicenoteId?: string
  ) {
    super(message, errorCode, details, {
      resourceType: 'voicenote',
      resourceId: voicenoteId,
      suggestion: 'Verify the voicenote ID exists and belongs to your account.'
    });
    this.name = 'VoicenoteNotFoundError';
    Object.setPrototypeOf(this, VoicenoteNotFoundError.prototype);
  }
}

/**
 * Webhook not found error
 *
 * Thrown when a webhook does not exist.
 */
export class WebhookNotFoundError extends NotFoundError {
  constructor(
    message: string,
    errorCode?: string,
    details?: Record<string, unknown>,
    webhookId?: string
  ) {
    super(message, errorCode, details, {
      resourceType: 'webhook',
      resourceId: webhookId,
      suggestion:
        'Verify the webhook ID exists. Use client.webhooks.list() to see available webhooks.'
    });
    this.name = 'WebhookNotFoundError';
    Object.setPrototypeOf(this, WebhookNotFoundError.prototype);
  }
}

/**
 * Transcription not found error
 *
 * Thrown when a transcription does not exist (voicenote may still be processing).
 */
export class TranscriptionNotFoundError extends NotFoundError {
  constructor(
    message: string,
    errorCode?: string,
    details?: Record<string, unknown>,
    voicenoteId?: string
  ) {
    super(message, errorCode, details, {
      resourceType: 'transcription',
      resourceId: voicenoteId,
      suggestion:
        'The voicenote may still be processing. Check voicenote.status before accessing transcription.'
    });
    this.name = 'TranscriptionNotFoundError';
    Object.setPrototypeOf(this, TranscriptionNotFoundError.prototype);
  }
}

/**
 * API key not found error
 *
 * Thrown when an API key does not exist.
 */
export class APIKeyNotFoundError extends NotFoundError {
  constructor(
    message: string,
    errorCode?: string,
    details?: Record<string, unknown>,
    apiKeyId?: string
  ) {
    super(message, errorCode, details, {
      resourceType: 'api_key',
      resourceId: apiKeyId,
      suggestion: 'Verify the API key ID exists. Use client.apiKeys.list() to see available keys.'
    });
    this.name = 'APIKeyNotFoundError';
    Object.setPrototypeOf(this, APIKeyNotFoundError.prototype);
  }
}
