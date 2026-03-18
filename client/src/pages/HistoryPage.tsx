import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { AlertCircle, Trash2, History, Microscope, Search } from 'lucide-react';
import api from '@/services/api';
import { HistoryEntry, ReportStatus } from '@/types';

const STATUS_BADGE: Record<ReportStatus, { variant: 'success' | 'warning' | 'danger'; label: string }> = {
  normal:    { variant: 'success', label: 'Normal' },
  attention: { variant: 'warning', label: 'Attention' },
  urgent:    { variant: 'danger',  label: 'Urgent' },
};

export default function HistoryPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<{ history: HistoryEntry[] }>('/history');
      setRows(data.history ?? []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const deleteEntry = async (id: string) => {
    try {
      await api.delete(`/history/${id}`);
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (err) { setError((err as Error).message); }
  };

  const clearAll = async () => {
    try {
      await api.delete('/history');
      setRows([]);
    } catch (err) { setError((err as Error).message); }
  };

  const filtered = rows.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center gap-2.5 mb-1.5">
        <History className="h-6 w-6 text-[#0D8A6E]" aria-hidden="true" />
        <h1 className="text-2xl font-light">Report History</h1>
      </div>
      <p className="text-muted-foreground text-sm mb-6">
        Session metadata only — no report content is stored anywhere.
      </p>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <button onClick={() => setError('')} className="ml-2 underline text-xs">Dismiss</button>
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <Card>
          <CardContent className="pt-6 space-y-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </CardContent>
        </Card>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center text-center">
            <Microscope className="h-12 w-12 text-muted-foreground/40 mb-4" aria-hidden="true" />
            <p className="text-muted-foreground mb-4">No reports analyzed in this session.</p>
            <Button variant="outline" size="sm" onClick={() => navigate('/analyze')}>
              Analyze a report
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            {/* Toolbar */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reports…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                  aria-label="Search report history"
                />
              </div>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={clearAll}>
                <Trash2 className="h-4 w-4 mr-1.5" /> Clear session
              </Button>
            </div>

            {/* Table */}
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-sm" aria-label="Report history">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Report</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date & time</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Findings</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Flagged</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((row) => {
                    const s = STATUS_BADGE[row.status] ?? { variant: 'info' as const, label: row.status };
                    return (
                      <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium truncate max-w-[200px]">{row.title}</td>
                        <td className="px-4 py-3 text-muted-foreground">{new Date(row.timestamp).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <Badge variant={s.variant}>{s.label}</Badge>
                        </td>
                        <td className="px-4 py-3">{row.findingsCount}</td>
                        <td className="px-4 py-3">{row.flaggedCount}</td>
                        <td className="px-4 py-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteEntry(row.id)}
                            aria-label={`Delete report ${row.title}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        No results match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
