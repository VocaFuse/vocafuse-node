import { BaseResource } from '../http/base-resource.js';
import { Account, UpdateAccountOptions } from '../types/account.js';
import { ApiResponse } from '../types/common.js';

/**
 * Manage account information and settings.
 *
 * @example
 * ```typescript
 * // Get account information
 * const account = await client.account.get();
 * console.log(`Plan: ${account.data.plan}`);
 * console.log(`Voicenotes: ${account.data.usage?.voicenotes_count}`);
 *
 * // Update account settings
 * await client.account.update({
 *   name: 'My Company',
 *   settings: { default_language: 'en-US' }
 * });
 * ```
 */
export class AccountResource extends BaseResource {
  /**
   * Get account information
   *
   * Returns account details including plan, settings, and usage statistics.
   *
   * @returns Promise resolving to account data
   *
   * @throws {AuthenticationError} If API credentials are invalid
   *
   * @example
   * ```typescript
   * const account = await client.account.get();
   * console.log(`Account: ${account.data.name}`);
   * console.log(`Plan: ${account.data.plan}`);
   * console.log(`Total voicenotes: ${account.data.usage?.voicenotes_count}`);
   * console.log(`Total duration: ${account.data.usage?.total_duration}s`);
   * ```
   */
  async get(): Promise<ApiResponse<Account>> {
    return this._get<Account>('account');
  }

  /**
   * Update account settings
   *
   * @param options - Account update options
   * @param options.name - Account name
   * @param options.settings - Partial settings to update
   *
   * @returns Promise resolving to the updated account
   *
   * @throws {ValidationError} If options are invalid
   * @throws {AuthenticationError} If API credentials are invalid
   *
   * @example
   * ```typescript
   * const account = await client.account.update({
   *   name: 'My Company',
   *   settings: {
   *     default_language: 'en-US',
   *     notifications_enabled: true
   *   }
   * });
   * ```
   */
  async update(options: UpdateAccountOptions): Promise<ApiResponse<Account>> {
    return this._put<Account, UpdateAccountOptions>('account', options);
  }
}
