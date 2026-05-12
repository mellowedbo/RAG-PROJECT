'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Search, FileSearch, Sparkles, TrendingUp, Shield,
  BarChart3, ChevronRight, Zap, ArrowRight,
  Activity, CheckCircle2, AlertCircle, Cpu, Database,
  Layers, Network, Send, Terminal,
  Upload, FileText, Trash2, Loader2, Download, Scan,
  FolderOpen, FilePlus2, BookOpen, LayoutDashboard,
  AlertTriangle, RefreshCw, Code2, Copy, Check,
  FileCheck, Scale, Gauge, CircleDot, MessageSquare,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, PieChart, Pie, Cell,
} from 'recharts';

/* ═══════════════════════ Types ═══════════════════════ */

interface DocInfo {
  id: string;
  title: string;
  filename: string;
  docType: string;
  sector: string | null;
  wordCount: number;
  chunkCount: number;
  status: string;
  createdAt: string;
}

interface AgentStep {
  agent: string;
  status: string;
  duration: number;
  output: string;
}

interface CitedChunk {
  index: number;
  chunkId: string;
  documentId: string;
  chunkIndex: number;
  section: string | null;
  score: number;
  preview: string;
}

interface ComplianceFinding {
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  reference: string;
  chunkIndex: number;
  excerpt: string;
}

interface QueryMetrics {
  chunksSearched: number;
  chunksRetrieved: number;
  retrievalMs: number;
  synthesisMs: number;
  totalLatencyMs: number;
  confidenceScore: number;
}

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

const SAMPLE_QUERIES = [
  'What are the key risk factors identified across all documents?',
  'What is the revenue growth and forward guidance for Tesla?',
  'Are there any compliance or regulatory issues at Goldman Sachs?',
  'What cybersecurity risks are disclosed across the portfolio?',
  'Identify any material weaknesses in internal controls',
  'What is the credit risk and liquidity position at JP Morgan?',
  'Summarize operational risk events and their financial impact',
  'What are the sanctions and anti-corruption investigation details?',
];

