import nock from 'nock';
import { Client } from '../../../src/client';
import { WebhookNotFoundError, ValidationError } from '../../../src/errors';

describe('WebhooksResource', () => {
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
    it('should list all webhooks', async () => {
      nock(baseUrl)
        .get('/webhooks')
        .reply(200, {
          data: [
            {
              id: 'wh_123',
              url: 'https://example.com/webhook',
              events: ['voicenote.transcribed'],
              active: true,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z'
            }
          ]
        });

      const result = await client.webhooks.list();

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('wh_123');
      expect(result.data[0].events).toContain('voicenote.transcribed');
    });
  });

  describe('create', () => {
    it('should create a webhook', async () => {
      nock(baseUrl)
        .post('/webhooks', {
          url: 'https://example.com/webhook',
          events: ['voicenote.transcribed', 'voicenote.failed']
        })
        .reply(201, {
          data: {
            id: 'wh_123',
            url: 'https://example.com/webhook',
            events: ['voicenote.transcribed', 'voicenote.failed'],
            active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        });

      const result = await client.webhooks.create({
        url: 'https://example.com/webhook',
        events: ['voicenote.transcribed', 'voicenote.failed']
      });

      expect(result.data.id).toBe('wh_123');
      expect(result.data.events).toHaveLength(2);
    });

    it('should create a webhook with secret', async () => {
      nock(baseUrl)
        .post('/webhooks', {
          url: 'https://example.com/webhook',
          events: ['voicenote.transcribed'],
          secret: 'my-secret'
        })
        .reply(201, {
          data: {
            id: 'wh_123',
            url: 'https://example.com/webhook',
            events: ['voicenote.transcribed'],
            secret: 'my-secret',
            active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        });

      const result = await client.webhooks.create({
        url: 'https://example.com/webhook',
        events: ['voicenote.transcribed'],
        secret: 'my-secret'
      });

      expect(result.data.secret).toBe('my-secret');
    });

    it('should throw ValidationError for invalid URL', async () => {
      nock(baseUrl)
        .post('/webhooks')
        .reply(400, {
          error: { message: 'Invalid URL format', code: 'VALIDATION_ERROR' }
        });

      await expect(client.webhooks.create({
        url: 'not-a-valid-url',
        events: ['voicenote.transcribed']
      })).rejects.toThrow(ValidationError);
    });
  });

  describe('get (callable pattern)', () => {
    it('should get a webhook by ID', async () => {
      nock(baseUrl)
        .get('/webhooks/wh_123')
        .reply(200, {
          data: {
            id: 'wh_123',
            url: 'https://example.com/webhook',
            events: ['voicenote.transcribed'],
            active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        });

      const result = await client.webhooks('wh_123').get();

      expect(result.data.id).toBe('wh_123');
    });

    it('should throw WebhookNotFoundError for 404', async () => {
      nock(baseUrl)
        .get('/webhooks/wh_invalid')
        .reply(404, {
          error: { message: 'Webhook not found' }
        });

      await expect(client.webhooks('wh_invalid').get()).rejects.toThrow(WebhookNotFoundError);
    });
  });

  describe('update (callable pattern)', () => {
    it('should update a webhook', async () => {
      nock(baseUrl)
        .put('/webhooks/wh_123', {
          url: 'https://example.com/new-webhook',
          events: ['voicenote.transcribed']
        })
        .reply(200, {
          data: {
            id: 'wh_123',
            url: 'https://example.com/new-webhook',
            events: ['voicenote.transcribed'],
            active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z'
          }
        });

      const result = await client.webhooks('wh_123').update({
        url: 'https://example.com/new-webhook',
        events: ['voicenote.transcribed']
      });

      expect(result.data.url).toBe('https://example.com/new-webhook');
    });

    it('should update a webhook with secret', async () => {
      nock(baseUrl)
        .put('/webhooks/wh_123', {
          url: 'https://example.com/webhook',
          events: ['voicenote.transcribed'],
          secret: 'new-secret'
        })
        .reply(200, {
          data: {
            id: 'wh_123',
            url: 'https://example.com/webhook',
            events: ['voicenote.transcribed'],
            secret: 'new-secret',
            active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z'
          }
        });

      const result = await client.webhooks('wh_123').update({
        url: 'https://example.com/webhook',
        events: ['voicenote.transcribed'],
        secret: 'new-secret'
      });

      expect(result.data.secret).toBe('new-secret');
    });
  });

  describe('delete (callable pattern)', () => {
    it('should delete a webhook', async () => {
      nock(baseUrl)
        .delete('/webhooks/wh_123')
        .reply(204);

      await expect(client.webhooks('wh_123').delete()).resolves.toBeUndefined();
    });

    it('should throw WebhookNotFoundError when deleting non-existent webhook', async () => {
      nock(baseUrl)
        .delete('/webhooks/wh_invalid')
        .reply(404, {
          error: { message: 'Webhook not found' }
        });

      await expect(client.webhooks('wh_invalid').delete()).rejects.toThrow(WebhookNotFoundError);
    });
  });
});
