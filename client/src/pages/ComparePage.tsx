import React, { useState, ReactNode } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { AlertCircle, GitCompare, TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';
import api from '@/services/api';
import HipaaBanner from '@/components/layout/HipaaBanner';
import { CompareResult } from '@/types';

interface TrendSectionProps {
  title: string;
  items: string[];
  Icon: React.FC<{ className?: string }>;
  badgeVariant: 'success' | 'danger' | 'info';
  iconClass: string;
}

function TrendSection({ title, items, Icon, badgeVariant, iconClass }: TrendSectionProps): ReactNode {
  if (!items?.length) return null;
  return (
    <div className="mb-5">
      <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
        <Icon className={`h-4 w-4 ${iconClass}`} aria-hidden="true" />
        {title}
      </h4>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <Badge key={i} variant={badgeVariant}>{item}</Badge>
        ))}
      </div>
    </div>
  );
}

export default function ComparePage() {
  const [reportA, setReportA] = useState('');
  const [reportB, setReportB] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<CompareResult | null>(null);

  const handleCompare = async () => {
    if (!reportA.trim() || !reportB.trim()) { setError('Please provide both reports.'); return; }
    setError(''); setLoading(true); setResult(null);
    try {
      const { data } = await api.post<CompareResult>('/analyze/compare', {
        reportA: reportA.trim(),
        reportB: reportB.trim(),
      });
      setResult(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <HipaaBanner />

      <div className="flex items-center gap-2.5 mb-1.5">
        <GitCompare className="h-6 w-6 text-[#0D8A6E]" aria-hidden="true" />
        <h1 className="text-2xl font-light">Compare Reports</h1>
      </div>
      <p className="text-muted-foreground text-sm mb-6">
        Paste two lab reports to identify trends over time using Gradient AI analysis.
      </p>

      {error && (
        <Alert variant="destructive" className="mb-4" aria-live="assertive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <button onClick={() => setError('')} className="ml-2 underline text-xs">Dismiss</button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div className="space-y-1.5">
          <Label htmlFor="report-a">Report A — older results</Label>
          <Textarea
            id="report-a"
            placeholder="Paste your earlier lab report here…"
            value={reportA}
            onChange={(e) => setReportA(e.target.value)}
            rows={8}
            className="font-mono text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="report-b">Report B — newer results</Label>
          <Textarea
            id="report-b"
            placeholder="Paste your more recent lab report here…"
            value={reportB}
            onChange={(e) => setReportB(e.target.value)}
            rows={8}
            className="font-mono text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          onClick={handleCompare}
          disabled={loading}
          className="bg-[#0D8A6E] hover:bg-[#0b7a61]"
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Comparing…</>
          ) : (
            <><GitCompare className="h-4 w-4" /> Compare Reports</>
          )}
        </Button>
        <span className="text-xs text-muted-foreground">Powered by Gradient AI</span>
      </div>

      {result && (
        <Card className="mt-6 hl-animate" role="region" aria-label="Comparison results">
          <CardContent className="pt-6">
            <h2 className="text-xl font-light mb-5">Trend Analysis</h2>

            {result.summary && (
              <div className="hl-summary-card">
                <p className="text-[11px] uppercase tracking-widest text-white/40 mb-2">Summary</p>
                <p>{result.summary}</p>
              </div>
            )}

            <TrendSection
              title="Improved"
              items={result.improved}
              Icon={TrendingUp}
              badgeVariant="success"
              iconClass="text-[#0D8A6E]"
            />
            <TrendSection
              title="Declined"
              items={result.declined}
              Icon={TrendingDown}
              badgeVariant="danger"
              iconClass="text-[#9B2020]"
            />
            <TrendSection
              title="Stable"
              items={result.stable}
              Icon={Minus}
              badgeVariant="info"
              iconClass="text-muted-foreground"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
