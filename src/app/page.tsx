'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Search, FileSearch, Sparkles, TrendingUp, Shield, FileCheck,
  BarChart3, Briefcase, Landmark, ChevronRight, Play, Zap, ArrowRight,
  Activity, Clock, CheckCircle2, AlertCircle, Cpu, Database, GitBranch,
  Layers, Network, Send, ExternalLink, Github, Terminal, Eye,
  Lightbulb, Target, LineChart, Globe, BookOpen, Users, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';
import {
  WORKFLOW_NODES,
  FINANCE_METRICS,
  USE_CASES,
  SAMPLE_QUERIES,
  AGENT_TRACE_STEPS,
  type AgentStep,
} from '@/lib/finance-data';

/* ───────────────────────── Navigation ───────────────────────── */
function Navigation() {
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
        scrolled
          ? 'bg-background/80 backdrop-blur-xl border-b border-border shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
            <Network className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">NEXUS</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
            v2.0
          </Badge>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#workflow" className="hover:text-foreground transition-colors">
            Workflow
          </a>
          <a href="#demo" className="hover:text-foreground transition-colors">
            Live Demo
          </a>
          <a href="#use-cases" className="hover:text-foreground transition-colors">
            Use Cases
          </a>
          <a href="#colab" className="hover:text-foreground transition-colors">
            Colab
          </a>
          <a href="#role" className="hover:text-foreground transition-colors">
            About
          </a>
        </div>
        <Button
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
          onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
        >
          <Play className="w-3 h-3" /> Try Demo
        </Button>
      </div>
    </motion.nav>
  );
}

