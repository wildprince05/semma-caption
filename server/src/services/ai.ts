import { Groq } from 'groq-sdk';
import type {
  EventData,
  Platform,
  PostType,
  Tone,
  Language,
  CaptionLength,
  ReferenceCaption,
  StyleProfile,
} from '../types/index.js';
import { getStyleProfileSummary } from './styleProfile.js';

let groqClientInstance: Groq | null = null;

export function getGroqClient(): Groq {
  const apiKey = (process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) {
    throw new Error('GROQ_API_KEY environment variable is not set. Please add it to your .env file.');
  }
  if (!groqClientInstance) {
    groqClientInstance = new Groq({ apiKey });
  }
  return groqClientInstance;
}

export function getGroqModel(): string {
  return process.env.GROQ_MODEL?.trim() || 'qwen/qwen3.8-27b';
}

/**
 * Check whether the configured model is available and whether it supports vision.
 */
export async function verifyGroqStatus(): Promise<{
  connected: boolean;
  configuredModel: string;
  modelAvailable: boolean;
  supportsVision: boolean;
  availableModels: string[];
  error?: string;
}> {
  try {
    const groq = getGroqClient();
    const configuredModel = getGroqModel();
    const list = await groq.models.list();
    const availableModels = list.data.map(m => m.id);
    const modelAvailable = availableModels.includes(configuredModel);

    // Known vision capable models on Groq
    const supportsVision =
      configuredModel.includes('vision') ||
      configuredModel === 'qwen/qwen3.8-27b' ||
      configuredModel.includes('vl');

    return {
      connected: true,
      configuredModel,
      modelAvailable,
      supportsVision,
      availableModels,
    };
  } catch (err) {
    return {
      connected: false,
      configuredModel: getGroqModel(),
      modelAvailable: false,
      supportsVision: false,
      availableModels: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ─────────────────────────────────────────────
// Prompt builders
// ─────────────────────────────────────────────

function buildEventBlock(eventData: EventData): string {
  const toArr = (v: string[] | string | undefined): string[] =>
    !v ? [] : Array.isArray(v) ? v : v.split(',').map(s => s.trim()).filter(Boolean);

  const lines: string[] = ['=== CONFIRMED EVENT DETAILS (use EXACTLY as given, NEVER invent anything) ==='];
  if (eventData.event_name) lines.push(`Event Name: ${eventData.event_name}`);
  if (eventData.organizer)  lines.push(`Organizer: ${eventData.organizer}`);
  if (eventData.date)       lines.push(`Date: ${eventData.date}`);
  if (eventData.time)       lines.push(`Time: ${eventData.time}`);
  if (eventData.venue)      lines.push(`Venue: ${eventData.venue}`);
  if (eventData.registration_url) lines.push(`Registration URL: ${eventData.registration_url}`);
  if (eventData.eligibility) lines.push(`Eligibility: ${eventData.eligibility}`);
  if (eventData.fees)       lines.push(`Fees: ${eventData.fees}`);
  if (eventData.prize_pool) lines.push(`Prize Pool: ${eventData.prize_pool}`);
  const tracks = toArr(eventData.tracks);
  if (tracks.length)   lines.push(`Tracks: ${tracks.join(', ')}`);
  const speakers = toArr(eventData.speakers);
  if (speakers.length) lines.push(`Speakers: ${speakers.join(', ')}`);
  const sponsors = toArr(eventData.sponsors);
  if (sponsors.length) lines.push(`Sponsors: ${sponsors.join(', ')}`);
  const highlights = toArr(eventData.highlights);
  if (highlights.length) lines.push(`Highlights: ${highlights.join('; ')}`);
  if (eventData.cta)        lines.push(`CTA: ${eventData.cta}`);
  if (eventData.other_details) lines.push(`Other: ${eventData.other_details}`);
  lines.push('=== END EVENT DETAILS ===');
  return lines.join('\n');
}

function buildReferenceBlock(refs: ReferenceCaption[]): string {
  if (refs.length === 0) return '';
  const lines = [
    '=== GROUND-TRUTH STYLE REFERENCE CAPTIONS ===',
    'Carefully study these examples to absorb: tone, Tanglish sentence rhythm, emoji density, hook structures, and CTA patterns.',
    'Do NOT copy entire text verbatim. Synthesize an ORIGINAL caption in this exact authentic creator voice.',
    '',
  ];
  refs.forEach((r, i) => {
    lines.push(`--- Reference #${i + 1} [Platform: ${r.platform} | Type: ${r.post_type} | Tone: ${r.tone}] ---`);
    lines.push(r.caption_text);
    lines.push('');
  });
  lines.push('=== END REFERENCES ===');
  return lines.join('\n');
}

function platformInstructions(platform: Platform, postType: string, tone: string, length: CaptionLength): string {
  const lengthGuide = {
    short: '80–140 words (quick, high-impact, mobile-friendly)',
    medium: '150–240 words (balanced storytelling + complete details)',
    long: '250–380 words (full breakdown, recap, or deep engagement)',
  }[length];

  const base = `PLATFORM TARGET: ${platform.toUpperCase()}
POST TYPE: ${postType}
TARGET TONE: ${tone}
TARGET LENGTH: ${lengthGuide}`;

  const platformSpecific: Record<Platform, string> = {
    instagram: `
- Opening Hook: Catchy, curiosity-inducing first 1-2 lines before the "more" fold.
- Formatting: Short, punchy paragraphs (1-3 lines max) with clean spacing.
- Emojis: Energetic and human (e.g., 🔥, 💛, 🚀, 👀, 😎), placed naturally, not spamming every line.
- Content: Event highlights + date/venue/registration clearly stated.
- Call To Action (CTA): Direct and engaging (e.g., "Link in bio", "Spot-ah lock pannunga!").
- Hashtags: 5-8 relevant, targeted hashtags at the very bottom on their own line.`,
    whatsapp: `
- Style: Feels like an active community announcement in a college/club group.
- Formatting: Highly scannable with bullet points (📅, 📍, 🔗, 💰) and short lines.
- No heavy fluff: 30% shorter than Instagram.
- Call To Action: Clear forward/registration link for quick tap.
- Hashtags: Zero hashtags (keep it clean like real WhatsApp broadcasts).`,
    linkedin: `
- Opening Hook: Professional yet warm and relatable hook (visible before "see more").
- Style: Authentic student-creator voice celebrating learning, building, or milestones.
- Tone: Professional without corporate jargon (no forced "synergy" or "paradigm").
- Language: Natural Tanglish if references demonstrate it, maintaining credibility.
- Call To Action: Thoughtful closing inviting connection or participation.
- Hashtags: 3-5 clean industry and community tags (e.g. #TechCommunity #StudentBuilders).`,
  };

  return `${base}\n${platformSpecific[platform]}`;
}

function buildSystemPrompt(styleProfile: StyleProfile | null): string {
  const styleSection = styleProfile ? getStyleProfileSummary(styleProfile) : '';

  return `You are Yelloverse — the AI Caption Studio built for college clubs, technical communities, hackathons, and student creators in Tamil Nadu.

YOUR IDENTITY & VOICE:
- You sound like a creative student content lead, NOT a corporate marketing bot.
- Your default language is Tanglish: authentic Tamil expressions written in Latin script naturally woven with English.
- Natural Tamil colloquial particles and vocabulary: "makkale", "vaanga", "semma", "namma", "pannunga", "dhan", "illa", "la", "ah", "da", "nga", "spot-ah lock pannidunga".
- NEVER translate English sentences mechanically into awkward Tamil.
- NEVER use forced slang on every single line — maintain natural sentence rhythm.
- NEVER sound generic ("Are you ready to unlock your potential"). Keep it grounded and vibrant.

ABSOLUTE FACTUAL RULES (CRITICAL):
1. NEVER invent dates, venues, URLs, ticket prices, prize pools, or speakers.
2. If an event fact is confirmed in the input, keep it EXACT.
3. If an event detail is not provided, do not hallucinate it.
4. Output ONLY the raw caption ready to copy/paste — do not write introductions, quotes, or conversational sign-offs like "Here is your caption:".

${styleSection}`;
}

// ─────────────────────────────────────────────
// Caption generation via Groq
// ─────────────────────────────────────────────

export interface GenerateCaptionsParams {
  eventData: EventData;
  platforms: Platform[];
  postType: PostType;
  tone: Tone;
  language: Language;
  length: CaptionLength;
  referenceExamples: ReferenceCaption[];
  styleProfile: StyleProfile | null;
  sessionId: string;
}

export interface GeneratedCaptionResult {
  platform: Platform;
  caption_text: string;
}

export async function generateCaptions(params: GenerateCaptionsParams): Promise<GeneratedCaptionResult[]> {
  const groq = getGroqClient();
  const model = getGroqModel();
  const systemPrompt = buildSystemPrompt(params.styleProfile);
  const eventBlock = buildEventBlock(params.eventData);

  const results: GeneratedCaptionResult[] = [];

  for (const platform of params.platforms) {
    const platformRefs = params.referenceExamples
      .filter(r => r.platform === platform)
      .slice(0, 3);
    const fallbackRefs = params.referenceExamples
      .filter(r => r.platform !== platform)
      .slice(0, 2);
    const refs = platformRefs.length >= 2 ? platformRefs : [...platformRefs, ...fallbackRefs].slice(0, 4);

    const refBlock = buildReferenceBlock(refs);
    const platformInst = platformInstructions(platform, params.postType, params.tone, params.length);

    const languageInstruction =
      params.language === 'tanglish'
        ? 'Language: Authentic Tanglish (Tamil words in Latin alphabet blended smoothly with English).'
        : params.language === 'english'
        ? 'Language: English, but maintaining the vibrant student-creator energy from the references.'
        : params.language === 'tamil'
        ? 'Language: Tamil script with English technical/proper names preserved.'
        : 'Language: Custom expressive blend matching user preference.';

    const userPrompt = `${eventBlock}

${refBlock}

${platformInst}
${languageInstruction}

Write the final caption for ${platform.toUpperCase()} now. Output ONLY the caption text.`;

    const completion = await groq.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.75,
      max_tokens: 1024,
    });

    const captionText = completion.choices[0]?.message?.content?.trim() || '';
    results.push({ platform, caption_text: captionText });
  }

  return results;
}

// ─────────────────────────────────────────────
// Caption refinement via Groq
// ─────────────────────────────────────────────

export interface RefineCaptionParams {
  currentCaption: string;
  platform: Platform;
  userInstruction: string;
  chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  eventData: EventData;
  referenceExamples: ReferenceCaption[];
}

export async function refineCaption(params: RefineCaptionParams): Promise<string> {
  const groq = getGroqClient();
  const model = getGroqModel();

  const eventBlock = buildEventBlock(params.eventData);
  const refs = params.referenceExamples.filter(r => r.platform === params.platform).slice(0, 3);
  const refBlock = buildReferenceBlock(refs);

  const systemPrompt = `You are Yelloverse AI Caption Studio. You refine existing social media captions based on conversational user requests.

CRITICAL INSTRUCTIONS:
- Apply precisely what the user requests (e.g. "make it catchy", "shorten it", "change only the first line", "more emojis", "namma old style la kudu").
- If the user asks to modify ONE part, PRESERVE the rest of the caption intact.
- ALWAYS preserve verified event facts: dates, times, venues, URLs, pricing.
- Keep the natural Tanglish style unless instructed otherwise.
- Output ONLY the updated caption text with no commentary or quotes.`;

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
  ];

  // Append recent context
  params.chatHistory.slice(-6).forEach(m => {
    messages.push({ role: m.role, content: m.content });
  });

  const prompt = `${eventBlock}

${refBlock}

CURRENT ${params.platform.toUpperCase()} CAPTION:
"""
${params.currentCaption}
"""

USER REFINEMENT REQUEST: "${params.userInstruction}"

Return ONLY the refined caption now:`;

  messages.push({ role: 'user', content: prompt });

  const completion = await groq.chat.completions.create({
    model,
    messages,
    temperature: 0.7,
    max_tokens: 1024,
  });

  return completion.choices[0]?.message?.content?.trim() || params.currentCaption;
}

