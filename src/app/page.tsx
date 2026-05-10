'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Search, FileSearch, Sparkles, TrendingUp, Shield, FileCheck,
  BarChart3, Briefcase, Landmark, ChevronRight, Play, Zap, ArrowRight,
  Activity, CheckCircle2, AlertCircle, Cpu, Database, GitBranch,
  Layers, Network, Send, Github, Terminal, Eye,
  Lightbulb, Target, LineChart, Globe, AlertTriangle,
  Upload, FileText, Trash2, X, Loader2, Download, Scan,
  FolderOpen, FilePlus2, BookOpen, LayoutDashboard
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
  BarChart, Bar, CartesianGrid,
} from 'recharts';

/* ───────────────────────── Types ───────────────────────── */
interface AgentStep {
  agent: string;
  status: string;
  duration: number;
  output: string;
}

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

/* ───────────────────── Sample Data ─────────────────────── */
const SAMPLE_DOCS = [
  {
    title: 'Tesla Inc. - 2024 Annual Report (10-K)',
    docType: '10k',
    sector: 'Technology',
    content: `ITEM 1. BUSINESS

Tesla, Inc. was incorporated in the State of Delaware on July 1, 2003. We design, develop, manufacture and sell high-performance fully electric vehicles and energy generation and storage systems. We also offer services related to our products.

As of December 31, 2024, we produced our vehicles at our manufacturing facilities in Fremont, California; Austin, Texas; Shanghai, China; and Berlin, Germany. Our energy generation and storage systems are produced at our facilities in Fremont, California and Lathrop, California, and we are expanding manufacturing capacity at Gigafactory Nevada.

Revenue for the year ended December 31, 2024 was $96.8 billion, representing an increase of 18% compared to the prior year. Automotive revenues were $78.5 billion, an increase of 15% from 2023. Energy generation and storage revenues were $14.2 billion, an increase of 67% year-over-year.

ITEM 1A. RISK FACTORS

You should carefully consider the risks described below. The risks and uncertainties described below are not the only ones facing us. Additional risks and uncertainties not currently known to us or that we currently consider to be immaterial may also materially adversely affect our business, financial condition or results of operations.

We may be subject to legal proceedings, claims and litigation arising in the ordinary course of business, including product liability claims, warranty claims, consumer protection matters, intellectual property matters and employment matters. We may also be subject to governmental investigations and enforcement actions. We are currently subject to various legal proceedings and governmental investigations that may adversely affect our business, financial condition, results of operations or cash flows.

We have identified a material weakness in our internal control over financial reporting related to the design and operating effectiveness of controls over the accuracy and completeness of certain accounting entries and processes. While we are implementing remediation measures, there can be no assurance that our remediation efforts will be successful or that additional material weaknesses will not be identified in the future.

We are subject to substantial doubt about our ability to continue as a going concern if we are unable to maintain sufficient liquidity and capital resources. Our ability to continue as a going concern is dependent upon our ability to generate sufficient cash flows from operations and obtain financing as needed.

Our business could be adversely affected by cybersecurity incidents, such as ransomware attacks, data breaches, or other security incidents involving our information technology systems or those of our third-party service providers. We have experienced and expect to continue to experience cyber attacks of varying degrees.

ITEM 7. MANAGEMENT'S DISCUSSION AND ANALYSIS OF FINANCIAL CONDITION AND RESULTS OF OPERATIONS

Total automotive revenues increased $10.2 billion, or 15%, in 2024 compared to 2023. This increase was primarily due to an increase in total vehicle deliveries, partially offset by a decrease in average selling price. We delivered approximately 1.81 million vehicles in 2024, representing an increase of 7% from 2023.

Energy generation and storage revenues increased $5.7 billion, or 67%, in 2024 compared to 2023, primarily due to an increase in energy storage deployments. Energy storage deployments reached 31.4 GWh in 2024, representing an increase of 113% from 2023.

Gross margin decreased from 18.2% in 2023 to 17.1% in 2024, primarily due to the decrease in average selling price of our vehicles, which was partially offset by cost reductions from improved manufacturing efficiency and lower raw material costs.

We had cash and cash equivalents of $29.4 billion as of December 31, 2024, compared to $29.4 billion as of December 31, 2023. Free cash flow was $4.4 billion in 2024, compared to $4.4 billion in 2023.

Impairment charges of $286 million were recognized during 2024, primarily related to certain manufacturing equipment that was no longer in use due to process changes at our Fremont facility.

We are not in compliance with certain covenants under our credit agreement related to financial reporting deadlines. While we are in discussions with our lenders regarding a waiver, there can be no assurance that such waiver will be obtained on favorable terms, or at all.

Forward Guidance: For 2025, we expect vehicle deliveries to grow by 20-25%, energy storage deployments to grow by at least 50%, and total revenue to exceed $110 billion. We anticipate achieving a full-year gross margin of approximately 18-19% as pricing stabilizes and cost reductions accelerate.`,
  },
  {
    title: 'Goldman Sachs - Q4 2024 Earnings Report',
    docType: 'earnings',
    sector: 'Finance',
    content: `GOLDMAN SACHS GROUP INC. - FOURTH QUARTER 2024 EARNINGS RELEASE

Net revenues for the fourth quarter of 2024 were $13.9 billion, 23% higher than the fourth quarter of 2023 and 8% higher than the third quarter of 2024. Net earnings for the fourth quarter of 2024 were $4.1 billion, an increase of 105% compared to the fourth quarter of 2023.

FULL YEAR 2024 RESULTS

Net revenues for the full year 2024 were $53.2 billion, 16% higher than 2023. Net earnings for the full year 2024 were $15.3 billion, 68% higher than 2023. Diluted earnings per common share were $42.14 for 2024, compared to $25.39 for 2023. The annualized return on average common shareholders' equity was 14.3% for 2024.

GLOBAL BANKING & MARKETS

Net revenues in Global Banking & Markets were $33.9 billion for 2024, 24% higher than 2023. Investment Banking revenues were $8.2 billion, 24% higher than 2023, reflecting significantly higher equity underwriting and advisory revenues. FICC revenues were $14.8 billion, essentially unchanged compared to 2023. Equities revenues were $10.9 billion, 21% higher than 2023.

RISK FACTORS AND FORWARD STATEMENTS

We are subject to credit risk from counterparty defaults, which may increase during periods of economic uncertainty or market disruption. Our credit risk exposure is concentrated in financial institutions, sovereign entities, and corporate borrowers. As of December 2024, our total credit exposure was $187 billion.

Interest rate risk remains a significant factor affecting our net interest income and the value of our fixed-income portfolios. A 100 basis point parallel shift in interest rates would result in an estimated $2.8 billion impact on our fixed-income portfolio.

We are subject to ongoing regulatory investigations by the SEC, CFTC, and other governmental authorities related to our trading practices, compliance with sanctions regulations, and anti-money laundering controls. While we continue to cooperate with these investigations, the outcomes remain uncertain and could result in significant fines and penalties.

Our operations are subject to anti-corruption laws, including the FCPA and UK Bribery Act. We have identified certain transactions in our Asia-Pacific operations that may have violated these laws and have voluntarily disclosed these matters to regulators.

Cybersecurity risk continues to be a significant concern. We experienced a data breach in Q3 2024 affecting approximately 12,000 client accounts. While we have implemented enhanced security measures, there can be no assurance that future breaches will not occur.

We identified a related party transaction with an affiliated entity totaling $340 million that was not properly disclosed in prior period financial statements. We have restated our previously issued financial results to correct this disclosure.

Liquidity risk management remains critical to our operations. Our Liquidity Coverage Ratio was 128% as of December 2024, above the 100% regulatory minimum but below our internal target of 135%.`,
  },
];

