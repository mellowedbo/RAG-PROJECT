'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Brain, Zap, BarChart3, Search,
  Activity, Cpu, Database,
  Layers, FileText, BookOpen, FileCheck, Gauge,
  FlaskConical, Monitor, Calculator, TrendingUp,
  ArrowRight, Clock, Upload, MessageSquare, Settings,
  Sparkles, Shield, AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import type { DocInfo, ChunkInfo, AppMode, PipelineConfig } from '@/types';
import { EMBEDDING_MODELS, GENERATION_MODELS } from '@/types';

/* ═══════════════════════ Constants ═══════════════════════ */

interface ActivityEntry {
  type: 'query' | 'upload' | 'journal';
  description: string;
  timestamp: string;
}

/* ═══════════════════════ Dashboard View ═══════════════════════ */

interface DashboardViewProps {
  documents: DocInfo[];
  chunks: ChunkInfo[];
  queryCount: number;
  appMode: AppMode;
  config: PipelineConfig;
  apiKey: string;
  onTabChange: (tab: string) => void;
}

export default function DashboardView({
  documents,
  chunks,
  queryCount,
  appMode,
  config,
  apiKey,
  onTabChange,
}: DashboardViewProps) {
  const [journalCount, setJournalCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState<ActivityEntry[]>([]);
  const [embeddedChunks, setEmbeddedChunks] = useState(0);

  // Load journal count from localStorage
  useEffect(() => {
    try {
      const entries = localStorage.getItem('nexus-journal-entries');
      if (entries) {
        const parsed = JSON.parse(entries);
        setJournalCount(Array.isArray(parsed) ? parsed.length : 0);
      }
    } catch {
      setJournalCount(0);
    }
  }, []);

  // Load recent activity from localStorage
  useEffect(() => {
    try {
      const activityLog = localStorage.getItem('nexus-activity-log');
      if (activityLog) {
        const parsed = JSON.parse(activityLog);
        setRecentActivity(Array.isArray(parsed) ? parsed.slice(-5).reverse() : []);
      }
    } catch {
      setRecentActivity([]);
    }
  }, []);

  // Count embedded chunks
  useEffect(() => {
    setEmbeddedChunks(chunks.filter(c => c.embedding && c.embedding.length > 0).length);
  }, [chunks]);

  // Look up model display info
  const embeddingModelInfo = EMBEDDING_MODELS.find(m => m.id === config.embeddingModel);
  const generationModelInfo = GENERATION_MODELS.find(m => m.id === config.generationModel);

  const totalChunks = chunks.length;
  const totalWords = documents.reduce((a, d) => a + d.wordCount, 0);

  const statCards = [
    { label: 'Documents', value: documents.length, icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    { label: 'Total Chunks', value: totalChunks, icon: Layers, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
    { label: 'Journal Entries', value: journalCount, icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30' },
    { label: 'Queries Run', value: queryCount, icon: Brain, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/30' },
    { label: 'Embedding Model', value: embeddingModelInfo?.name || config.embeddingModel, icon: Sparkles, color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-950/30' },
    { label: 'Generation Model', value: generationModelInfo?.name || config.generationModel, icon: Cpu, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
  ];

  const featureCards = [
    {
      id: 'query',
      title: 'RAG Query',
      description: 'Ask questions about your financial documents using the 4-agent agentic pipeline',
      icon: Search,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      borderColor: 'hover:border-emerald-500/40',
      status: apiKey ? 'ready' as const : 'needs-key' as const,
      tab: 'query',
    },
    {
      id: 'accounting',
      title: 'Accounting',
      description: 'Double-entry bookkeeping, journal entries, trial balance, and ledger management',
      icon: Calculator,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      borderColor: 'hover:border-amber-500/40',
      status: 'ready' as const,
      tab: 'accounting',
    },
    {
      id: 'tax',
      title: 'Tax',
      description: 'Income tax calculator (old & new regimes), GST computation, and comparison analysis',
      icon: Shield,
      color: 'text-rose-600',
      bg: 'bg-rose-50 dark:bg-rose-950/30',
      borderColor: 'hover:border-rose-500/40',
      status: 'ready' as const,
      tab: 'tax',
    },
    {
      id: 'analysis',
      title: 'Analysis',
      description: 'Financial ratio analysis, DuPont decomposition, and AI-powered insights',
      icon: TrendingUp,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-950/30',
      borderColor: 'hover:border-purple-500/40',
      status: apiKey ? 'ready' as const : 'needs-key' as const,
      tab: 'analysis',
    },
  ];

  const pipelineStages = [
    { name: 'Ingestion', desc: 'Document parsing & chunking', model: `${config.chunkSize} chars, ${config.chunkOverlap} overlap`, pct: documents.length > 0 ? 100 : 0, icon: Upload, active: documents.length > 0 },
    { name: 'Retrieval', desc: `${embeddingModelInfo?.name || config.embeddingModel}`, model: `${config.embeddingDimensions || 768}-dim vectors`, pct: embeddedChunks > 0 ? Math.round((embeddedChunks / Math.max(totalChunks, 1)) * 100) : 0, icon: Database, active: embeddedChunks > 0 },
    { name: 'Reasoning', desc: `${generationModelInfo?.name || config.generationModel}`, model: apiKey ? 'API key set' : 'No API key', pct: apiKey ? 100 : 0, icon: Brain, active: !!apiKey },
    { name: 'Synthesis', desc: 'Cited response generation', model: `Top-${config.topK} retrieval`, pct: queryCount > 0 ? 100 : 0, icon: FileCheck, active: queryCount > 0 },
  ];

  const formatTimeAgo = (timestamp: string) => {
    try {
      const then = new Date(timestamp).getTime();
      const now = Date.now();
      const diffMs = now - then;
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      return `${Math.floor(diffHr / 24)}d ago`;
    } catch {
      return '';
    }
  };

  const activityIcons: Record<string, typeof MessageSquare> = {
    query: MessageSquare,
    upload: Upload,
    journal: Calculator,
  };

  return (
    <div className="space-y-6">
      {/* Mode banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className={`border-2 ${appMode === 'demo' ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {appMode === 'demo' ? (
                <Monitor className="w-5 h-5 text-emerald-600" />
              ) : (
                <FlaskConical className="w-5 h-5 text-amber-600" />
              )}
              <div>
                <div className="text-sm font-semibold">
                  {appMode === 'demo' ? 'Demo Mode — Pre-loaded Financial Documents' : 'Test Mode — Your Documents, Local Storage'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {appMode === 'demo'
                    ? `${documents.length} pre-indexed documents with ${totalChunks} chunks ready for RAG queries. Powered by ${embeddingModelInfo?.name || config.embeddingModel} + ${generationModelInfo?.name || config.generationModel}. ${apiKey ? '' : 'Add your API key for LLM analysis.'}`
                    : `Upload your own financial documents. Data persists in browser. Powered by ${embeddingModelInfo?.name || config.embeddingModel} + ${generationModelInfo?.name || config.generationModel}. ${apiKey ? '' : 'Add your API key for LLM analysis.'}`}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center shrink-0`}>
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-lg font-bold tracking-tight truncate">{stat.value}</div>
                    <div className="text-[10px] text-muted-foreground leading-tight">{stat.label}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Feature Cards */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-emerald-600" />
          <h2 className="text-sm font-semibold">Platform Features</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featureCards.map((feature, i) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
            >
              <Card
                className={`cursor-pointer border transition-all duration-200 ${feature.borderColor} hover:shadow-md`}
                onClick={() => onTabChange(feature.tab)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-lg ${feature.bg} flex items-center justify-center`}>
                      <feature.icon className={`w-5 h-5 ${feature.color}`} />
                    </div>
                    <Badge
                      variant={feature.status === 'ready' ? 'default' : 'secondary'}
                      className={`text-[10px] gap-1 ${feature.status === 'ready' ? 'bg-emerald-600' : 'bg-amber-500/15 text-amber-600 border-amber-500/30'}`}
                    >
                      {feature.status === 'ready' ? (
                        <><Zap className="w-2.5 h-2.5" /> Ready</>
                      ) : (
                        <><AlertCircle className="w-2.5 h-2.5" /> Needs API Key</>
                      )}
                    </Badge>
                  </div>
                  <h3 className="text-sm font-semibold mb-1">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                  <div className="mt-3 flex items-center text-[10px] text-emerald-600 font-medium gap-1">
                    <span>Open</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pipeline Architecture */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-600" />
                4-Agent Pipeline Architecture
              </CardTitle>
              <CardDescription>Agentic RAG workflow: Ingestion → Retrieval → Reasoning → Synthesis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {pipelineStages.map((stage, i) => (
                  <motion.div
                    key={stage.name}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + i * 0.08 }}
                    className={`p-3 rounded-lg border transition-colors ${
                      stage.active
                        ? 'border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/10'
                        : 'border-border'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-md bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                        <stage.icon className={`w-3.5 h-3.5 ${stage.active ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                      </div>
                      <div>
                        <div className="text-xs font-semibold">{stage.name}</div>
                        <div className="text-[10px] text-muted-foreground">{stage.desc}</div>
                      </div>
                    </div>
                    <div className="text-[10px] text-muted-foreground mb-1.5">{stage.model}</div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-muted-foreground">Status</span>
                      <span className={`text-[10px] font-medium ${stage.active ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                        {stage.active ? 'Active' : 'Idle'}
                      </span>
                    </div>
                    <Progress value={stage.pct} className="h-1.5" />
                  </motion.div>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-[10px] gap-1"><Zap className="w-2.5 h-2.5" /> Real-time</Badge>
                <Badge variant="secondary" className="text-[10px] gap-1"><Layers className="w-2.5 h-2.5" /> Multi-source</Badge>
                <Badge variant="secondary" className="text-[10px] gap-1"><Activity className="w-2.5 h-2.5" /> Agentic</Badge>
                <Badge variant="secondary" className="text-[10px] gap-1"><FileCheck className="w-2.5 h-2.5" /> Cited</Badge>
                <Badge variant="secondary" className="text-[10px] gap-1"><Database className="w-2.5 h-2.5" /> {embeddedChunks}/{totalChunks} indexed</Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Model Configuration Summary + Recent Activity */}
        <div className="space-y-4">
          {/* Model Config Summary */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-emerald-600" />
                    Model Configuration
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] gap-1 text-emerald-600 hover:text-emerald-700"
                    onClick={() => onTabChange('settings')}
                  >
                    <Settings className="w-3 h-3" />
                    Settings
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-2.5 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Embedding</span>
                    {embeddingModelInfo?.isRecommended && (
                      <Badge className="text-[9px] h-4 bg-emerald-600 gap-0.5">Recommended</Badge>
                    )}
                  </div>
                  <div className="text-xs font-semibold">{embeddingModelInfo?.name || config.embeddingModel}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {config.embeddingDimensions || 768} dimensions
                    {embeddingModelInfo?.isMultimodal && ' • Multimodal'}
                    {' • '}{embeddingModelInfo?.maxTokens || '—'} max tokens
                  </div>
                </div>
                <div className="p-2.5 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Generation</span>
                    {generationModelInfo?.isRecommended && (
                      <Badge className="text-[9px] h-4 bg-emerald-600 gap-0.5">Recommended</Badge>
                    )}
                  </div>
                  <div className="text-xs font-semibold">{generationModelInfo?.name || config.generationModel}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {generationModelInfo?.maxTokens ? `${generationModelInfo.maxTokens.toLocaleString()} output tokens` : ''}
                    {generationModelInfo?.isMultimodal && ' • Multimodal'}
                    {config.simulationMode && ' • Simulation mode'}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg border border-border">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Vector Store</div>
                  <div className="text-xs font-semibold">{embeddedChunks} / {totalChunks} chunks indexed</div>
                  <div className="text-[10px] text-muted-foreground">
                    Task type: {config.embeddingTaskType?.replace(/_/g, ' ') || 'RETRIEVAL DOCUMENT'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Activity */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivity.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {recentActivity.map((entry, i) => {
                      const Icon = activityIcons[entry.type] || MessageSquare;
                      return (
                        <div key={i} className="flex items-center gap-2.5 p-2 rounded-md hover:bg-muted/50 transition-colors">
                          <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center shrink-0">
                            <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium truncate">{entry.description}</div>
                            <div className="text-[10px] text-muted-foreground">{formatTimeAgo(entry.timestamp)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <Activity className="w-8 h-8 text-muted-foreground/30 mb-2" />
                    <div className="text-xs text-muted-foreground">No recent activity</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">Start by uploading documents or running queries</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Quick Stats Row */}
      {documents.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-6 flex-wrap">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="text-xs font-semibold">{documents.length} Documents</div>
                      <div className="text-[10px] text-muted-foreground">{totalWords.toLocaleString()} total words</div>
                    </div>
                  </div>
                  <Separator orientation="vertical" className="h-6" />
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-600" />
                    <div>
                      <div className="text-xs font-semibold">{totalChunks} Chunks</div>
                      <div className="text-[10px] text-muted-foreground">{embeddedChunks} with embeddings</div>
                    </div>
                  </div>
                  <Separator orientation="vertical" className="h-6" />
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-purple-600" />
                    <div>
                      <div className="text-xs font-semibold">{Object.keys(documents.reduce((acc, d) => { acc[d.docType] = true; return acc; }, {} as Record<string, boolean>)).length} Types</div>
                      <div className="text-[10px] text-muted-foreground">
                        {Object.entries(documents.reduce((acc, d) => { acc[d.docType] = (acc[d.docType] || 0) + 1; return acc; }, {} as Record<string, number>))
                          .map(([k, v]) => `${k.replace(/_/g, ' ')} (${v})`)
                          .join(', ')}
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={() => onTabChange('documents')}
                >
                  View Documents
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
