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

describe('VocaFuseError', () => {
  describe('constructor', () => {
    it('should create error with all properties', () => {
      const error = new VocaFuseError(
        'Test error',
        400,
        'TEST_ERROR',
        { field: 'value' },
        { resourceType: 'test', resourceId: '123', suggestion: 'Try again' }
      );

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.errorCode).toBe('TEST_ERROR');
      expect(error.details).toEqual({ field: 'value' });
      expect(error.context?.resourceType).toBe('test');
    });

    it('should create error with minimal properties', () => {
      const error = new VocaFuseError('Simple error');

      expect(error.message).toBe('Simple error');
      expect(error.statusCode).toBeUndefined();
      expect(error.errorCode).toBeUndefined();
      expect(error.details).toBeUndefined();
      expect(error.context).toBeUndefined();
    });
  });

  describe('friendlyMessage', () => {
    it('should return message when no context', () => {
      const error = new VocaFuseError('Test error');
      expect(error.friendlyMessage).toBe('Test error');
    });

    it('should include resource info when available', () => {
      const error = new VocaFuseError('Test error', 404, undefined, undefined, {
        resourceType: 'voicenote',
        resourceId: 'vn_123'
      });

      expect(error.friendlyMessage).toBe('Test error (voicenote: vn_123)');
    });

    it('should include suggestion when available', () => {
      const error = new VocaFuseError('Test error', 404, undefined, undefined, {
        suggestion: 'Check the ID'
      });

      expect(error.friendlyMessage).toBe('Test error. Check the ID');
    });

    it('should include both resource and suggestion', () => {
      const error = new VocaFuseError('Test error', 404, undefined, undefined, {
        resourceType: 'voicenote',
        resourceId: 'vn_123',
        suggestion: 'Check the ID'
      });

      expect(error.friendlyMessage).toBe('Test error (voicenote: vn_123). Check the ID');
    });
  });

  describe('toJSON', () => {
    it('should serialize error to JSON', () => {
      const error = new VocaFuseError(
        'Test error',
        400,
        'TEST_ERROR',
        { field: 'value' },
        { resourceType: 'test', resourceId: '123' }
      );

      const json = error.toJSON();

      expect(json.name).toBe('VocaFuseError');
      expect(json.message).toBe('Test error');
      expect(json.statusCode).toBe(400);
      expect(json.errorCode).toBe('TEST_ERROR');
      expect(json.details).toEqual({ field: 'value' });
      expect(json.context).toEqual({ resourceType: 'test', resourceId: '123' });
      expect(json.friendlyMessage).toBe('Test error (test: 123)');
    });
  });

  describe('instanceof checks', () => {
    it('should be instance of Error', () => {
      const error = new VocaFuseError('Test');
      expect(error).toBeInstanceOf(Error);
    });

    it('should be instance of VocaFuseError', () => {
      const error = new VocaFuseError('Test');
      expect(error).toBeInstanceOf(VocaFuseError);
    });
  });
});

describe('AuthenticationError', () => {
  it('should have correct status code', () => {
    const error = new AuthenticationError('Invalid credentials');
    expect(error.statusCode).toBe(401);
    expect(error.name).toBe('AuthenticationError');
  });

  it('should have default suggestion', () => {
    const error = new AuthenticationError('Invalid credentials');
    expect(error.context?.suggestion).toContain('API key and secret');
  });
});

describe('AuthorizationError', () => {
  it('should have correct status code', () => {
    const error = new AuthorizationError('Forbidden');
    expect(error.statusCode).toBe(403);
    expect(error.name).toBe('AuthorizationError');
  });

  it('should have default suggestion', () => {
    const error = new AuthorizationError('Forbidden');
    expect(error.context?.suggestion).toContain('permissions');
  });
});

describe('ValidationError', () => {
  it('should have correct status code', () => {
    const error = new ValidationError('Invalid input');
    expect(error.statusCode).toBe(400);
    expect(error.name).toBe('ValidationError');
  });
});

describe('NotFoundError', () => {
  it('should have correct status code', () => {
    const error = new NotFoundError('Not found');
    expect(error.statusCode).toBe(404);
    expect(error.name).toBe('NotFoundError');
  });
});

describe('ConflictError', () => {
  it('should have correct status code', () => {
    const error = new ConflictError('Conflict');
    expect(error.statusCode).toBe(409);
    expect(error.name).toBe('ConflictError');
  });
});

describe('RateLimitError', () => {
  it('should have correct status code', () => {
    const error = new RateLimitError('Rate limited');
    expect(error.statusCode).toBe(429);
    expect(error.name).toBe('RateLimitError');
  });

  it('should store retryAfter value', () => {
    const error = new RateLimitError('Rate limited', undefined, undefined, undefined, 60);
    expect(error.retryAfter).toBe(60);
  });

  it('should include retryAfter in suggestion', () => {
    const error = new RateLimitError('Rate limited', undefined, undefined, undefined, 60);
    expect(error.context?.suggestion).toContain('60 seconds');
  });
});

describe('ServerError', () => {
  it('should accept custom status code', () => {
    const error = new ServerError('Server error', 503);
    expect(error.statusCode).toBe(503);
    expect(error.name).toBe('ServerError');
  });

  it('should have default suggestion', () => {
    const error = new ServerError('Server error', 500);
    expect(error.context?.suggestion).toContain('server-side');
  });
});

describe('Resource-specific errors', () => {
  describe('VoicenoteNotFoundError', () => {
    it('should have correct context', () => {
      const error = new VoicenoteNotFoundError('Not found', undefined, undefined, 'vn_123');
      expect(error.context?.resourceType).toBe('voicenote');
      expect(error.context?.resourceId).toBe('vn_123');
      expect(error.name).toBe('VoicenoteNotFoundError');
    });

    it('should be instance of NotFoundError', () => {
      const error = new VoicenoteNotFoundError('Not found');
      expect(error).toBeInstanceOf(NotFoundError);
    });
  });

  describe('WebhookNotFoundError', () => {
    it('should have correct context', () => {
      const error = new WebhookNotFoundError('Not found', undefined, undefined, 'wh_456');
      expect(error.context?.resourceType).toBe('webhook');
      expect(error.context?.resourceId).toBe('wh_456');
      expect(error.name).toBe('WebhookNotFoundError');
    });
  });

  describe('TranscriptionNotFoundError', () => {
    it('should have correct context', () => {
      const error = new TranscriptionNotFoundError('Not found', undefined, undefined, 'vn_123');
      expect(error.context?.resourceType).toBe('transcription');
      expect(error.context?.resourceId).toBe('vn_123');
      expect(error.name).toBe('TranscriptionNotFoundError');
    });

    it('should mention processing in suggestion', () => {
      const error = new TranscriptionNotFoundError('Not found');
      expect(error.context?.suggestion).toContain('processing');
    });
  });

  describe('APIKeyNotFoundError', () => {
    it('should have correct context', () => {
      const error = new APIKeyNotFoundError('Not found', undefined, undefined, 'ak_789');
      expect(error.context?.resourceType).toBe('api_key');
      expect(error.context?.resourceId).toBe('ak_789');
      expect(error.name).toBe('APIKeyNotFoundError');
    });
  });
});

