import nock from 'nock';
import { Client } from '../../../src/client';
import { AuthenticationError } from '../../../src/errors';

describe('AccountResource', () => {
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

  describe('get', () => {
    it('should get account information', async () => {
      nock(baseUrl)
        .get('/account')
        .reply(200, {
          data: {
            id: 'acc_123',
            tenant_id: 'tenant_456',
            name: 'Test Account',
            email: 'test@example.com',
            plan: 'pro',
            created_at: '2024-01-01T00:00:00Z',
            settings: {
              default_language: 'en-US',
              notifications_enabled: true
            },
            usage: {
              voicenotes_count: 100,
              total_duration: 3600,
              api_calls_count: 500
            }
          }
        });

      const result = await client.account.get();

      expect(result.data.id).toBe('acc_123');
      expect(result.data.name).toBe('Test Account');
      expect(result.data.plan).toBe('pro');
      expect(result.data.settings?.default_language).toBe('en-US');
      expect(result.data.usage?.voicenotes_count).toBe(100);
    });

    it('should throw AuthenticationError for invalid credentials', async () => {
      nock(baseUrl)
        .get('/account')
        .reply(401, {
          error: { message: 'Invalid API credentials' }
        });

      await expect(client.account.get()).rejects.toThrow(AuthenticationError);
    });
  });

  describe('update', () => {
    it('should update account name', async () => {
      nock(baseUrl)
        .put('/account', { name: 'Updated Account' })
        .reply(200, {
          data: {
            id: 'acc_123',
            tenant_id: 'tenant_456',
            name: 'Updated Account',
            email: 'test@example.com',
            plan: 'pro',
            created_at: '2024-01-01T00:00:00Z'
          }
        });

      const result = await client.account.update({ name: 'Updated Account' });

      expect(result.data.name).toBe('Updated Account');
    });

    it('should update account settings', async () => {
      nock(baseUrl)
        .put('/account', {
          settings: {
            default_language: 'es-ES',
            notifications_enabled: false
          }
        })
        .reply(200, {
          data: {
            id: 'acc_123',
            tenant_id: 'tenant_456',
            name: 'Test Account',
            email: 'test@example.com',
            plan: 'pro',
            created_at: '2024-01-01T00:00:00Z',
            settings: {
              default_language: 'es-ES',
              notifications_enabled: false
            }
          }
        });

      const result = await client.account.update({
        settings: {
          default_language: 'es-ES',
          notifications_enabled: false
        }
      });

      expect(result.data.settings?.default_language).toBe('es-ES');
      expect(result.data.settings?.notifications_enabled).toBe(false);
    });

    it('should update both name and settings', async () => {
      nock(baseUrl)
        .put('/account', {
          name: 'New Name',
          settings: { default_language: 'fr-FR' }
        })
        .reply(200, {
          data: {
            id: 'acc_123',
            tenant_id: 'tenant_456',
            name: 'New Name',
            email: 'test@example.com',
            plan: 'pro',
            created_at: '2024-01-01T00:00:00Z',
            settings: {
              default_language: 'fr-FR'
            }
          }
        });

      const result = await client.account.update({
        name: 'New Name',
        settings: { default_language: 'fr-FR' }
      });

      expect(result.data.name).toBe('New Name');
      expect(result.data.settings?.default_language).toBe('fr-FR');
    });
  });
});

