// Main client
export { Client, ClientOptions, RetryConfig } from './client.js';

// JWT token generation
export { AccessToken, AccessTokenOptions, GenerateTokenOptions } from './jwt/access-token.js';

// Webhook validation
export { RequestValidator, ValidateOptions } from './webhook/request-validator.js';

// Resources (for advanced usage)
export {
  CallableVoicenotesResource,
  VoicenoteInstance,
  TranscriptionResource
} from './resources/voicenotes.js';
export {
  CallableWebhooksResource,
  WebhookInstance,
  WebhooksResource
} from './resources/webhooks.js';
export { CallableAPIKeysResource, APIKeyInstance, APIKeysResource } from './resources/api-keys.js';
export { AccountResource } from './resources/account.js';

// Errors
export {
  VocaFuseError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ServerError,
  VoicenoteNotFoundError,
  WebhookNotFoundError,
  TranscriptionNotFoundError,
  APIKeyNotFoundError
} from './errors/index.js';

export type { ErrorContext } from './errors/vocafuse-error.js';

// Types
export type {
  ApiResponse,
  PaginatedResponse,
  TokenResponse,
  ErrorResponse
} from './types/common.js';

export type {
  Voicenote,
  VoicenoteStatus,
  Transcription,
  TranscriptionWord,
  ListVoicenotesOptions
} from './types/voicenotes.js';

export type {
  Webhook,
  WebhookEvent,
  CreateWebhookOptions,
  UpdateWebhookOptions
} from './types/webhooks.js';

export type { APIKey, CreateAPIKeyOptions } from './types/api-keys.js';

export type {
  Account,
  AccountSettings,
  UsageStats,
  UpdateAccountOptions
} from './types/account.js';
