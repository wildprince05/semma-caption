import type { ReferenceCaption, StyleProfile } from '../types/index.js';

/**
 * Extract the opening hook (first line) from a caption.
 */
function extractFirstLine(caption: string): string {
  const lines = caption.split('\n').filter((l) => l.trim().length > 0);
  return lines.length > 0 ? lines[0].trim() : '';
}

/**
 * Count emoji occurrences in a text string.
 */
function countEmojis(text: string): number {
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{200D}\u{20E3}\u{FE0F}\u{E0020}-\u{E007F}]/gu;
  const matches = text.match(emojiRegex);
  return matches ? matches.length : 0;
}

/**
 * Extract unique emojis from text.
 */
function extractEmojis(text: string): string[] {
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
  const matches = text.match(emojiRegex);
  return matches ? [...new Set(matches)] : [];
}

/**
 * Detect Tamil words in text (simple heuristic: common Tamil/Tanglish words).
 */
const COMMON_TAMIL_WORDS = new Set([
  'makkale', 'neenga', 'vaanga', 'pannunga', 'sollunga', 'parunga',
  'semma', 'mass', 'illa', 'irukku', 'dhan', 'enna', 'epdi',
  'romba', 'namma', 'unga', 'ellaarum', 'pannalaam', 'pannidaathinga',
  'kondu', 'poradhu', 'varudhu', 'kudunga', 'pannadhu', 'panna',
  'ippo', 'inga', 'oru', 'oda', 'ku', 'la', 'ah', 'idhu',
  'dei', 'da', 'di', 'le', 'ya', 'aanavanga', 'irundhaalum',
  'sollitten', 'pannamaatinga', 'regret', 'legends', 'indha',
]);

function countTamilWords(text: string): number {
  const words = text.toLowerCase().split(/\s+/);
  return words.filter((w) => COMMON_TAMIL_WORDS.has(w.replace(/[^a-z]/g, ''))).length;
}

/**
 * Extract hashtags from text.
 */
function extractHashtags(text: string): string[] {
  const matches = text.match(/#\w+/g);
  return matches || [];
}

/**
 * Extract common CTA patterns from captions.
 */
function extractCTAs(caption: string): string[] {
  const ctaPatterns = [
    /register\s+(?:now|here|link\s+in\s+bio)/gi,
    /link\s+in\s+bio/gi,
    /swipe\s+(?:for|to|right|left|up)/gi,
    /drop\s+a\s+.+/gi,
    /tag\s+yourself/gi,
    /dm\s+us/gi,
    /check\s+your\s+(?:email|inbox)/gi,
    /grab\s+yours/gi,
    /vaanga/gi,
    /forward\s+pannunga/gi,
    /reply\s+here/gi,
  ];

  const found: string[] = [];
  for (const pattern of ctaPatterns) {
    const matches = caption.match(pattern);
    if (matches) {
      found.push(...matches.map((m) => m.trim()));
    }
  }
  return found;
}

/**
 * Detect paragraph spacing style in a caption.
 */
function detectSpacingStyle(caption: string): string {
  const doubleNewlines = (caption.match(/\n\n/g) || []).length;
  const singleNewlines = (caption.match(/\n/g) || []).length - doubleNewlines * 2;

  if (doubleNewlines > 3) return 'generous-spacing';
  if (doubleNewlines > 0) return 'moderate-spacing';
  if (singleNewlines > 3) return 'compact';
  return 'minimal';
}

/**
 * Find common phrases (2-grams) across multiple captions.
 */
function findCommonPhrases(captions: string[]): string[] {
  const phraseCount = new Map<string, number>();

  for (const caption of captions) {
    const words = caption
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 1);

    const seenInCaption = new Set<string>();
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = `${words[i]} ${words[i + 1]}`;
      if (!seenInCaption.has(bigram)) {
        seenInCaption.add(bigram);
        phraseCount.set(bigram, (phraseCount.get(bigram) || 0) + 1);
      }
    }
  }

  // Keep phrases that appear in at least 2 captions
  return [...phraseCount.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([phrase]) => phrase);
}

/**
 * Analyze a set of reference captions and extract a style profile.
 */
