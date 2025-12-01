/**
 * Account resource
 */
export interface Account {
  id: string;
  tenant_id: string;
  name: string;
  email: string;
  plan: string;
  created_at: string;
  settings?: AccountSettings;
  usage?: UsageStats;
}

/**
 * Account settings
 */
export interface AccountSettings {
  default_language?: string;
  webhook_url?: string;
  notifications_enabled?: boolean;
}

/**
 * Account usage statistics
 */
export interface UsageStats {
  voicenotes_count: number;
  total_duration: number;
  api_calls_count: number;
}

/**
 * Options for updating account settings
 */
export interface UpdateAccountOptions {
  name?: string;
  settings?: Partial<AccountSettings>;
}