const SEVERITY_CONFIG = {
  critical: { color: 'bg-red-500', text: 'text-red-600', border: 'border-red-500/30', bg: 'bg-red-500/5', label: 'CRITICAL' },
  high: { color: 'bg-orange-500', text: 'text-orange-600', border: 'border-orange-500/30', bg: 'bg-orange-500/5', label: 'HIGH' },
  medium: { color: 'bg-yellow-500', text: 'text-yellow-600', border: 'border-yellow-500/30', bg: 'bg-yellow-500/5', label: 'MEDIUM' },
  low: { color: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-500/30', bg: 'bg-blue-500/5', label: 'LOW' },
};

const COLAB_CODE = `# NEXUS Finance RAG Platform — Python Notebook
# ================================================
# Run each cell sequentially to interact with the NEXUS API

!pip install requests pandas matplotlib

import requests
import json
import pandas as pd
import matplotlib.pyplot as plt

BASE_URL = "http://localhost:3000"

# ── Cell 1: Seed the Database ──────────────────────
resp = requests.post(f"{BASE_URL}/api/seed")
print(json.dumps(resp.json(), indent=2))

# ── Cell 2: List Documents ─────────────────────────
resp = requests.get(f"{BASE_URL}/api/documents/list")
data = resp.json()
print(f"Total documents: {data['stats']['totalDocuments']}")
print(f"Total chunks: {data['stats']['totalChunks']}")
for doc in data['documents']:
    print(f"  • {doc['title']} ({doc['chunkCount']} chunks)")

# ── Cell 3: Upload Custom Document ─────────────────
doc = {
    "title": "Morgan Stanley — Q3 2024 Earnings",
    "content": "Net revenues were $15.0 billion for Q3 2024...",
    "docType": "earnings",
    "sector": "Financial Services",
    "filename": "morgan_stanley_q3_2024.txt"
}
resp = requests.post(f"{BASE_URL}/api/documents/upload", json=doc)
print(json.dumps(resp.json(), indent=2))

# ── Cell 4: Run RAG Query ──────────────────────────
query = {
    "query": "What are the major risk factors across all documents?"
}
resp = requests.post(f"{BASE_URL}/api/finance-query", json=query)
data = resp.json()

print("=" * 60)
print("ANALYSIS OUTPUT")
print("=" * 60)
print(data['response'])
print("\\n" + "=" * 60)
print("AGENT TRACE")
print("=" * 60)
for step in data['agentTrace']:
    status_icon = "✓" if step['status'] == 'completed' else "..."
    print(f"  {status_icon} {step['agent']}: {step['output']} ({step['duration']}ms)")

print("\\n" + "=" * 60)
print("METRICS")
print("=" * 60)
metrics = data['metrics']
print(f"  Chunks Searched:   {metrics['chunksSearched']}")
print(f"  Chunks Retrieved:  {metrics['chunksRetrieved']}")
print(f"  Retrieval Time:    {metrics['retrievalMs']}ms")
print(f"  Synthesis Time:    {metrics['synthesisMs']}ms")
print(f"  Total Latency:     {metrics['totalLatencyMs']}ms")
print(f"  Confidence Score:  {metrics['confidenceScore']:.1%}")

# ── Cell 5: Compliance Scan ────────────────────────
resp = requests.post(f"{BASE_URL}/api/compliance-scan", json={})
data = resp.json()

print(f"Total Findings: {data['stats']['totalFindings']}")
print(f"  Critical: {data['stats']['critical']}")
print(f"  High:     {data['stats']['high']}")
print(f"  Medium:   {data['stats']['medium']}")
print(f"  Low:      {data['stats']['low']}")

# Visualize severity distribution
severities = ['critical', 'high', 'medium', 'low']
counts = [data['stats'][s] for s in severities]
colors = ['#ef4444', '#f97316', '#eab308', '#3b82f6']

fig, ax = plt.subplots(figsize=(8, 4))
bars = ax.bar(severities, counts, color=colors)
ax.set_title('Compliance Findings by Severity')
ax.set_ylabel('Count')
for bar, count in zip(bars, counts):
    ax.text(bar.get_x() + bar.get_width()/2., bar.get_height() + 0.1,
            str(count), ha='center', fontweight='bold')
plt.tight_layout()
plt.show()

# ── Cell 6: Cited Sources Analysis ─────────────────
print("=" * 60)
print("CITED SOURCES")
print("=" * 60)
for chunk in data.get('citedChunks', []):
    print(f"  Source {chunk['index']}: Score={chunk['score']:.2f}")
    print(f"    {chunk['preview'][:100]}...")
    print()

# ── Cell 7: Batch Queries for Benchmarking ─────────
queries = [
    "What is Tesla's revenue growth?",
    "What cybersecurity risks exist?",
    "What are the sanctions compliance issues?",
    "What is the credit risk exposure?",
]
results = []
for q in queries:
    resp = requests.post(f"{BASE_URL}/api/finance-query",
                         json={"query": q})
    d = resp.json()
    results.append({
        'query': q,
        'latency_ms': d['metrics']['totalLatencyMs'],
        'confidence': d['metrics']['confidenceScore'],
        'chunks': d['metrics']['chunksRetrieved']
    })

df = pd.DataFrame(results)
print(df.to_string(index=False))

fig, axes = plt.subplots(1, 2, figsize=(12, 4))
axes[0].barh(range(len(queries)), df['latency_ms'], color='#059669')
axes[0].set_yticks(range(len(queries)))
axes[0].set_yticklabels([q[:30]+'...' for q in queries])
axes[0].set_xlabel('Latency (ms)')
axes[0].set_title('Query Latency')

axes[1].bar(range(len(queries)), df['confidence'], color='#10b981')
axes[1].set_xticks(range(len(queries)))
axes[1].set_xticklabels([f'Q{i+1}' for i in range(len(queries))])
axes[1].set_ylabel('Confidence')
axes[1].set_title('Confidence Score')
plt.tight_layout()
plt.show()
`;

/* ═══════════════════════ Navigation ═══════════════════════ */

function Navigation({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (t: string) => void;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'documents', label: 'Documents', icon: FolderOpen },
    { id: 'query', label: 'Query', icon: Search },
    { id: 'compliance', label: 'Compliance', icon: Shield },
    { id: 'colab', label: 'Colab', icon: Terminal },
  ];

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-background/80 backdrop-blur-xl border-b border-border shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shadow-md shadow-emerald-600/20">
            <Network className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">NEXUS</span>
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0 h-5 font-mono"
          >
            RAG
          </Badge>
        </div>
        <div className="hidden md:flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-emerald-600/10 text-emerald-600 font-medium shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
        {/* Mobile tab selector */}
        <div className="md:hidden">
          <Select value={activeTab} onValueChange={onTabChange}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tabs.map((tab) => (
                <SelectItem key={tab.id} value={tab.id}>
                  {tab.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </motion.nav>
  );
}

/* ═══════════════════════ Dashboard ═══════════════════════ */

function DashboardView({
  documents,
  queryCount,
  stats,
}: {
  documents: DocInfo[];
  queryCount: number;
  stats: { totalDocuments: number; totalChunks: number; totalWords: number; byType: Record<string, number> } | null;
}) {
  const totalChunks = stats?.totalChunks ?? documents.reduce((a, d) => a + d.chunkCount, 0);
  const totalWords = stats?.totalWords ?? documents.reduce((a, d) => a + d.wordCount, 0);
  const byType = stats?.byType ?? documents.reduce((acc, d) => { acc[d.docType] = (acc[d.docType] || 0) + 1; return acc; }, {} as Record<string, number>);

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
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
          >
            <Card className="overflow-hidden">
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
        {/* Query performance area chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Query Performance
              </CardTitle>
              <CardDescription>Monthly query volume and accuracy trends</CardDescription>
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
                  <Tooltip
                    contentStyle={{
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="queries"
                    stroke={EMERALD}
                    fillOpacity={1}
                    fill="url(#gradQueries)"
                    strokeWidth={2}
                    name="Queries"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Latency bar chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
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
                  <Tooltip
                    contentStyle={{
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="latency" fill={EMERALD_LIGHT} radius={[4, 4, 0, 0]} name="Latency (ms)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Document type pie chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
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
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((_entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[180px] text-muted-foreground text-sm">
                  No documents yet
                </div>
              )}
              <div className="flex flex-wrap gap-3 justify-center mt-2">
                {pieData.map((entry, i) => (
                  <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    <span className="capitalize">{entry.name}</span>
                    <span className="text-muted-foreground">({entry.value})</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pipeline architecture */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="lg:col-span-2"
        >
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
                  { name: 'Retrieval', desc: 'Semantic chunk search', pct: 94, icon: Database },
                  { name: 'Ranking', desc: 'TF-IDF + keyword scoring', pct: 91, icon: Gauge },
                  { name: 'Reasoning', desc: 'LLM synthesis engine', pct: 88, icon: Brain },
                  { name: 'Citation', desc: 'Source traceability', pct: 96, icon: FileCheck },
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
                <Badge variant="secondary" className="text-[10px] gap-1">
                  <Zap className="w-2.5 h-2.5" /> Real-time
                </Badge>
                <Badge variant="secondary" className="text-[10px] gap-1">
                  <Layers className="w-2.5 h-2.5" /> Multi-source
                </Badge>
                <Badge variant="secondary" className="text-[10px] gap-1">
                  <Network className="w-2.5 h-2.5" /> Agentic
                </Badge>
                <Badge variant="secondary" className="text-[10px] gap-1">
                  <FileCheck className="w-2.5 h-2.5" /> Cited
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

/* ═══════════════════════ Documents View ═══════════════════════ */

function DocumentsView({
  documents,
  onRefresh,
}: {
  documents: DocInfo[];
  onRefresh: () => void;
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [docType, setDocType] = useState('custom');
  const [sector, setSector] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleUpload = async () => {
    if (!title.trim() || !content.trim()) return;
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);
    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          docType,
          sector: sector || null,
          filename: `${title.trim().replace(/\s+/g, '_')}.txt`,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Upload failed');
      }
      setTitle('');
      setContent('');
      setDocType('custom');
      setSector('');
      setUploadSuccess(true);
      onRefresh();
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/documents/delete?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  const handleReseed = async () => {
    setIsUploading(true);
    try {
      await fetch('/api/seed', { method: 'DELETE' });
      const res = await fetch('/api/seed', { method: 'POST' });
      if (!res.ok) throw new Error('Reseed failed');
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="w-4 h-4 text-emerald-600" />
            Upload Financial Document
          </CardTitle>
          <CardDescription>
            Paste financial document text for RAG processing. The system will automatically chunk and index it for retrieval.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {uploadError && (
            <div className="text-sm text-red-600 flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {uploadError}
            </div>
          )}
          {uploadSuccess && (
            <div className="text-sm text-emerald-600 flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Document uploaded and chunked successfully!
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="text-xs font-medium mb-1.5 block">Document Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Apple 10-K 2024"
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block">Type</label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10k">10-K Filing</SelectItem>
                  <SelectItem value="earnings">Earnings Report</SelectItem>
                  <SelectItem value="annual_report">Annual Report</SelectItem>
                  <SelectItem value="risk_assessment">Risk Assessment</SelectItem>
                  <SelectItem value="market_brief">Market Brief</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block">Sector (optional)</label>
              <Input
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                placeholder="e.g., Technology"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block">Document Content</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste financial document text here..."
              className="min-h-[180px] font-mono text-xs"
            />
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[11px] text-muted-foreground">
                {content.split(/\s+/).filter((w) => w).length} words
              </span>
              <span className="text-[11px] text-muted-foreground">
                {content.length.toLocaleString()} characters
              </span>
            </div>
          </div>
          <Button
            onClick={handleUpload}
            disabled={isUploading || !title.trim() || !content.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {isUploading ? 'Processing...' : 'Upload & Chunk'}
          </Button>
        </CardContent>
      </Card>

      {/* Document list */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-emerald-600" />
                Indexed Documents
                <Badge variant="secondary" className="text-[10px] ml-1">
                  {documents.length}
                </Badge>
              </CardTitle>
              <CardDescription className="mt-1">
                Documents are automatically chunked and indexed for retrieval
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReseed}
                disabled={isUploading}
                className="h-8 text-xs gap-1.5"
              >
                <RefreshCw className="w-3 h-3" />
                Reseed
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                className="h-8 text-xs gap-1.5"
              >
                <Activity className="w-3 h-3" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No documents indexed yet</p>
              <p className="text-xs mt-1">Upload a document above or click Reseed to load sample data.</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-2 pr-2">
                {documents.map((doc, i) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-emerald-500/20 hover:bg-emerald-500/[0.02] transition-all duration-200"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{doc.title}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                          <Badge variant="secondary" className="text-[9px] h-4 capitalize">
                            {doc.docType.replace('_', ' ')}
                          </Badge>
                          <span>{doc.chunkCount} chunks</span>
                          <span>•</span>
                          <span>{doc.wordCount.toLocaleString()} words</span>
                          {doc.sector && (
                            <>
                              <span>•</span>
                              <span>{doc.sector}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <Badge
                        variant="outline"
                        className={`text-[9px] h-5 ${
                          doc.status === 'chunked'
                            ? 'border-emerald-500/30 text-emerald-600'
                            : 'border-amber-500/30 text-amber-600'
                        }`}
                      >
                        {doc.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(doc.id)}
                        disabled={deletingId === doc.id}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      >
                        {deletingId === doc.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════ Query View ═══════════════════════ */

function QueryView({
  documents,
  onQueryComplete,
}: {
  documents: DocInfo[];
  onQueryComplete: () => void;
}) {
  const [query, setQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<QueryMetrics | null>(null);
  const [citedChunks, setCitedChunks] = useState<CitedChunk[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const abortRef = useRef(false);

  const runAnalysis = useCallback(
    async (queryText: string) => {
      if (!queryText.trim()) return;
      abortRef.current = false;
      setIsAnalyzing(true);
      setResult(null);
      setMetrics(null);
      setCitedChunks([]);
      setError(null);
      setAgentSteps([
        { agent: 'Retrieval Agent', status: 'running', duration: 0, output: 'Searching document chunks...' },
        { agent: 'Ranking Agent', status: 'pending', duration: 0, output: '' },
        { agent: 'Reasoning Agent', status: 'pending', duration: 0, output: '' },
        { agent: 'Synthesis Agent', status: 'pending', duration: 0, output: '' },
      ]);

      try {
        const res = await fetch('/api/finance-query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: queryText,
            documentIds: selectedDocs.length > 0 ? selectedDocs : undefined,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Analysis failed');
        }

        const data = await res.json();
        if (abortRef.current) return;

        setAgentSteps(data.agentTrace || []);
        setResult(data.response);
        setMetrics(data.metrics || null);
        setCitedChunks(data.citedChunks || []);
        onQueryComplete();
      } catch (err) {
        if (abortRef.current) return;
        const msg = err instanceof Error ? err.message : 'Analysis failed. Please try again.';
        setError(msg);
        setAgentSteps((prev) =>
          prev.map((s) => (s.status === 'running' ? { ...s, status: 'failed', output: msg } : s))
        );
      } finally {
        setIsAnalyzing(false);
      }
    },
    [selectedDocs, onQueryComplete]
  );

  const handleSampleQuery = (sq: string) => {
    setQuery(sq);
    runAnalysis(sq);
  };

  const toggleDoc = (docId: string) => {
    setSelectedDocs((prev) =>
      prev.includes(docId) ? prev.filter((d) => d !== docId) : [...prev, docId]
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      {/* Query panel */}
      <div className="lg:col-span-3 space-y-4">
        <Card>
          <CardContent className="pt-6 space-y-4">
            {/* Document filter */}
            {documents.length > 0 && (
              <div>
                <label className="text-xs font-medium mb-2 block flex items-center gap-1.5">
                  <Database className="w-3 h-3" />
                  Search Scope{' '}
                  <span className="text-muted-foreground font-normal">
                    (leave empty for all documents)
                  </span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {documents.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => toggleDoc(doc.id)}
                      className={`text-[11px] px-2.5 py-1 rounded-full border transition-all duration-200 ${
                        selectedDocs.includes(doc.id)
                          ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600 shadow-sm'
                          : 'border-border text-muted-foreground hover:border-emerald-500/30 hover:text-foreground'
                      }`}
                    >
                      {doc.title.length > 35 ? doc.title.slice(0, 35) + '...' : doc.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && runAnalysis(query)}
                  placeholder={
                    documents.length === 0
                      ? 'Upload documents first...'
                      : 'Ask a financial question...'
                  }
                  className="pl-9"
                  disabled={isAnalyzing || documents.length === 0}
                />
              </div>
              <Button
                onClick={() => runAnalysis(query)}
                disabled={isAnalyzing || !query.trim() || documents.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shrink-0"
              >
                {isAnalyzing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Analyze
              </Button>
            </div>

            {/* Sample queries */}
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                Sample Queries — Click to Run
              </label>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_QUERIES.map((sq) => (
                  <button
                    key={sq}
                    onClick={() => handleSampleQuery(sq)}
                    disabled={isAnalyzing || documents.length === 0}
                    className="text-[11px] px-2.5 py-1 rounded-full border border-border hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all duration-200 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sq}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Result */}
        <Card className="min-h-[300px]">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                Analysis Output
              </CardTitle>
              {metrics && (
                <Badge
                  variant="secondary"
                  className="text-[10px] gap-1"
                >
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                  {(metrics.confidenceScore * 100).toFixed(0)}% confidence
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="text-sm text-red-600 flex items-center gap-2 mb-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
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

                  {/* Cited sources */}
                  {citedChunks.length > 0 && (
                    <div>
                      <Separator className="mb-3" />
                      <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                        <BookOpen className="w-3 h-3" />
                        Cited Sources ({citedChunks.length})
                      </h4>
                      <div className="space-y-2">
                        {citedChunks.map((chunk) => (
                          <motion.div
                            key={chunk.chunkId}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-2.5 rounded-lg border border-border text-xs hover:border-emerald-500/20 transition-colors"
                          >
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <Badge variant="secondary" className="text-[9px] h-4">
                                Source {chunk.index}
                              </Badge>
                              <span className="text-muted-foreground">Chunk #{chunk.chunkIndex}</span>
                              {chunk.section && (
                                <>
                                  <span className="text-muted-foreground">•</span>
                                  <span className="text-muted-foreground">{chunk.section}</span>
                                </>
                              )}
                              <span className="text-emerald-600 ml-auto font-medium">
                                Score: {chunk.score.toFixed(2)}
                              </span>
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
                  {documents.length === 0
                    ? 'Upload documents first, then run queries'
                    : 'Select a query or type your own to begin analysis'}
                </p>
                <p className="text-xs mt-1 opacity-70">
                  The multi-agent RAG pipeline will retrieve, rank, and synthesize insights
                </p>
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
            <CardDescription>Real-time RAG pipeline status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {agentSteps.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">
                Start an analysis to see the agent trace
              </div>
            ) : (
              agentSteps.map((step, i) => (
                <motion.div
                  key={`${step.agent}-${i}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.3 }}
                  className={`p-3 rounded-lg border transition-all duration-300 ${
                    step.status === 'running'
                      ? 'border-amber-500/30 bg-amber-500/5'
                      : step.status === 'completed'
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : step.status === 'failed'
                      ? 'border-red-500/30 bg-red-500/5'
                      : 'border-border'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {step.status === 'running' && (
                        <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                      )}
                      {step.status === 'completed' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      )}
                      {step.status === 'failed' && (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                      {step.status === 'pending' && (
                        <CircleDot className="w-4 h-4 text-muted-foreground opacity-40" />
                      )}
                      <span className="text-sm font-medium">{step.agent}</span>
                    </div>
                    {step.duration > 0 && (
                      <Badge variant="secondary" className="text-[10px] font-mono">
                        {step.duration}ms
                      </Badge>
                    )}
                  </div>
                  {step.output && (
                    <p
                      className={`text-xs mt-1.5 ${
                        step.status === 'completed'
                          ? 'text-emerald-600'
                          : step.status === 'failed'
                          ? 'text-red-600'
                          : 'text-muted-foreground'
                      }`}
                    >
                      → {step.output}
                    </p>
                  )}
                </motion.div>
              ))
            )}

            {/* Progress bar */}
            {isAnalyzing && agentSteps.length > 0 && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Pipeline Progress</span>
                  <span>
                    {agentSteps.filter((s) => s.status === 'completed').length}/
                    {agentSteps.length}
                  </span>
                </div>
                <Progress
                  value={
                    (agentSteps.filter((s) => s.status === 'completed').length /
                      Math.max(agentSteps.length, 1)) *
                    100
                  }
                  className="h-1.5"
                />
              </div>
            )}

            {/* Metrics panel */}
            {metrics && !isAnalyzing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 pt-3 border-t"
              >
                <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Gauge className="w-3 h-3" />
                  Pipeline Metrics
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Chunks Searched', value: metrics.chunksSearched, icon: Database },
                    { label: 'Chunks Retrieved', value: metrics.chunksRetrieved, icon: FileSearch },
                    { label: 'Retrieval Time', value: `${metrics.retrievalMs}ms`, icon: Zap },
                    { label: 'LLM Synthesis', value: `${metrics.synthesisMs}ms`, icon: Brain },
                    { label: 'Total Latency', value: `${metrics.totalLatencyMs}ms`, icon: Activity },
                    {
                      label: 'Confidence',
                      value: `${(metrics.confidenceScore * 100).toFixed(1)}%`,
                      icon: CheckCircle2,
                    },
                  ].map((m) => (
                    <div
                      key={m.label}
                      className="p-2 rounded-md border border-border flex items-center gap-2"
                    >
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

/* ═══════════════════════ Compliance View ═══════════════════════ */

function ComplianceView({ documents }: { documents: DocInfo[] }) {
  const [findings, setFindings] = useState<ComplianceFinding[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [stats, setStats] = useState<{
    totalFindings: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  } | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  const runScan = async () => {
    setIsScanning(true);
    setError(null);
    try {
      const res = await fetch('/api/compliance-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentIds: documents.map((d) => d.id) }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Scan failed');
      }
      const data = await res.json();
      setFindings(data.findings || []);
      setStats(data.stats || null);
      setSummary(data.summary || null);
      setCategories(data.categories || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Compliance scan failed');
    } finally {
      setIsScanning(false);
    }
  };

  const filteredFindings =
    filterSeverity === 'all'
      ? findings
      : findings.filter((f) => f.severity === filterSeverity);

  const severityCounts = stats
    ? [
        { severity: 'critical', count: stats.critical, color: '#ef4444' },
        { severity: 'high', count: stats.high, color: '#f97316' },
        { severity: 'medium', count: stats.medium, color: '#eab308' },
        { severity: 'low', count: stats.low, color: '#3b82f6' },
      ].filter((s) => s.count > 0)
    : [];

  return (
    <div className="space-y-6">
      {/* Scan controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-600" />
                Regulatory Compliance Scanner
              </CardTitle>
              <CardDescription className="mt-1">
                Automated scanning for regulatory compliance issues, risk disclosures, and control deficiencies
              </CardDescription>
            </div>
            <Button
              onClick={runScan}
              disabled={isScanning || documents.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              {isScanning ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Scan className="w-4 h-4" />
              )}
              {isScanning ? 'Scanning...' : 'Run Compliance Scan'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {error && (
        <div className="text-sm text-red-600 flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {isScanning && (
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
              <p className="text-sm font-medium">Scanning documents for compliance issues...</p>
              <p className="text-xs text-muted-foreground mt-1">
                Analyzing {documents.length} documents for regulatory violations and risk factors
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {stats && !isScanning && (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card>
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold">{stats.totalFindings}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Total Findings
                </div>
              </CardContent>
            </Card>
            {severityCounts.map((s) => (
              <Card key={s.severity}>
                <CardContent className="p-3 text-center">
                  <div className="text-2xl font-bold" style={{ color: s.color }}>
                    {s.count}
                  </div>
                  <div
                    className="text-[10px] uppercase tracking-wider font-semibold"
                    style={{ color: s.color }}
                  >
                    {s.severity}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Summary + Severity chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  Severity Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {severityCounts.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={severityCounts} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis type="number" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                      <YAxis
                        dataKey="severity"
                        type="category"
                        tick={{ fontSize: 11 }}
                        stroke="var(--muted-foreground)"
                        width={60}
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--card)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {severityCounts.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[180px] text-sm text-muted-foreground">
                    No findings
                  </div>
                )}

                {categories.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Categories
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {categories.map((cat) => (
                        <Badge key={cat} variant="secondary" className="text-[10px]">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Findings list */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-emerald-600" />
                    Findings
                    <Badge variant="secondary" className="text-[10px]">
                      {filteredFindings.length}
                    </Badge>
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    {['all', 'critical', 'high', 'medium', 'low'].map((sev) => (
                      <button
                        key={sev}
                        onClick={() => setFilterSeverity(sev)}
                        className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors capitalize ${
                          filterSeverity === sev
                            ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600'
                            : 'border-border text-muted-foreground hover:border-emerald-500/30'
                        }`}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredFindings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No findings to display
                  </div>
                ) : (
                  <ScrollArea className="max-h-[500px]">
                    <div className="space-y-2 pr-2">
                      {filteredFindings.map((finding, i) => {
                        const config = SEVERITY_CONFIG[finding.severity];
                        return (
                          <motion.div
                            key={`${finding.chunkIndex}-${i}`}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className={`p-3 rounded-lg border ${config.border} ${config.bg}`}
                          >
                            <div className="flex items-center gap-2 mb-1.5">
                              <Badge
                                variant="outline"
                                className={`text-[9px] h-5 ${config.text} border-current`}
                              >
                                {config.label}
                              </Badge>
                              <Badge variant="secondary" className="text-[9px] h-5">
                                {finding.category}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground ml-auto">
                                {finding.reference}
                              </span>
                            </div>
                            <p className="text-xs font-medium mb-1">{finding.description}</p>
                            <p className="text-[11px] text-muted-foreground italic">
                              &ldquo;{finding.excerpt.slice(0, 150)}
                              {finding.excerpt.length > 150 ? '...' : ''}&rdquo;
                            </p>
                          </motion.div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          {summary && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  Scan Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{summary}</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!stats && !isScanning && !error && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <Shield className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">
                {documents.length === 0
                  ? 'Upload documents first to run compliance scans'
                  : 'Click "Run Compliance Scan" to analyze documents'}
              </p>
              <p className="text-xs mt-1 opacity-70">
                Scans for regulatory violations, risk disclosures, and control deficiencies
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ═══════════════════════ Colab View ═══════════════════════ */

function ColabView() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(COLAB_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = COLAB_CODE;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([COLAB_CODE], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nexus_finance_rag_notebook.py';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-600" />
                Python Notebook — NEXUS API
              </CardTitle>
              <CardDescription className="mt-1">
                Complete notebook code to interact with the NEXUS Finance RAG Platform via Python.
                Copy to clipboard or download as a .py file, then run in Google Colab or Jupyter.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="gap-1.5"
              >
                {copied ? (
                  <Check className="w-3 h-3 text-emerald-600" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              <Button
                size="sm"
                onClick={handleDownload}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              >
                <Download className="w-3 h-3" />
                Download .py
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick reference */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            title: 'Seed Database',
            desc: 'POST /api/seed — Load 3 sample financial documents',
            icon: Database,
          },
          {
            title: 'RAG Query',
            desc: 'POST /api/finance-query — Multi-agent analysis pipeline',
            icon: Brain,
          },
          {
            title: 'Compliance Scan',
            desc: 'POST /api/compliance-scan — Regulatory risk scanner',
            icon: Shield,
          },
        ].map((item) => (
          <Card key={item.title}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <item.icon className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium">{item.title}</span>
              </div>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Code display */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Code2 className="w-4 h-4 text-emerald-600" />
            Complete Notebook Code
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[500px]">
            <pre className="text-xs font-mono leading-relaxed p-4 rounded-lg bg-muted/50 overflow-x-auto">
              <code>{COLAB_CODE}</code>
            </pre>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════ Main Page ═══════════════════════ */

export default function NexusPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [documents, setDocuments] = useState<DocInfo[]>([]);
  const [stats, setStats] = useState<{
    totalDocuments: number;
    totalChunks: number;
    totalWords: number;
    byType: Record<string, number>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const [queryCount, setQueryCount] = useState(0);
  const [pageError, setPageError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch('/api/documents/list');
      if (!res.ok) throw new Error('Failed to fetch documents');
      const data = await res.json();
      setDocuments(data.documents || []);
      setStats(data.stats || null);
      return data.documents?.length ?? 0;
    } catch (err) {
      console.error('Fetch error:', err);
      setPageError('Failed to load documents. Please refresh.');
      return 0;
    }
  }, []);

  // Auto-seed on first load
  useEffect(() => {
    let cancelled = false;

    async function init() {
      setIsLoading(true);
      try {
        // First fetch to check if documents exist
        const count = await fetchDocuments();

        if (count === 0 && !cancelled) {
          // Auto-seed
          setIsSeeding(true);
          try {
            const seedRes = await fetch('/api/seed', { method: 'POST' });
            if (seedRes.ok) {
              const seedData = await seedRes.json();
              if (seedData.success) {
                setSeeded(true);
                // Re-fetch after seeding
                await fetchDocuments();
              }
            }
          } catch (e) {
            console.error('Auto-seed error:', e);
          } finally {
            setIsSeeding(false);
          }
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  const handleRefresh = useCallback(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleQueryComplete = useCallback(() => {
    setQueryCount((c) => c + 1);
  }, []);

  const tabContent = {
    dashboard: (
      <DashboardView documents={documents} queryCount={queryCount} stats={stats} />
    ),
    documents: (
      <DocumentsView documents={documents} onRefresh={handleRefresh} />
    ),
    query: (
      <QueryView documents={documents} onQueryComplete={handleQueryComplete} />
    ),
    compliance: <ComplianceView documents={documents} />,
    colab: <ColabView />,
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 pt-20 pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  NEXUS
                  <span className="text-muted-foreground font-normal text-lg">
                    Finance RAG
                  </span>
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Multi-agent retrieval-augmented generation for enterprise financial intelligence
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isSeeding && (
                  <Badge variant="secondary" className="text-[10px] gap-1 animate-pulse">
                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                    Seeding...
                  </Badge>
                )}
                {seeded && !isSeeding && (
                  <Badge variant="secondary" className="text-[10px] gap-1 text-emerald-600">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    Demo data loaded
                  </Badge>
                )}
                {documents.length > 0 && (
                  <Badge variant="outline" className="text-[10px] gap-1">
                    <Database className="w-2.5 h-2.5" />
                    {documents.length} docs • {stats?.totalChunks ?? 0} chunks
                  </Badge>
                )}
              </div>
            </div>
          </motion.div>

          {/* Error banner */}
          {pageError && (
            <div className="mb-4 text-sm text-red-600 flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {pageError}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setPageError(null); handleRefresh(); }}
                className="ml-auto h-7 text-xs"
              >
                Retry
              </Button>
            </div>
          )}

          {/* Loading state */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-4" />
              <p className="text-sm text-muted-foreground">
                {isSeeding ? 'Seeding demo data...' : 'Loading NEXUS...'}
              </p>
            </div>
          ) : (
            /* Tab content */
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {tabContent[activeTab as keyof typeof tabContent]}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-5 h-5 rounded bg-emerald-600 flex items-center justify-center">
                <Network className="w-3 h-3 text-white" />
              </div>
              <span className="font-medium">NEXUS</span>
              <span>•</span>
              <span>Agentic Intelligence for Finance</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Cpu className="w-3 h-3" />
                Multi-Agent RAG
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Compliance Engine
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Real-time
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
