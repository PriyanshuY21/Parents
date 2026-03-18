import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { AlertCircle, Microscope, Loader2, X, Upload } from 'lucide-react';
import api from '@/services/api';
import HipaaBanner from '@/components/layout/HipaaBanner';
import ReportResults from '@/components/report/ReportResults';
import { AnalysisResult } from '@/types';

interface SampleEntry { label: string; text: string; }

const SAMPLES: Record<string, SampleEntry> = {
  cbc: {
    label: 'Blood count (CBC)',
    text: `WBC: 11.8 K/uL [Ref: 4.5–11.0] HIGH\nRBC: 3.9 M/uL [Ref: 4.5–5.5] LOW\nHemoglobin: 10.4 g/dL [Ref: 13.5–17.5] LOW\nHematocrit: 31% [Ref: 41–53%] LOW\nMCV: 72 fL [Ref: 80–100] LOW\nPlatelets: 420 K/uL [Ref: 150–400] HIGH`,
  },
  lipid: {
    label: 'Lipid panel',
    text: `Total Cholesterol: 248 mg/dL [Desirable <200] HIGH\nHDL: 36 mg/dL [Optimal >60] LOW\nLDL: 172 mg/dL [Optimal <100] HIGH\nTriglycerides: 210 mg/dL [Normal <150] HIGH`,
  },
  thyroid: {
    label: 'Thyroid panel',
    text: `TSH: 7.2 mIU/L [Ref: 0.4–4.0] HIGH\nFree T4: 0.68 ng/dL [Ref: 0.8–1.8] LOW\nTPO Antibodies: 182 IU/mL [Normal <35] HIGH`,
  },
  diabetes: {
    label: 'Diabetes screen',
    text: `Fasting Glucose: 128 mg/dL [Normal <100] HIGH\nHbA1c: 6.9% [Normal <5.7%] HIGH\nFasting Insulin: 24 mIU/L [Ref: 2–20] HIGH\neGFR: 74 mL/min [Ref: ≥90] LOW`,
  },
  symptoms: {
    label: 'Symptoms',
    text: `Persistent fatigue (6 weeks), hair thinning, always cold, slow heart rate (~52 bpm), weight gain 9 lbs without diet change, brain fog, dry skin, constipation.`,
  },
};

export default function AnalyzePage() {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async () => {
    if (!text.trim() && !file) { setError('Please paste report text or upload an image.'); return; }
    setError(''); setLoading(true); setResult(null);
    try {
      const formData = new FormData();
      if (text.trim()) formData.append('text', text.trim());
      if (file) formData.append('file', file);
      const { data } = await api.post<AnalysisResult>('/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data);
      try {
        const flagged = (data.findings ?? []).filter((f) => f.flag !== 'ok' && f.flag !== 'info').length;
        await api.post('/history', {
          title: file ? file.name.replace(/\.[^.]+$/, '') : text.slice(0, 50) + '…',
          status: data.overall_status ?? 'normal',
          findingsCount: data.findings?.length ?? 0,
          flaggedCount: flagged,
        });
      } catch { /* History save failure is non-critical */ }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => { setResult(null); setError(''); setText(''); setFile(null); };

  if (result) {
    return <div><HipaaBanner /><ReportResults result={result} onNewReport={handleReset} /></div>;
  }

  return (
    <div>
      <HipaaBanner />

      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-1.5">
          <Microscope className="h-6 w-6 text-[#0D8A6E]" aria-hidden="true" />
          <h1 className="text-2xl font-light">Analyze a Report</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Paste your lab results or upload an image. Get a plain-English breakdown powered by Gradient AI.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4" aria-live="assertive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <button onClick={() => setError('')} className="ml-2 underline text-xs">Dismiss</button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="pt-6">
              <Tabs defaultValue="text">
                <TabsList className="mb-4">
                  <TabsTrigger value="text">Paste text</TabsTrigger>
                  <TabsTrigger value="upload">Upload image</TabsTrigger>
                </TabsList>

                <TabsContent value="text">
                  <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    <span className="text-xs text-muted-foreground">Try a sample:</span>
                    {Object.entries(SAMPLES).map(([k, s]) => (
                      <button
                        key={k}
                        onClick={() => setText(s.text)}
                        className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium hover:bg-accent transition-colors cursor-pointer"
                        aria-label={`Load ${s.label} sample`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                  <Label htmlFor="report-text" className="mb-1.5 block">Lab report or symptom description</Label>
                  <Textarea
                    id="report-text"
                    placeholder={`Paste your lab results here, e.g.:\n\nHemoglobin: 10.4 g/dL [Ref: 13.5–17.5] LOW\nWBC: 11.8 K/uL [Ref: 4.5–11.0] HIGH\n\nOr describe symptoms in plain language.`}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={10}
                    className="font-mono text-sm"
                  />
                </TabsContent>

                <TabsContent value="upload">
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-[#0D8A6E] transition-colors">
                    <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm font-medium mb-1">Upload lab report</p>
                    <p className="text-xs text-muted-foreground mb-4">JPEG, PNG, WebP, or PDF · Max 10 MB</p>
                    <label htmlFor="file-upload">
                      <Button variant="outline" size="sm" asChild>
                        <span>Choose file</span>
                      </Button>
                      <input
                        id="file-upload"
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,.pdf"
                        className="sr-only"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); }}
                      />
                    </label>
                    {file && (
                      <div className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <span><strong>{file.name}</strong> ({(file.size / 1024).toFixed(0)} KB)</span>
                        <button onClick={() => setFile(null)} className="hover:text-destructive" aria-label="Remove file">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="mt-4">
                    <Label htmlFor="upload-context" className="mb-1.5 block">Additional context (optional)</Label>
                    <Textarea
                      id="upload-context"
                      placeholder="Add any notes or context about the report…"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      rows={3}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="mt-5 flex items-center gap-3 flex-wrap">
                <Button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="bg-[#0D8A6E] hover:bg-[#0b7a61]"
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing…</>
                  ) : (
                    <><Microscope className="h-4 w-4" /> Analyze Report</>
                  )}
                </Button>
                {(text || file) && !loading && (
                  <Button variant="ghost" size="sm" onClick={handleReset}>Clear</Button>
                )}
                <span className="text-xs text-muted-foreground ml-auto">Powered by Gradient AI</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="bg-muted/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Tips for best results</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>Include reference ranges (e.g., <code className="text-xs bg-muted px-1 py-0.5 rounded">[Ref: 4.5–11.0]</code>)</li>
                <li>Label values as HIGH or LOW if you know</li>
                <li>Upload original PDFs when possible</li>
                <li>Add symptom context for richer analysis</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
