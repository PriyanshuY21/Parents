import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertTriangle, CheckCircle2, XCircle, Info, Send, Loader2,
  type LucideIcon,
} from 'lucide-react';
import api from '@/services/api';
import { AnalysisResult, Finding, FlagType, RiskLevel, ChatMessage } from '@/types';

// ── Flag metadata ──────────────────────────────────────────────────────────────
interface FlagMeta {
  label: string;
  badgeVariant: 'danger' | 'warning' | 'success' | 'info';
  Icon: LucideIcon;
  color: string;
}

const FLAG_META: Record<FlagType, FlagMeta> = {
  high: { label: 'Above range', badgeVariant: 'danger',  Icon: XCircle,       color: '#9B2020' },
  low:  { label: 'Below range', badgeVariant: 'warning', Icon: AlertTriangle,  color: '#B5620A' },
  ok:   { label: 'Normal',      badgeVariant: 'success', Icon: CheckCircle2,   color: '#0D8A6E' },
  info: { label: 'Note',        badgeVariant: 'info',    Icon: Info,           color: '#525252' },
};

// ── GaugeBar ──────────────────────────────────────────────────────────────────
function GaugeBar({ value, flag }: { value: number; flag: FlagType }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const t = setTimeout(() => {
      if (ref.current) ref.current.style.width = `${value}%`;
    }, 80);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <div
      className="hl-gauge"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Value indicator: ${value}%`}
    >
      <div ref={ref} className={`hl-gauge__fill hl-gauge__fill--${flag}`} />
    </div>
  );
}

// ── FindingCard ───────────────────────────────────────────────────────────────
function FindingCard({ finding, index }: { finding: Finding; index: number }) {
  const meta = FLAG_META[finding.flag] ?? FLAG_META.info;
  const { Icon } = meta;
  return (
    <div
      className={`hl-finding-card hl-finding-card--${finding.flag} hl-animate rounded-lg p-4 border`}
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      <div className="flex justify-between items-start gap-2 mb-1">
        <div className="flex-1">
          <p className="font-medium text-sm">{finding.name}</p>
          <p className="text-xs text-muted-foreground">Ref: {finding.range}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xl font-light leading-tight" style={{ color: meta.color }}>
            {finding.value}
          </p>
          <Badge variant={meta.badgeVariant} className="mt-1 text-[10px] gap-1">
            <Icon className="h-3 w-3" aria-hidden="true" />
            {meta.label}
          </Badge>
        </div>
      </div>
      <GaugeBar value={finding.gauge ?? 50} flag={finding.flag} />
      <p className="text-xs text-muted-foreground leading-relaxed mt-1">{finding.explain}</p>
    </div>
  );
}

// ── RiskRow ───────────────────────────────────────────────────────────────────
function RiskRow({ label, level }: { label: string; level: RiskLevel }) {
  const colors: Record<RiskLevel, string> = { ok: '#0D8A6E', warn: '#B5620A', high: '#9B2020' };
  const count: Record<RiskLevel, number> = { ok: 1, warn: 2, high: 3 };
  return (
    <div className="flex justify-between items-center py-2 border-b border-border last:border-0">
      <span className="text-sm">{label}</span>
      <div className="flex gap-1.5" aria-label={`${label}: ${level}`}>
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="w-2.5 h-2.5 rounded-full transition-colors"
            style={{ background: n <= (count[level] ?? 1) ? colors[level] : '#e0e0e0' }}
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  );
}

// ── ReportResults ─────────────────────────────────────────────────────────────
interface ReportResultsProps {
  result: AnalysisResult;
  onNewReport: () => void;
}

export default function ReportResults({ result, onNewReport }: ReportResultsProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const sendChat = async () => {
    const msg = chatInput.trim();
    if (!msg || chatLoading) return;
    const userMsg: ChatMessage = { role: 'user', content: msg };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);
    try {
      const history = [...chatMessages, userMsg];
      const { data } = await api.post<{ reply: string }>('/analyze/chat', { messages: history });
      setChatMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      const error = err as Error;
      setChatMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${error.message}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    normal: '#0D8A6E', attention: '#B5620A', urgent: '#9B2020',
  };
  const statusLabels: Record<string, string> = {
    normal: 'All Clear', attention: 'Needs Attention', urgent: 'Urgent Review',
  };

  return (
    <div className="hl-animate">
      {/* Header */}
      <div className="flex justify-between items-start mb-5 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-light">Your Health Report</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {result.findings?.length ?? 0} findings ·{' '}
            <span className="font-medium" style={{ color: statusColors[result.overall_status] ?? '#0D8A6E' }}>
              {statusLabels[result.overall_status] ?? 'All Clear'}
            </span>
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onNewReport}>← New report</Button>
      </div>

      {/* Summary dark card */}
      <div className="hl-summary-card" role="region" aria-label="Report summary">
        <p className="text-[11px] uppercase tracking-widest text-white/40 mb-2">Overview</p>
        <p>{result.summary}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Findings + Questions */}
        <div className="lg:col-span-3 space-y-6">
          <div>
            <h3 className="text-base font-medium mb-3">Findings</h3>
            <div
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              role="list"
              aria-label="Lab findings"
            >
              {(result.findings ?? []).map((f, i) => (
                <div role="listitem" key={i}>
                  <FindingCard finding={f} index={i} />
                </div>
              ))}
            </div>
          </div>

          {/* Doctor questions */}
          <Card role="region" aria-label="Questions for your doctor">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Questions to ask your doctor</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ol className="space-y-2">
                {(result.questions ?? []).map((q, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="text-muted-foreground italic flex-shrink-0 w-5">{i + 1}.</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        {/* Right: Risk summary + Chat */}
        <div className="lg:col-span-2 space-y-4">
          {/* Risk summary */}
          <Card role="region" aria-label="Risk summary by system">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">At a glance</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {(result.risk_summary ?? []).map((r, i) => (
                <RiskRow key={i} label={r.label} level={r.level} />
              ))}
            </CardContent>
          </Card>

          {/* Chat */}
          <Card role="region" aria-label="Ask a follow-up question">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Ask a follow-up</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div
                className="min-h-40 max-h-72 overflow-y-auto flex flex-col gap-2.5 mb-3"
                aria-live="polite"
                aria-label="Conversation"
              >
                {chatMessages.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">
                    Ask anything about your results…
                  </p>
                )}
                {chatMessages.map((m, i) => (
                  <div
                    key={i}
                    className={`max-w-[90%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'self-end bg-[#0D1B2A] text-white'
                        : 'self-start bg-muted text-foreground'
                    }`}
                    role="article"
                    aria-label={m.role === 'user' ? 'Your message' : 'Coach response'}
                  >
                    {m.content}
                  </div>
                ))}
                {chatLoading && (
                  <div className="self-start flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="flex gap-2">
                <Input
                  hideLabel
                  placeholder="e.g. What does high LDL mean long-term?"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') sendChat(); }}
                  disabled={chatLoading}
                  className="flex-1"
                  aria-label="Ask a follow-up question"
                />
                <Button
                  size="icon"
                  onClick={sendChat}
                  disabled={chatLoading || !chatInput.trim()}
                  className="bg-[#0D8A6E] hover:bg-[#0b7a61] flex-shrink-0"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {result.disclaimer && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              ⓘ {result.disclaimer}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
