import type { EventData, Platform, ValidationResult } from '../types/index.js';

/** Platform-specific character limits */
const PLATFORM_LIMITS: Record<Platform, number> = {
  instagram: 2200,
  whatsapp: 65536,
  linkedin: 3000,
};

/**
 * Validate that a generated caption is factually consistent with the event data
 * and meets platform requirements.
 */
export function validateCaption(
  caption: string,
  eventData: EventData,
  platform: Platform = 'instagram',
): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const characterCount = caption.length;
  const platformLimit = PLATFORM_LIMITS[platform] || 2200;

  // Character limit check
  if (characterCount > platformLimit) {
    errors.push(
      `Caption exceeds ${platform} character limit: ${characterCount}/${platformLimit}`,
    );
  }

  // Empty caption check
  if (caption.trim().length === 0) {
    errors.push('Caption is empty');
    return { valid: false, warnings, errors, characterCount, platformLimit };
  }

  // Fact-checking: verify confirmed event details appear in the caption
  const captionLower = caption.toLowerCase();

  // Check event name
  if (eventData.event_name) {
    const eventNameLower = eventData.event_name.toLowerCase();
    if (!captionLower.includes(eventNameLower)) {
      warnings.push(
        `Event name "${eventData.event_name}" not found in caption. Verify it's mentioned correctly.`,
      );
    }
  }

  // Check date
  if (eventData.date) {
    const dateLower = eventData.date.toLowerCase();
    if (!captionLower.includes(dateLower)) {
      warnings.push(
        `Date "${eventData.date}" not found verbatim in caption. Verify date is correct.`,
      );
    }
  }

  // Check registration URL
  if (eventData.registration_url) {
    if (!caption.includes(eventData.registration_url)) {
      warnings.push(
        `Registration URL "${eventData.registration_url}" not found in caption. URLs must be exact.`,
      );
    }
  }

  // Check venue
  if (eventData.venue) {
    const venueLower = eventData.venue.toLowerCase();
    if (!captionLower.includes(venueLower)) {
      warnings.push(
        `Venue "${eventData.venue}" not found in caption. Verify it's mentioned correctly.`,
      );
    }
  }

  // Check for fabricated URLs (URLs present in caption but not in event data)
  const urlRegex = /https?:\/\/[^\s)]+/g;
  const captionUrls = caption.match(urlRegex) || [];
  const knownUrls = [eventData.registration_url].filter(Boolean) as string[];

  for (const url of captionUrls) {
    if (!knownUrls.some((known) => url.includes(known) || known.includes(url))) {
      warnings.push(
        `URL "${url}" found in caption but not in event data — may be fabricated.`,
      );
    }
  }

  // Check fees/prize pool if present
  if (eventData.fees) {
    if (!caption.includes(eventData.fees)) {
      warnings.push(
        `Fees "${eventData.fees}" not found in caption. Monetary values must be exact.`,
      );
    }
  }

  if (eventData.prize_pool) {
    if (!caption.includes(eventData.prize_pool)) {
      warnings.push(
        `Prize pool "${eventData.prize_pool}" not found in caption. Monetary values must be exact.`,
      );
    }
  }

  // Platform-specific structure checks
  if (platform === 'instagram') {
    // Instagram posts should typically have hashtags
    const hashtagCount = (caption.match(/#\w+/g) || []).length;
    if (hashtagCount === 0) {
      warnings.push('Instagram post has no hashtags — consider adding relevant ones.');
    }
  }

  if (platform === 'linkedin') {
    // LinkedIn posts should generally be more structured
    if (caption.length < 100) {
      warnings.push('LinkedIn post seems very short — consider adding more professional context.');
    }
  }

  if (platform === 'whatsapp') {
    // WhatsApp messages should be concise
    if (caption.length > 1500) {
      warnings.push('WhatsApp message is quite long — consider making it more concise and scannable.');
    }
  }

  const valid = errors.length === 0;

  return { valid, warnings, errors, characterCount, platformLimit };
}
