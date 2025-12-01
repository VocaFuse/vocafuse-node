import { AxiosInstance } from 'axios';
import { handleApiError } from '../errors/error-handler.js';
import { ApiResponse } from '../types/common.js';

/**
 * Base class for all API resources.
 *
 * Note: Protected methods use underscore prefix (_request, _get, _post, etc.)
 * to avoid naming collisions with public resource methods like get(), delete().
 */
export abstract class BaseResource {
  constructor(protected readonly httpClient: AxiosInstance) {}

  /**
   * Make a GET request
   *
   * @param endpoint - API endpoint path
   * @param params - Optional query parameters
   * @returns Promise resolving to API response
   */
  protected async _get<T>(
    endpoint: string,
    params?: Record<string, unknown>
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.httpClient.get<ApiResponse<T>>(endpoint, { params });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Make a POST request
   *
   * @param endpoint - API endpoint path
   * @param data - Optional request body
   * @returns Promise resolving to API response
   */
  protected async _post<T, D = Record<string, unknown>>(
    endpoint: string,
    data?: D
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.httpClient.post<ApiResponse<T>>(endpoint, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Make a PUT request
   *
   * @param endpoint - API endpoint path
   * @param data - Optional request body
   * @returns Promise resolving to API response
   */
  protected async _put<T, D = Record<string, unknown>>(
    endpoint: string,
    data?: D
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.httpClient.put<ApiResponse<T>>(endpoint, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Make a DELETE request
   *
   * @param endpoint - API endpoint path
   */
  protected async _delete(endpoint: string): Promise<void> {
    try {
      await this.httpClient.delete(endpoint);
    } catch (error) {
      throw handleApiError(error);
    }
  }
}
