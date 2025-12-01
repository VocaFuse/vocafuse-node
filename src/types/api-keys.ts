/**
 * API key resource
 */
export interface APIKey {
  id: string;
  name: string;
  api_key: string;
  /** Only returned on creation */
  api_secret?: string;
  created_at: string;
  last_used_at?: string;
}

/**
 * Options for creating an API key
 */
export interface CreateAPIKeyOptions {
  /** Name for the API key */
  name: string;
}
