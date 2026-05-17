'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Brain, Search, Sparkles,
  Activity, CheckCircle2, AlertCircle, Database,
  Send, Loader2, BookOpen,
  FileSearch, Zap, Gauge, CircleDot, Key,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ChunkInfo, AgentStep, CitedChunk, QueryMetrics } from '@/types';

interface QueryViewProps {
  chunks: ChunkInfo[];
  apiKey: string;
  isAnalyzing: boolean;
  agentSteps: AgentStep[];
  result: string | null;
  metrics: QueryMetrics | null;
  citedChunks: CitedChunk[];
  error: string | null;
  onRunQuery: (query: string) => void;
  sampleQueries: string[];
}

export default function QueryView({
  chunks,
  apiKey,
  isAnalyzing,
  agentSteps,
  result,
  metrics,
  citedChunks,
  error,
  onRunQuery,
  sampleQueries,
}: QueryViewProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = () => {
    if (query.trim()) {
      onRunQuery(query.trim());
    }
  };

  const handleSampleQuery = (sq: string) => {
    setQuery(sq);
    onRunQuery(sq);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <div className="lg:col-span-3 space-y-4">
        <Card>
          <CardContent className="pt-6 space-y-4">
            {!apiKey && (
              <div className="text-xs text-amber-600 flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-500/20">
                <Key className="w-3.5 h-3.5 shrink-0" />
                Add your Gemini API key above for full LLM-powered analysis. Without it, only retrieval results are shown.
              </div>
            )}

            <div className="flex gap-2">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  placeholder={chunks.length === 0 ? 'No documents available...' : 'Ask a financial question...'}
                  className="pl-9 min-w-0"
                  disabled={isAnalyzing || chunks.length === 0}
                />
              </div>
              <Button onClick={handleSubmit} disabled={isAnalyzing || !query.trim() || chunks.length === 0} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shrink-0">
                {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Analyze
              </Button>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Sample Queries — Click to Run</label>
              <div className="flex flex-wrap gap-1.5">
                {sampleQueries.map((sq) => (
                  <button
                    key={sq}
                    onClick={() => handleSampleQuery(sq)}
                    disabled={isAnalyzing || chunks.length === 0}
                    className="text-[11px] px-2.5 py-1 rounded-full border border-border hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all duration-200 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed text-wrap break-words max-w-[280px]"
                  >
                    {sq}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="min-h-[300px]">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                Analysis Output
              </CardTitle>
              {metrics && (
                <Badge variant="secondary" className="text-[10px] gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                  {(metrics.confidenceScore * 100).toFixed(0)}% confidence
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="text-sm text-red-600 flex items-center gap-2 mb-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
                <AlertCircle className="w-4 h-4 shrink-0" />{error}
              </div>
            )}

            {isAnalyzing && !result && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
                <p className="text-sm text-muted-foreground">Running multi-agent analysis...</p>
              </div>
            )}

            {result ? (
              <ScrollArea className="max-h-[500px]">
                <div className="space-y-4 pr-3">
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">{result}</div>
                  {citedChunks.length > 0 && (
                    <div>
                      <Separator className="mb-3" />
                      <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                        <BookOpen className="w-3 h-3" />Cited Sources ({citedChunks.length})
                      </h4>
                      <div className="space-y-2">
                        {citedChunks.map((chunk) => (
                          <motion.div key={chunk.chunkId} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="p-2.5 rounded-lg border border-border text-xs hover:border-emerald-500/20 transition-colors">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <Badge variant="secondary" className="text-[9px] h-4">Source {chunk.index}</Badge>
                              <span className="text-muted-foreground">Chunk #{chunk.chunkIndex}</span>
                              {chunk.section && <><span className="text-muted-foreground">•</span><span className="text-muted-foreground">{chunk.section}</span></>}
                              <span className="text-emerald-600 ml-auto font-medium">Score: {chunk.score.toFixed(2)}</span>
                            </div>
                            <p className="text-muted-foreground leading-relaxed">{chunk.preview}</p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            ) : !isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Brain className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm font-medium">
                  {chunks.length === 0 ? 'Upload documents first, then run queries' : 'Select a query or type your own to begin analysis'}
                </p>
                <p className="text-xs mt-1 opacity-70">The multi-agent RAG pipeline will retrieve, rank, and synthesize insights</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Agent trace sidebar */}
      <div className="lg:col-span-2">
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              Agent Execution Trace
            </CardTitle>
            <p className="text-xs text-muted-foreground">Real-time RAG pipeline status</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {agentSteps.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">Start an analysis to see the agent trace</div>
            ) : (
              agentSteps.map((step, i) => (
                <motion.div
                  key={`${step.agent}-${i}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.3 }}
                  className={`p-3 rounded-lg border transition-all duration-300 ${
                    step.status === 'running' ? 'border-amber-500/30 bg-amber-500/5'
                    : step.status === 'completed' ? 'border-emerald-500/30 bg-emerald-500/5'
                    : step.status === 'failed' ? 'border-red-500/30 bg-red-500/5'
                    : 'border-border'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {step.status === 'running' && <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />}
                      {step.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      {step.status === 'failed' && <AlertCircle className="w-4 h-4 text-red-500" />}
                      {step.status === 'pending' && <CircleDot className="w-4 h-4 text-muted-foreground opacity-40" />}
                      <span className="text-sm font-medium">{step.agent}</span>
                    </div>
                    {step.duration > 0 && <Badge variant="secondary" className="text-[10px] font-mono">{step.duration}ms</Badge>}
                  </div>
                  {step.output && (
                    <p className={`text-xs mt-1.5 ${step.status === 'completed' ? 'text-emerald-600' : step.status === 'failed' ? 'text-red-600' : 'text-muted-foreground'}`}>
                      → {step.output}
                    </p>
                  )}
                </motion.div>
              ))
            )}

            {isAnalyzing && agentSteps.length > 0 && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Pipeline Progress</span>
                  <span>{agentSteps.filter(s => s.status === 'completed').length}/{agentSteps.length}</span>
                </div>
                <Progress value={(agentSteps.filter(s => s.status === 'completed').length / Math.max(agentSteps.length, 1)) * 100} className="h-1.5" />
              </div>
            )}

            {metrics && !isAnalyzing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 pt-3 border-t">
                <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Gauge className="w-3 h-3" />Pipeline Metrics
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Chunks Searched', value: metrics.chunksSearched, icon: Database },
                    { label: 'Chunks Retrieved', value: metrics.chunksRetrieved, icon: FileSearch },
                    { label: 'Retrieval Time', value: `${metrics.retrievalMs}ms`, icon: Zap },
                    { label: 'LLM Synthesis', value: metrics.synthesisMs > 0 ? `${metrics.synthesisMs}ms` : 'N/A', icon: Brain },
                    { label: 'Total Latency', value: `${metrics.totalLatencyMs}ms`, icon: Activity },
                    { label: 'Confidence', value: `${(metrics.confidenceScore * 100).toFixed(1)}%`, icon: CheckCircle2 },
                  ].map((m) => (
                    <div key={m.label} className="p-2 rounded-md border border-border flex items-center gap-2">
                      <m.icon className="w-3 h-3 text-emerald-600 shrink-0" />
                      <div>
                        <div className="text-[10px] text-muted-foreground">{m.label}</div>
                        <div className="text-xs font-semibold">{m.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
