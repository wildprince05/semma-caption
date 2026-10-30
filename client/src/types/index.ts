export type Platform = 'instagram' | 'whatsapp' | 'linkedin';

export type PostType =
  | 'event_announcement'
  | 'event_reminder'
  | 'registration_open'
  | 'speaker_spotlight'
  | 'sponsor_shoutout'
  | 'countdown'
  | 'behind_the_scenes'
  | 'recap'
  | 'testimonial'
  | 'workshop'
  | 'hackathon'
  | 'competition'
  | 'cultural_event'
  | 'sports_event'
  | 'fest_launch'
  | 'results_announcement'
  | 'achievement'
  | 'collaboration'
  | 'general_update'
  | 'throwback'
  | 'teaser';

export type Tone =
  | 'energetic'
  | 'casual'
  | 'professional'
  | 'urgent'
  | 'humorous'
  | 'warm'
  | 'inspirational'
  | 'celebratory';

export type Language = 'tanglish' | 'english' | 'tamil' | 'custom';

export type CaptionLength = 'short' | 'medium' | 'long';

export interface EventData {
  name: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  registrationLink: string;
  organizer: string;
  highlights: string;
  cta: string;
  postType: PostType;
  referenceCaption: string;
}

export interface ReferenceCaption {
  id: string;
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
}

export interface GeneratedCaption {
  id: string;
  platform: Platform;
  caption_text: string;
  version: number;
  is_current: boolean;
  metadata: {
    tone: Tone;
    language: Language;
    length: CaptionLength;
    postType: PostType;
    hashtags?: string[];
    characterCount?: number;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface Session {
  id: string;
  eventData: EventData;
  extractedPosterData: Record<string, unknown> | null;
  captions: Map<Platform, GeneratedCaption[]>;
  chatMessages: ChatMessage[];
}

export interface ReferenceStats {
  total: number;
  byPlatform: Record<string, number>;
  byPostType: Record<string, number>;
  byTone: Record<string, number>;
  preferred: number;
}

export type ViewType = 'home' | 'workspace' | 'library';

export const POST_TYPE_LABELS: Record<PostType, string> = {
  event_announcement: 'Event Announcement',
  event_reminder: 'Event Reminder',
  registration_open: 'Registration Open',
  speaker_spotlight: 'Speaker Spotlight',
  sponsor_shoutout: 'Sponsor Shoutout',
  countdown: 'Countdown',
  behind_the_scenes: 'Behind the Scenes',
  recap: 'Recap',
  testimonial: 'Testimonial',
  workshop: 'Workshop',
  hackathon: 'Hackathon',
  competition: 'Competition',
  cultural_event: 'Cultural Event',
  sports_event: 'Sports Event',
  fest_launch: 'Fest Launch',
  results_announcement: 'Results Announcement',
  achievement: 'Achievement',
  collaboration: 'Collaboration',
  general_update: 'General Update',
  throwback: 'Throwback',
  teaser: 'Teaser',
};

export const TONE_LABELS: Record<Tone, string> = {
  energetic: 'Energetic ⚡',
  casual: 'Casual 😎',
  professional: 'Professional 💼',
  urgent: 'Urgent 🚨',
  humorous: 'Humorous 😂',
  warm: 'Warm 🤗',
  inspirational: 'Inspirational ✨',
  celebratory: 'Celebratory 🎉',
};

export const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  linkedin: 'LinkedIn',
};

export const PLATFORM_LIMITS: Record<Platform, number> = {
  instagram: 2200,
  whatsapp: 65536,
  linkedin: 3000,
};
