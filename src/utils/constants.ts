/**
 * SDK version - should match package.json version
 */
export const VERSION = '0.1.0';

/**
 * Default API endpoints
 */
export const API_ENDPOINTS = {
  LIVE: 'https://api.vocafuse.com',
  TEST: 'https://test-api.vocafuse.com'
} as const;

/**
 * API key prefixes for environment detection
 */
export const API_KEY_PREFIXES = {
  LIVE: 'sk_live_',
  TEST: 'sk_test_'
} as const;

/**
 * Default configuration values
 */
export const DEFAULTS = {
  TIMEOUT: 30000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  PAGE_LIMIT: 50,
  MAX_PAGE_LIMIT: 100
} as const;

/**
 * HTTP headers used by the SDK
 */
export const HEADERS = {
  API_KEY: 'X-VocaFuse-API-Key',
  API_SECRET: 'X-VocaFuse-API-Secret',
  SIGNATURE: 'X-VocaFuse-Signature',
  TIMESTAMP: 'X-VocaFuse-Timestamp',
  DELIVERY_ID: 'X-VocaFuse-Delivery-ID'
} as const;

/**
 * Retryable HTTP status codes
 */
export const RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504] as const;
