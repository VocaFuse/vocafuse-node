import nock from 'nock';
import { AccessToken } from '../../../src/jwt/access-token';
import { AuthenticationError, ValidationError } from '../../../src/errors';

describe('AccessToken', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  describe('constructor', () => {
    it('should detect test environment from API key', async () => {
      nock('https://test-api.vocafuse.com')
        .post('/token')
        .reply(200, {
          data: {
            jwt_token: 'test-jwt-token',
            token_type: 'Bearer',
            expires_in: 3600
          }
        });

      const token = new AccessToken({
        apiKey: 'sk_test_123',
        apiSecret: 'secret_123',
        identity: 'user_123'
      });

      await token.generate();
      expect(nock.isDone()).toBe(true);
    });

    it('should detect live environment from API key', async () => {
      nock('https://api.vocafuse.com')
        .post('/token')
        .reply(200, {
          data: {
            jwt_token: 'live-jwt-token',
            token_type: 'Bearer',
            expires_in: 3600
          }
        });

      const token = new AccessToken({
        apiKey: 'sk_live_123',
        apiSecret: 'secret_123',
        identity: 'user_123'
      });

      await token.generate();
      expect(nock.isDone()).toBe(true);
    });

    it('should use custom baseUrl when provided', async () => {
      nock('https://custom-api.example.com')
        .post('/token')
        .reply(200, {
          data: {
            jwt_token: 'custom-jwt-token',
            token_type: 'Bearer',
            expires_in: 3600
          }
        });

      const token = new AccessToken({
        apiKey: 'sk_test_123',
        apiSecret: 'secret_123',
        identity: 'user_123',
        baseUrl: 'https://custom-api.example.com'
      });

      await token.generate();
      expect(nock.isDone()).toBe(true);
    });

    it('should set correct headers', async () => {
      nock('https://test-api.vocafuse.com', {
        reqheaders: {
          'X-VocaFuse-API-Key': 'sk_test_123',
          'X-VocaFuse-API-Secret': 'secret_123',
          'Content-Type': 'application/json'
        }
      })
        .post('/token')
        .reply(200, {
          data: {
            jwt_token: 'test-jwt-token',
            token_type: 'Bearer',
            expires_in: 3600
          }
        });

      const token = new AccessToken({
        apiKey: 'sk_test_123',
        apiSecret: 'secret_123',
        identity: 'user_123'
      });

      await token.generate();
      expect(nock.isDone()).toBe(true);
    });
  });

  describe('generate', () => {
    it('should generate token with default options', async () => {
      nock('https://test-api.vocafuse.com')
        .post('/token', {
          user_id: 'user_123',
          expires_in: undefined,
          scopes: ['voice-api.upload_voicenote']
        })
        .reply(200, {
          data: {
            jwt_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            token_type: 'Bearer',
            expires_in: 3600
          }
        });

      const token = new AccessToken({
        apiKey: 'sk_test_123',
        apiSecret: 'secret_123',
        identity: 'user_123'
      });

      const result = await token.generate();

      expect(result.data.jwt_token).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
      expect(result.data.token_type).toBe('Bearer');
      expect(result.data.expires_in).toBe(3600);
    });

    it('should generate token with custom expiresIn', async () => {
      nock('https://test-api.vocafuse.com')
        .post('/token', {
          user_id: 'user_456',
          expires_in: 7200,
          scopes: ['voice-api.upload_voicenote']
        })
        .reply(200, {
          data: {
            jwt_token: 'custom-expiry-token',
            token_type: 'Bearer',
            expires_in: 7200
          }
        });

      const token = new AccessToken({
        apiKey: 'sk_test_123',
        apiSecret: 'secret_123',
        identity: 'user_456'
      });

      const result = await token.generate({ expiresIn: 7200 });

      expect(result.data.expires_in).toBe(7200);
    });

    it('should generate token with custom scopes', async () => {
      nock('https://test-api.vocafuse.com')
        .post('/token', {
          user_id: 'user_789',
          expires_in: undefined,
          scopes: ['voicenotes:read', 'voicenotes:write']
        })
        .reply(200, {
          data: {
            jwt_token: 'custom-scopes-token',
            token_type: 'Bearer',
            expires_in: 3600
          }
        });

      const token = new AccessToken({
        apiKey: 'sk_test_123',
        apiSecret: 'secret_123',
        identity: 'user_789'
      });

      const result = await token.generate({
        scopes: ['voicenotes:read', 'voicenotes:write']
      });

      expect(result.data.jwt_token).toBe('custom-scopes-token');
    });

    it('should generate token with both expiresIn and scopes', async () => {
      nock('https://test-api.vocafuse.com')
        .post('/token', {
          user_id: 'user_full',
          expires_in: 1800,
          scopes: ['voicenotes:read']
        })
        .reply(200, {
          data: {
            jwt_token: 'full-options-token',
            token_type: 'Bearer',
            expires_in: 1800
          }
        });

      const token = new AccessToken({
        apiKey: 'sk_test_123',
        apiSecret: 'secret_123',
        identity: 'user_full'
      });

      const result = await token.generate({
        expiresIn: 1800,
        scopes: ['voicenotes:read']
      });

      expect(result.data.jwt_token).toBe('full-options-token');
      expect(result.data.expires_in).toBe(1800);
    });

    it('should throw AuthenticationError for invalid credentials', async () => {
      nock('https://test-api.vocafuse.com')
        .post('/token')
        .reply(401, {
          error: {
            message: 'Invalid API credentials',
            code: 'AUTHENTICATION_ERROR'
          }
        });

      const token = new AccessToken({
        apiKey: 'sk_test_invalid',
        apiSecret: 'invalid_secret',
        identity: 'user_123'
      });

      await expect(token.generate()).rejects.toThrow(AuthenticationError);
    });

    it('should throw ValidationError for invalid parameters', async () => {
      nock('https://test-api.vocafuse.com')
        .post('/token')
        .reply(400, {
          error: {
            message: 'Invalid identity format',
            code: 'VALIDATION_ERROR'
          }
        });

      const token = new AccessToken({
        apiKey: 'sk_test_123',
        apiSecret: 'secret_123',
        identity: ''
      });

      await expect(token.generate()).rejects.toThrow(ValidationError);
    });
  });
});

