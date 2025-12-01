import { AxiosInstance } from 'axios';
import { BaseResource } from '../http/base-resource.js';
import { Webhook, CreateWebhookOptions, UpdateWebhookOptions } from '../types/webhooks.js';
import { ApiResponse } from '../types/common.js';

/**
 * Provides access to a specific webhook's operations
 */
export class WebhookInstance extends BaseResource {
  constructor(
    httpClient: AxiosInstance,
    private readonly webhookId: string
  ) {
    super(httpClient);
  }

  /**
   * Delete this webhook configuration
   *
   * @throws {WebhookNotFoundError} If webhook does not exist
   * @throws {AuthenticationError} If API credentials are invalid
   *
   * @example
   * ```typescript
   * await client.webhooks('wh_123').delete();
   * ```
   */
  async delete(): Promise<void> {
    return this._delete(`webhooks/${this.webhookId}`);
  }

  /**
   * Update this webhook configuration
   *
   * @param options - Updated webhook configuration
   * @param options.url - The URL to receive webhook events
   * @param options.events - Event types to subscribe to
   * @param options.secret - Optional secret for signature verification
   *
   * @returns Promise resolving to the updated webhook
   *
   * @throws {WebhookNotFoundError} If webhook does not exist
   * @throws {ValidationError} If options are invalid
   * @throws {AuthenticationError} If API credentials are invalid
   *
   * @example
   * ```typescript
   * const webhook = await client.webhooks('wh_123').update({
   *   url: 'https://myapp.com/new-endpoint',
   *   events: ['voicenote.transcribed']
   * });
   * ```
   */
  async update(options: UpdateWebhookOptions): Promise<ApiResponse<Webhook>> {
    return this._put<Webhook>(`webhooks/${this.webhookId}`, {
      url: options.url,
      events: options.events,
      ...(options.secret && { secret: options.secret })
    });
  }

  /**
   * Get this webhook configuration
   *
   * @returns Promise resolving to the webhook data
   *
   * @throws {WebhookNotFoundError} If webhook does not exist
   * @throws {AuthenticationError} If API credentials are invalid
   *
   * @example
   * ```typescript
   * const webhook = await client.webhooks('wh_123').get();
   * console.log(`URL: ${webhook.data.url}`);
   * ```
   */
  async get(): Promise<ApiResponse<Webhook>> {
    return this._get<Webhook>(`webhooks/${this.webhookId}`);
  }
}

/**
 * Callable interface for WebhooksResource
 * Enables: client.webhooks('id').delete()
 */
export interface CallableWebhooksResource {
  (webhookId: string): WebhookInstance;
  list(): Promise<ApiResponse<Webhook[]>>;
  create(options: CreateWebhookOptions): Promise<ApiResponse<Webhook>>;
}

/**
 * Internal implementation of webhooks resource
 */
class WebhooksResourceImpl extends BaseResource {
  /**
   * List all webhook configurations
   *
   * @returns Promise resolving to list of webhooks
   *
   * @throws {AuthenticationError} If API credentials are invalid
   *
   * @example
   * ```typescript
   * const webhooks = await client.webhooks.list();
   * for (const webhook of webhooks.data) {
   *   console.log(`Webhook: ${webhook.url} - ${webhook.events.join(', ')}`);
   * }
   * ```
   */
  async list(): Promise<ApiResponse<Webhook[]>> {
    return this._get<Webhook[]>('webhooks');
  }

  /**
   * Create new webhook configuration
   *
   * @param options - Webhook configuration options
   * @param options.url - The URL to receive webhook events
   * @param options.events - Event types to subscribe to
   * @param options.secret - Optional secret for signature verification
   *
   * @returns Promise resolving to the created webhook
   *
   * @throws {ValidationError} If options are invalid
   * @throws {AuthenticationError} If API credentials are invalid
   * @throws {ConflictError} If webhook URL already exists
   *
   * @example
   * ```typescript
   * const webhook = await client.webhooks.create({
   *   url: 'https://myapp.com/webhooks',
   *   events: ['voicenote.transcribed', 'voicenote.failed'],
   *   secret: 'my-webhook-secret'
   * });
   * console.log(`Created webhook: ${webhook.data.id}`);
   * ```
   */
  async create(options: CreateWebhookOptions): Promise<ApiResponse<Webhook>> {
    return this._post<Webhook>('webhooks', {
      url: options.url,
      events: options.events,
      ...(options.secret && { secret: options.secret })
    });
  }
}

/**
 * Factory function to create a callable WebhooksResource
 *
 * This enables the syntax: client.webhooks('id').delete()
 * while also supporting: client.webhooks.list(), client.webhooks.create()
 *
 * @param httpClient - Axios instance for making requests
 * @returns A callable resource with methods attached
 */
export function createWebhooksResource(httpClient: AxiosInstance): CallableWebhooksResource {
  const resource = new WebhooksResourceImpl(httpClient);

  // Create the callable function
  const callable = (webhookId: string): WebhookInstance => {
    return new WebhookInstance(httpClient, webhookId);
  };

  // Attach methods to the callable
  callable.list = resource.list.bind(resource);
  callable.create = resource.create.bind(resource);

  return callable as CallableWebhooksResource;
}

/**
 * @deprecated Use createWebhooksResource instead
 * Kept for backwards compatibility
 */
export class WebhooksResource extends BaseResource {
  async list(): Promise<ApiResponse<Webhook[]>> {
    return this._get<Webhook[]>('webhooks');
  }

  async create(options: CreateWebhookOptions): Promise<ApiResponse<Webhook>> {
    return this._post<Webhook>('webhooks', {
      url: options.url,
      events: options.events,
      ...(options.secret && { secret: options.secret })
    });
  }

  async get(webhookId: string): Promise<ApiResponse<Webhook>> {
    return this._get<Webhook>(`webhooks/${webhookId}`);
  }

  async update(webhookId: string, options: UpdateWebhookOptions): Promise<ApiResponse<Webhook>> {
    return this._put<Webhook>(`webhooks/${webhookId}`, {
      url: options.url,
      events: options.events,
      ...(options.secret && { secret: options.secret })
    });
  }

  async delete(webhookId: string): Promise<void> {
    return this._delete(`webhooks/${webhookId}`);
  }
}
