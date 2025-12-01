import nock from 'nock';
import { Client } from '../../src/client';

describe('Client', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  describe('constructor', () => {
    it('should create client with required options', () => {
      const client = new Client({
        apiKey: 'sk_test_123',
        apiSecret: 'secret_123'
      });

      expect(client).toBeDefined();
      expect(client.voicenotes).toBeDefined();
      expect(client.webhooks).toBeDefined();
      expect(client.apiKeys).toBeDefined();
      expect(client.account).toBeDefined();
    });

    it('should detect test environment from API key', () => {
      nock('https://test-api.vocafuse.com')
        .get('/voicenotes')
        .query(true)
        .reply(200, { data: [], pagination: { page: 0, limit: 50, total: 0, has_more: false } });

      const client = new Client({
        apiKey: 'sk_test_123',
        apiSecret: 'secret_123'
      });

      // This will make a request to the test API
      return client.voicenotes.list().then(() => {
        expect(nock.isDone()).toBe(true);
      });
    });

    it('should detect live environment from API key', () => {
      nock('https://api.vocafuse.com')
        .get('/voicenotes')
        .query(true)
        .reply(200, { data: [], pagination: { page: 0, limit: 50, total: 0, has_more: false } });

      const client = new Client({
        apiKey: 'sk_live_123',
        apiSecret: 'secret_123'
      });

      return client.voicenotes.list().then(() => {
        expect(nock.isDone()).toBe(true);
      });
    });

    it('should use custom baseUrl when provided', () => {
      nock('https://custom-api.example.com')
        .get('/voicenotes')
        .query(true)
        .reply(200, { data: [], pagination: { page: 0, limit: 50, total: 0, has_more: false } });

      const client = new Client({
        apiKey: 'sk_test_123',
        apiSecret: 'secret_123',
        baseUrl: 'https://custom-api.example.com'
      });

      return client.voicenotes.list().then(() => {
        expect(nock.isDone()).toBe(true);
      });
    });

    it('should set correct headers', () => {
      nock('https://test-api.vocafuse.com', {
        reqheaders: {
          'X-VocaFuse-API-Key': 'sk_test_123',
          'X-VocaFuse-API-Secret': 'secret_123',
          'Content-Type': 'application/json'
        }
      })
        .get('/voicenotes')
        .query(true)
        .reply(200, { data: [], pagination: { page: 0, limit: 50, total: 0, has_more: false } });

      const client = new Client({
        apiKey: 'sk_test_123',
        apiSecret: 'secret_123'
      });

      return client.voicenotes.list().then(() => {
        expect(nock.isDone()).toBe(true);
      });
    });
  });

  describe('retry logic', () => {
    it('should retry on 500 errors', async () => {
      let attempts = 0;
      nock('https://test-api.vocafuse.com')
        .get('/voicenotes')
        .query(true)
        .times(2)
        .reply(() => {
          attempts++;
          if (attempts === 1) {
            return [500, { error: { message: 'Server error' } }];
          }
          return [200, { data: [], pagination: { page: 0, limit: 50, total: 0, has_more: false } }];
        });

      const client = new Client({
        apiKey: 'sk_test_123',
        apiSecret: 'secret_123',
        retry: {
          maxRetries: 3,
          retryDelay: 10 // Short delay for tests
        }
      });

      const result = await client.voicenotes.list();
      expect(result.data).toEqual([]);
      expect(attempts).toBe(2);
    });

    it('should retry on 429 rate limit errors', async () => {
      let attempts = 0;
      nock('https://test-api.vocafuse.com')
        .get('/voicenotes')
        .query(true)
        .times(2)
        .reply(() => {
          attempts++;
          if (attempts === 1) {
            return [429, { error: { message: 'Rate limited' } }];
          }
          return [200, { data: [], pagination: { page: 0, limit: 50, total: 0, has_more: false } }];
        });

      const client = new Client({
        apiKey: 'sk_test_123',
        apiSecret: 'secret_123',
        retry: {
          maxRetries: 3,
          retryDelay: 10
        }
      });

      const result = await client.voicenotes.list();
      expect(result.data).toEqual([]);
      expect(attempts).toBe(2);
    });

    it('should not retry on 400 errors', async () => {
      let attempts = 0;
      nock('https://test-api.vocafuse.com')
        .get('/voicenotes')
        .query(true)
        .reply(() => {
          attempts++;
          return [400, { error: { message: 'Bad request' } }];
        });

      const client = new Client({
        apiKey: 'sk_test_123',
        apiSecret: 'secret_123',
        retry: {
          maxRetries: 3,
          retryDelay: 10
        }
      });

      await expect(client.voicenotes.list()).rejects.toThrow();
      expect(attempts).toBe(1);
    });

    it('should stop retrying after max retries', async () => {
      let attempts = 0;
      nock('https://test-api.vocafuse.com')
        .get('/voicenotes')
        .query(true)
        .times(4)
        .reply(() => {
          attempts++;
          return [500, { error: { message: 'Server error' } }];
        });

      const client = new Client({
        apiKey: 'sk_test_123',
        apiSecret: 'secret_123',
        retry: {
          maxRetries: 3,
          retryDelay: 10
        }
      });

      await expect(client.voicenotes.list()).rejects.toThrow();
      expect(attempts).toBe(4); // 1 initial + 3 retries
    });
  });
});

