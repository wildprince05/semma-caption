import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type {
  ReferenceCaptionRow,
  SessionRow,
  GeneratedCaptionRow,
  ChatMessage,
} from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = process.env.DATABASE_PATH
  ? path.dirname(process.env.DATABASE_PATH)
  : path.resolve(__dirname, '..', '..', 'data');

// ============================================================
// In-memory store backed by JSON files
// ============================================================

interface Store {
  references: ReferenceCaptionRow[];
  sessions: SessionRow[];
  captions: GeneratedCaptionRow[];
  chatMessages: ChatMessage[];
  /** Auto-increment counters */
  _counters: {
    references: number;
    captions: number;
    chatMessages: number;
  };
}

const FILE_MAP = {
  references: 'references.json',
  sessions: 'sessions.json',
  captions: 'captions.json',
  chatMessages: 'chat-messages.json',
} as const;

let store: Store = {
  references: [],
  sessions: [],
  captions: [],
  chatMessages: [],
  _counters: { references: 0, captions: 0, chatMessages: 0 },
};

// ============================================================
// File I/O helpers
// ============================================================

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function filePath(name: string): string {
  return path.join(DATA_DIR, name);
}

function loadCollection<T>(fileName: string): T[] {
  const fp = filePath(fileName);
  if (fs.existsSync(fp)) {
    try {
      const raw = fs.readFileSync(fp, 'utf-8');
      return JSON.parse(raw) as T[];
    } catch {
      return [];
    }
  }
  return [];
}

function saveCollection<T>(fileName: string, data: T[]): void {
  ensureDataDir();
  fs.writeFileSync(filePath(fileName), JSON.stringify(data, null, 2), 'utf-8');
}

function saveCounters(): void {
  ensureDataDir();
  fs.writeFileSync(
    filePath('_counters.json'),
    JSON.stringify(store._counters, null, 2),
    'utf-8',
  );
}

function loadCounters(): Store['_counters'] {
  const fp = filePath('_counters.json');
  if (fs.existsSync(fp)) {
    try {
      return JSON.parse(fs.readFileSync(fp, 'utf-8'));
    } catch {
      return { references: 0, captions: 0, chatMessages: 0 };
    }
  }
  return { references: 0, captions: 0, chatMessages: 0 };
}

// ============================================================
// Initialization
// ============================================================

export function initializeDatabase(): void {
  ensureDataDir();
  store.references = loadCollection<ReferenceCaptionRow>(FILE_MAP.references);
  store.sessions = loadCollection<SessionRow>(FILE_MAP.sessions);
  store.captions = loadCollection<GeneratedCaptionRow>(FILE_MAP.captions);
  store.chatMessages = loadCollection<ChatMessage>(FILE_MAP.chatMessages);
  store._counters = loadCounters();

  // Reconcile counters with actual data
  const maxRefId = store.references.reduce((m, r) => Math.max(m, r.id), 0);
  const maxCapId = store.captions.reduce((m, c) => Math.max(m, c.id), 0);
  const maxChatId = store.chatMessages.reduce((m, c) => Math.max(m, c.id), 0);
  if (maxRefId > store._counters.references) store._counters.references = maxRefId;
  if (maxCapId > store._counters.captions) store._counters.captions = maxCapId;
  if (maxChatId > store._counters.chatMessages) store._counters.chatMessages = maxChatId;
  saveCounters();
}

export function isDatabaseHealthy(): boolean {
  return true; // in-memory store is always available
}

export function getTableCount(table: string): number {
  switch (table) {
    case 'references_table':
      return store.references.length;
    case 'sessions':
      return store.sessions.length;
    case 'generated_captions':
      return store.captions.length;
    case 'chat_messages':
      return store.chatMessages.length;
    default:
      throw new Error(`Invalid table name: ${table}`);
  }
}

// ============================================================
// References CRUD
// ============================================================

function nowISO(): string {
  return new Date().toISOString();
}

export function insertReference(row: Omit<ReferenceCaptionRow, 'id' | 'created_at' | 'updated_at'>): ReferenceCaptionRow {
  store._counters.references += 1;
  const newRow: ReferenceCaptionRow = {
    ...row,
    id: store._counters.references,
    created_at: nowISO(),
    updated_at: nowISO(),
  };
  store.references.push(newRow);
  saveCollection(FILE_MAP.references, store.references);
  saveCounters();
  return newRow;
}

export function getAllReferences(): ReferenceCaptionRow[] {
  return store.references;
}

export function getReferenceById(id: number): ReferenceCaptionRow | undefined {
  return store.references.find((r) => r.id === id);
}

export function updateReference(id: number, updates: Partial<Omit<ReferenceCaptionRow, 'id' | 'created_at'>>): ReferenceCaptionRow | undefined {
  const idx = store.references.findIndex((r) => r.id === id);
  if (idx === -1) return undefined;
  store.references[idx] = { ...store.references[idx], ...updates, updated_at: nowISO() };
  saveCollection(FILE_MAP.references, store.references);
  return store.references[idx];
}

