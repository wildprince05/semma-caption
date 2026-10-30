import { create } from 'zustand';
import type {
  Platform,
  PostType,
  Tone,
  Language,
  CaptionLength,
  EventData,
  GeneratedCaption,
  ChatMessage,
  ReferenceStats,
  ViewType,
} from '../types';
import { api } from '../services/api';
import toast from 'react-hot-toast';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const defaultEventData: EventData = {
  name: '',
  description: '',
  date: '',
  time: '',
  venue: '',
  registrationLink: '',
  organizer: '',
  highlights: '',
  cta: '',
  postType: 'event_announcement',
  referenceCaption: '',
};

interface AppState {
  // Navigation
  currentView: ViewType;

  // Session
  sessionId: string | null;

  // Event Data
  eventData: EventData;

  // Generation Settings
  selectedPlatforms: Platform[];
  tone: Tone;
  language: Language;
  length: CaptionLength;
  postType: PostType;

  // Generated Captions (platform -> version history)
  generatedCaptions: Record<string, GeneratedCaption[]>;
  currentCaptions: Record<string, string>;

  // Chat
  chatMessages: ChatMessage[];

  // UI state
  activePlatformTab: Platform;
  isGenerating: boolean;
  isRefining: boolean;
  isAnalyzing: boolean;

  // Poster
  posterFile: File | null;
  posterPreview: string | null;
  extractedPosterData: Record<string, unknown> | null;

  // Reference Library
  referenceStats: ReferenceStats | null;

  // Actions
  setView: (view: ViewType) => void;
  setEventData: (data: Partial<EventData>) => void;
  setSelectedPlatforms: (platforms: Platform[]) => void;
  togglePlatform: (platform: Platform) => void;
  setTone: (tone: Tone) => void;
  setLanguage: (language: Language) => void;
  setLength: (length: CaptionLength) => void;
  setPostType: (postType: PostType) => void;
  setPosterFile: (file: File | null) => void;
  setExtractedPosterData: (data: Record<string, unknown> | null) => void;
  generateCaptions: () => Promise<void>;
  refineCaption: (instruction: string) => Promise<void>;
  analyzePoster: () => Promise<void>;
  addChatMessage: (message: ChatMessage) => void;
  setChatMessages: (messages: ChatMessage[]) => void;
  setActivePlatformTab: (platform: Platform) => void;
  updateCaptionText: (platform: Platform, text: string) => void;
  restoreVersion: (platform: Platform, version: number) => void;
  newSession: () => void;
  loadReferenceStats: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  currentView: 'home',
  sessionId: null,
  eventData: { ...defaultEventData },
  selectedPlatforms: ['instagram'],
  tone: 'energetic',
  language: 'tanglish',
  length: 'medium',
  postType: 'event_announcement',
  generatedCaptions: {},
  currentCaptions: {},
  chatMessages: [],
  activePlatformTab: 'instagram',
  isGenerating: false,
  isRefining: false,
  isAnalyzing: false,
  posterFile: null,
  posterPreview: null,
  extractedPosterData: null,
  referenceStats: null,

  // Actions
  setView: (view) => set({ currentView: view }),

  setEventData: (data) =>
    set((state) => ({
      eventData: { ...state.eventData, ...data },
    })),

  setSelectedPlatforms: (platforms) => set({ selectedPlatforms: platforms }),

  togglePlatform: (platform) =>
    set((state) => {
      const platforms = state.selectedPlatforms.includes(platform)
        ? state.selectedPlatforms.filter((p) => p !== platform)
        : [...state.selectedPlatforms, platform];

      const activePlatformTab =
        platforms.length > 0
          ? platforms.includes(state.activePlatformTab)
            ? state.activePlatformTab
            : platforms[0]
          : state.activePlatformTab;

      return { selectedPlatforms: platforms, activePlatformTab };
    }),

  setTone: (tone) => set({ tone }),
  setLanguage: (language) => set({ language }),
  setLength: (length) => set({ length }),
  setPostType: (postType) =>
    set((state) => ({
      postType,
      eventData: { ...state.eventData, postType },
    })),

