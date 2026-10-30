import type {
  Platform,
  PostType,
  Tone,
  Language,
  CaptionLength,
  GeneratedCaption,
  ReferenceCaption,
  ReferenceStats,
  ChatMessage,
} from '../types';

const API_BASE = '/api';

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      errorBody.error || errorBody.message || `Request failed with status ${response.status}`
    );
  }

  const data = await response.json();
  return data as T;
}

export interface GenerateCaptionsParams {
  eventData: {
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
  };
  platforms: Platform[];
  tone: Tone;
  language: Language;
  length: CaptionLength;
  posterData?: Record<string, unknown> | null;
}

export interface RefineCaptionParams {
  sessionId?: string;
  captionId?: string;
  platform: Platform;
  currentCaption: string;
  instruction: string;
  chatHistory: ChatMessage[];
  eventContext?: {
    name: string;
    description: string;
    postType: PostType;
  };
}

export interface ServerCaptionItem {
  platform: Platform;
  caption_text: string;
  id: number | string;
  version: number;
  validation?: unknown;
}

export interface GenerateCaptionsResponse {
  sessionId: string;
  captions: ServerCaptionItem[] | Record<string, ServerCaptionItem>;
}

export interface RefineCaptionResponse {
  caption: ServerCaptionItem;
  message: string;
  chatMessages?: ChatMessage[];
}

export interface AnalyzePosterResponse {
  extractedData: Record<string, unknown>;
  confidence: Record<string, string> | number;
}

export interface ImportReferencesResponse {
  imported: number;
  duplicates: number;
  errors: string[];
}

export interface GetReferencesParams {
  platform?: Platform;
  postType?: PostType;
  tone?: Tone;
  search?: string;
  page?: number;
  limit?: number;
}

export interface GetReferencesResponse {
  references: ReferenceCaption[];
  total: number;
  page: number;
  totalPages: number;
}

export const api = {
  async generateCaptions(
    params: GenerateCaptionsParams
  ): Promise<GenerateCaptionsResponse> {
    return request<GenerateCaptionsResponse>('/captions/generate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async refineCaption(
    params: RefineCaptionParams
  ): Promise<RefineCaptionResponse> {
    return request<RefineCaptionResponse>('/captions/refine', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async analyzePoster(file: File): Promise<AnalyzePosterResponse> {
    const formData = new FormData();
    formData.append('poster', file);

    const response = await fetch(`${API_BASE}/poster/analyze`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(
        errorBody.error || errorBody.message || `Poster analysis failed with status ${response.status}`
      );
    }

    return response.json();
  },

  async importReferences(
    data: { captions: Partial<ReferenceCaption>[] } | File
  ): Promise<ImportReferencesResponse> {
    if (data instanceof File) {
      const formData = new FormData();
      formData.append('file', data);

      const response = await fetch(`${API_BASE}/references/import`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(
          errorBody.error || errorBody.message || `Import failed with status ${response.status}`
        );
      }

      return response.json();
    }

    return request<ImportReferencesResponse>('/references/import', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getReferences(
    filters: GetReferencesParams = {}
  ): Promise<GetReferencesResponse> {
    const params = new URLSearchParams();
    if (filters.platform) params.set('platform', filters.platform);
    if (filters.postType) params.set('post_type', filters.postType);
    if (filters.tone) params.set('tone', filters.tone);
    if (filters.search) params.set('search', filters.search);
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));

    const query = params.toString();
    return request<GetReferencesResponse>(
      `/references${query ? `?${query}` : ''}`
    );
  },

  async getReferenceStats(): Promise<ReferenceStats> {
    return request<ReferenceStats>('/references/stats');
  },

  async updateReference(
    id: string,
    data: Partial<ReferenceCaption>
  ): Promise<ReferenceCaption> {
    return request<ReferenceCaption>(`/references/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteReference(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/references/${id}`, {
      method: 'DELETE',
    });
  },

  async healthCheck(): Promise<unknown> {
    return request<unknown>('/health');
  },
};

export default api;
