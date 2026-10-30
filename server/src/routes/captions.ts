import express from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import {
  createSession,
  getSession,
  getChatMessagesBySession,
  insertChatMessage,
  insertGeneratedCaption,
  markOldVersions,
  getMaxVersion,
} from '../db/database.js';
import { retrieveRelevantReferences } from '../services/retrieval.js';
import { generateStyleProfile } from '../services/styleProfile.js';
import { generateCaptions, refineCaption } from '../services/ai.js';
import { validateCaption } from '../services/validator.js';
import type { Platform, EventData, Tone, Language, CaptionLength, PostType } from '../types/index.js';

const router = express.Router();

// ─── POST /api/captions/generate ───────────────────────────
const generateSchema = z.object({
  eventData: z.object({
    event_name: z.string().optional(),
    organizer: z.string().optional(),
    date: z.string().optional(),
    time: z.string().optional(),
    venue: z.string().optional(),
    registration_url: z.string().optional(),
    eligibility: z.string().optional(),
    fees: z.string().optional(),
    prize_pool: z.string().optional(),
    tracks: z.union([z.array(z.string()), z.string()]).optional(),
    speakers: z.union([z.array(z.string()), z.string()]).optional(),
    sponsors: z.union([z.array(z.string()), z.string()]).optional(),
    highlights: z.union([z.array(z.string()), z.string()]).optional(),
    cta: z.string().optional(),
    other_details: z.string().optional(),
    // Accept flat fields from frontend EventData shape too
    name: z.string().optional(),
    description: z.string().optional(),
    registrationLink: z.string().optional(),
    postType: z.string().optional(),
    referenceCaption: z.string().optional(),
  }).passthrough(),
  platforms: z.array(z.enum(['instagram', 'whatsapp', 'linkedin'])).min(1),
  postType: z.string().optional(),
  tone: z.string().optional(),
  language: z.string().optional(),
  length: z.enum(['short', 'medium', 'long']).optional(),
  sessionId: z.string().optional(),
  posterData: z.record(z.unknown()).nullable().optional(),
});

