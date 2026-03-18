// ── Auth ──────────────────────────────────────────────────────────────────────
export interface AuthUser {
  id?: string;
  sub?: string;
  name: string;
  email: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (name: string, email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
}

// ── History ───────────────────────────────────────────────────────────────────
export type ReportStatus = 'normal' | 'attention' | 'urgent';

export interface HistoryEntry {
  id: string;
  title: string;
  timestamp: string;
  status: ReportStatus;
  findingsCount: number;
  flaggedCount: number;
}

// ── Analysis ──────────────────────────────────────────────────────────────────
export type FlagType = 'high' | 'low' | 'ok' | 'info';
export type RiskLevel = 'ok' | 'warn' | 'high';

export interface Finding {
  name: string;
  value: string;
  range: string;
  flag: FlagType;
  gauge: number;
  explain: string;
}

export interface RiskSummaryItem {
  label: string;
  level: RiskLevel;
}

export interface AnalysisResult {
  summary: string;
  overall_status: ReportStatus;
  findings: Finding[];
  risk_summary: RiskSummaryItem[];
  questions: string[];
  disclaimer?: string;
  _meta?: {
    hipaa_notice: string;
    powered_by: string;
    model: string;
    timestamp: string;
  };
}

export interface CompareResult {
  improved: string[];
  declined: string[];
  stable: string[];
  summary: string;
}

// ── Chat ──────────────────────────────────────────────────────────────────────
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
