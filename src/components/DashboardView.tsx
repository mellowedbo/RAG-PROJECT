'use client';

import { motion } from 'framer-motion';
import {
  Brain, TrendingUp, BarChart3, Zap,
  Activity, Cpu, Database,
  Layers, FileText, BookOpen, FileCheck, Gauge,
  FlaskConical, Monitor,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, PieChart, Pie, Cell,
} from 'recharts';
import type { DocInfo, ChunkInfo, AppMode } from '@/types';

/* ═══════════════════════ Constants ═══════════════════════ */

const EMERALD = '#059669';
const EMERALD_LIGHT = '#10b981';

const PERFORMANCE_DATA = [
  { name: 'Jan', queries: 1200, accuracy: 88, latency: 890 },
  { name: 'Feb', queries: 1800, accuracy: 90, latency: 720 },
  { name: 'Mar', queries: 2400, accuracy: 91, latency: 650 },
  { name: 'Apr', queries: 2100, accuracy: 92, latency: 580 },
  { name: 'May', queries: 3200, accuracy: 93, latency: 510 },
  { name: 'Jun', queries: 3800, accuracy: 94, latency: 470 },
  { name: 'Jul', queries: 4200, accuracy: 95, latency: 430 },
];

/* ═══════════════════════ Dashboard View ═══════════════════════ */

interface DashboardViewProps {
  documents: DocInfo[];
  chunks: ChunkInfo[];
  queryCount: number;
  appMode: AppMode;
}

export default function DashboardView({
  documents,
  chunks,
  queryCount,
  appMode,
}: DashboardViewProps) {
  const totalChunks = chunks.length;
  const totalWords = documents.reduce((a, d) => a + d.wordCount, 0);
  const byType = documents.reduce((acc, d) => { acc[d.docType] = (acc[d.docType] || 0) + 1; return acc; }, {} as Record<string, number>);
  const pieData = Object.entries(byType).map(([name, value]) => ({ name: name.replace('_', ' '), value }));
  const PIE_COLORS = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'];

  const statCards = [
    { label: 'Documents', value: documents.length, icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    { label: 'Total Chunks', value: totalChunks, icon: Layers, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
    { label: 'Total Words', value: totalWords.toLocaleString(), icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30' },
    { label: 'Queries Run', value: queryCount, icon: Brain, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/30' },
  ];

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
                    ? '3 pre-indexed financial documents with 17 chunks ready for RAG queries. Powered by Gemini Embedding 2 + Gemma 4 31B IT. Add your API key for LLM analysis.'
                    : 'Upload your own financial documents. Data persists in browser. Powered by Gemini Embedding 2 + Gemma 4 31B IT. Add your API key for LLM analysis.'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Query Performance
              </CardTitle>
              <CardDescription>Simulated pipeline throughput trends</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={PERFORMANCE_DATA}>
                  <defs>
                    <linearGradient id="gradQueries" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={EMERALD} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={EMERALD} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="queries" stroke={EMERALD} fillOpacity={1} fill="url(#gradQueries)" strokeWidth={2} name="Queries" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Gauge className="w-4 h-4 text-emerald-600" />
                Latency Optimization
              </CardTitle>
              <CardDescription>Average response latency (ms) over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={PERFORMANCE_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="latency" fill={EMERALD_LIGHT} radius={[4, 4, 0, 0]} name="Latency (ms)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                Document Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                      {pieData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[180px] text-muted-foreground text-sm">No documents yet</div>
              )}
              <div className="flex flex-wrap gap-3 justify-center mt-2">
                {pieData.map((entry, i) => (
                  <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="capitalize">{entry.name}</span>
                    <span className="text-muted-foreground">({entry.value})</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-600" />
                Multi-Agent Pipeline Architecture
              </CardTitle>
              <CardDescription>Agentic RAG workflow with specialized reasoning agents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { name: 'Retrieval', desc: 'Gemini Embedding 2 + cosine search', pct: 96, icon: Database },
                  { name: 'Ranking', desc: 'Relevance normalization', pct: 93, icon: Gauge },
                  { name: 'Reasoning', desc: 'Gemma 4 31B synthesis', pct: 91, icon: Brain },
                  { name: 'Citation', desc: 'Source traceability', pct: 97, icon: FileCheck },
                ].map((agent, i) => (
                  <motion.div
                    key={agent.name}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + i * 0.08 }}
                    className="p-3 rounded-lg border border-border hover:border-emerald-500/30 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-md bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                        <agent.icon className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold">{agent.name}</div>
                        <div className="text-[10px] text-muted-foreground">{agent.desc}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-muted-foreground">Effectiveness</span>
                      <span className="text-[10px] font-medium text-emerald-600">{agent.pct}%</span>
                    </div>
                    <Progress value={agent.pct} className="h-1.5" />
                  </motion.div>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-[10px] gap-1"><Zap className="w-2.5 h-2.5" /> Real-time</Badge>
                <Badge variant="secondary" className="text-[10px] gap-1"><Layers className="w-2.5 h-2.5" /> Multi-source</Badge>
                <Badge variant="secondary" className="text-[10px] gap-1"><Activity className="w-2.5 h-2.5" /> Agentic</Badge>
                <Badge variant="secondary" className="text-[10px] gap-1"><FileCheck className="w-2.5 h-2.5" /> Cited</Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
