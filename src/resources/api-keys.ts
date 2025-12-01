import { AxiosInstance } from 'axios';
import { BaseResource } from '../http/base-resource.js';
import { APIKey, CreateAPIKeyOptions } from '../types/api-keys.js';
import { ApiResponse } from '../types/common.js';

/**
 * Provides access to a specific API key's operations
 */
export class APIKeyInstance extends BaseResource {
  constructor(
    httpClient: AxiosInstance,
    private readonly apiKeyId: string
  ) {
    super(httpClient);
  }

  /**
   * Delete this API key
   *
   * @throws {APIKeyNotFoundError} If API key does not exist
   * @throws {AuthenticationError} If API credentials are invalid
   *
   * @example
   * ```typescript
   * await client.apiKeys('ak_123').delete();
   * ```
   */
  async delete(): Promise<void> {
    return this._delete(`account/api-keys/${this.apiKeyId}`);
  }

  /**
   * Get this API key
   *
   * @returns Promise resolving to the API key data
   *
   * @throws {APIKeyNotFoundError} If API key does not exist
   * @throws {AuthenticationError} If API credentials are invalid
   *
   * @example
   * ```typescript
   * const key = await client.apiKeys('ak_123').get();
   * console.log(`Name: ${key.data.name}`);
   * ```
   */
  async get(): Promise<ApiResponse<APIKey>> {
    return this._get<APIKey>(`account/api-keys/${this.apiKeyId}`);
  }
}

/**
 * Callable interface for APIKeysResource
 * Enables: client.apiKeys('id').delete()
 */
export interface CallableAPIKeysResource {
  (apiKeyId: string): APIKeyInstance;
  list(): Promise<ApiResponse<APIKey[]>>;
  create(options: CreateAPIKeyOptions): Promise<ApiResponse<APIKey>>;
}

/**
 * Internal implementation of API keys resource
 */
class APIKeysResourceImpl extends BaseResource {
  /**
   * List all API keys
   *
   * @returns Promise resolving to list of API keys
   *
   * @throws {AuthenticationError} If API credentials are invalid
   *
   * @example
   * ```typescript
   * const keys = await client.apiKeys.list();
   * for (const key of keys.data) {
   *   console.log(`${key.name}: ${key.api_key}`);
   * }
   * ```
   */
  async list(): Promise<ApiResponse<APIKey[]>> {
    return this._get<APIKey[]>('account/api-keys');
  }

  /**
   * Create new API key
   *
   * **Important:** The api_secret is only returned once upon creation.
   * Make sure to store it securely.
   *
   * @param options - API key options
   * @param options.name - Name for the API key
   *
   * @returns Promise resolving to the created API key (includes api_secret)
   *
   * @throws {ValidationError} If name is invalid
   * @throws {AuthenticationError} If API credentials are invalid
   *
   * @example
   * ```typescript
   * const newKey = await client.apiKeys.create({ name: 'Production Key' });
   *
   * // IMPORTANT: Save these values securely!
   * console.log(`API Key: ${newKey.data.api_key}`);
   * console.log(`API Secret: ${newKey.data.api_secret}`);
   * ```
   */
  async create(options: CreateAPIKeyOptions): Promise<ApiResponse<APIKey>> {
    return this._post<APIKey>('account/api-keys', {
      name: options.name
    });
  }
}

/**
 * Factory function to create a callable APIKeysResource
 *
 * This enables the syntax: client.apiKeys('id').delete()
 * while also supporting: client.apiKeys.list(), client.apiKeys.create()
 *
 * @param httpClient - Axios instance for making requests
 * @returns A callable resource with methods attached
 */
export function createAPIKeysResource(httpClient: AxiosInstance): CallableAPIKeysResource {
  const resource = new APIKeysResourceImpl(httpClient);

  // Create the callable function
  const callable = (apiKeyId: string): APIKeyInstance => {
    return new APIKeyInstance(httpClient, apiKeyId);
  };

  // Attach methods to the callable
  callable.list = resource.list.bind(resource);
  callable.create = resource.create.bind(resource);

  return callable as CallableAPIKeysResource;
}

/**
 * @deprecated Use createAPIKeysResource instead
 * Kept for backwards compatibility
 */
export class APIKeysResource extends BaseResource {
  async list(): Promise<ApiResponse<APIKey[]>> {
    return this._get<APIKey[]>('account/api-keys');
  }

  async create(options: CreateAPIKeyOptions): Promise<ApiResponse<APIKey>> {
    return this._post<APIKey>('account/api-keys', {
      name: options.name
    });
  }

  async delete(apiKeyId: string): Promise<void> {
    return this._delete(`account/api-keys/${apiKeyId}`);
  }
}
