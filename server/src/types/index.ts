// ============================================================
// Shared TypeScript types for Yelloverse AI Caption Studio
// ============================================================

/** Supported social media platforms */
export type Platform = 'instagram' | 'whatsapp' | 'linkedin';

/** Types of posts that can be generated */
export type PostType =
  | 'event_announcement'
  | 'registration_reminder'
  | 'last_date_reminder'
  | 'speaker_introduction'
  | 'event_recap'
  | 'winner_announcement'
  | 'certificate_announcement'
  | 'thank_you_post'
  | 'collaboration_announcement'
  | 'reel_caption'
  | 'photo_dump'
  | 'sponsor_appreciation'
  | 'milestone_announcement'
  | 'volunteer_appreciation'
  | 'community_meetup'
  | 'general';

/** Tone of the caption */
export type Tone =
  | 'energetic'
  | 'urgent'
  | 'excited'
  | 'celebratory'
  | 'warm'
  | 'casual'
  | 'humorous'
  | 'grateful'
  | 'professional'
  | 'inspirational'
  | 'direct'
  | 'helpful';

/** Language for caption generation */
export type Language = 'tanglish' | 'english' | 'tamil';

/** Caption length preference */
export type CaptionLength = 'short' | 'medium' | 'long';

/** Event data extracted from poster or user input */
export interface EventData {
  event_name?: string;
  organizer?: string;
  date?: string;
  time?: string;
  venue?: string;
  registration_url?: string;
  eligibility?: string;
  fees?: string;
  prize_pool?: string;
  tracks?: string[] | string;
  speakers?: string[] | string;
  sponsors?: string[] | string;
  highlights?: string[] | string;
  cta?: string;
  other_details?: string;
  [key: string]: unknown;
}

/** A reference caption stored in the database */
export interface ReferenceCaption {
  id: number;
  caption_text: string;
  platform: Platform;
  event_type: string;
  post_type: PostType;
  language: Language;
  tone: Tone;
  organization: string;
  is_preferred: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

/** Raw reference row from SQLite (tags stored as JSON string) */
export interface ReferenceCaptionRow {
  id: number;
  caption_text: string;
  platform: string;
  event_type: string;
  post_type: string;
  language: string;
  tone: string;
  organization: string;
  is_preferred: number;
  tags: string;
  created_at: string;
  updated_at: string;
}

/** A generated caption */
export interface GeneratedCaption {
  id: number;
  session_id: string;
  platform: Platform;
  caption_text: string;
  version: number;
  is_current: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

/** Raw generated caption row from SQLite */
export interface GeneratedCaptionRow {
  id: number;
  session_id: string;
  platform: string;
  caption_text: string;
  version: number;
  is_current: number;
  metadata: string;
  created_at: string;
}

/** A user session */
export interface Session {
  id: string;
  event_data: EventData;
  extracted_poster_data: EventData | null;
  style_profile: StyleProfile | null;
  created_at: string;
}

/** Raw session row from SQLite */
export interface SessionRow {
  id: string;
  event_data: string;
  extracted_poster_data: string | null;
  style_profile: string | null;
  created_at: string;
}

/** A chat message in a refinement conversation */
export interface ChatMessage {
  id: number;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

/** Style profile extracted from reference captions */
export interface StyleProfile {
  avgCaptionLength: Record<string, number>;
  commonOpeningHooks: string[];
  emojiFrequency: number;
  commonEmojis: string[];
  tamilEnglishMixRatio: number;
  commonCTAs: string[];
  hashtagConventions: {
    avgCount: number;
    commonHashtags: string[];
  };
  paragraphSpacing: string;
  commonPhrases: string[];
  toneCharacteristics: string[];
}

// ============================================================
// API Request & Response Types
// ============================================================

/** POST /api/captions/generate request body */
export interface GenerateCaptionsRequest {
  eventData: EventData;
  platforms: Platform[];
  postType: PostType;
  tone: Tone;
  language: Language;
  length: CaptionLength;
  sessionId?: string;
}

/** POST /api/captions/generate response body */
export interface GenerateCaptionsResponse {
  sessionId: string;
  captions: {
    platform: Platform;
    caption_text: string;
    id: number;
    version: number;
  }[];
}

/** POST /api/captions/refine request body */
export interface RefineCaptionRequest {
  sessionId: string;
  platform: Platform;
  instruction: string;
  currentCaption: string;
}

/** POST /api/captions/refine response body */
export interface RefineCaptionResponse {
  caption: {
    platform: Platform;
    caption_text: string;
    id: number;
    version: number;
  };
  chatMessages: ChatMessage[];
}

/** POST /api/poster/analyze response body */
export interface AnalyzePosterResponse {
  eventData: EventData;
  confidence: Record<string, 'high' | 'medium' | 'low'>;
}

/** POST /api/references/import request body (when using JSON body) */
export interface ImportReferencesRequest {
  captions: Array<{
    caption_text: string;
    platform?: string;
    event_type?: string;
    post_type?: string;
    language?: string;
    tone?: string;
    organization?: string;
    tags?: string[];
  }>;
}

/** POST /api/references/import response body */
export interface ImportReferencesResponse {
  summary: {
    total: number;
    added: number;
    skipped: number;
    errors: number;
  };
  details: Array<{
    index: number;
    status: 'added' | 'skipped' | 'error';
    reason?: string;
  }>;
}

/** GET /api/references query parameters */
export interface ReferencesQueryParams {
  platform?: Platform;
  post_type?: PostType;
  search?: string;
  page?: number;
  limit?: number;
}

/** GET /api/references response body */
export interface ReferencesListResponse {
  references: ReferenceCaption[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/** GET /api/references/stats response body */
export interface ReferencesStatsResponse {
  total: number;
  byPlatform: Record<string, number>;
  byPostType: Record<string, number>;
  byTone: Record<string, number>;
  preferred: number;
}

/** Validation result for a caption */
export interface ValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
  characterCount: number;
  platformLimit: number;
}

/** Retrieval query for finding relevant references */
export interface RetrievalQuery {
  platform?: Platform;
  postType?: PostType;
  eventType?: string;
  tone?: Tone;
  language?: Language;
  keywords?: string[];
}

/** Scored reference for retrieval ranking */
export interface ScoredReference {
  reference: ReferenceCaption;
  score: number;
}
