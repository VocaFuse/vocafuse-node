import nock from 'nock';
import { Client } from '../../../src/client';
import { VoicenoteNotFoundError, TranscriptionNotFoundError } from '../../../src/errors';

describe('VoicenotesResource', () => {
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
    it('should list voicenotes with default options', async () => {
      nock(baseUrl)
        .get('/voicenotes')
        .query({ page: 0, limit: 50 })
        .reply(200, {
          data: [
            { id: 'vn_123', status: 'transcribed', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' }
          ],
          pagination: { page: 0, limit: 50, total: 1, has_more: false }
        });

      const result = await client.voicenotes.list();

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('vn_123');
      expect(result.pagination?.has_more).toBe(false);
    });

    it('should list voicenotes with custom options', async () => {
      nock(baseUrl)
        .get('/voicenotes')
        .query({ page: 1, limit: 20, status: 'transcribed', date_from: '2024-01-01', date_to: '2024-12-31' })
        .reply(200, {
          data: [],
          pagination: { page: 1, limit: 20, total: 0, has_more: false }
        });

      const result = await client.voicenotes.list({
        page: 1,
        limit: 20,
        status: 'transcribed',
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31'
      });

      expect(result.data).toHaveLength(0);
    });

    it('should cap limit at 100', async () => {
      nock(baseUrl)
        .get('/voicenotes')
        .query({ page: 0, limit: 100 })
        .reply(200, {
          data: [],
          pagination: { page: 0, limit: 100, total: 0, has_more: false }
        });

      await client.voicenotes.list({ limit: 200 });
      expect(nock.isDone()).toBe(true);
    });
  });

  describe('get (callable pattern)', () => {
    it('should get a voicenote by ID', async () => {
      nock(baseUrl)
        .get('/voicenotes/vn_123')
        .reply(200, {
          data: {
            id: 'vn_123',
            status: 'transcribed',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            duration: 30,
            file_size: 1024
          }
        });

      const result = await client.voicenotes('vn_123').get();

      expect(result.data.id).toBe('vn_123');
      expect(result.data.status).toBe('transcribed');
      expect(result.data.duration).toBe(30);
    });

    it('should throw VoicenoteNotFoundError for 404', async () => {
      nock(baseUrl)
        .get('/voicenotes/vn_invalid')
        .reply(404, {
          error: { message: 'Voicenote not found', code: 'NOT_FOUND' }
        });

      await expect(client.voicenotes('vn_invalid').get()).rejects.toThrow(VoicenoteNotFoundError);
    });
  });

  describe('delete (callable pattern)', () => {
    it('should delete a voicenote', async () => {
      nock(baseUrl)
        .delete('/voicenotes/vn_123')
        .reply(204);

      await expect(client.voicenotes('vn_123').delete()).resolves.toBeUndefined();
    });

    it('should throw VoicenoteNotFoundError when deleting non-existent voicenote', async () => {
      nock(baseUrl)
        .delete('/voicenotes/vn_invalid')
        .reply(404, {
          error: { message: 'Voicenote not found' }
        });

      await expect(client.voicenotes('vn_invalid').delete()).rejects.toThrow(VoicenoteNotFoundError);
    });
  });

  describe('iterate', () => {
    it('should iterate over all voicenotes with automatic pagination', async () => {
      nock(baseUrl)
        .get('/voicenotes')
        .query({ page: 0, limit: 50 })
        .reply(200, {
          data: [
            { id: 'vn_1', status: 'transcribed', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
            { id: 'vn_2', status: 'transcribed', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' }
          ],
          pagination: { page: 0, limit: 50, total: 4, has_more: true }
        });

      nock(baseUrl)
        .get('/voicenotes')
        .query({ page: 1, limit: 50 })
        .reply(200, {
          data: [
            { id: 'vn_3', status: 'transcribed', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
            { id: 'vn_4', status: 'transcribed', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' }
          ],
          pagination: { page: 1, limit: 50, total: 4, has_more: false }
        });

      const voicenotes = [];
      for await (const vn of client.voicenotes.iterate()) {
        voicenotes.push(vn);
      }

      expect(voicenotes).toHaveLength(4);
      expect(voicenotes.map(v => v.id)).toEqual(['vn_1', 'vn_2', 'vn_3', 'vn_4']);
    });

    it('should support early exit from iteration', async () => {
      nock(baseUrl)
        .get('/voicenotes')
        .query({ page: 0, limit: 50 })
        .reply(200, {
          data: [
            { id: 'vn_1', status: 'transcribed', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
            { id: 'vn_2', status: 'failed', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
            { id: 'vn_3', status: 'transcribed', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' }
          ],
          pagination: { page: 0, limit: 50, total: 100, has_more: true }
        });

      const voicenotes = [];
      for await (const vn of client.voicenotes.iterate()) {
        voicenotes.push(vn);
        if (vn.status === 'failed') {
          break;
        }
      }

      expect(voicenotes).toHaveLength(2);
      expect(voicenotes[1].status).toBe('failed');
    });

    it('should pass filter options through iteration', async () => {
      nock(baseUrl)
        .get('/voicenotes')
        .query({ page: 0, limit: 50, status: 'transcribed' })
        .reply(200, {
          data: [
            { id: 'vn_1', status: 'transcribed', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' }
          ],
          pagination: { page: 0, limit: 50, total: 1, has_more: false }
        });

      const voicenotes = [];
      for await (const vn of client.voicenotes.iterate({ status: 'transcribed' })) {
        voicenotes.push(vn);
      }

      expect(voicenotes).toHaveLength(1);
    });
  });

  describe('callable pattern (nested resources)', () => {
    it('should access transcription via callable pattern', async () => {
      nock(baseUrl)
        .get('/voicenotes/vn_123/transcription')
        .reply(200, {
          data: {
            id: 'tr_456',
            voicenote_id: 'vn_123',
            text: 'Hello world',
            confidence: 0.95,
            language: 'en',
            created_at: '2024-01-01T00:00:00Z'
          }
        });

      const result = await client.voicenotes('vn_123').transcription.get();

      expect(result.data.id).toBe('tr_456');
      expect(result.data.text).toBe('Hello world');
      expect(result.data.confidence).toBe(0.95);
    });

    it('should throw TranscriptionNotFoundError for 404', async () => {
      nock(baseUrl)
        .get('/voicenotes/vn_123/transcription')
        .reply(404, {
          error: { message: 'Transcription not found' }
        });

      await expect(client.voicenotes('vn_123').transcription.get()).rejects.toThrow(TranscriptionNotFoundError);
    });
  });
});
