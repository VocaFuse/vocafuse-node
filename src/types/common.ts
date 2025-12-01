/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  meta?: {
    request_id?: string;
    timestamp?: string;
  };
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    has_more: boolean;
  };
}

/**
 * JWT token response
 */
export interface TokenResponse {
  data: {
    jwt_token: string;
    token_type: string;
    expires_in: number;
  };
}

/**
 * Error response from the API
 */
export interface ErrorResponse {
  error: {
    message: string;
    code?: string;
    details?: Record<string, unknown>;
  };
}