export function generateStyleProfile(references: ReferenceCaption[]): StyleProfile {
  if (references.length === 0) {
    return {
      avgCaptionLength: {},
      commonOpeningHooks: [],
      emojiFrequency: 0,
      commonEmojis: [],
      tamilEnglishMixRatio: 0,
      commonCTAs: [],
      hashtagConventions: { avgCount: 0, commonHashtags: [] },
      paragraphSpacing: 'moderate-spacing',
      commonPhrases: [],
      toneCharacteristics: [],
    };
  }

  // -- Average caption length per platform --
  const lengthsByPlatform: Record<string, number[]> = {};
  for (const ref of references) {
    const p = ref.platform || 'unknown';
    if (!lengthsByPlatform[p]) lengthsByPlatform[p] = [];
    lengthsByPlatform[p].push(ref.caption_text.length);
  }
  const avgCaptionLength: Record<string, number> = {};
  for (const [platform, lengths] of Object.entries(lengthsByPlatform)) {
    avgCaptionLength[platform] = Math.round(
      lengths.reduce((a, b) => a + b, 0) / lengths.length,
    );
  }

  // -- Common opening hooks --
  const hooks = references
    .map((r) => extractFirstLine(r.caption_text))
    .filter((h) => h.length > 0);
  const commonOpeningHooks = [...new Set(hooks)].slice(0, 10);

  // -- Emoji analysis --
  const totalEmojis = references.reduce((sum, r) => sum + countEmojis(r.caption_text), 0);
  const emojiFrequency = Math.round((totalEmojis / references.length) * 10) / 10;

  const allEmojis: Map<string, number> = new Map();
  for (const ref of references) {
    for (const emoji of extractEmojis(ref.caption_text)) {
      allEmojis.set(emoji, (allEmojis.get(emoji) || 0) + 1);
    }
  }
  const commonEmojis = [...allEmojis.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([e]) => e);

  // -- Tamil/English mixing ratio --
  let totalWords = 0;
  let totalTamilWords = 0;
  for (const ref of references) {
    const words = ref.caption_text.split(/\s+/).length;
    totalWords += words;
    totalTamilWords += countTamilWords(ref.caption_text);
  }
  const tamilEnglishMixRatio =
    totalWords > 0 ? Math.round((totalTamilWords / totalWords) * 100) / 100 : 0;

  // -- CTA patterns --
  const allCTAs: Map<string, number> = new Map();
  for (const ref of references) {
    for (const cta of extractCTAs(ref.caption_text)) {
      const normalized = cta.toLowerCase();
      allCTAs.set(normalized, (allCTAs.get(normalized) || 0) + 1);
    }
  }
  const commonCTAs = [...allCTAs.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([cta]) => cta);

  // -- Hashtag conventions --
  const allHashtags: Map<string, number> = new Map();
  let totalHashtagCount = 0;
  let captionsWithHashtags = 0;
  for (const ref of references) {
    const tags = extractHashtags(ref.caption_text);
    if (tags.length > 0) {
      captionsWithHashtags++;
      totalHashtagCount += tags.length;
      for (const tag of tags) {
        allHashtags.set(tag, (allHashtags.get(tag) || 0) + 1);
      }
    }
  }
  const avgHashtagCount =
    captionsWithHashtags > 0
      ? Math.round((totalHashtagCount / captionsWithHashtags) * 10) / 10
      : 0;
  const commonHashtags = [...allHashtags.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag]) => tag);

  // -- Paragraph spacing --
  const spacingStyles = references.map((r) => detectSpacingStyle(r.caption_text));
  const spacingCount = new Map<string, number>();
  for (const s of spacingStyles) {
    spacingCount.set(s, (spacingCount.get(s) || 0) + 1);
  }
  const paragraphSpacing = [...spacingCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'moderate-spacing';

  // -- Common phrases --
  const captionTexts = references.map((r) => r.caption_text);
  const commonPhrases = findCommonPhrases(captionTexts);

  // -- Tone characteristics --
  const toneCount = new Map<string, number>();
  for (const ref of references) {
    if (ref.tone) {
      toneCount.set(ref.tone, (toneCount.get(ref.tone) || 0) + 1);
    }
  }
  const toneCharacteristics = [...toneCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tone, count]) => `${tone} (${count}/${references.length} captions)`);

  return {
    avgCaptionLength,
    commonOpeningHooks,
    emojiFrequency,
    commonEmojis,
    tamilEnglishMixRatio,
    commonCTAs,
    hashtagConventions: {
      avgCount: avgHashtagCount,
      commonHashtags,
    },
    paragraphSpacing,
    commonPhrases,
    toneCharacteristics,
  };
}

/**
 * Convert a style profile into a human-readable summary for inclusion in AI prompts.
 */
export function getStyleProfileSummary(profile: StyleProfile): string {
  const lines: string[] = [];

  lines.push('=== STYLE PROFILE (learn from this, do not copy) ===');
  lines.push('');

  // Caption lengths
  if (Object.keys(profile.avgCaptionLength).length > 0) {
    lines.push('Caption Length Averages:');
    for (const [platform, len] of Object.entries(profile.avgCaptionLength)) {
      lines.push(`  - ${platform}: ~${len} characters`);
    }
    lines.push('');
  }

  // Opening hooks
  if (profile.commonOpeningHooks.length > 0) {
    lines.push('Common Opening Hook Styles:');
    for (const hook of profile.commonOpeningHooks.slice(0, 5)) {
      lines.push(`  - "${hook}"`);
    }
    lines.push('');
  }

  // Emoji usage
  lines.push(`Emoji Usage: ~${profile.emojiFrequency} emojis per caption on average`);
  if (profile.commonEmojis.length > 0) {
    lines.push(`Frequently Used Emojis: ${profile.commonEmojis.join(' ')}`);
  }
  lines.push('');

  // Tamil-English mixing
  lines.push(
    `Tamil-English Mix: ~${Math.round(profile.tamilEnglishMixRatio * 100)}% Tamil/Tanglish words`,
  );
  lines.push('');

  // CTA patterns
  if (profile.commonCTAs.length > 0) {
    lines.push('Common Call-to-Action patterns:');
    for (const cta of profile.commonCTAs) {
      lines.push(`  - "${cta}"`);
    }
    lines.push('');
  }

  // Hashtag conventions
  lines.push(
    `Hashtags: Avg ${profile.hashtagConventions.avgCount} per post`,
  );
  if (profile.hashtagConventions.commonHashtags.length > 0) {
    lines.push(
      `Common hashtags: ${profile.hashtagConventions.commonHashtags.join(', ')}`,
    );
  }
  lines.push('');

  // Spacing
  lines.push(`Paragraph Spacing Style: ${profile.paragraphSpacing}`);
  lines.push('');

  // Common phrases
  if (profile.commonPhrases.length > 0) {
    lines.push('Common Phrases & Vocabulary:');
    for (const phrase of profile.commonPhrases.slice(0, 10)) {
      lines.push(`  - "${phrase}"`);
    }
    lines.push('');
  }

  // Tone
  if (profile.toneCharacteristics.length > 0) {
    lines.push('Tone Distribution:');
    for (const t of profile.toneCharacteristics) {
      lines.push(`  - ${t}`);
    }
  }

  lines.push('=== END STYLE PROFILE ===');

  return lines.join('\n');
}
