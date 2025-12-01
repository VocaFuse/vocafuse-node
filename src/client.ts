import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { createVoicenotesResource, CallableVoicenotesResource } from './resources/voicenotes.js';
import { createWebhooksResource, CallableWebhooksResource } from './resources/webhooks.js';
import { createAPIKeysResource, CallableAPIKeysResource } from './resources/api-keys.js';
import { AccountResource } from './resources/account.js';
import { VERSION, DEFAULTS, HEADERS, RETRYABLE_STATUS_CODES } from './utils/constants.js';
import { detectBaseUrl } from './utils/environment.js';

/**
 * Retry configuration options
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Base delay between retries in milliseconds */
  retryDelay: number;
  /** HTTP status codes that should trigger a retry */
  retryableStatuses: number[];
}

/**
 * Client configuration options
 */
export interface ClientOptions {
  /** Your VocaFuse API key */
  apiKey: string;
  /** Your VocaFuse API secret */
  apiSecret: string;
  /** Custom base URL (auto-detected from API key prefix by default) */
  baseUrl?: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Retry configuration */
  retry?: Partial<RetryConfig>;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: DEFAULTS.MAX_RETRIES,
  retryDelay: DEFAULTS.RETRY_DELAY,
  retryableStatuses: [...RETRYABLE_STATUS_CODES]
};

/**
 * VocaFuse API Client
 *
 * The main entry point for interacting with the VocaFuse API.
 * Provides access to all API resources: voicenotes, webhooks, API keys, and account.
 *
 * **Features:**
 * - Automatic environment detection based on API key prefix
 * - Automatic retries with exponential backoff
 * - Full TypeScript support
 * - Async iterators for pagination
 *
 * @example
 * ```typescript
 * import { Client } from 'vocafuse-node';
 *
 * const client = new Client({
 *   apiKey: process.env.VOCAFUSE_API_KEY!,
 *   apiSecret: process.env.VOCAFUSE_API_SECRET!
 * });
 *
 * // List voicenotes
 * const voicenotes = await client.voicenotes.list({ limit: 10 });
 *
 * // Get a specific voicenote and its transcription
 * const voicenote = await client.voicenotes('vn_123').get();
 * const transcription = await client.voicenotes('vn_123').transcription.get();
 *
 * // Delete a voicenote
 * await client.voicenotes('vn_123').delete();
 *
 * // Iterate over all voicenotes with automatic pagination
 * for await (const vn of client.voicenotes.iterate({ status: 'transcribed' })) {
 *   console.log(vn.id);
 * }
 * ```
 */
export class Client {
  private readonly httpClient: AxiosInstance;
  private readonly retryConfig: RetryConfig;

  /**
   * Voicenotes resource
   *
   * Access voicenotes and their transcriptions.
   *
   * @example
   * ```typescript
   * // List voicenotes
   * const list = await client.voicenotes.list();
   *
   * // Get a voicenote
   * const vn = await client.voicenotes('vn_123').get();
   *
   * // Access nested transcription
   * const transcription = await client.voicenotes('vn_123').transcription.get();
   *
   * // Delete a voicenote
   * await client.voicenotes('vn_123').delete();
   *
   * // Iterate with automatic pagination
   * for await (const vn of client.voicenotes.iterate()) {
   *   console.log(vn.id);
   * }
   * ```
   */
  public readonly voicenotes: CallableVoicenotesResource;

  /**
   * Webhooks resource
   *
   * Manage webhook configurations for receiving event notifications.
   *
   * @example
   * ```typescript
   * // Create a webhook
   * const webhook = await client.webhooks.create({
   *   url: 'https://myapp.com/webhooks',
   *   events: ['voicenote.transcribed', 'voicenote.failed']
   * });
   *
   * // Update a webhook
   * await client.webhooks('wh_123').update({
   *   url: 'https://myapp.com/new-endpoint',
   *   events: ['voicenote.transcribed']
   * });
   *
   * // Delete a webhook
   * await client.webhooks('wh_123').delete();
   * ```
   */
  public readonly webhooks: CallableWebhooksResource;

  /**
   * API Keys resource
   *
   * Manage API keys for your account.
   *
   * @example
   * ```typescript
   * const newKey = await client.apiKeys.create({ name: 'Production' });
   * console.log(`Key: ${newKey.data.api_key}, Secret: ${newKey.data.api_secret}`);
   *
   * // Delete an API key
   * await client.apiKeys('ak_123').delete();
   * ```
   */
  public readonly apiKeys: CallableAPIKeysResource;

  /**
   * Account resource
   *
   * Access and update account information.
   *
   * @example
   * ```typescript
   * const account = await client.account.get();
   * console.log(`Plan: ${account.data.plan}`);
   * ```
   */
  public readonly account: AccountResource;

  /**
   * Create a new VocaFuse client
   *
   * @param options - Client configuration options
   * @param options.apiKey - Your VocaFuse API key
   * @param options.apiSecret - Your VocaFuse API secret
   * @param options.baseUrl - Custom base URL (optional, auto-detected by default)
   * @param options.timeout - Request timeout in milliseconds (default: 30000)
   * @param options.retry - Retry configuration (optional)
   *
   * @example
   * ```typescript
   * // Basic usage (environment auto-detected from API key)
   * const client = new Client({
   *   apiKey: process.env.VOCAFUSE_API_KEY!,
   *   apiSecret: process.env.VOCAFUSE_API_SECRET!
   * });
   *
   * // With custom options
   * const client = new Client({
   *   apiKey: 'sk_test_...',
   *   apiSecret: 'secret_...',
   *   timeout: 60000,
   *   retry: {
   *     maxRetries: 5,
   *     retryDelay: 2000
   *   }
   * });
   * ```
   */
  constructor(options: ClientOptions) {
    const baseUrl = options.baseUrl || detectBaseUrl(options.apiKey);

    this.retryConfig = {
      ...DEFAULT_RETRY_CONFIG,
      ...options.retry
    };

    this.httpClient = axios.create({
      baseURL: baseUrl,
      timeout: options.timeout || DEFAULTS.TIMEOUT,
      headers: {
        [HEADERS.API_KEY]: options.apiKey,
        [HEADERS.API_SECRET]: options.apiSecret,
        'Content-Type': 'application/json',
        'User-Agent': `VocaFuse-Node-SDK/${VERSION}`
      }
    });

    // Add retry interceptor
    this.setupRetryInterceptor();

    // Initialize resources
    this.voicenotes = createVoicenotesResource(this.httpClient);
    this.webhooks = createWebhooksResource(this.httpClient);
    this.apiKeys = createAPIKeysResource(this.httpClient);
    this.account = new AccountResource(this.httpClient);
  }

  /**
   * Set up retry interceptor with exponential backoff
   */
  private setupRetryInterceptor(): void {
    this.httpClient.interceptors.response.use(
      response => response,
      async (error: AxiosError) => {
        const config = error.config as InternalAxiosRequestConfig & { _retryCount?: number };

        if (!config) {
          return Promise.reject(error);
        }

        config._retryCount = config._retryCount || 0;

        const shouldRetry =
          config._retryCount < this.retryConfig.maxRetries &&
          error.response?.status !== undefined &&
          this.retryConfig.retryableStatuses.includes(error.response.status);

        if (!shouldRetry) {
          return Promise.reject(error);
        }

        config._retryCount += 1;

        // Exponential backoff: delay * 2^(retryCount - 1)
        const delay = this.retryConfig.retryDelay * Math.pow(2, config._retryCount - 1);

        await new Promise(resolve => setTimeout(resolve, delay));

        return this.httpClient.request(config);
      }
    );
  }
}
