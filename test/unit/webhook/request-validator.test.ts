import { RequestValidator } from '../../../src/webhook/request-validator';

describe('RequestValidator', () => {
  const secret = 'test-secret-key';
  let validator: RequestValidator;

  beforeEach(() => {
    validator = new RequestValidator(secret);
  });

  describe('validate', () => {
    it('should validate correct signature', () => {
      const payload = '{"event":"voicenote.completed"}';
      const signature = validator.computeSignature(payload);

      expect(validator.validate(payload, signature)).toBe(true);
    });

    it('should reject invalid signature', () => {
      const payload = '{"event":"voicenote.completed"}';
      const invalidSignature = 'invalid-signature';

      expect(validator.validate(payload, invalidSignature)).toBe(false);
    });

    it('should handle sha256= prefix', () => {
      const payload = '{"event":"voicenote.completed"}';
      const signature = `sha256=${validator.computeSignature(payload)}`;

      expect(validator.validate(payload, signature)).toBe(true);
    });

    it('should validate with timestamp', () => {
      const payload = '{"event":"voicenote.completed"}';
      const timestamp = '1234567890';
      const signature = validator.computeSignature(payload, timestamp);

      expect(validator.validate(payload, signature, { timestamp })).toBe(true);
    });

    it('should validate with timestamp and deliveryId', () => {
      const payload = '{"event":"voicenote.completed"}';
      const timestamp = '1234567890';
      const deliveryId = 'del_abc123';
      const signature = validator.computeSignature(payload, timestamp, deliveryId);

      expect(validator.validate(payload, signature, { timestamp, deliveryId })).toBe(true);
    });

    it('should reject when timestamp is missing but expected', () => {
      const payload = '{"event":"voicenote.completed"}';
      const timestamp = '1234567890';
      const signature = validator.computeSignature(payload, timestamp);

      // Signature was computed with timestamp, but validation is done without
      expect(validator.validate(payload, signature)).toBe(false);
    });

    it('should reject tampered payload', () => {
      const payload = '{"event":"voicenote.completed"}';
      const signature = validator.computeSignature(payload);
      const tamperedPayload = '{"event":"voicenote.failed"}';

      expect(validator.validate(tamperedPayload, signature)).toBe(false);
    });

    it('should handle different length signatures gracefully', () => {
      const payload = '{"event":"voicenote.completed"}';
      const shortSignature = 'abc';
      const longSignature = 'a'.repeat(200);

      expect(validator.validate(payload, shortSignature)).toBe(false);
      expect(validator.validate(payload, longSignature)).toBe(false);
    });
  });

  describe('computeSignature', () => {
    it('should compute consistent signatures', () => {
      const payload = '{"event":"voicenote.completed"}';
      const sig1 = validator.computeSignature(payload);
      const sig2 = validator.computeSignature(payload);

      expect(sig1).toBe(sig2);
    });

    it('should produce different signatures for different payloads', () => {
      const sig1 = validator.computeSignature('payload1');
      const sig2 = validator.computeSignature('payload2');

      expect(sig1).not.toBe(sig2);
    });

    it('should produce different signatures for different secrets', () => {
      const payload = 'test-payload';
      const validator2 = new RequestValidator('different-secret');

      const sig1 = validator.computeSignature(payload);
      const sig2 = validator2.computeSignature(payload);

      expect(sig1).not.toBe(sig2);
    });

    it('should include timestamp in signature when provided', () => {
      const payload = 'test-payload';
      const timestamp = '1234567890';

      const sigWithoutTimestamp = validator.computeSignature(payload);
      const sigWithTimestamp = validator.computeSignature(payload, timestamp);

      expect(sigWithoutTimestamp).not.toBe(sigWithTimestamp);
    });

    it('should return hex string', () => {
      const payload = 'test-payload';
      const signature = validator.computeSignature(payload);

      expect(signature).toMatch(/^[a-f0-9]+$/);
      expect(signature.length).toBe(64); // SHA-256 produces 64 hex chars
    });
  });
});

