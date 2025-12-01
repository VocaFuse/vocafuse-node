/**
 * Webhook event types
 */
export type WebhookEvent =
  | 'voicenote.created'
  | 'voicenote.transcribed'
  | 'voicenote.failed'
  | 'voicenote.deleted';

/**
 * Webhook configuration resource
 */
export interface Webhook {
  id: string;
  url: string;
  events: WebhookEvent[];
  secret?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Options for creating a webhook
 */
export interface CreateWebhookOptions {
  /** The URL to receive webhook events */
  url: string;
  /** Event types to subscribe to */
  events: WebhookEvent[];
  /** Optional secret for signature verification */
  secret?: string;
}

/**
 * Options for updating a webhook
 */
export interface UpdateWebhookOptions {
  /** The URL to receive webhook events */
  url: string;
  /** Event types to subscribe to */
  events: WebhookEvent[];
  /** Optional secret for signature verification */
  secret?: string;
}
