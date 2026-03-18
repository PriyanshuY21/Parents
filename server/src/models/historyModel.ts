import { HistoryEntry, ReportStatus } from '../types/index';

// ── In-memory session history store (Model) ───────────────────────────────────
// HIPAA: stored only for the lifetime of the server process.
// Report content is NEVER stored — only metadata.
const sessionHistory = new Map<string, HistoryEntry[]>();

const VALID_STATUSES: ReportStatus[] = ['normal', 'attention', 'urgent'];
const MAX_ENTRIES = 20;

export const HistoryModel = {
  getByUser(userId: string): HistoryEntry[] {
    if (!sessionHistory.has(userId)) sessionHistory.set(userId, []);
    return sessionHistory.get(userId)!;
  },

  add(userId: string, entry: HistoryEntry): HistoryEntry {
    const history = this.getByUser(userId);
    history.unshift(entry);
    if (history.length > MAX_ENTRIES) history.splice(MAX_ENTRIES);
    return entry;
  },

  remove(userId: string, entryId: string): boolean {
    const history = this.getByUser(userId);
    const idx = history.findIndex((h) => h.id === entryId);
    if (idx === -1) return false;
    history.splice(idx, 1);
    return true;
  },

  clearAll(userId: string): void {
    sessionHistory.set(userId, []);
  },

  buildEntry(fields: {
    title?: string;
    status?: string;
    findingsCount?: number;
    flaggedCount?: number;
  }): HistoryEntry {
    return {
      id: `h_${Date.now()}`,
      timestamp: new Date().toISOString(),
      title: String(fields.title ?? 'Report').slice(0, 80),
      status: VALID_STATUSES.includes(fields.status as ReportStatus)
        ? (fields.status as ReportStatus)
        : 'normal',
      findingsCount: parseInt(String(fields.findingsCount)) || 0,
      flaggedCount: parseInt(String(fields.flaggedCount)) || 0,
    };
  },
};