router.post('/generate', async (req, res) => {
  try {
    const parsed = generateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
    }

    const { eventData: rawEventData, platforms, tone, language, length, posterData } = parsed.data;

    // Normalize highlights — accept string or array
    const rawHighlights = rawEventData.highlights;
    const normalizedHighlights: string[] | undefined =
      Array.isArray(rawHighlights)
        ? rawHighlights as string[]
        : typeof rawHighlights === 'string' && rawHighlights.trim()
        ? rawHighlights.split(',').map((s: string) => s.trim()).filter(Boolean)
        : undefined;

    const eventData: EventData = {
      event_name: rawEventData.event_name || rawEventData.name,
      organizer: rawEventData.organizer,
      date: rawEventData.date,
      time: rawEventData.time,
      venue: rawEventData.venue,
      registration_url: rawEventData.registration_url || rawEventData.registrationLink,
      eligibility: rawEventData.eligibility,
      fees: rawEventData.fees,
      prize_pool: rawEventData.prize_pool,
      tracks: Array.isArray(rawEventData.tracks) ? rawEventData.tracks as string[] : undefined,
      speakers: Array.isArray(rawEventData.speakers) ? rawEventData.speakers as string[] : undefined,
      sponsors: Array.isArray(rawEventData.sponsors) ? rawEventData.sponsors as string[] : undefined,
      highlights: normalizedHighlights,
      cta: rawEventData.cta,
      other_details: rawEventData.description as string | undefined || rawEventData.other_details as string | undefined,
      ...(posterData || {}),
    };

    const postType = (parsed.data.postType || rawEventData.postType || 'event_announcement') as PostType;
    const safeTone = (tone || 'energetic') as Tone;
    const safeLanguage = (language || 'tanglish') as Language;
    const safeLength = (length || 'medium') as CaptionLength;

    // Session
    let sessionId = parsed.data.sessionId;
    if (!sessionId) {
      sessionId = uuidv4();
      createSession({
        id: sessionId,
        event_data: JSON.stringify(eventData),
        extracted_poster_data: posterData ? JSON.stringify(posterData) : null,
        style_profile: null,
        created_at: new Date().toISOString(),
      });
    } else {
      const existing = getSession(sessionId);
      if (!existing) {
        createSession({
          id: sessionId,
          event_data: JSON.stringify(eventData),
          extracted_poster_data: posterData ? JSON.stringify(posterData) : null,
          style_profile: null,
          created_at: new Date().toISOString(),
        });
      }
    }

    // Build keywords from event data for retrieval
    const highlightKeywords = Array.isArray(eventData.highlights) ? eventData.highlights : [];
    const keywords = [
      eventData.event_name,
      eventData.organizer,
      postType,
      safeTone,
      ...highlightKeywords,
    ].filter(Boolean) as string[];

    // Retrieve references for each platform
    const allRefs = platforms.flatMap(platform =>
      retrieveRelevantReferences({
        platform: platform as Platform,
        postType,
        tone: safeTone,
        language: safeLanguage,
        keywords,
      }, 4)
    );

    // Deduplicate
    const uniqueRefs = [...new Map(allRefs.map(r => [r.id, r])).values()];

    // Generate style profile from retrieved references
    const styleProfile = generateStyleProfile(uniqueRefs);

    // Generate captions
    const generated = await generateCaptions({
      eventData,
      platforms: platforms as Platform[],
      postType,
      tone: safeTone,
      language: safeLanguage,
      length: safeLength,
      referenceExamples: uniqueRefs,
      styleProfile,
      sessionId,
    });

    // Store and validate captions
    const results = [];
    for (const cap of generated) {
      const validation = validateCaption(cap.caption_text, eventData, cap.platform);
      markOldVersions(sessionId, cap.platform);
      const version = getMaxVersion(sessionId, cap.platform) + 1;
      const stored = insertGeneratedCaption({
        session_id: sessionId,
        platform: cap.platform,
        caption_text: cap.caption_text,
        version,
        is_current: 1,
        metadata: JSON.stringify({ tone: safeTone, language: safeLanguage, length: safeLength, postType, validation }),
      });
      results.push({
        platform: cap.platform,
        caption_text: cap.caption_text,
        id: stored.id,
        version,
        validation,
      });
    }

    return res.json({ sessionId, captions: results });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Caption generation failed';
    console.error('[generate error]', err);
    return res.status(500).json({ error: message });
  }
});

// ─── POST /api/captions/refine ──────────────────────────────
const refineSchema = z.object({
  sessionId: z.string(),
  platform: z.enum(['instagram', 'whatsapp', 'linkedin']),
  instruction: z.string().min(1),
  currentCaption: z.string().min(1),
  chatHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional(),
  // Also accept frontend shape
  captionId: z.string().optional(),
  eventContext: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    postType: z.string().optional(),
  }).optional(),
});

router.post('/refine', async (req, res) => {
  try {
    const parsed = refineSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
    }

    const { sessionId, platform, instruction, currentCaption, chatHistory = [], eventContext } = parsed.data;

    const session = getSession(sessionId);
    const eventData: EventData = session
      ? JSON.parse(session.event_data)
      : { event_name: eventContext?.name, other_details: eventContext?.description };

    insertChatMessage({ session_id: sessionId, role: 'user', content: instruction });

    const keywords = [eventData.event_name, platform].filter(Boolean) as string[];
    const refs = retrieveRelevantReferences({ platform: platform as Platform, keywords }, 3);

    const refined = await refineCaption({
      currentCaption,
      platform: platform as Platform,
      userInstruction: instruction,
      chatHistory,
      eventData,
      referenceExamples: refs,
    });

    insertChatMessage({ session_id: sessionId, role: 'assistant', content: refined });

    markOldVersions(sessionId, platform);
    const version = getMaxVersion(sessionId, platform) + 1;
    const stored = insertGeneratedCaption({
      session_id: sessionId,
      platform,
      caption_text: refined,
      version,
      is_current: 1,
      metadata: JSON.stringify({ refined: true, instruction }),
    });

    const chatMessages = getChatMessagesBySession(sessionId);

    return res.json({
      caption: { platform, caption_text: refined, id: stored.id, version },
      message: refined,
      chatMessages,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Refinement failed';
    console.error('[refine error]', err);
    return res.status(500).json({ error: message });
  }
});

export default router;