  setPosterFile: (file) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        set({ posterFile: file, posterPreview: reader.result as string });
      };
      reader.readAsDataURL(file);
    } else {
      set({
        posterFile: null,
        posterPreview: null,
        extractedPosterData: null,
      });
    }
  },

  setExtractedPosterData: (data) => set({ extractedPosterData: data }),

  generateCaptions: async () => {
    const state = get();

    if (state.selectedPlatforms.length === 0) {
      toast.error('Select at least one platform');
      return;
    }

    if (!state.eventData.name.trim()) {
      toast.error('Enter an event name');
      return;
    }

    set({ isGenerating: true });

    try {
      const response = await api.generateCaptions({
        eventData: state.eventData,
        platforms: state.selectedPlatforms,
        tone: state.tone,
        language: state.language,
        length: state.length,
        posterData: state.extractedPosterData,
      });

      const newGeneratedCaptions: Record<string, GeneratedCaption[]> = {
        ...state.generatedCaptions,
      };
      const newCurrentCaptions: Record<string, string> = {
        ...state.currentCaptions,
      };

      // Server returns captions as an array: [{ platform, caption_text, id, version, validation }]
      // Also handle object shape { [platform]: caption } safely
      const rawCaptions = response.captions;
      const captionList: Array<{ platform: Platform; caption_text: string; id?: string | number; version?: number }> =
        Array.isArray(rawCaptions)
          ? rawCaptions
          : Object.entries(rawCaptions || {}).map(([plat, val]) => ({
              ...val,
              platform: (val.platform || plat) as Platform,
            }));

      for (const item of captionList) {
        const platform = item.platform as Platform;
        const captionObj: GeneratedCaption = {
          id: String(item.id || generateId()),
          platform,
          caption_text: item.caption_text,
          version: item.version || 1,
          is_current: true,
          metadata: {
            tone: state.tone,
            language: state.language,
            length: state.length,
            postType: state.postType,
            characterCount: item.caption_text.length,
          },
        };

        const existingVersions = newGeneratedCaptions[platform] || [];
        const newVersion =
          item.version ??
          (existingVersions.length > 0
            ? Math.max(...existingVersions.map((c) => c.version)) + 1
            : 1);

        captionObj.version = newVersion;

        // Mark previous versions as inactive
        const updatedVersions = existingVersions.map((c) => ({
          ...c,
          is_current: false,
        }));

        newGeneratedCaptions[platform] = [...updatedVersions, captionObj];
        newCurrentCaptions[platform] = captionObj.caption_text;
      }

      set({
        generatedCaptions: newGeneratedCaptions,
        currentCaptions: newCurrentCaptions,
        sessionId: response.sessionId || state.sessionId || generateId(),
        activePlatformTab: state.selectedPlatforms[0],
        currentView: 'workspace',
      });

      toast.success('Captions generated! 🔥');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to generate captions';
      toast.error(message);
    } finally {
      set({ isGenerating: false });
    }
  },

  refineCaption: async (instruction) => {
    const state = get();
    const platform = state.activePlatformTab;
    const currentCaption = state.currentCaptions[platform];

    if (!currentCaption) {
      toast.error('No caption to refine');
      return;
    }

    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: instruction,
      created_at: new Date().toISOString(),
    };

    set((s) => ({
      chatMessages: [...s.chatMessages, userMessage],
      isRefining: true,
    }));

    try {
      const currentVersions = state.generatedCaptions[platform] || [];
      const currentCaptionObj = currentVersions.find((c) => c.is_current);

      const response = await api.refineCaption({
        sessionId: state.sessionId || undefined,
        captionId: currentCaptionObj?.id || generateId(),
        platform,
        currentCaption,
        instruction,
        chatHistory: [...state.chatMessages, userMessage],
        eventContext: {
          name: state.eventData.name,
          description: state.eventData.description,
          postType: state.eventData.postType,
        },
      });

      const refinedText = response.caption?.caption_text || response.message || '';
      const newVersion =
        response.caption?.version ??
        (currentVersions.length > 0
          ? Math.max(...currentVersions.map((c) => c.version)) + 1
          : 1);

      const refinedCaption: GeneratedCaption = {
        id: String(response.caption?.id || generateId()),
        platform,
        caption_text: refinedText,
        version: newVersion,
        is_current: true,
        metadata: {
          tone: state.tone,
          language: state.language,
          length: state.length,
          postType: state.postType,
          characterCount: refinedText.length,
        },
      };

      const updatedVersions = currentVersions.map((c) => ({
        ...c,
        is_current: false,
      }));

      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content:
          response.message || "Here's the refined caption! Check it out above.",
        created_at: new Date().toISOString(),
      };

      set((s) => ({
        generatedCaptions: {
          ...s.generatedCaptions,
          [platform]: [...updatedVersions, refinedCaption],
        },
        currentCaptions: {
          ...s.currentCaptions,
          [platform]: refinedCaption.caption_text,
        },
        chatMessages: [...s.chatMessages, assistantMessage],
      }));

      toast.success('Caption refined! ✨');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to refine caption';

      const errorMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: `Sorry, I couldn't refine that. ${message}`,
        created_at: new Date().toISOString(),
      };

      set((s) => ({
        chatMessages: [...s.chatMessages, errorMessage],
      }));

      toast.error(message);
    } finally {
      set({ isRefining: false });
    }
  },

  analyzePoster: async () => {
    const state = get();
    if (!state.posterFile) {
      toast.error('Upload a poster first');
      return;
    }

    set({ isAnalyzing: true });

    try {
      const response = await api.analyzePoster(state.posterFile);

      set({ extractedPosterData: response.extractedData });

      // Auto-fill event data from poster
      const extracted = response.extractedData as Record<string, string>;
      const updates: Partial<EventData> = {};

      if (extracted.name) updates.name = extracted.name;
      if (extracted.description) updates.description = extracted.description;
      if (extracted.date) updates.date = extracted.date;
      if (extracted.time) updates.time = extracted.time;
      if (extracted.venue) updates.venue = extracted.venue;
      if (extracted.organizer) updates.organizer = extracted.organizer;
      if (extracted.registrationLink)
        updates.registrationLink = extracted.registrationLink;

      if (Object.keys(updates).length > 0) {
        set((s) => ({
          eventData: { ...s.eventData, ...updates },
        }));
      }

      const confStr =
        typeof response.confidence === 'number'
          ? `${Math.round(response.confidence * 100)}%`
          : 'High';

      toast.success(
        `Poster analyzed! (${confStr})`
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to analyze poster';
      toast.error(message);
    } finally {
      set({ isAnalyzing: false });
    }
  },

  addChatMessage: (message) =>
    set((state) => ({
      chatMessages: [...state.chatMessages, message],
    })),

  setChatMessages: (messages) => set({ chatMessages: messages }),

  setActivePlatformTab: (platform) => set({ activePlatformTab: platform }),

  updateCaptionText: (platform, text) =>
    set((state) => ({
      currentCaptions: {
        ...state.currentCaptions,
        [platform]: text,
      },
    })),

  restoreVersion: (platform, version) =>
    set((state) => {
      const versions = state.generatedCaptions[platform] || [];
      const targetVersion = versions.find((c) => c.version === version);

      if (!targetVersion) return state;

      const updatedVersions = versions.map((c) => ({
        ...c,
        is_current: c.version === version,
      }));

      return {
        generatedCaptions: {
          ...state.generatedCaptions,
          [platform]: updatedVersions,
        },
        currentCaptions: {
          ...state.currentCaptions,
          [platform]: targetVersion.caption_text,
        },
      };
    }),

  newSession: () =>
    set({
      sessionId: null,
      eventData: { ...defaultEventData },
      generatedCaptions: {},
      currentCaptions: {},
      chatMessages: [],
      posterFile: null,
      posterPreview: null,
      extractedPosterData: null,
      activePlatformTab: 'instagram',
      selectedPlatforms: ['instagram'],
      tone: 'energetic',
      language: 'tanglish',
      length: 'medium',
      postType: 'event_announcement',
    }),

  loadReferenceStats: async () => {
    try {
      const stats = await api.getReferenceStats();
      set({ referenceStats: stats });
    } catch (error) {
      console.error('Failed to load reference stats:', error);
    }
  },
}));
