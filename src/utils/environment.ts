import { API_ENDPOINTS, API_KEY_PREFIXES } from './constants.js';

/**
 * Detect the appropriate base URL based on API key prefix
 *
 * @param apiKey - The API key to analyze
 * @returns The appropriate base URL for the environment
 */
export function detectBaseUrl(apiKey: string): string {
  if (apiKey.startsWith(API_KEY_PREFIXES.LIVE)) {
    return API_ENDPOINTS.LIVE;
  } else if (apiKey.startsWith(API_KEY_PREFIXES.TEST)) {
    return API_ENDPOINTS.TEST;
  }
  // Default to live environment
  return API_ENDPOINTS.LIVE;
}

/**
 * Check if the API key is for the test environment
 *
 * @param apiKey - The API key to check
 * @returns True if the key is for test environment
 */
export function isTestKey(apiKey: string): boolean {
  return apiKey.startsWith(API_KEY_PREFIXES.TEST);
}

/**
 * Check if the API key is for the live environment
 *
 * @param apiKey - The API key to check
 * @returns True if the key is for live environment
 */
export function isLiveKey(apiKey: string): boolean {
  return apiKey.startsWith(API_KEY_PREFIXES.LIVE);
}
