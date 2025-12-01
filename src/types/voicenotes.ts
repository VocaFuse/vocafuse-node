/**
 * Voicenote processing status
 */
export type VoicenoteStatus = 'processing' | 'transcribed' | 'failed';

/**
 * Voicenote resource
 */
export interface Voicenote {
  id: string;
  status: VoicenoteStatus;
  created_at: string;
  updated_at: string;
  duration?: number;
  file_size?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Transcription resource
 */
export interface Transcription {
  id: string;
  voicenote_id: string;
  text: string;
  confidence: number;
  language: string;
  words?: TranscriptionWord[];
  created_at: string;
}

/**
 * Individual word in a transcription with timing information
 */
export interface TranscriptionWord {
  word: string;
  start_time: number;
  end_time: number;
  confidence: number;
}

/**
 * Options for listing voicenotes
 */
export interface ListVoicenotesOptions {
  /** Page number (0-based), defaults to 0 */
  page?: number;
  /** Number of items per page (max 100), defaults to 50 */
  limit?: number;
  /** Filter by status */
  status?: VoicenoteStatus;
  /** Filter voicenotes from this date (ISO 8601 format) */
  dateFrom?: string;
  /** Filter voicenotes to this date (ISO 8601 format) */
  dateTo?: string;
}
