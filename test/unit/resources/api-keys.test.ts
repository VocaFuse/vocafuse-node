import nock from 'nock';
import { Client } from '../../../src/client';
import { APIKeyNotFoundError } from '../../../src/errors';

describe('APIKeysResource', () => {
  let client: Client;
  const baseUrl = 'https://test-api.vocafuse.com';

  beforeEach(() => {
    client = new Client({
      apiKey: 'sk_test_123',
      apiSecret: 'secret_123'
    });
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('list', () => {
    it('should list all API keys', async () => {
      nock(baseUrl)
        .get('/account/api-keys')
        .reply(200, {
          data: [
            {
              id: 'ak_123',
              name: 'Production Key',
              api_key: 'sk_live_abc123',
              created_at: '2024-01-01T00:00:00Z',
              last_used_at: '2024-01-15T00:00:00Z'
            }
          ]
        });

      const result = await client.apiKeys.list();

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('ak_123');
      expect(result.data[0].name).toBe('Production Key');
    });
  });

  describe('create', () => {
    it('should create an API key', async () => {
      nock(baseUrl)
        .post('/account/api-keys', { name: 'New Key' })
        .reply(201, {
          data: {
            id: 'ak_456',
            name: 'New Key',
            api_key: 'sk_live_newkey',
            api_secret: 'secret_newkey',
            created_at: '2024-01-01T00:00:00Z'
          }
        });

      const result = await client.apiKeys.create({ name: 'New Key' });

      expect(result.data.id).toBe('ak_456');
      expect(result.data.name).toBe('New Key');
      expect(result.data.api_key).toBe('sk_live_newkey');
      expect(result.data.api_secret).toBe('secret_newkey');
    });
  });

  describe('get (callable pattern)', () => {
    it('should get an API key by ID', async () => {
      nock(baseUrl)
        .get('/account/api-keys/ak_123')
        .reply(200, {
          data: {
            id: 'ak_123',
            name: 'Production Key',
            api_key: 'sk_live_abc123',
            created_at: '2024-01-01T00:00:00Z',
            last_used_at: '2024-01-15T00:00:00Z'
          }
        });

      const result = await client.apiKeys('ak_123').get();

      expect(result.data.id).toBe('ak_123');
      expect(result.data.name).toBe('Production Key');
    });
  });

  describe('delete (callable pattern)', () => {
    it('should delete an API key', async () => {
      nock(baseUrl)
        .delete('/account/api-keys/ak_123')
        .reply(204);

      await expect(client.apiKeys('ak_123').delete()).resolves.toBeUndefined();
    });

    it('should throw APIKeyNotFoundError for 404', async () => {
      nock(baseUrl)
        .delete('/account/api-keys/ak_invalid')
        .reply(404, {
          error: { message: 'API key not found' }
        });

      await expect(client.apiKeys('ak_invalid').delete()).rejects.toThrow(APIKeyNotFoundError);
    });
  });
});
