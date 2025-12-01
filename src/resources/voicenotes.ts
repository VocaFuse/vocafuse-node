import { AxiosInstance } from 'axios';
import { BaseResource } from '../http/base-resource.js';
import { Voicenote, Transcription, ListVoicenotesOptions } from '../types/voicenotes.js';
import { ApiResponse, PaginatedResponse } from '../types/common.js';
import { DEFAULTS } from '../utils/constants.js';

/**
 * Provides access to a specific voicenote's nested resources and operations
 */
export class VoicenoteInstance extends BaseResource {
  public readonly transcription: TranscriptionResource;
  private readonly voicenoteId: string;

  constructor(httpClient: AxiosInstance, voicenoteId: string) {
    super(httpClient);
    this.voicenoteId = voicenoteId;
    this.transcription = new TranscriptionResource(httpClient, voicenoteId);
  }

  /**
   * Delete this voicenote
   *
   * @throws {VoicenoteNotFoundError} If voicenote does not exist
   * @throws {AuthenticationError} If API credentials are invalid
   *
   * @example
   * ```typescript
   * await client.voicenotes('vn_123').delete();
   * ```
   */
  async delete(): Promise<void> {
    return this._delete(`voicenotes/${this.voicenoteId}`);
  }

  /**
   * Get this voicenote
   *
   * @returns Promise resolving to the voicenote data
   *
   * @throws {VoicenoteNotFoundError} If voicenote does not exist
   * @throws {AuthenticationError} If API credentials are invalid
   *
   * @example
   * ```typescript
   * const voicenote = await client.voicenotes('vn_123').get();
   * console.log(`Status: ${voicenote.data.status}`);
   * ```
   */
  async get(): Promise<ApiResponse<Voicenote>> {
    return this._get<Voicenote>(`voicenotes/${this.voicenoteId}`);
  }
}

/**
 * Access transcription data for a voicenote
 */
export class TranscriptionResource extends BaseResource {
  constructor(
    httpClient: AxiosInstance,
    private readonly voicenoteId: string
  ) {
    super(httpClient);
  }

  /**
   * Get transcription for the voicenote
   *
   * @returns Promise resolving to the transcription data
   *
   * @throws {TranscriptionNotFoundError} If transcription does not exist
   * @throws {VoicenoteNotFoundError} If voicenote does not exist
   * @throws {AuthenticationError} If API credentials are invalid
   *
   * @example
   * ```typescript
   * const transcription = await client.voicenotes('vn_123').transcription.get();
   * console.log(transcription.data.text);
   * ```
   */
  async get(): Promise<ApiResponse<Transcription>> {
    return this._get<Transcription>(`voicenotes/${this.voicenoteId}/transcription`);
  }
}

/**
 * Callable interface for VoicenotesResource
 * Enables: client.voicenotes('id').transcription.get() and client.voicenotes('id').delete()
 */
export interface CallableVoicenotesResource {
  (voicenoteId: string): VoicenoteInstance;
  list(options?: ListVoicenotesOptions): Promise<PaginatedResponse<Voicenote>>;
  iterate(options?: ListVoicenotesOptions): AsyncIterable<Voicenote>;
}

/**
 * Internal implementation of voicenotes resource
 */
class VoicenotesResourceImpl extends BaseResource {
  /**
   * List voicenotes with optional filtering (single page)
   *
   * @param options - Optional filtering and pagination options
   * @param options.page - Page number (0-based), defaults to 0
   * @param options.limit - Number of items per page (max 100), defaults to 50
   * @param options.status - Filter by status: 'processing', 'completed', or 'failed'
   * @param options.dateFrom - Filter voicenotes from this date (ISO 8601 format)
   * @param options.dateTo - Filter voicenotes to this date (ISO 8601 format)
   *
   * @returns Promise resolving to paginated voicenotes list
   *
   * @throws {AuthenticationError} If API credentials are invalid
   * @throws {ValidationError} If filter parameters are invalid
   * @throws {RateLimitError} If rate limit is exceeded
   *
   * @example
   * ```typescript
   * // List all voicenotes
   * const voicenotes = await client.voicenotes.list();
   *
   * // List with filters
   * const completed = await client.voicenotes.list({
   *   status: 'completed',
   *   limit: 20,
   *   dateFrom: '2024-01-01'
   * });
   * ```
   */
  async list(options?: ListVoicenotesOptions): Promise<PaginatedResponse<Voicenote>> {
    const params = {
      page: options?.page || 0,
      limit: Math.min(options?.limit || DEFAULTS.PAGE_LIMIT, DEFAULTS.MAX_PAGE_LIMIT),
      ...(options?.status && { status: options.status }),
      ...(options?.dateFrom && { date_from: options.dateFrom }),
      ...(options?.dateTo && { date_to: options.dateTo })
    };

    return this._get<Voicenote[]>('voicenotes', params) as Promise<PaginatedResponse<Voicenote>>;
  }

  /**
   * Iterate over all voicenotes with automatic pagination
   *
   * This method returns an async iterable that automatically fetches subsequent
   * pages as you iterate, eliminating pagination boilerplate.
   *
   * @param options - Optional filtering options (same as list)
   * @returns AsyncIterable that yields voicenotes one at a time
   *
   * @example
   * ```typescript
   * // Iterate over ALL voicenotes - pagination handled automatically
   * for await (const voicenote of client.voicenotes.iterate({ status: 'completed' })) {
   *   console.log(`Processing: ${voicenote.id}`);
   * }
   *
   * // Collect all voicenotes into an array
   * const allVoicenotes: Voicenote[] = [];
   * for await (const voicenote of client.voicenotes.iterate()) {
   *   allVoicenotes.push(voicenote);
   * }
   *
   * // Early exit - stops fetching more pages
   * for await (const voicenote of client.voicenotes.iterate()) {
   *   if (voicenote.status === 'failed') {
   *     console.log('Found failed voicenote:', voicenote.id);
   *     break; // Stops iteration, no more API calls
   *   }
   * }
   * ```
   */
  async *iterate(options?: ListVoicenotesOptions): AsyncIterable<Voicenote> {
    let page = options?.page || 0;
    let hasMore = true;

    while (hasMore) {
      const response = await this.list({ ...options, page });

      for (const voicenote of response.data) {
        yield voicenote;
      }

      hasMore = response.pagination?.has_more ?? false;
      page += 1;
    }
  }
}

/**
 * Factory function to create a callable VoicenotesResource
 *
 * This enables the syntax: client.voicenotes('id').transcription.get()
 * while also supporting: client.voicenotes.list(), client.voicenotes.get('id')
 *
 * @param httpClient - Axios instance for making requests
 * @returns A callable resource with methods attached
 */
export function createVoicenotesResource(httpClient: AxiosInstance): CallableVoicenotesResource {
  const resource = new VoicenotesResourceImpl(httpClient);

  // Create the callable function
  const callable = (voicenoteId: string): VoicenoteInstance => {
    return new VoicenoteInstance(httpClient, voicenoteId);
  };

  // Attach methods to the callable
  callable.list = resource.list.bind(resource);
  callable.iterate = resource.iterate.bind(resource);

  return callable as CallableVoicenotesResource;
}
