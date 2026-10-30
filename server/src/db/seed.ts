import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getAllReferences,
  insertReference,
  findReferenceByCaptionText,
} from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Path to the test captions JSON shipped with the project */
const TEST_CAPTIONS_PATH = path.resolve(__dirname, '..', '..', '..', 'data', 'test-captions.json');

interface SeedCaption {
  caption_text: string;
  platform?: string;
  event_type?: string;
  post_type?: string;
  language?: string;
  tone?: string;
  organization?: string;
  tags?: string[];
}

/**
 * Seed the references_table with test captions from data/test-captions.json.
 * Skips seeding if the table already has data or the seed file doesn't exist.
 * Returns the number of rows inserted.
 */
export function seedDatabase(): number {
  const existing = getAllReferences();
  if (existing.length > 0) {
    console.log(`[seed] References table already has ${existing.length} rows — skipping seed.`);
    return 0;
  }

  if (!fs.existsSync(TEST_CAPTIONS_PATH)) {
    console.warn(`[seed] Seed file not found at ${TEST_CAPTIONS_PATH} — skipping.`);
    return 0;
  }

  let captions: SeedCaption[];
  try {
    const raw = fs.readFileSync(TEST_CAPTIONS_PATH, 'utf-8');
    captions = JSON.parse(raw) as SeedCaption[];
  } catch (err) {
    console.error('[seed] Failed to parse seed file:', err);
    return 0;
  }

  if (!Array.isArray(captions) || captions.length === 0) {
    console.warn('[seed] Seed file is empty or not an array.');
    return 0;
  }

  let inserted = 0;
  for (const c of captions) {
    if (!c.caption_text || typeof c.caption_text !== 'string') {
      continue;
    }

    // Avoid duplicates
    const dup = findReferenceByCaptionText(c.caption_text);
    if (dup) continue;

    insertReference({
      caption_text: c.caption_text,
      platform: c.platform || 'instagram',
      event_type: c.event_type || 'general',
      post_type: c.post_type || 'general',
      language: c.language || 'tanglish',
      tone: c.tone || 'energetic',
      organization: c.organization || '',
      is_preferred: 0,
      tags: JSON.stringify(c.tags ?? []),
    });
    inserted++;
  }

  console.log(`[seed] Inserted ${inserted} reference captions from seed file.`);
  return inserted;
}
