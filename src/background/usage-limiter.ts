import { supabaseService } from './supabase-service';
import { FREE_TIER_DAILY_LIMIT } from '../shared/constants';
import { UsageLimitResult } from '../shared/types';

// Cache for usage limit to reduce API calls
interface UsageCache {
  result: UsageLimitResult;
  timestamp: number;
}

let usageCache: UsageCache | null = null;
const CACHE_TTL_MS = 60 * 1000; // 1 minute cache

/**
 * Check if user can make another voice request
 */
export async function checkUsageLimit(): Promise<UsageLimitResult> {
  // Check cache first
  if (usageCache && Date.now() - usageCache.timestamp < CACHE_TTL_MS) {
    return usageCache.result;
  }

  // Check if authenticated
  if (!supabaseService.isAuthenticated()) {
    return { allowed: false, remaining: 0 };
  }

  // Get fresh usage data from Supabase
  const result = await supabaseService.checkUsageLimit();

  // Update cache
  usageCache = {
    result,
    timestamp: Date.now(),
  };

  return result;
}

/**
 * Record a usage event
 * Call this after successfully processing a voice request
 */
export async function recordUsage(params: {
  sourceLanguage: string;
  objective?: string;
  additionalContext?: string;
  audioDurationSeconds?: number;
  originalTextLength?: number;
  elaboratedTextLength?: number;
  tokensUsed?: number;
}): Promise<void> {
  // Increment the daily counter
  await supabaseService.incrementUsage();

  // Log detailed usage for analytics
  await supabaseService.logUsage(params);

  // Invalidate cache
  usageCache = null;
}

/**
 * Get the daily limit for the current user
 * Returns -1 for unlimited
 */
export function getDailyLimit(): number {
  // TODO: Check user's subscription tier and return appropriate limit
  // For now, return free tier limit
  return FREE_TIER_DAILY_LIMIT;
}

/**
 * Check if user has exceeded their daily limit
 */
export async function isLimitExceeded(): Promise<boolean> {
  const result = await checkUsageLimit();
  return !result.allowed;
}

/**
 * Get remaining prompts for today
 */
export async function getRemainingPrompts(): Promise<number> {
  const result = await checkUsageLimit();
  return result.remaining;
}

/**
 * Clear the usage cache
 * Call this when user logs in/out or changes subscription
 */
export function clearUsageCache(): void {
  usageCache = null;
}
