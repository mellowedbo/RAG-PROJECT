'use client';

import { motion } from 'framer-motion';
import {
  Shield, BarChart3, AlertTriangle, Scan, Loader2,
  FileCheck, Scale,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell,
} from 'recharts';
import type { ChunkInfo, ComplianceFinding } from '@/types';

// Constants

const SEVERITY_CONFIG: Record<string, { color: string; text: string; border: string; bg: string; label: string }> = {
  critical: { color: 'bg-red-500', text: 'text-red-600', border: 'border-red-500/30', bg: 'bg-red-500/5', label: 'CRITICAL' },
  high: { color: 'bg-orange-500', text: 'text-orange-600', border: 'border-orange-500/30', bg: 'bg-orange-500/5', label: 'HIGH' },
  medium: { color: 'bg-yellow-500', text: 'text-yellow-600', border: 'border-yellow-500/30', bg: 'bg-yellow-500/5', label: 'MEDIUM' },
  low: { color: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-500/30', bg: 'bg-blue-500/5', label: 'LOW' },
};

// Compliance View

interface ComplianceStats {
  totalFindings: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

interface ComplianceViewProps {
  chunks: ChunkInfo[];
  findings: ComplianceFinding[];
  isScanning: boolean;
  stats: ComplianceStats | null;
  summary: string | null;
  categories: string[];
  filterSeverity: string;
  setFilterSeverity: (severity: string) => void;
  onRunScan: () => void;
}

export default function ComplianceView({
  chunks,
  findings,
  isScanning,
  stats,
  summary,
  categories,
  filterSeverity,
  setFilterSeverity,
  onRunScan,
}: ComplianceViewProps) {
  const filteredFindings = filterSeverity === 'all' ? findings : findings.filter(f => f.severity === filterSeverity);
  const severityCounts = stats ? [
    { severity: 'critical', count: stats.critical, color: '#ef4444' },
    { severity: 'high', count: stats.high, color: '#f97316' },
    { severity: 'medium', count: stats.medium, color: '#eab308' },
    { severity: 'low', count: stats.low, color: '#3b82f6' },
  ].filter(s => s.count > 0) : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-600" />Regulatory Compliance Scanner
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Scans for regulatory compliance issues, risk disclosures, and control deficiencies</p>
            </div>
            <Button onClick={onRunScan} disabled={isScanning || chunks.length === 0} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
              {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scan className="w-4 h-4" />}
              {isScanning ? 'Scanning...' : 'Run Compliance Scan'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {isScanning && (
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
              <p className="text-sm font-medium">Scanning {chunks.length} chunks for compliance issues...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {stats && !isScanning && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card><CardContent className="p-3 text-center"><div className="text-2xl font-bold">{stats.totalFindings}</div><div className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Findings</div></CardContent></Card>
            {severityCounts.map(s => (
              <Card key={s.severity}><CardContent className="p-3 text-center"><div className="text-2xl font-bold" style={{ color: s.color }}>{s.count}</div><div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: s.color }}>{s.severity}</div></CardContent></Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-1">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4 text-emerald-600" />Severity Distribution</CardTitle></CardHeader>
              <CardContent>
                {severityCounts.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={severityCounts} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis type="number" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                      <YAxis dataKey="severity" type="category" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" width={60} />
                      <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {severityCounts.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (<div className="flex items-center justify-center h-[180px] text-sm text-muted-foreground">No findings</div>)}
                {categories.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Categories</div>
                    <div className="flex flex-wrap gap-1">{categories.map(cat => (<Badge key={cat} variant="secondary" className="text-[10px]">{cat}</Badge>))}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-emerald-600" />Findings<Badge variant="secondary" className="text-[10px]">{filteredFindings.length}</Badge></CardTitle>
                  <div className="flex items-center gap-1">
                    {['all', 'critical', 'high', 'medium', 'low'].map(sev => (
                      <button key={sev} onClick={() => setFilterSeverity(sev)} className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors capitalize ${filterSeverity === sev ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600' : 'border-border text-muted-foreground hover:border-emerald-500/30'}`}>{sev}</button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredFindings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">No findings to display</div>
                ) : (
                  <ScrollArea className="max-h-[500px]">
                    <div className="space-y-2 pr-2">
                      {filteredFindings.map((finding, i) => {
                        const config = SEVERITY_CONFIG[finding.severity];
                        return (
                          <motion.div key={`${finding.chunkIndex}-${i}`} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className={`p-3 rounded-lg border ${config.border} ${config.bg}`}>
                            <div className="flex items-center gap-2 mb-1.5">
                              <Badge variant="outline" className={`text-[9px] h-5 ${config.text} border-current`}>{config.label}</Badge>
                              <Badge variant="secondary" className="text-[9px] h-5">{finding.category}</Badge>
                              <span className="text-[10px] text-muted-foreground ml-auto">{finding.reference}</span>
                            </div>
                            <p className="text-xs font-medium mb-1">{finding.description}</p>
                            <p className="text-[11px] text-muted-foreground italic">&ldquo;{finding.excerpt.slice(0, 150)}{finding.excerpt.length > 150 ? '...' : ''}&rdquo;</p>
                          </motion.div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>

          {summary && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileCheck className="w-4 h-4 text-emerald-600" />Scan Summary</CardTitle></CardHeader>
              <CardContent><p className="text-sm whitespace-pre-wrap leading-relaxed">{summary}</p></CardContent>
            </Card>
          )}
        </>
      )}

      {!stats && !isScanning && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <Shield className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">{chunks.length === 0 ? 'Upload documents first to run compliance scans' : 'Click "Run Compliance Scan" to analyze documents'}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
