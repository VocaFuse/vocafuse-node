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
} from './vocafuse-error.js';

export type { ErrorContext } from './vocafuse-error.js';

export { handleApiError } from './error-handler.js';
