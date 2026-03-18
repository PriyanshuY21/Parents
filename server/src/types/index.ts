// ── User types ────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  hash: string;
  createdAt: string;
}

export interface TokenPayload {
  sub: string;
  name: string;
  email: string;
  iat?: number;
  exp?: number;
}

// ── History types ─────────────────────────────────────────────────────────────
export type ReportStatus = 'normal' | 'attention' | 'urgent';

export interface HistoryEntry {
  id: string;
  timestamp: string;
  title: string;
  status: ReportStatus;
  findingsCount: number;
  flaggedCount: number;
}

// ── Analysis types ────────────────────────────────────────────────────────────
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
  disclaimer: string;
}

export interface CompareResult {
  improved: string[];
  declined: string[];
  stable: string[];
  summary: string;
}

export interface AnalyzeReportParams {
  text: string;
  imageBase64: string | null;
  mimeType: string | null;
}

// ── Express augmentation ──────────────────────────────────────────────────────
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}
