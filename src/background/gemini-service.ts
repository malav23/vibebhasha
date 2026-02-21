import { supabaseService } from './supabase-service';
import { SUPABASE_URL, EDGE_FUNCTIONS } from '../shared/constants';
import { TranscriptionResult, ElaborationResult, LanguageCode, ObjectiveType } from '../shared/types';

/**
 * Send audio to Supabase Edge Function for transcription via Gemini API
 */
export async function transcribeAudio(audioData: string): Promise<TranscriptionResult> {
  const accessToken = supabaseService.getAccessToken();
  if (!accessToken) {
    throw new Error('Not authenticated');
  }

  // Convert base64 to blob
  const byteCharacters = atob(audioData);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const audioBlob = new Blob([byteArray], { type: 'audio/webm' });

  // Create form data
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');

  // Call the edge function
  const response = await fetch(`${SUPABASE_URL}${EDGE_FUNCTIONS.TRANSCRIBE_AUDIO}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `Transcription failed: ${response.status}`);
  }

  const result = await response.json();
  return {
    text: result.text,
    language: result.language as LanguageCode,
    duration: result.duration,
    remaining: result.remaining,
  };
}

/**
 * Send text to Supabase Edge Function for translation and elaboration via Gemini API
 */
export async function translateAndElaborate(params: {
  text: string;
  sourceLanguage: LanguageCode;
  objective: ObjectiveType;
  additionalContext?: string;
}): Promise<ElaborationResult> {
  const accessToken = supabaseService.getAccessToken();
  if (!accessToken) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${SUPABASE_URL}${EDGE_FUNCTIONS.TRANSLATE_ELABORATE}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: params.text,
      sourceLanguage: params.sourceLanguage,
      objective: params.objective,
      additionalContext: params.additionalContext,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `Elaboration failed: ${response.status}`);
  }

  const result = await response.json();
  return {
    original: result.original,
    translated: result.translated,
    elaborated: result.elaborated,
  };
}

/**
 * Estimate tokens used for a given text
 * This is a rough estimate, actual usage may vary
 */
export function estimateTokens(text: string): number {
  // Rough estimate: ~4 characters per token for English
  // Non-Latin scripts may use more tokens
  return Math.ceil(text.length / 4);
}