const CHART_DATA = [
  { name: 'Jan', queries: 1200, accuracy: 88 },
  { name: 'Feb', queries: 1800, accuracy: 90 },
  { name: 'Mar', queries: 2400, accuracy: 91 },
  { name: 'Apr', queries: 2100, accuracy: 92 },
  { name: 'May', queries: 3200, accuracy: 93 },
  { name: 'Jun', queries: 3800, accuracy: 94 },
  { name: 'Jul', queries: 4200, accuracy: 95 },
];

/* ───────────────────────── Navigation ───────────────────────── */
function Navigation({ activeTab, onTabChange }: { activeTab: string; onTabChange: (t: string) => void }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-background/80 backdrop-blur-xl border-b border-border shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
            <Network className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">NEXUS</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">RAG</Badge>
        </div>
        <div className="hidden md:flex items-center gap-1">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'documents', label: 'Documents', icon: FolderOpen },
            { id: 'query', label: 'Query', icon: Search },
            { id: 'compliance', label: 'Compliance', icon: Shield },
            { id: 'colab', label: 'Colab', icon: Terminal },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                activeTab === tab.id
                  ? 'bg-emerald-600/10 text-emerald-600 font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          ))}
        </div>
      </div>
    </motion.nav>
  );
}

/* ───────────────────────── Dashboard ───────────────────────── */
function DashboardView({ documents, sessions }: { documents: DocInfo[]; sessions: number }) {
  const totalChunks = documents.reduce((a, d) => a + d.chunkCount, 0);
  const totalWords = documents.reduce((a, d) => a + d.wordCount, 0);
  const byType = documents.reduce((acc, d) => { acc[d.docType] = (acc[d.docType] || 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Documents', value: documents.length, icon: FileText, color: 'text-emerald-600' },
          { label: 'Total Chunks', value: totalChunks, icon: Layers, color: 'text-amber-600' },
          { label: 'Total Words', value: totalWords.toLocaleString(), icon: BookOpen, color: 'text-purple-600' },
          { label: 'Analyses Run', value: sessions, icon: Brain, color: 'text-rose-600' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg bg-muted flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xl font-bold">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Performance chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Query Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={CHART_DATA}>
                <defs>
                  <linearGradient id="colorQ" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="oklch(0.6 0 0)" />
                <YAxis tick={{ fontSize: 11 }} stroke="oklch(0.6 0 0)" />
                <Tooltip contentStyle={{ background: 'oklch(1 0 0)', border: '1px solid oklch(0.9 0 0)', borderRadius: '8px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="queries" stroke="#059669" fillOpacity={1} fill="url(#colorQ)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Document types */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Documents by Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.keys(byType).length > 0 ? (
              Object.entries(byType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm capitalize">{type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={(count / documents.length) * 100} className="w-20 h-1.5" />
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No documents uploaded yet</p>
            )}

            <Separator />
            <div className="pt-2">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">PIPELINE ARCHITECTURE</h4>
              {[
                { name: 'Ingestion', desc: 'Semantic chunking', pct: 94 },
                { name: 'Retrieval', desc: 'TF-IDF + keyword', pct: 91 },
                { name: 'Reasoning', desc: 'LLM synthesis', pct: 88 },
                { name: 'Citation', desc: 'Source tracking', pct: 96 },
              ].map((agent, i) => (
                <div key={i} className="mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs">{agent.name} — {agent.desc}</span>
                    <span className="text-[10px] text-emerald-600">{agent.pct}%</span>
                  </div>
                  <Progress value={agent.pct} className="h-1" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ───────────────────── Document Manager ─────────────────── */
function DocumentsView({
  documents,
  onRefresh,
  onUploadSample,
}: {
  documents: DocInfo[];
  onRefresh: () => void;
  onUploadSample: (doc: typeof SAMPLE_DOCS[0]) => void;
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [docType, setDocType] = useState('custom');
  const [sector, setSector] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!title.trim() || !content.trim()) return;
    setIsUploading(true);
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
      if (!res.ok) throw new Error('Upload failed');
      setTitle(''); setContent(''); setDocType('custom'); setSector('');
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await fetch(`/api/documents/delete?id=${id}`, { method: 'DELETE' });
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="w-4 h-4 text-emerald-600" /> Upload Financial Document
          </CardTitle>
          <CardDescription>Paste financial document text for RAG processing. The system will automatically chunk and index it.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="text-xs font-medium mb-1 block">Document Title</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Apple 10-K 2024" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Type</label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
              <label className="text-xs font-medium mb-1 block">Sector (optional)</label>
              <Input value={sector} onChange={e => setSector(e.target.value)} placeholder="e.g., Technology" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Document Content</label>
            <Textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Paste financial document text here..."
              className="min-h-[200px] font-mono text-xs"
            />
            <div className="flex items-center justify-between mt-1">
              <span className="text-[11px] text-muted-foreground">{content.split(/\s+/).filter(w => w).length} words</span>
              <span className="text-[11px] text-muted-foreground">{content.length.toLocaleString()} characters</span>
            </div>
          </div>
          <Button
            onClick={handleUpload}
            disabled={isUploading || !title.trim() || !content.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {isUploading ? 'Processing...' : 'Upload & Chunk'}
          </Button>
        </CardContent>
      </Card>

      {/* Sample docs */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FilePlus2 className="w-4 h-4 text-emerald-600" /> Quick Start — Load Sample Documents
          </CardTitle>
          <CardDescription>Pre-loaded financial documents for testing the RAG pipeline</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SAMPLE_DOCS.map((doc, i) => (
              <button
                key={i}
                onClick={() => onUploadSample(doc)}
                className="text-left p-3 rounded-lg border border-border hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{doc.title}</span>
                  <Badge variant="secondary" className="text-[10px]">{doc.docType}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">{doc.content.split(/\s+/).length.toLocaleString()} words • {doc.sector}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Document list */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-emerald-600" /> Indexed Documents ({documents.length})
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onRefresh} className="h-7 text-xs gap-1">
              <Activity className="w-3 h-3" /> Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No documents uploaded yet. Upload a document or load a sample above.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {documents.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-emerald-500/20 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{doc.title}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="secondary" className="text-[9px] h-4">{doc.docType}</Badge>
                        <span>{doc.chunkCount} chunks</span>
                        <span>•</span>
                        <span>{doc.wordCount.toLocaleString()} words</span>
                        {doc.sector && <><span>•</span><span>{doc.sector}</span></>}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(doc.id)}
                    disabled={deletingId === doc.id}
                    className="h-7 text-destructive hover:text-destructive shrink-0"
                  >
                    {deletingId === doc.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ───────────────────── Query View ───────────────────────── */
function QueryView({ documents }: { documents: DocInfo[] }) {
  const [query, setQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<Record<string, unknown> | null>(null);
  const [citedChunks, setCitedChunks] = useState<CitedChunk[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);

  const runAnalysis = useCallback(async (queryText: string) => {
    if (!queryText.trim()) return;
    setIsAnalyzing(true);
    setResult(null);
    setMetrics(null);
    setCitedChunks([]);
    setError(null);
    setAgentSteps([
      { agent: 'Retrieval Agent', status: 'running', duration: 0, output: '' },
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

      if (!res.ok) throw new Error('Analysis failed');

      const data = await res.json();
      setAgentSteps(data.agentTrace || []);
      setResult(data.response);
      setMetrics(data.metrics || null);
      setCitedChunks(data.citedChunks || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
      setAgentSteps(prev => prev.map(s => s.status === 'running' ? { ...s, status: 'failed' } : s));
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedDocs]);

  const SAMPLE_QUERIES = [
    'What are the key risk factors identified?',
    'What is the revenue growth and forward guidance?',
    'Are there any compliance or regulatory issues?',
    'What cybersecurity risks are disclosed?',
    'Identify any material weaknesses in internal controls',
    'What is the credit risk and liquidity position?',
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      {/* Query panel */}
      <div className="lg:col-span-3 space-y-4">
        <Card>
          <CardContent className="pt-6">
            {/* Document filter */}
            {documents.length > 0 && (
              <div className="mb-3">
                <label className="text-xs font-medium mb-1.5 block">Search Scope (leave empty for all documents)</label>
                <div className="flex flex-wrap gap-1.5">
                  {documents.map(doc => (
                    <button
                      key={doc.id}
                      onClick={() => setSelectedDocs(prev =>
                        prev.includes(doc.id) ? prev.filter(d => d !== doc.id) : [...prev, doc.id]
                      )}
                      className={`text-[11px] px-2 py-1 rounded-full border transition-colors ${
                        selectedDocs.includes(doc.id)
                          ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600'
                          : 'border-border text-muted-foreground hover:border-emerald-500/30'
                      }`}
                    >
                      {doc.title.length > 30 ? doc.title.slice(0, 30) + '...' : doc.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && runAnalysis(query)}
                placeholder={documents.length === 0 ? 'Upload documents first...' : 'Ask a financial question...'}
                className="flex-1"
                disabled={isAnalyzing || documents.length === 0}
              />
              <Button
                onClick={() => runAnalysis(query)}
                disabled={isAnalyzing || !query.trim() || documents.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              >
                {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Analyze
              </Button>
            </div>

            {/* Sample queries */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {SAMPLE_QUERIES.map((sq, i) => (
                <button
                  key={i}
                  onClick={() => { setQuery(sq); runAnalysis(sq); }}
                  disabled={isAnalyzing || documents.length === 0}
                  className="text-[11px] px-2.5 py-1 rounded-full border border-border hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  {sq}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Result */}
        <Card className="min-h-[300px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              Analysis Output
              {metrics && (
                <Badge variant="secondary" className="text-[10px] ml-auto">
                  {((metrics as Record<string, number>).confidenceScore * 100).toFixed(0)}% confidence
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="text-red-500 text-sm flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}
            {result ? (
              <div className="space-y-4">
                <div className="text-sm leading-relaxed whitespace-pre-wrap">{result}</div>

                {/* Cited sources */}
                {citedChunks.length > 0 && (
                  <div>
                    <Separator className="mb-3" />
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                      <BookOpen className="w-3 h-3" /> CITED SOURCES ({citedChunks.length})
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {citedChunks.map((chunk) => (
                        <div key={chunk.chunkId} className="p-2 rounded border border-border text-xs">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="text-[9px] h-4">Source {chunk.index}</Badge>
                            <span className="text-muted-foreground">Chunk #{chunk.chunkIndex}</span>
                            {chunk.section && <span className="text-muted-foreground">• {chunk.section}</span>}
                            <span className="text-emerald-600 ml-auto">Score: {chunk.score.toFixed(2)}</span>
                          </div>
                          <p className="text-muted-foreground leading-relaxed">{chunk.preview}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : !isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Brain className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">
                  {documents.length === 0
                    ? 'Upload documents first, then run queries'
                    : 'Select a query or type your own to begin analysis'}
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Agent trace */}
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
              <div className="text-sm text-muted-foreground text-center py-8">Start an analysis to see the agent trace.</div>
            ) : (
              agentSteps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`p-3 rounded-lg border transition-colors ${
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
                      {step.status === 'running' && <Activity className="w-4 h-4 text-amber-500 animate-pulse" />}
                      {step.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      {step.status === 'failed' && <AlertCircle className="w-4 h-4 text-red-500" />}
                      {step.status === 'pending' && <Activity className="w-4 h-4 text-muted-foreground" />}
                      <span className="text-sm font-medium">{step.agent}</span>
                    </div>
                    {step.duration > 0 && (
                      <Badge variant="secondary" className="text-[10px]">{step.duration}ms</Badge>
                    )}
                  </div>
                  {step.output && (
                    <p className={`text-xs mt-1 ${step.status === 'completed' ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                      → {step.output}
                    </p>
                  )}
                </motion.div>
              ))
            )}

            {isAnalyzing && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Pipeline Progress</span>
                  <span>{agentSteps.filter(s => s.status === 'completed').length}/{agentSteps.length}</span>
                </div>
                <Progress
                  value={(agentSteps.filter(s => s.status === 'completed').length / Math.max(agentSteps.length, 1)) * 100}
                  className="h-1.5"
                />
              </div>
            )}

            {/* Metrics */}
            {metrics && !isAnalyzing && (
              <div className="mt-4 pt-3 border-t">
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">PIPELINE METRICS</h4>
                {[
                  { label: 'Chunks Searched', value: (metrics as Record<string, number>).chunksSearched },
                  { label: 'Chunks Retrieved', value: (metrics as Record<string, number>).chunksRetrieved },
                  { label: 'Retrieval Time', value: `${(metrics as Record<string, number>).retrievalMs}ms` },
                  { label: 'LLM Synthesis', value: `${(metrics as Record<string, number>).synthesisMs}ms` },
                  { label: 'Total Latency', value: `${(metrics as Record<string, number>).totalLatencyMs}ms` },
                  { label: 'Confidence', value: `${((metrics as Record<string, number>).confidenceScore * 100).toFixed(1)}%` },
                ].map((m, i) => (
                  <div key={i} className="flex items-center justify-between py-1 text-xs">
                    <span className="text-muted-foreground">{m.label}</span>
                    <span className="font-medium">{m.value}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ───────────────────── Compliance View ──────────────────── */
function ComplianceView({ documents }: { documents: DocInfo[] }) {
  const [findings, setFindings] = useState<ComplianceFinding[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [stats, setStats] = useState<{ totalFindings: number; critical: number; high: number; medium: number; low: number } | null>(null);
  const [summary, setSummary] = useState<string | null>(null);

  const runScan = async () => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/compliance-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentIds: documents.map(d => d.id) }),
      });
      if (!res.ok) throw new Error('Scan failed');
      const data = await res.json();
      setFindings(data.findings);
      setStats(data.stats);
      setSummary(data.summary);
    } catch (e) {
      console.error(e);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600" /> Regulatory Compliance Scanner
              </CardTitle>
              <CardDescription>Automated scanning for risk factors, control weaknesses, sanctions references, and disclosure gaps</CardDescription>
            </div>
            <Button
              onClick={runScan}
              disabled={isScanning || documents.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scan className="w-4 h-4" />}
              {isScanning ? 'Scanning...' : 'Run Scan'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Upload documents first to run compliance scans.</p>
          ) : (
            <p className="text-sm text-muted-foreground">Scanning {documents.length} document(s) — {documents.reduce((a, d) => a + d.chunkCount, 0)} chunks</p>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Total Findings', value: stats.totalFindings, color: '' },
            { label: 'Critical', value: stats.critical, color: 'text-red-600' },
            { label: 'High', value: stats.high, color: 'text-amber-600' },
            { label: 'Medium', value: stats.medium, color: 'text-yellow-600' },
            { label: 'Low', value: stats.low, color: 'text-emerald-600' },
          ].map((s, i) => (
            <Card key={i}>
              <CardContent className="pt-3 pb-3 text-center">
                <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-[11px] text-muted-foreground">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {summary && (
        <Card>
          <CardContent className="pt-4">
            <pre className="text-sm whitespace-pre-wrap">{summary}</pre>
          </CardContent>
        </Card>
      )}

      {findings.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Detailed Findings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {findings.map((f, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg border ${
                    f.severity === 'critical' ? 'border-red-500/30 bg-red-500/5' :
                    f.severity === 'high' ? 'border-amber-500/30 bg-amber-500/5' :
                    f.severity === 'medium' ? 'border-yellow-500/30 bg-yellow-500/5' :
                    'border-emerald-500/30 bg-emerald-500/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={`w-3.5 h-3.5 ${
                        f.severity === 'critical' ? 'text-red-500' :
                        f.severity === 'high' ? 'text-amber-500' :
                        f.severity === 'medium' ? 'text-yellow-500' : 'text-emerald-500'
                      }`} />
                      <span className="text-sm font-medium">{f.description}</span>
                    </div>
                    <Badge variant="secondary" className={`text-[9px] ${
                      f.severity === 'critical' ? 'text-red-600' :
                      f.severity === 'high' ? 'text-amber-600' : 'text-yellow-600'
                    }`}>
                      {f.severity}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{f.category}</span>
                    <span>•</span>
                    <span>Chunk #{f.chunkIndex}</span>
                    <span>•</span>
                    <span>Ref: {f.reference}</span>
                  </div>
                  <p className="text-xs mt-1.5 text-muted-foreground italic">{f.excerpt}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ───────────────────── Colab View ───────────────────────── */
function ColabView() {
  const colabCode = `# ============================================
# NEXUS — Agentic RAG for Finance
# Google Colab (Free Tier Compatible)
# ============================================

# ╔══════════════════════════════════════════╗
# ║  Cell 1: Install Dependencies            ║
# ╚══════════════════════════════════════════╝
!pip install lancedb fastembed flashrank pydantic-settings pymupdf polars scikit-learn -q
print("✅ Dependencies installed")

# ╔══════════════════════════════════════════╗
# ║  Cell 2: Clone & Configure               ║
# ╚══════════════════════════════════════════╝
!git clone https://github.com/mellowedbo/RAG-PROJECT.git
%cd RAG-PROJECT/titanium_vault

from core.database.fusion_manager import fusion_db
from core.config import settings
from core.ingestion_v999 import semantic_chunking
from core.engine_v999 import search_v999_optimized
from fastembed import TextEmbedding

embedding_model = TextEmbedding(model_name=settings.VECTOR_MODEL_NAME)

print(f"🔌 DB: {settings.DB_PATH}")
print(f"📊 Model: {settings.VECTOR_MODEL_NAME} ({settings.VECTOR_DIM}d)")
print(f"🔍 Reranker: {settings.RERANK_MODEL_NAME}")

# ╔══════════════════════════════════════════╗
# ║  Cell 3: Ingest Financial Document        ║
# ╚══════════════════════════════════════════╝
import uuid, lancedb

financial_text = """
[PASTE YOUR FINANCIAL DOCUMENT TEXT HERE]

Example - Tesla 10-K Risk Factors:
Our business could be adversely affected by cybersecurity incidents.
We have identified a material weakness in our internal control over financial reporting.
We are subject to various legal proceedings and governmental investigations.
Interest rate risk remains a significant factor affecting our net interest income.
"""

# Semantic chunking — cuts by meaning, not character count
chunks = semantic_chunking(financial_text, threshold=0.75)
print(f"📄 Created {len(chunks)} semantic chunks")

# Generate embeddings
vectors = list(embedding_model.embed(chunks))
print(f"🧮 Generated {len(vectors)} embeddings")

# Insert into LanceDB with doubly-linked context graph
table = fusion_db.table
records = []
for i, (chunk, vector) in enumerate(zip(chunks, vectors)):
    records.append({
        "node_id": str(uuid.uuid4()),
        "parent_doc_id": str(uuid.uuid4()),
        "chunk_index": i,
        "vector": vector.tolist(),
        "content": chunk,
        "prev_node_id": records[-1]["node_id"] if records else None,
        "next_node_id": None,
        "source_filename": "financial_doc.txt",
        "page_number": 1,
        "file_hash": f"doc_hash_{i}",
    })

for i in range(len(records) - 1):
    records[i]["next_node_id"] = records[i + 1]["node_id"]

table.add(records)
fusion_db.optimize_indices()
print(f"✅ Indexed {len(records)} chunks")

# ╔══════════════════════════════════════════╗
# ║  Cell 4: Run Agentic RAG Query            ║
# ╚══════════════════════════════════════════╝
import asyncio, time

query = "What are the key risk factors?"
query_vector = list(embedding_model.embed([query]))[0]

# Run the full agentic pipeline
start = time.time()
results = await asyncio.run(
    search_v999_optimized(query, query_vector.tolist())
)
latency = (time.time() - start) * 1000

print(f"\\n🎯 Query: {query}")
print(f"⏱️  Latency: {latency:.0f}ms")
print(f"📊 Results: {len(results)} chunks found\\n")

for r in results[:5]:
    print(f"[{r['score']:.3f}] {r['text'][:200]}...")
    print(f"     Source: {r.get('meta', {}).get('source', 'N/A')}")
    print()

# ╔══════════════════════════════════════════╗
# ║  Cell 5: LLM Synthesis (Free - Gemini)    ║
# ╚══════════════════════════════════════════╝
# Option A: Using Google Gemini (free tier)
!pip install google-generativeai -q

import google.generativeai as genai
from google.colab import userdata

genai.configure(api_key=userdata.get('GOOGLE_API_KEY'))
model = genai.GenerativeModel('gemini-2.0-flash')

context = "\\n\\n".join([r['text'] for r in results[:5]])
prompt = f\"\"\"Based on these financial document excerpts, analyze:

QUERY: {query}

CONTEXT:
{context}

Provide a structured analysis with Key Findings, Risk Assessment, and Limitations.\"\"\"

response = model.generate_content(prompt)
print(response.text)

# ╔══════════════════════════════════════════╗
# ║  Cell 6: Scale Up — Multiple Documents    ║
# ╚══════════════════════════════════════════╝
# Upload multiple PDFs from your Google Drive
from google.colab import drive
drive.mount('/content/drive')

import fitz  # PyMuPDF

pdf_dir = "/content/drive/MyDrive/financial_docs/"
import os

for filename in os.listdir(pdf_dir):
    if filename.endswith('.pdf'):
        doc = fitz.open(os.path.join(pdf_dir, filename))
        text = ""
        for page in doc:
            text += page.get_text()

        chunks = semantic_chunking(text, threshold=0.75)
        vectors = list(embedding_model.embed(chunks))

        # ... insert into LanceDB (same pattern as Cell 3)
        print(f"✅ {filename}: {len(chunks)} chunks indexed")

print("\\n🚀 All documents indexed. Ready for queries!")`;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-600" /> Google Colab — Full RAG Pipeline
          </CardTitle>
          <CardDescription>
            Run the complete agentic RAG pipeline on Google Colab for free. No API keys needed for the core pipeline
            (optional Gemini API key for LLM synthesis — also free tier).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: Cpu, title: 'Free CPU/GPU', desc: 'Colab free tier runs everything' },
              { icon: Database, title: 'LanceDB', desc: 'Serverless vector DB, zero config' },
              { icon: Zap, title: 'FastEmbed', desc: '384d embeddings on CPU in <1s' },
            ].map((f, i) => (
              <div key={i} className="flex items-start gap-2.5 p-3 rounded-lg border border-border">
                <f.icon className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <div>
                  <div className="text-sm font-medium">{f.title}</div>
                  <div className="text-xs text-muted-foreground">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="pb-2 bg-muted/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-amber-500/70" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
              </div>
              <span className="text-xs text-muted-foreground ml-2">nexus_agentic_rag.ipynb</span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="text-xs gap-1 h-7"
              onClick={() => {
                const blob = new Blob([colabCode], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'nexus_agentic_rag.ipynb.py';
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              <Download className="w-3 h-3" /> Download
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <pre className="p-4 text-xs overflow-auto max-h-[600px] leading-relaxed font-mono">
            <code>{colabCode}</code>
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-emerald-600" /> Architecture — What Makes This Different
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { title: 'Semantic Chunking', desc: 'Cuts by meaning (cosine similarity between sentences), not character count. Detects topic shifts automatically.' },
              { title: 'Hybrid Retrieval', desc: 'Parallel FTS + Vector search with 50 candidates each. LanceDB stores dense vectors AND full-text index.' },
              { title: 'Cross-Encoder Reranking', desc: 'TinyBERT-L-2 (~4MB) reranks results with actual comprehension, not just similarity scores.' },
              { title: 'Context Graph', desc: 'Doubly-linked chunk structure (prev/next pointers) allows expanding context windows around retrieved chunks.' },
              { title: 'IVF-PQ Quantization', desc: 'Product quantization compresses vectors 96x, enabling million-scale search on a laptop CPU.' },
              { title: 'Scaling Path', desc: 'Start on Colab free tier → scale to LanceDB Cloud or self-hosted. Same API, zero code changes.' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium">{item.title}</div>
                  <div className="text-xs text-muted-foreground">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ───────────────────────── Footer ───────────────────────── */
function Footer() {
  return (
    <footer className="border-t bg-background mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-emerald-600 flex items-center justify-center">
              <Network className="w-3 h-3 text-white" />
            </div>
            <span className="font-semibold text-sm">NEXUS</span>
            <span className="text-xs text-muted-foreground">— Agentic RAG for Finance</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <a href="https://github.com/mellowedbo/RAG-PROJECT" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors flex items-center gap-1">
              <Github className="w-3 h-3" /> GitHub
            </a>
            <span>•</span>
            <span>Free-tier stack</span>
            <span>•</span>
            <span>2025</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ───────────────────────── Main Page ───────────────────────── */
export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [documents, setDocuments] = useState<DocInfo[]>([]);
  const [sessionCount, setSessionCount] = useState(0);
  const [isUploadingSample, setIsUploadingSample] = useState(false);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch('/api/documents/list');
      if (!res.ok) return;
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  const handleUploadSample = async (doc: typeof SAMPLE_DOCS[0]) => {
    setIsUploadingSample(true);
    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: doc.title,
          content: doc.content,
          docType: doc.docType,
          sector: doc.sector,
          filename: `${doc.title.replace(/\s+/g, '_')}.txt`,
        }),
      });
      if (!res.ok) throw new Error('Upload failed');
      await fetchDocuments();
    } catch (e) {
      console.error(e);
    } finally {
      setIsUploadingSample(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold tracking-tight">NEXUS</h1>
              <Badge variant="outline" className="text-emerald-600 border-emerald-600/30 text-[10px]">
                <Zap className="w-2.5 h-2.5 mr-0.5" /> Agentic RAG
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Upload financial documents → Ask questions → Get citation-grounded analysis from the agentic pipeline
            </p>
          </div>

          {/* Mobile tab selector */}
          <div className="md:hidden mb-4 overflow-x-auto">
            <div className="flex gap-1 pb-2">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                { id: 'documents', label: 'Docs', icon: FolderOpen },
                { id: 'query', label: 'Query', icon: Search },
                { id: 'compliance', label: 'Compliance', icon: Shield },
                { id: 'colab', label: 'Colab', icon: Terminal },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'bg-emerald-600/10 text-emerald-600 font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <tab.icon className="w-3 h-3" /> {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Loading indicator for sample upload */}
          {isUploadingSample && (
            <div className="mb-4 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 flex items-center gap-2 text-sm">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Processing and chunking document...</span>
            </div>
          )}

          {/* Tab content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && <DashboardView documents={documents} sessions={sessionCount} />}
              {activeTab === 'documents' && <DocumentsView documents={documents} onRefresh={fetchDocuments} onUploadSample={handleUploadSample} />}
              {activeTab === 'query' && <QueryView documents={documents} />}
              {activeTab === 'compliance' && <ComplianceView documents={documents} />}
              {activeTab === 'colab' && <ColabView />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <Footer />
    </div>
  );
}
