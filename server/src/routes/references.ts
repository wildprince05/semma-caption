import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import {
  getAllReferences,
  insertReference,
  findReferenceByCaptionText,
  getReferenceStats,
  queryReferences,
  getReferenceById,
  updateReference,
  deleteReference,
} from '../db/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const uploadDir = process.env.UPLOAD_DIR || path.resolve(__dirname, '..', '..', 'uploads');
const upload = multer({ dest: uploadDir, limits: { fileSize: 5 * 1024 * 1024 } });

// ─── GET /api/references ────────────────────────────────────
router.get('/', (req, res) => {
  const platform = req.query.platform as string | undefined;
  const post_type = req.query.post_type as string | undefined;
  const search = req.query.search as string | undefined;
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

  const result = queryReferences({ platform, post_type, search, page, limit });

  return res.json({
    references: result.rows,
    pagination: {
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit),
    },
  });
});

// ─── GET /api/references/stats ──────────────────────────────
router.get('/stats', (_req, res) => {
  const stats = getReferenceStats();
  return res.json(stats);
});

// ─── POST /api/references/import ────────────────────────────
function parseCaptionsFromText(text: string): Array<{ caption_text: string; platform?: string; post_type?: string; tone?: string; language?: string }> {
  // Split by double newline or separator patterns
  const blocks = text.split(/\n\s*\n+/).map(b => b.trim()).filter(b => b.length > 30);
  return blocks.map(block => ({ caption_text: block }));
}

function parseCaptionsFromCSV(text: string): Array<Record<string, string>> {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
  return lines.slice(1).map(line => {
    const values = line.match(/(".*?"|[^,]+)/g)?.map(v => v.replace(/^"|"$/g, '').trim()) || [];
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ''; });
    return obj;
  }).filter(row => row.caption_text || row.caption || row.text);
}

router.post('/import', upload.single('file'), async (req, res) => {
  let captionsToImport: Array<{
    caption_text: string;
    platform?: string;
    event_type?: string;
    post_type?: string;
    language?: string;
    tone?: string;
    organization?: string;
    tags?: string[];
  }> = [];

  // Handle file upload
  if (req.file) {
    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      fs.unlinkSync(filePath);

      if (ext === '.json') {
        const parsed = JSON.parse(content);
        captionsToImport = Array.isArray(parsed) ? parsed : [parsed];
      } else if (ext === '.csv') {
        captionsToImport = parseCaptionsFromCSV(content).map(row => ({
          caption_text: row.caption_text || row.caption || row.text,
          platform: row.platform,
          event_type: row.event_type,
          post_type: row.post_type,
          language: row.language,
          tone: row.tone,
          organization: row.organization,
        }));
      } else {
        // TXT or MD
        captionsToImport = parseCaptionsFromText(content);
      }
    } catch (err) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'Failed to parse file' });
    }
  } else if (req.body?.captions && Array.isArray(req.body.captions)) {
    captionsToImport = req.body.captions;
  } else if (req.body?.text) {
    captionsToImport = parseCaptionsFromText(req.body.text);
  } else {
    return res.status(400).json({ error: 'No captions provided. Upload a file or send { captions: [...] } in request body.' });
  }

  // Process imports
  let added = 0;
  let skipped = 0;
  let errors = 0;
  const details: Array<{ index: number; status: string; reason?: string }> = [];

  for (let i = 0; i < captionsToImport.length; i++) {
    const cap = captionsToImport[i];
    const text = cap.caption_text?.trim();

    if (!text || text.length < 10) {
      details.push({ index: i, status: 'error', reason: 'Caption text too short or missing' });
      errors++;
      continue;
    }

    // Duplicate detection
    const existing = findReferenceByCaptionText(text);
    if (existing) {
      details.push({ index: i, status: 'skipped', reason: 'Duplicate caption' });
      skipped++;
      continue;
    }

    try {
      insertReference({
        caption_text: text,
        platform: cap.platform || 'instagram',
        event_type: cap.event_type || 'general',
        post_type: cap.post_type || 'general',
        language: cap.language || 'tanglish',
        tone: cap.tone || 'energetic',
        organization: cap.organization || '',
        is_preferred: 0,
        tags: JSON.stringify(cap.tags || []),
      });
      details.push({ index: i, status: 'added' });
      added++;
    } catch (err) {
      details.push({ index: i, status: 'error', reason: 'Database error' });
      errors++;
    }
  }

  return res.json({
    summary: { total: captionsToImport.length, added, skipped, errors },
    details,
    imported: added,
    duplicates: skipped,
  });
});

// ─── PATCH /api/references/:id ──────────────────────────────
const updateSchema = z.object({
  caption_text: z.string().optional(),
  platform: z.string().optional(),
  event_type: z.string().optional(),
  post_type: z.string().optional(),
  language: z.string().optional(),
  tone: z.string().optional(),
  organization: z.string().optional(),
  is_preferred: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

router.patch('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

  const existing = getReferenceById(id);
  if (!existing) return res.status(404).json({ error: 'Reference not found' });

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid data', details: parsed.error.flatten() });

  const updates = parsed.data;
  const updated = updateReference(id, {
    ...updates,
    is_preferred: updates.is_preferred !== undefined ? (updates.is_preferred ? 1 : 0) : undefined,
    tags: updates.tags ? JSON.stringify(updates.tags) : undefined,
  });

  return res.json(updated);
});

// ─── DELETE /api/references/:id ─────────────────────────────
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

  const deleted = deleteReference(id);
  if (!deleted) return res.status(404).json({ error: 'Reference not found' });

  return res.json({ success: true });
});

export default router;

