import type {
  ReferenceCaption,
  ReferenceCaptionRow,
  RetrievalQuery,
  ScoredReference,
} from '../types/index.js';
import { getAllReferences, queryReferences } from '../db/database.js';

/**
 * Parse a raw DB row into a typed ReferenceCaption.
 */
function rowToReference(row: ReferenceCaptionRow): ReferenceCaption {
  let tags: string[] = [];
  try {
    tags = JSON.parse(row.tags || '[]');
  } catch {
    tags = [];
  }

  return {
    id: row.id,
    caption_text: row.caption_text,
    platform: row.platform as ReferenceCaption['platform'],
    event_type: row.event_type,
    post_type: row.post_type as ReferenceCaption['post_type'],
    language: row.language as ReferenceCaption['language'],
    tone: row.tone as ReferenceCaption['tone'],
    organization: row.organization,
    is_preferred: Boolean(row.is_preferred),
    tags,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Tokenize text into lowercase words, stripping common punctuation and emojis.
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s@#]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

/**
 * Compute a simple keyword overlap score between two token arrays.
 * Uses a TF-IDF-like approach: each matching keyword is scored higher if it
 * appears less frequently in the reference corpus.
 */
function keywordOverlapScore(queryTokens: string[], refTokens: string[], corpusDocFreq: Map<string, number>, corpusSize: number): number {
  if (queryTokens.length === 0 || refTokens.length === 0) return 0;

  const refSet = new Set(refTokens);
  let score = 0;

  for (const token of queryTokens) {
    if (refSet.has(token)) {
      const df = corpusDocFreq.get(token) || 1;
      // IDF-like weighting: rarer words matter more
      const idf = Math.log((corpusSize + 1) / (df + 1)) + 1;
      score += idf;
    }
  }

  // Normalize by query length to keep scores comparable
  return score / queryTokens.length;
}

/**
 * Build a document-frequency map over all references for IDF scoring.
 */
function buildDocFrequency(references: ReferenceCaption[]): Map<string, number> {
  const df = new Map<string, number>();
  for (const ref of references) {
    const uniqueTokens = new Set(tokenize(ref.caption_text));
    for (const token of uniqueTokens) {
      df.set(token, (df.get(token) || 0) + 1);
    }
  }
  return df;
}

/**
 * Retrieve the most relevant reference captions for a given query.
 *
 * Strategy:
 * 1. Filter by exact platform match (if provided).
 * 2. Filter by post_type match (if provided).
 * 3. Score remaining by keyword overlap with event details.
 * 4. Boost score for matching event_type, tone, language, and preferred status.
 * 5. Sort descending by score and return top `limit` results.
 */
export function retrieveRelevantReferences(
  query: RetrievalQuery,
  limit: number = 5,
): ReferenceCaption[] {
  const allRows = getAllReferences();
  let candidates = allRows.map(rowToReference);

  // Step 1: platform filter
  if (query.platform) {
    const platformFiltered = candidates.filter((r) => r.platform === query.platform);
    // Fall back to all if no matches for this platform
    if (platformFiltered.length > 0) {
      candidates = platformFiltered;
    }
  }

  // Step 2: post_type filter (soft — prefer but don't require)
  if (query.postType) {
    const ptFiltered = candidates.filter((r) => r.post_type === query.postType);
    if (ptFiltered.length >= 2) {
      candidates = ptFiltered;
    }
  }

  // Step 3 & 4: scoring
  const corpusDocFreq = buildDocFrequency(candidates);
  const corpusSize = candidates.length;

  const queryTokens = tokenize((query.keywords || []).join(' '));

  const scored: ScoredReference[] = candidates.map((ref) => {
    let score = 0;

    // Keyword overlap score
    const refTokens = tokenize(ref.caption_text);
    score += keywordOverlapScore(queryTokens, refTokens, corpusDocFreq, corpusSize) * 10;

    // Bonus for matching event_type
    if (query.eventType && ref.event_type === query.eventType) {
      score += 5;
    }

    // Bonus for matching tone
    if (query.tone && ref.tone === query.tone) {
      score += 2;
    }

    // Bonus for matching language
    if (query.language && ref.language === query.language) {
      score += 1;
    }

    // Bonus for preferred references
    if (ref.is_preferred) {
      score += 3;
    }

    return { reference: ref, score };
  });

  // Step 5: sort and return top results
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.reference);
}

/**
 * Search references for the reference library UI.
 * Supports text search and metadata filters with pagination.
 */
export function searchReferences(
  searchTerm?: string,
  filters?: { platform?: string; post_type?: string; page?: number; limit?: number },
): { references: ReferenceCaption[]; total: number; page: number; totalPages: number } {
  const page = filters?.page ?? 1;
  const limit = filters?.limit ?? 20;

  const result = queryReferences({
    platform: filters?.platform,
    post_type: filters?.post_type,
    search: searchTerm,
    page,
    limit,
  });

  const references = result.rows.map(rowToReference);
  const totalPages = Math.ceil(result.total / limit);

  return {
    references,
    total: result.total,
    page,
    totalPages,
  };
}