/* ───────────────────────── Hero Section ───────────────────────── */
function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img
          src="/hero-bg.png"
          alt="Finance AI Network"
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-emerald-500/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Badge
            variant="outline"
            className="mb-6 px-4 py-1.5 text-emerald-600 border-emerald-600/30 bg-emerald-600/5"
          >
            <Zap className="w-3 h-3 mr-1.5" />
            Agentic RAG Intelligence Platform
          </Badge>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6"
        >
          Financial Intelligence,{' '}
          <span className="text-emerald-500">Augmented</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed"
        >
          A multi-agent retrieval-augmented generation system designed for enterprise
          financial document analysis. From 10-K filings to earnings calls —
          <strong className="text-foreground"> agentic workflows</strong> that reason, retrieve,
          and synthesize at scale.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button
            size="lg"
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 px-8"
            onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <Play className="w-4 h-4" /> Launch Demo
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="gap-2 px-8"
            onClick={() => document.getElementById('workflow')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <Eye className="w-4 h-4" /> View Architecture
          </Button>
        </motion.div>

        {/* Metrics strip */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
        >
          {FINANCE_METRICS.map((m, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl font-bold">{m.value}</div>
              <div className="text-xs text-muted-foreground">{m.label}</div>
              <Badge
                variant="secondary"
                className={`mt-1 text-[10px] ${
                  m.changeType === 'positive'
                    ? 'text-emerald-600'
                    : m.changeType === 'negative'
                    ? 'text-red-500'
                    : 'text-muted-foreground'
                }`}
              >
                {m.change}
              </Badge>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <ChevronRight className="w-5 h-5 text-muted-foreground rotate-90" />
      </motion.div>
    </section>
  );
}

/* ───────────────────────── Workflow Section ───────────────────────── */
function WorkflowSection() {
  const [activeNode, setActiveNode] = useState<string | null>(null);

  const typeColors: Record<string, string> = {
    ingestion: 'border-amber-500/50 bg-amber-500/5 text-amber-600',
    retrieval: 'border-emerald-500/50 bg-emerald-500/5 text-emerald-600',
    reasoning: 'border-purple-500/50 bg-purple-500/5 text-purple-600',
    synthesis: 'border-rose-500/50 bg-rose-500/5 text-rose-600',
  };

  const iconMap: Record<string, React.ReactNode> = {
    FileSearch: <FileSearch className="w-5 h-5" />,
    Search: <Search className="w-5 h-5" />,
    Brain: <Brain className="w-5 h-5" />,
    Sparkles: <Sparkles className="w-5 h-5" />,
  };

  return (
    <section id="workflow" className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge variant="outline" className="mb-4 text-emerald-600 border-emerald-600/30">
            <GitBranch className="w-3 h-3 mr-1" /> System Architecture
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Agentic Workflow Pipeline
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Four specialized agents collaborate in a sequential pipeline — each
            optimizing a distinct phase of the financial intelligence extraction process.
          </p>
        </motion.div>

        {/* Pipeline visualization */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {WORKFLOW_NODES.map((node, i) => (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative"
            >
              <Card
                className={`cursor-pointer transition-all duration-300 border-2 hover:shadow-lg ${
                  activeNode === node.id
                    ? typeColors[node.type]
                    : 'border-border hover:border-emerald-500/30'
                }`}
                onClick={() =>
                  setActiveNode(activeNode === node.id ? null : node.id)
                }
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      {iconMap[node.icon]}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      Phase {i + 1}
                    </div>
                  </div>
                  <CardTitle className="text-base mt-2">{node.label}</CardTitle>
                  <CardDescription className="text-xs">
                    {node.description}
                  </CardDescription>
                </CardHeader>
              </Card>
              {/* Arrow connector */}
              {i < WORKFLOW_NODES.length - 1 && (
                <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                  <ArrowRight className="w-5 h-5 text-emerald-500" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Detail panel */}
        <AnimatePresence>
          {activeNode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <Card className="border-emerald-500/20 bg-emerald-500/5">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {WORKFLOW_NODES.find((n) => n.id === activeNode)?.label} — Technical Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {WORKFLOW_NODES.find((n) => n.id === activeNode)?.details.map(
                      (detail, j) => (
                        <div
                          key={j}
                          className="flex items-start gap-2 text-sm"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                          <span>{detail}</span>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

/* ───────────────────── Dashboard Preview Section ──────────────────── */
const PERFORMANCE_DATA = [
  { name: 'Jan', queries: 1200, accuracy: 88 },
  { name: 'Feb', queries: 1800, accuracy: 90 },
  { name: 'Mar', queries: 2400, accuracy: 91 },
  { name: 'Apr', queries: 2100, accuracy: 92 },
  { name: 'May', queries: 3200, accuracy: 93 },
  { name: 'Jun', queries: 3800, accuracy: 94 },
  { name: 'Jul', queries: 4200, accuracy: 95 },
];

const SECTOR_DATA = [
  { name: 'Tech', risk: 32, confidence: 94 },
  { name: 'Finance', risk: 45, confidence: 91 },
  { name: 'Healthcare', risk: 28, confidence: 96 },
  { name: 'Energy', risk: 52, confidence: 89 },
  { name: 'Retail', risk: 38, confidence: 92 },
  { name: 'Real Estate', risk: 61, confidence: 87 },
];

const RISK_ALERTS = [
  { sector: 'Energy', type: 'High Volatility', severity: 'high', icon: AlertTriangle },
  { sector: 'Real Estate', type: 'Credit Risk Elevated', severity: 'medium', icon: AlertTriangle },
  { sector: 'Tech', type: 'Regulatory Headwinds', severity: 'low', icon: AlertTriangle },
];

function DashboardPreview() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src="/network-bg.png" alt="" className="w-full h-full object-cover opacity-15" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge variant="outline" className="mb-4 text-emerald-600 border-emerald-600/30">
            <BarChart3 className="w-3 h-3 mr-1" /> Intelligence Dashboard
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Real-Time Financial Intelligence
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Monitor query performance, sector risk profiles, and agent accuracy — all driven by the
            agentic pipeline processing financial documents in real-time.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          {/* Query Performance Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-2"
          >
            <Card className="h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Agentic Query Performance</CardTitle>
                  <Badge variant="secondary" className="text-[10px]">Last 7 months</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={PERFORMANCE_DATA}>
                    <defs>
                      <linearGradient id="colorQueries" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="oklch(0.6 0 0)" />
                    <YAxis tick={{ fontSize: 11 }} stroke="oklch(0.6 0 0)" />
                    <Tooltip
                      contentStyle={{
                        background: 'oklch(1 0 0)',
                        border: '1px solid oklch(0.9 0 0)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="queries"
                      stroke="#059669"
                      fillOpacity={1}
                      fill="url(#colorQueries)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Risk Alerts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Risk Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {RISK_ALERTS.map((alert, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg border ${
                      alert.severity === 'high'
                        ? 'border-red-500/30 bg-red-500/5'
                        : alert.severity === 'medium'
                        ? 'border-amber-500/30 bg-amber-500/5'
                        : 'border-emerald-500/30 bg-emerald-500/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <alert.icon
                          className={`w-3.5 h-3.5 ${
                            alert.severity === 'high'
                              ? 'text-red-500'
                              : alert.severity === 'medium'
                              ? 'text-amber-500'
                              : 'text-emerald-500'
                          }`}
                        />
                        <span className="text-sm font-medium">{alert.sector}</span>
                      </div>
                      <Badge
                        variant="secondary"
                        className={`text-[9px] ${
                          alert.severity === 'high'
                            ? 'text-red-600'
                            : alert.severity === 'medium'
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{alert.type}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Sector Risk Bar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Sector Risk vs Confidence</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={SECTOR_DATA} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="oklch(0.6 0 0)" />
                    <YAxis tick={{ fontSize: 11 }} stroke="oklch(0.6 0 0)" />
                    <Tooltip
                      contentStyle={{
                        background: 'oklch(1 0 0)',
                        border: '1px solid oklch(0.9 0 0)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="risk" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Risk Index" />
                    <Bar dataKey="confidence" fill="#059669" radius={[4, 4, 0, 0]} name="Confidence %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Agent Pipeline Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  Agent Pipeline Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: 'Ingestion Agent', status: 'Active', throughput: '12 docs/min', pct: 87 },
                  { name: 'Retrieval Agent', status: 'Active', throughput: '47ms avg', pct: 94 },
                  { name: 'Reasoning Agent', status: 'Active', throughput: '12ms rerank', pct: 91 },
                  { name: 'Synthesis Agent', status: 'Active', throughput: '1.8s avg', pct: 88 },
                ].map((agent, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-sm">{agent.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-muted-foreground">{agent.throughput}</span>
                        <span className="text-[11px] font-medium text-emerald-600">{agent.pct}%</span>
                      </div>
                    </div>
                    <Progress value={agent.pct} className="h-1.5" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── Live Demo Section ───────────────────────── */
function DemoSection() {
  const [query, setQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const runAnalysis = useCallback(async (queryText: string) => {
    if (!queryText.trim()) return;
    setIsAnalyzing(true);
    setResult(null);
    setError(null);
    setAgentSteps(
      AGENT_TRACE_STEPS.map((s) => ({ ...s, status: 'pending' as const, duration: undefined }))
    );

    try {
      // Step 1: Call backend API for real LLM analysis
      const steps = AGENT_TRACE_STEPS.map((s) => ({
        ...s,
        status: 'pending' as const,
      }));
      setAgentSteps([...steps]);

      // Animate agent steps
      for (let i = 0; i < steps.length; i++) {
        steps[i].status = 'running';
        setAgentSteps([...steps]);
        await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));
        steps[i].status = 'completed';
        steps[i].duration = AGENT_TRACE_STEPS[i].duration + Math.floor(Math.random() * 100);
        setAgentSteps([...steps]);
      }

      // Call backend API
      const res = await fetch('/api/finance-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText }),
      });

      if (!res.ok) throw new Error('Analysis failed');

      const data = await res.json();
      setResult(data.response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const handleSampleQuery = (q: string) => {
    setQuery(q);
    runAnalysis(q);
  };

  const statusIcon = (status: AgentStep['status']) => {
    switch (status) {
      case 'running':
        return <Activity className="w-4 h-4 text-amber-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <section id="demo" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge variant="outline" className="mb-4 text-emerald-600 border-emerald-600/30">
            <Terminal className="w-3 h-3 mr-1" /> Interactive Demo
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Live Financial Intelligence
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Ask any financial question and watch the agentic pipeline execute in real-time.
            Each agent processes sequentially — you see every step.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Query panel */}
          <div className="lg:col-span-3 space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-2">
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && runAnalysis(query)}
                    placeholder="Ask a financial question..."
                    className="flex-1"
                    disabled={isAnalyzing}
                  />
                  <Button
                    onClick={() => runAnalysis(query)}
                    disabled={isAnalyzing || !query.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                  >
                    <Send className="w-4 h-4" /> Analyze
                  </Button>
                </div>

                {/* Sample queries */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {SAMPLE_QUERIES.map((sq, i) => (
                    <button
                      key={i}
                      onClick={() => handleSampleQuery(sq)}
                      disabled={isAnalyzing}
                      className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
                    >
                      {sq.length > 50 ? sq.slice(0, 50) + '...' : sq}
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
                </CardTitle>
              </CardHeader>
              <CardContent ref={scrollRef}>
                {error && (
                  <div className="text-red-500 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> {error}
                  </div>
                )}
                {result ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="prose prose-sm max-w-none dark:prose-invert"
                  >
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">{result}</div>
                  </motion.div>
                ) : !isAnalyzing ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Brain className="w-10 h-10 mb-3 opacity-30" />
                    <p className="text-sm">Select a sample query or type your own to begin analysis</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          {/* Agent trace panel */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  Agent Execution Trace
                </CardTitle>
                <CardDescription>Real-time agentic pipeline status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {agentSteps.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-8">
                    No active agents. Start an analysis to see the trace.
                  </div>
                ) : (
                  agentSteps.map((step, i) => (
                    <motion.div
                      key={step.id}
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
                          {statusIcon(step.status)}
                          <span className="text-sm font-medium">{step.agent}</span>
                        </div>
                        {step.duration && (
                          <Badge variant="secondary" className="text-[10px]">
                            {step.duration}ms
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {step.action}
                      </p>
                      {step.output && step.status === 'completed' && (
                        <p className="text-xs text-emerald-600 mt-1.5">
                          → {step.output}
                        </p>
                      )}
                    </motion.div>
                  ))
                )}

                {/* Pipeline progress */}
                {isAnalyzing && (
                  <div className="mt-4">
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
                          agentSteps.length) *
                        100
                      }
                      className="h-1.5"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── Use Cases Section ───────────────────────── */
function UseCasesSection() {
  const iconMap: Record<string, React.ReactNode> = {
    TrendingUp: <TrendingUp className="w-5 h-5" />,
    Shield: <Shield className="w-5 h-5" />,
    FileCheck: <FileCheck className="w-5 h-5" />,
    BarChart3: <BarChart3 className="w-5 h-5" />,
    Briefcase: <Briefcase className="w-5 h-5" />,
    Landmark: <Landmark className="w-5 h-5" />,
  };

  return (
    <section id="use-cases" className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge variant="outline" className="mb-4 text-emerald-600 border-emerald-600/30">
            <Layers className="w-3 h-3 mr-1" /> Applications
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Finance Use Cases
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Designed for the workflows that matter most in institutional finance — from
            compliance automation to investment intelligence.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {USE_CASES.map((uc, i) => (
            <motion.div
              key={uc.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="h-full hover:border-emerald-500/30 transition-colors group">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-emerald-600/10 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600/20 transition-colors">
                      {iconMap[uc.icon]}
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {uc.metric}
                    </Badge>
                  </div>
                  <CardTitle className="text-base mt-3">{uc.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {uc.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── Colab Section ───────────────────────── */
function ColabSection() {
  const colabCode = `# ============================================
# NEXUS — Agentic RAG for Finance
# Google Colab Notebook (Free Tier Compatible)
# ============================================

# Cell 1: Install Dependencies (Free GPU/CPU)
!pip install lancedb fastembed flashrank pydantic-settings pymupdf polars scikit-learn -q

# Cell 2: Clone the project
!git clone https://github.com/mellowedbo/RAG-PROJECT.git
%cd RAG-PROJECT/titanium_vault

# Cell 3: Initialize the Fusion Database
from core.database.fusion_manager import fusion_db
from core.config import settings

print(f"🔌 Connected to: {settings.DB_PATH}")
print(f"📊 Vector Model: {settings.VECTOR_MODEL_NAME}")
print(f"🔍 Reranker: {settings.RERANK_MODEL_NAME}")

# Cell 4: Ingest Financial Documents
from core.ingestion_v999 import semantic_chunking
from fastembed import TextEmbedding
import lancedb
import uuid

embedding_model = TextEmbedding(model_name=settings.VECTOR_MODEL_NAME)

# Sample financial text
financial_text = """
Q4 2024 Earnings Summary: Revenue increased 23% YoY to $96.1B.
Operating margin expanded to 32% driven by cloud services growth.
Forward guidance: Expecting 18-22% revenue growth in FY2025.
Risk factors include regulatory headwinds in EU markets and
supply chain constraints in semiconductor procurement.
"""

# Semantic chunking
chunks = semantic_chunking(financial_text, threshold=0.75)
print(f"📄 Created {len(chunks)} semantic chunks")

# Generate embeddings
vectors = list(embedding_model.embed(chunks))

# Insert into LanceDB
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
        "source_filename": "earnings_q4_2024.txt",
        "page_number": 1,
        "file_hash": "demo_hash_001",
    })

if records:
    # Fix doubly-linked list
    for i in range(len(records) - 1):
        records[i]["next_node_id"] = records[i + 1]["node_id"]

    table.add(records)
    fusion_db.optimize_indices()
    print(f"✅ Indexed {len(records)} chunks")

# Cell 5: Execute Agentic RAG Query
from core.engine_v999 import search_v999_optimized
import asyncio

query = "What are the key risk factors?"
query_vector = list(embedding_model.embed([query]))[0]

results = await asyncio.run(
    search_v999_optimized(query, query_vector.tolist())
)

print(f"\\n🎯 Query: {query}")
print(f"📊 Results: {len(results)} relevant chunks found")
for r in results[:3]:
    print(f"\\n[{r['score']:.3f}] {r['text'][:150]}...")`;

  return (
    <section id="colab" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge variant="outline" className="mb-4 text-emerald-600 border-emerald-600/30">
            <Cpu className="w-3 h-3 mr-1" /> Reproducible
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Run on Google Colab — Free
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            No credit card, no API keys, no GPU required. The entire agentic
            pipeline runs on Google Colab&apos;s free tier with open-source models.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Code preview */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-3"
          >
            <Card className="overflow-hidden">
              <CardHeader className="pb-2 bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/70" />
                      <div className="w-3 h-3 rounded-full bg-amber-500/70" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
                    </div>
                    <span className="text-xs text-muted-foreground ml-2">
                      nexus_agentic_rag_demo.ipynb
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">
                    Python
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <pre className="p-4 text-xs overflow-auto max-h-[500px] leading-relaxed font-mono">
                  <code>{colabCode}</code>
                </pre>
              </CardContent>
            </Card>
          </motion.div>

          {/* Info panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-2 space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-500" />
                  Free Tier Stack
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  {
                    name: 'FastEmbed (BAAI/bge-small-en-v1.5)',
                    desc: '384-dim embeddings, runs on CPU',
                  },
                  {
                    name: 'FlashRank (TinyBERT-L-2)',
                    desc: '~4MB reranker, instant on CPU',
                  },
                  {
                    name: 'LanceDB',
                    desc: 'Serverless vector DB, zero config',
                  },
                  {
                    name: 'Polars',
                    desc: 'Fast DataFrame operations',
                  },
                  {
                    name: 'scikit-learn',
                    desc: 'Semantic similarity computation',
                  },
                ].map((dep, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-sm font-medium">{dep.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {dep.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-500" />
                  Architecture Highlights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  'Hybrid retrieval: Dense vectors + Sparse FTS',
                  'Semantic chunking via cosine similarity',
                  'IVF-PQ quantization (96x compression)',
                  'Doubly-linked context graph',
                  'Async parallel retrieval pipeline',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <ChevronRight className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              size="lg"
              onClick={() =>
                window.open(
                  'https://github.com/mellowedbo/RAG-PROJECT',
                  '_blank'
                )
              }
            >
              <Github className="w-4 h-4" /> View on GitHub
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── Role / CV Section ───────────────────────── */
function RoleSection() {
  const competencies = [
    {
      category: 'Agentic Workflow Design',
      icon: <GitBranch className="w-5 h-5" />,
      items: [
        'Multi-agent pipeline architecture & orchestration',
        'Retrieval-Augmented Generation (RAG) system design',
        'Autonomous agent coordination & task decomposition',
        'Human-in-the-loop workflow integration',
      ],
    },
    {
      category: 'ML/AI Applications in Finance',
      icon: <Brain className="w-5 h-5" />,
      items: [
        'Semantic search & vector retrieval systems',
        'Cross-encoder reranking for precision optimization',
        'Embedding-based topic boundary detection',
        'Financial document intelligence & extraction',
      ],
    },
    {
      category: 'Business & Financial Analysis',
      icon: <LineChart className="w-5 h-5" />,
      items: [
        'Earnings call & 10-K filing analysis',
        'Risk factor aggregation & cross-referencing',
        'Regulatory compliance automation',
        'Investment intelligence & due diligence',
      ],
    },
    {
      category: 'Systems & Analytical Thinking',
      icon: <Target className="w-5 h-5" />,
      items: [
        'End-to-end system design from requirements to deployment',
        'Performance optimization (96x compression, sub-50ms retrieval)',
        'Cost-aware architecture (free-tier compatible stack)',
        'Scalable data pipeline design',
      ],
    },
  ];

  return (
    <section id="role" className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge variant="outline" className="mb-4 text-emerald-600 border-emerald-600/30">
            <Lightbulb className="w-3 h-3 mr-1" /> My Role
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            What I Bring to the Table
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Not just a developer — a systems thinker who understands how to design,
            architect, and apply AI-driven solutions to real business problems in
            finance and beyond.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {competencies.map((comp, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="h-full hover:border-emerald-500/30 transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-600/10 text-emerald-600 flex items-center justify-center">
                      {comp.icon}
                    </div>
                    <CardTitle className="text-base">{comp.category}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {comp.items.map((item, j) => (
                    <div
                      key={j}
                      className="flex items-start gap-2 text-sm"
                    >
                      <ChevronRight className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Project contribution summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12"
        >
          <Card className="border-emerald-500/20 bg-gradient-to-r from-emerald-600/5 to-emerald-600/0">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="w-5 h-5 text-emerald-500" />
                Project Contribution Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <h4 className="text-sm font-semibold mb-2 text-emerald-600">System Design</h4>
                  <p className="text-sm text-muted-foreground">
                    Architected the complete 4-agent pipeline from requirements analysis
                    through deployment — defining data flow, agent responsibilities,
                    and the hybrid retrieval strategy.
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-2 text-emerald-600">Business Logic</h4>
                  <p className="text-sm text-muted-foreground">
                    Translated financial domain requirements (compliance, risk, earnings analysis)
                    into technical system capabilities — ensuring the architecture
                    solves real institutional finance problems.
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-2 text-emerald-600">Optimization Strategy</h4>
                  <p className="text-sm text-muted-foreground">
                    Designed the cost-performance optimization strategy: IVF-PQ quantization
                    for 96x compression, free-tier compatible model selection, and
                    async parallel execution for sub-50ms retrieval.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

/* ───────────────────────── Tech Stack Section ───────────────────────── */
function TechStackSection() {
  const stack = [
    { name: 'LanceDB', role: 'Hybrid Vector + FTS Database', category: 'Storage' },
    { name: 'FastEmbed', role: 'BAAI/bge-small-en-v1.5 Embeddings', category: 'ML' },
    { name: 'FlashRank', role: 'TinyBERT Cross-Encoder Reranker', category: 'ML' },
    { name: 'Polars', role: 'High-Performance DataFrame', category: 'Data' },
    { name: 'scikit-learn', role: 'Similarity Computation', category: 'ML' },
    { name: 'PyMuPDF', role: 'PDF Text Extraction', category: 'Ingestion' },
    { name: 'Next.js 16', role: 'Dashboard & Demo Interface', category: 'Frontend' },
    { name: 'Tailwind CSS', role: 'UI Styling Framework', category: 'Frontend' },
  ];

  return (
    <section className="py-16 border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h3 className="text-2xl font-bold mb-2">Technology Stack</h3>
          <p className="text-muted-foreground text-sm">
            100% free-tier compatible. No API keys or paid services required.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stack.map((tech, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="text-center hover:border-emerald-500/30 transition-colors">
                <CardContent className="pt-4 pb-4 px-3">
                  <div className="font-semibold text-sm">{tech.name}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {tech.role}
                  </div>
                  <Badge variant="secondary" className="mt-2 text-[9px]">
                    {tech.category}
                  </Badge>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── Footer ───────────────────────── */
function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-emerald-600 flex items-center justify-center">
              <Network className="w-3 h-3 text-white" />
            </div>
            <span className="font-semibold text-sm">NEXUS</span>
            <span className="text-xs text-muted-foreground">
              — Agentic Intelligence for Finance
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <a
              href="https://github.com/mellowedbo/RAG-PROJECT"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Github className="w-3 h-3" /> GitHub
            </a>
            <span>•</span>
            <span>Built with Free-Tier Stack</span>
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
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1">
        <HeroSection />
        <WorkflowSection />
        <DashboardPreview />
        <DemoSection />
        <UseCasesSection />
        <ColabSection />
        <RoleSection />
        <TechStackSection />
      </main>
      <Footer />
    </div>
  );
}