export function deleteReference(id: number): boolean {
  const idx = store.references.findIndex((r) => r.id === id);
  if (idx === -1) return false;
  store.references.splice(idx, 1);
  saveCollection(FILE_MAP.references, store.references);
  return true;
}

export function findReferenceByCaptionText(text: string): ReferenceCaptionRow | undefined {
  return store.references.find((r) => r.caption_text === text);
}

export function queryReferences(filters: {
  platform?: string;
  post_type?: string;
  search?: string;
  page?: number;
  limit?: number;
}): { rows: ReferenceCaptionRow[]; total: number } {
  let results = [...store.references];

  if (filters.platform) {
    results = results.filter((r) => r.platform === filters.platform);
  }
  if (filters.post_type) {
    results = results.filter((r) => r.post_type === filters.post_type);
  }
  if (filters.search) {
    const term = filters.search.toLowerCase();
    results = results.filter(
      (r) =>
        r.caption_text.toLowerCase().includes(term) ||
        (r.event_type && r.event_type.toLowerCase().includes(term)) ||
        (r.organization && r.organization.toLowerCase().includes(term)),
    );
  }

  const total = results.length;
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const offset = (page - 1) * limit;
  const rows = results.slice(offset, offset + limit);

  return { rows, total };
}

export function getReferenceStats(): {
  total: number;
  byPlatform: Record<string, number>;
  byPostType: Record<string, number>;
  byTone: Record<string, number>;
  preferred: number;
} {
  const byPlatform: Record<string, number> = {};
  const byPostType: Record<string, number> = {};
  const byTone: Record<string, number> = {};
  let preferred = 0;

  for (const r of store.references) {
    const plat = r.platform || 'unknown';
    byPlatform[plat] = (byPlatform[plat] || 0) + 1;

    const pt = r.post_type || 'unknown';
    byPostType[pt] = (byPostType[pt] || 0) + 1;

    const t = r.tone || 'unknown';
    byTone[t] = (byTone[t] || 0) + 1;

    if (r.is_preferred) preferred++;
  }

  return { total: store.references.length, byPlatform, byPostType, byTone, preferred };
}

// ============================================================
// Sessions CRUD
// ============================================================

export function createSession(row: SessionRow): SessionRow {
  store.sessions.push(row);
  saveCollection(FILE_MAP.sessions, store.sessions);
  return row;
}

export function getSession(id: string): SessionRow | undefined {
  return store.sessions.find((s) => s.id === id);
}

export function updateSession(id: string, updates: Partial<Omit<SessionRow, 'id' | 'created_at'>>): SessionRow | undefined {
  const idx = store.sessions.findIndex((s) => s.id === id);
  if (idx === -1) return undefined;
  store.sessions[idx] = { ...store.sessions[idx], ...updates };
  saveCollection(FILE_MAP.sessions, store.sessions);
  return store.sessions[idx];
}

// ============================================================
// Generated Captions CRUD
// ============================================================

export function insertGeneratedCaption(row: Omit<GeneratedCaptionRow, 'id' | 'created_at'>): GeneratedCaptionRow {
  store._counters.captions += 1;
  const newRow: GeneratedCaptionRow = {
    ...row,
    id: store._counters.captions,
    created_at: nowISO(),
  };
  store.captions.push(newRow);
  saveCollection(FILE_MAP.captions, store.captions);
  saveCounters();
  return newRow;
}

export function getCaptionsBySession(sessionId: string): GeneratedCaptionRow[] {
  return store.captions.filter((c) => c.session_id === sessionId);
}

export function getCurrentCaptionForPlatform(sessionId: string, platform: string): GeneratedCaptionRow | undefined {
  return store.captions.find(
    (c) => c.session_id === sessionId && c.platform === platform && c.is_current === 1,
  );
}

export function markOldVersions(sessionId: string, platform: string): void {
  let changed = false;
  for (const c of store.captions) {
    if (c.session_id === sessionId && c.platform === platform && c.is_current === 1) {
      c.is_current = 0;
      changed = true;
    }
  }
  if (changed) {
    saveCollection(FILE_MAP.captions, store.captions);
  }
}

export function getMaxVersion(sessionId: string, platform: string): number {
  let max = 0;
  for (const c of store.captions) {
    if (c.session_id === sessionId && c.platform === platform && c.version > max) {
      max = c.version;
    }
  }
  return max;
}

// ============================================================
// Chat Messages CRUD
// ============================================================

export function insertChatMessage(row: Omit<ChatMessage, 'id' | 'created_at'>): ChatMessage {
  store._counters.chatMessages += 1;
  const newMsg: ChatMessage = {
    ...row,
    id: store._counters.chatMessages,
    created_at: nowISO(),
  };
  store.chatMessages.push(newMsg);
  saveCollection(FILE_MAP.chatMessages, store.chatMessages);
  saveCounters();
  return newMsg;
}

export function getChatMessagesBySession(sessionId: string): ChatMessage[] {
  return store.chatMessages
    .filter((m) => m.session_id === sessionId)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}
