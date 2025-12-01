import axios, { AxiosError } from 'axios';
import {
  VocaFuseError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ServerError,
  VoicenoteNotFoundError,
  WebhookNotFoundError,
  TranscriptionNotFoundError,
  APIKeyNotFoundError
} from './vocafuse-error.js';
import { ErrorResponse } from '../types/common.js';

/**
 * Extract resource ID from URL path
 *
 * @example
 * extractResourceId('/voicenotes/vn_123', 'voicenote') // 'vn_123'
 * extractResourceId('/voicenotes/vn_123/transcription', 'transcription') // 'vn_123'
 * extractResourceId('voicenotes/vn_123', 'voicenote') // 'vn_123' (without leading slash)
 */
function extractResourceId(url: string | undefined, resourceType: string): string | undefined {
  if (!url) return undefined;

  const patterns: Record<string, RegExp> = {
    voicenote: /voicenotes\/([^/]+)(?:\/|$)/,
    webhook: /webhooks\/([^/]+)(?:\/|$)/,
    api_key: /api-keys\/([^/]+)(?:\/|$)/,
    transcription: /voicenotes\/([^/]+)\/transcription/
  };

  const pattern = patterns[resourceType];
  if (!pattern) return undefined;

  const match = url.match(pattern);
  return match?.[1];
}

/**
 * Determine resource type from URL path
 * Handles both absolute paths (/voicenotes/...) and relative paths (voicenotes/...)
 */
function detectResourceType(url: string | undefined): string | undefined {
  if (!url) return undefined;

  // Check for transcription first (more specific)
  if (url.includes('/transcription') || url.match(/voicenotes\/[^/]+\/transcription/)) {
    return 'transcription';
  }
  // Check for voicenotes (handles both /voicenotes and voicenotes)
  if (url.includes('voicenotes/') || url.includes('/voicenotes')) {
    return 'voicenote';
  }
  // Check for webhooks
  if (url.includes('webhooks/') || url.includes('/webhooks')) {
    return 'webhook';
  }
  // Check for api-keys
  if (url.includes('api-keys/') || url.includes('/api-keys')) {
    return 'api_key';
  }

  return undefined;
}

/**
 * Convert unknown errors into typed VocaFuseError instances
 * with rich context for better debugging
 *
 * @param error - The error to handle
 * @returns A typed VocaFuseError instance
 */
export function handleApiError(error: unknown): VocaFuseError {
  // Already a VocaFuseError, return as-is
  if (error instanceof VocaFuseError) {
    return error;
  }

  // Use axios.isAxiosError for proper type guard
  if (!axios.isAxiosError(error)) {
    return new VocaFuseError(error instanceof Error ? error.message : 'Unknown error occurred');
  }

  const axiosError = error as AxiosError<ErrorResponse>;
  const statusCode = axiosError.response?.status;
  const errorData = axiosError.response?.data?.error;
  const message = errorData?.message || axiosError.message || 'An error occurred';
  const errorCode = errorData?.code;
  const details = errorData?.details;
  const requestUrl = axiosError.config?.url;

  // Extract context from request
  const resourceType = detectResourceType(requestUrl);
  const resourceId = resourceType ? extractResourceId(requestUrl, resourceType) : undefined;

  // Map status codes to specific exceptions with context
  switch (statusCode) {
    case 401:
      return new AuthenticationError(message, errorCode, details, { endpoint: requestUrl });

    case 403:
      return new AuthorizationError(message, errorCode, details, { endpoint: requestUrl });

    case 400:
      return new ValidationError(message, errorCode, details, { endpoint: requestUrl });

    case 404:
      // Create resource-specific errors with extracted IDs
      if (resourceType === 'transcription') {
        return new TranscriptionNotFoundError(message, errorCode, details, resourceId);
      } else if (resourceType === 'voicenote') {
        return new VoicenoteNotFoundError(message, errorCode, details, resourceId);
      } else if (resourceType === 'webhook') {
        return new WebhookNotFoundError(message, errorCode, details, resourceId);
      } else if (resourceType === 'api_key') {
        return new APIKeyNotFoundError(message, errorCode, details, resourceId);
      }
      return new NotFoundError(message, errorCode, details, { endpoint: requestUrl });

    case 409:
      return new ConflictError(message, errorCode, details, { endpoint: requestUrl });

    case 429: {
      // Extract retry-after header if present
      const retryAfterHeader = axiosError.response?.headers?.['retry-after'] as string | undefined;
      const retryAfterSeconds = retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined;
      return new RateLimitError(
        message,
        errorCode,
        details,
        { endpoint: requestUrl },
        retryAfterSeconds
      );
    }

    default:
      if (statusCode && statusCode >= 500) {
        return new ServerError(message, statusCode, errorCode, details, { endpoint: requestUrl });
      }
      return new VocaFuseError(message, statusCode, errorCode, details, { endpoint: requestUrl });
  }
}
