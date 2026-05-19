/**
 * FeedGuard AI — Transcript Utility
 *
 * Placeholder module for future YouTube transcript extraction.
 * Currently provides a stub that returns the video title/description
 * as context for summarization. In a future phase, this will integrate
 * with youtube-transcript-api or similar services.
 */

/** Extracted transcript data shape */
export interface TranscriptResult {
  /** Whether a real transcript was found */
  available: boolean;
  /** The transcript text (or fallback) */
  text: string;
}

/**
 * Attempts to fetch a transcript for a given YouTube video.
 * Currently returns a fallback based on the provided title and description.
 *
 * @param videoId - YouTube video ID (e.g. "dQw4w9WgXcQ")
 * @param title - Video title as fallback context
 * @param description - Video description as fallback context
 * @returns TranscriptResult with available flag and text
 */
export async function getTranscript(
  videoId: string,
  title: string,
  description: string
): Promise<TranscriptResult> {
  // ─── Future Implementation ────────────────────────────────────────────────
  // This is where you would call a transcript service, e.g.:
  //   const { YoutubeTranscript } = require('youtube-transcript');
  //   const segments = await YoutubeTranscript.fetchTranscript(videoId);
  //   const text = segments.map(s => s.text).join(' ');
  //   return { available: true, text };
  // ─────────────────────────────────────────────────────────────────────────

  console.log(`[Transcript] Stub called for video: ${videoId}`);

  // Fallback: combine title + description as context
  const fallbackText = [title, description].filter(Boolean).join('. ');

  return {
    available: false,
    text: fallbackText || 'No transcript or metadata available.',
  };
}

/**
 * Extracts a YouTube video ID from a URL string.
 * Supports standard, shortened, and embed URL formats.
 *
 * @param url - A YouTube URL
 * @returns The video ID string, or null if not found
 */
export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}
