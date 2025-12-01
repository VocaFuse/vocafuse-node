import { AxiosError } from 'axios';
import { handleApiError } from '../../../src/errors/error-handler';
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
} from '../../../src/errors';

describe('handleApiError', () => {
  function createAxiosError(
    status: number,
    message: string,
    code?: string,
    url?: string,
    headers?: Record<string, string>
  ): AxiosError {
    const error = new Error(message) as AxiosError;
    error.isAxiosError = true;
    error.response = {
      status,
      statusText: 'Error',
      headers: headers || {},
      config: {} as any,
      data: {
        error: { message, code }
      }
    };
    error.config = { url } as any;
    return error;
  }

  describe('VocaFuseError passthrough', () => {
    it('should return VocaFuseError as-is', () => {
      const originalError = new VocaFuseError('Original error', 400);
      const result = handleApiError(originalError);

      expect(result).toBe(originalError);
    });
  });

  describe('non-Axios errors', () => {
    it('should wrap generic Error', () => {
      const error = new Error('Generic error');
      const result = handleApiError(error);

      expect(result).toBeInstanceOf(VocaFuseError);
      expect(result.message).toBe('Generic error');
    });

    it('should handle unknown errors', () => {
      const result = handleApiError('string error');

      expect(result).toBeInstanceOf(VocaFuseError);
      expect(result.message).toBe('Unknown error occurred');
    });
  });

  describe('401 Authentication errors', () => {
    it('should create AuthenticationError', () => {
      const error = createAxiosError(401, 'Invalid API key');
      const result = handleApiError(error);

      expect(result).toBeInstanceOf(AuthenticationError);
      expect(result.message).toBe('Invalid API key');
      expect(result.statusCode).toBe(401);
    });
  });

  describe('403 Authorization errors', () => {
    it('should create AuthorizationError', () => {
      const error = createAxiosError(403, 'Insufficient permissions');
      const result = handleApiError(error);

      expect(result).toBeInstanceOf(AuthorizationError);
      expect(result.message).toBe('Insufficient permissions');
      expect(result.statusCode).toBe(403);
    });
  });

  describe('400 Validation errors', () => {
    it('should create ValidationError', () => {
      const error = createAxiosError(400, 'Invalid parameters');
      const result = handleApiError(error);

      expect(result).toBeInstanceOf(ValidationError);
      expect(result.message).toBe('Invalid parameters');
      expect(result.statusCode).toBe(400);
    });
  });

  describe('404 Not Found errors', () => {
    it('should create VoicenoteNotFoundError for voicenote endpoints', () => {
      const error = createAxiosError(404, 'Voicenote not found', 'NOT_FOUND', '/voicenotes/vn_123');
      const result = handleApiError(error);

      expect(result).toBeInstanceOf(VoicenoteNotFoundError);
      expect(result.context?.resourceType).toBe('voicenote');
      expect(result.context?.resourceId).toBe('vn_123');
    });

    it('should create WebhookNotFoundError for webhook endpoints', () => {
      const error = createAxiosError(404, 'Webhook not found', 'NOT_FOUND', '/webhooks/wh_456');
      const result = handleApiError(error);

      expect(result).toBeInstanceOf(WebhookNotFoundError);
      expect(result.context?.resourceType).toBe('webhook');
      expect(result.context?.resourceId).toBe('wh_456');
    });

    it('should create TranscriptionNotFoundError for transcription endpoints', () => {
      const error = createAxiosError(404, 'Transcription not found', 'NOT_FOUND', '/voicenotes/vn_123/transcription');
      const result = handleApiError(error);

      expect(result).toBeInstanceOf(TranscriptionNotFoundError);
      expect(result.context?.resourceType).toBe('transcription');
      expect(result.context?.resourceId).toBe('vn_123');
    });

    it('should create APIKeyNotFoundError for api-keys endpoints', () => {
      const error = createAxiosError(404, 'API key not found', 'NOT_FOUND', '/api-keys/ak_789');
      const result = handleApiError(error);

      expect(result).toBeInstanceOf(APIKeyNotFoundError);
      expect(result.context?.resourceType).toBe('api_key');
      expect(result.context?.resourceId).toBe('ak_789');
    });

    it('should create generic NotFoundError for unknown endpoints', () => {
      const error = createAxiosError(404, 'Not found', 'NOT_FOUND', '/unknown/endpoint');
      const result = handleApiError(error);

      expect(result).toBeInstanceOf(NotFoundError);
      expect(result).not.toBeInstanceOf(VoicenoteNotFoundError);
    });
  });

  describe('409 Conflict errors', () => {
    it('should create ConflictError', () => {
      const error = createAxiosError(409, 'Resource already exists');
      const result = handleApiError(error);

      expect(result).toBeInstanceOf(ConflictError);
      expect(result.message).toBe('Resource already exists');
      expect(result.statusCode).toBe(409);
    });
  });

  describe('429 Rate Limit errors', () => {
    it('should create RateLimitError', () => {
      const error = createAxiosError(429, 'Rate limit exceeded');
      const result = handleApiError(error);

      expect(result).toBeInstanceOf(RateLimitError);
      expect(result.message).toBe('Rate limit exceeded');
      expect(result.statusCode).toBe(429);
    });

    it('should extract retry-after header', () => {
      const error = createAxiosError(429, 'Rate limit exceeded', undefined, undefined, { 'retry-after': '60' });
      const result = handleApiError(error) as RateLimitError;

      expect(result).toBeInstanceOf(RateLimitError);
      expect(result.retryAfter).toBe(60);
    });
  });

  describe('5xx Server errors', () => {
    it('should create ServerError for 500', () => {
      const error = createAxiosError(500, 'Internal server error');
      const result = handleApiError(error);

      expect(result).toBeInstanceOf(ServerError);
      expect(result.statusCode).toBe(500);
    });

    it('should create ServerError for 502', () => {
      const error = createAxiosError(502, 'Bad gateway');
      const result = handleApiError(error);

      expect(result).toBeInstanceOf(ServerError);
      expect(result.statusCode).toBe(502);
    });

    it('should create ServerError for 503', () => {
      const error = createAxiosError(503, 'Service unavailable');
      const result = handleApiError(error);

      expect(result).toBeInstanceOf(ServerError);
      expect(result.statusCode).toBe(503);
    });
  });

  describe('other status codes', () => {
    it('should create generic VocaFuseError for unknown status codes', () => {
      const error = createAxiosError(418, "I'm a teapot");
      const result = handleApiError(error);

      expect(result).toBeInstanceOf(VocaFuseError);
      expect(result).not.toBeInstanceOf(AuthenticationError);
      expect(result.statusCode).toBe(418);
    });
  });
});