// ─────────────────────────────────────────────
// Poster Analysis (Groq Vision + OCR Fallback)
// ─────────────────────────────────────────────

async function performOCR(imageBuffer: Buffer): Promise<string> {
  try {
    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker('eng');
    const ret = await worker.recognize(imageBuffer);
    await worker.terminate();
    return ret.data.text || '';
  } catch (err) {
    console.warn('[OCR fallback error]', err);
    return '';
  }
}

export async function analyzePoster(
  imageBuffer: Buffer,
  mimeType: string,
): Promise<{ eventData: EventData; confidence: Record<string, string>; method: 'vision' | 'ocr' }> {
  const groq = getGroqClient();
  const model = getGroqModel();
  const base64Data = imageBuffer.toString('base64');

  const jsonExtractionPrompt = `You are an expert event information extractor for posters and flyers.
Carefully extract all visible event details into a valid JSON object.

Output ONLY valid JSON matching this structure:
{
  "event_name": "Event title or null",
  "organizer": "Club / Company organizing or null",
  "date": "Event date as written or null",
  "time": "Event time or null",
  "venue": "Venue / platform / location or null",
  "registration_url": "URL or link if visible, else null",
  "eligibility": "Who can participate or null",
  "fees": "Registration fee or free, else null",
  "prize_pool": "Prize pool if stated or null",
  "tracks": ["track1", "track2"],
  "speakers": ["speaker names"],
  "sponsors": ["sponsor names"],
  "highlights": ["key highlight 1", "key highlight 2"],
  "cta": "Main call to action text or null",
  "other_details": "Any extra notes or null",
  "confidence": {
    "event_name": "high",
    "date": "high"
  }
}

CRITICAL RULES:
- Never hallucinate dates, fees, venues or URLs.
- If not visible, return null or empty array.
- Output ONLY raw JSON, without markdown formatting.`;

  // First try direct Vision on the configured model
  try {
    const visionResponse = await groq.chat.completions.create({
      model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: jsonExtractionPrompt },
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64Data}` },
            },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 1000,
    });

    const raw = visionResponse.choices[0]?.message?.content?.trim() || '';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const { confidence, ...eventDataRaw } = parsed;
      return {
        eventData: eventDataRaw as EventData,
        confidence: confidence || {},
        method: 'vision',
      };
    }
  } catch (visionErr) {
    console.warn(`[Groq Vision failed with model ${model}, falling back to OCR + Groq text extraction]:`, (visionErr as Error).message);
  }

  // Fallback: Perform OCR on the poster image, then feed recognized text to Groq text completion
  const ocrText = await performOCR(imageBuffer);
  if (!ocrText.trim()) {
    throw new Error('Could not extract text from this poster image. Please fill details manually.');
  }

  const textExtraction = await groq.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: 'You extract structured event information from raw OCR text of event posters. Output ONLY valid JSON.',
      },
      {
        role: 'user',
        content: `${jsonExtractionPrompt}\n\nRAW POSTER OCR TEXT:\n${ocrText}`,
      },
    ],
    temperature: 0.1,
    max_tokens: 1000,
  });

  const rawText = textExtraction.choices[0]?.message?.content?.trim() || '';
  const match = rawText.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error('Failed to parse event details from poster text.');
  }

  const parsed = JSON.parse(match[0]);
  const { confidence, ...eventDataRaw } = parsed;
  return {
    eventData: eventDataRaw as EventData,
    confidence: confidence || {},
    method: 'ocr',
  };
}
