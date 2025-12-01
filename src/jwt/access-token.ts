import axios, { AxiosInstance } from 'axios';
import { handleApiError } from '../errors/error-handler.js';
import { TokenResponse } from '../types/common.js';
import { VERSION, DEFAULTS, HEADERS } from '../utils/constants.js';
import { detectBaseUrl } from '../utils/environment.js';

/**
 * Options for creating an AccessToken instance
 */
export interface AccessTokenOptions {
  /** Your VocaFuse API key */
  apiKey: string;
  /** Your VocaFuse API secret */
  apiSecret: string;
  /** User identity to associate with the token */
  identity: string;
  /** Optional custom base URL */
  baseUrl?: string;
}

/**
 * Options for generating a token
 */
export interface GenerateTokenOptions {
  /** Token expiration time in seconds */
  expiresIn?: number;
  /** Scopes to grant to the token */
  scopes?: string[];
}

/**
 * Generate JWT tokens for frontend authentication.
 *
 * AccessToken is used to generate short-lived JWT tokens that can be passed
 * to frontend clients to authenticate with the VocaFuse API directly.
 *
 * @example
 * ```typescript
 * import { AccessToken } from 'vocafuse-node';
 *
 * // Create token generator for a specific user
 * const token = new AccessToken({
 *   apiKey: process.env.VOCAFUSE_API_KEY!,
 *   apiSecret: process.env.VOCAFUSE_API_SECRET!,
 *   identity: 'user_123'
 * });
 *
 * // Generate a token
 * const response = await token.generate();
 * const jwtToken = response.data.jwt_token;
 *
 * // Generate with custom options
 * const customResponse = await token.generate({
 *   expiresIn: 3600,
 *   scopes: ['voicenotes:read', 'voicenotes:write']
 * });
 * ```
 */
export class AccessToken {
  private readonly httpClient: AxiosInstance;
  private readonly identity: string;

  constructor(options: AccessTokenOptions) {
    this.identity = options.identity;
    const baseUrl = options.baseUrl || detectBaseUrl(options.apiKey);

    this.httpClient = axios.create({
      baseURL: baseUrl,
      timeout: DEFAULTS.TIMEOUT,
      headers: {
        [HEADERS.API_KEY]: options.apiKey,
        [HEADERS.API_SECRET]: options.apiSecret,
        'Content-Type': 'application/json',
        'User-Agent': `VocaFuse-Node-SDK/${VERSION}`
      }
    });
  }

  /**
   * Generate JWT token
   *
   * @param options - Optional token generation options
   * @param options.expiresIn - Token expiration time in seconds
   * @param options.scopes - Scopes to grant to the token
   *
   * @returns Promise resolving to the token response
   *
   * @throws {AuthenticationError} If API credentials are invalid
   * @throws {ValidationError} If options are invalid
   *
   * @example
   * ```typescript
   * // Generate with default options
   * const response = await token.generate();
   *
   * // Generate with custom expiration and scopes
   * const response = await token.generate({
   *   expiresIn: 7200, // 2 hours
   *   scopes: ['voicenotes:read']
   * });
   *
   * // Use the token
   * console.log(`Token: ${response.data.jwt_token}`);
   * console.log(`Expires in: ${response.data.expires_in}s`);
   * ```
   */
  async generate(options?: GenerateTokenOptions): Promise<TokenResponse> {
    try {
      const response = await this.httpClient.post<TokenResponse>('/token', {
        user_id: this.identity,
        expires_in: options?.expiresIn,
        scopes: options?.scopes || ['voice-api.upload_voicenote']
      });

      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
}
