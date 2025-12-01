import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Options for webhook validation
 */
export interface ValidateOptions {
  /** Optional URL (not used in signature, reserved for future use) */
  url?: string;
  /** Timestamp from X-VocaFuse-Timestamp header */
  timestamp?: string;
  /** Delivery ID from X-VocaFuse-Delivery-ID header */
  deliveryId?: string;
}

/**
 * Validate webhook request signatures.
 *
 * RequestValidator is a standalone class for verifying that incoming webhook
 * requests are authentic and originated from VocaFuse.
 *
 * **Security Notes:**
 * - Uses timing-safe comparison to prevent timing attacks
 * - Supports timestamp-based signatures to prevent replay attacks
 * - Always verify webhooks in production to ensure request authenticity
 *
 * @example
 * ```typescript
 * import { RequestValidator } from 'vocafuse-node';
 *
 * const validator = new RequestValidator(process.env.WEBHOOK_SECRET!);
 *
 * // In your webhook handler
 * app.post('/webhooks/vocafuse', (req, res) => {
 *   const payload = req.body.toString('utf8');
 *   const signature = req.headers['x-vocafuse-signature'];
 *
 *   if (!validator.validate(payload, signature)) {
 *     return res.status(401).json({ error: 'Invalid signature' });
 *   }
 *
 *   // Process webhook...
 *   res.json({ received: true });
 * });
 * ```
 */
export class RequestValidator {
  constructor(private readonly authToken: string) {}

  /**
   * Validate webhook signature
   *
   * @param payload - Raw request body as string
   * @param signature - Signature from X-VocaFuse-Signature header
   * @param options - Optional validation options
   * @param options.timestamp - Timestamp from X-VocaFuse-Timestamp header
   * @param options.deliveryId - Delivery ID from X-VocaFuse-Delivery-ID header
   *
   * @returns True if signature is valid, false otherwise
   *
   * @example
   * ```typescript
   * // Validate webhook signature
   * const isValid = validator.validate(payload, signature);
   * ```
   */
  validate(payload: string, signature: string, options?: ValidateOptions): boolean {
    const stringToSign = this.buildStringToSign(payload, options?.timestamp, options?.deliveryId);

    const expectedSignature = this.computeSignature(stringToSign);
    const providedSignature = signature.startsWith('sha256=') ? signature.slice(7) : signature;

    // Timing-safe comparison to prevent timing attacks
    try {
      return timingSafeEqual(
        Buffer.from(providedSignature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch {
      // If buffers have different lengths, timingSafeEqual throws
      return false;
    }
  }

  /**
   * Compute signature for a payload
   *
   * Useful for testing or generating signatures for outgoing webhooks.
   *
   * @param payload - The payload to sign
   * @param timestamp - Optional timestamp to include in signature
   * @param deliveryId - Optional delivery ID to include in signature
   *
   * @returns The computed HMAC-SHA256 signature as hex string
   *
   * @example
   * ```typescript
   * // Compute signature for testing
   * const signature = validator.computeSignature(
   *   '{"event":"voicenote.transcribed"}'
   * );
   * ```
   */
  computeSignature(payload: string, timestamp?: string, deliveryId?: string): string {
    const stringToSign = this.buildStringToSign(payload, timestamp, deliveryId);
    return createHmac('sha256', this.authToken).update(stringToSign).digest('hex');
  }

  /**
   * Build the string to sign based on available components
   */
  private buildStringToSign(payload: string, timestamp?: string, deliveryId?: string): string {
    if (timestamp && deliveryId) {
      return `${timestamp}.${deliveryId}.${payload}`;
    } else if (timestamp) {
      return `${timestamp}.${payload}`;
    }
    return payload;
  }
}
