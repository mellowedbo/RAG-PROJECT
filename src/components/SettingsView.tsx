'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Key, Eye, EyeOff, Zap, Check, Shield, Database,
  Layers, Brain, Cpu, Gauge, Activity, HardDrive,
  FlaskConical, Monitor, Save, RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { PipelineConfig } from '@/types';
import { DEFAULT_CONFIG } from '@/types';

/* ═══════════════════════ Settings View ═══════════════════════ */

interface SettingsViewProps {
  apiKey: string;
  setApiKey: (k: string) => void;
  simulationMode: boolean;
  setSimulationMode: (v: boolean) => void;
  useEmbeddings: boolean;
  setUseEmbeddings: (v: boolean) => void;
  config: PipelineConfig;
  onConfigChange: (config: PipelineConfig) => void;
  embeddingProgress: number | null;
}

export default function SettingsView({
  apiKey,
  setApiKey,
  simulationMode,
  setSimulationMode,
  useEmbeddings,
  setUseEmbeddings,
  config,
  onConfigChange,
  embeddingProgress,
}: SettingsViewProps) {
  const [showKey, setShowKey] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey);
  const [saved, setSaved] = useState(false);

  const handleSaveKey = () => {
    setApiKey(tempKey);
    localStorage.setItem('nexus-gemini-key', tempKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateConfig = (partial: Partial<PipelineConfig>) => {
    onConfigChange({ ...config, ...partial });
  };

  const handleResetConfig = () => {
    onConfigChange({ ...DEFAULT_CONFIG });
  };

  // Storage estimation
  const estimatedStorageMB = typeof window !== 'undefined'
    ? (() => {
        try {
          let total = 0;
          for (const key of Object.keys(localStorage)) {
            total += (localStorage.getItem(key) || '').length;
          }
          return (total / 1024 / 1024).toFixed(2);
        } catch { return '0.00'; }
      })()
    : '0.00';

  return (
    <div className="space-y-6">
      {/* API Key Management */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-600" />
              API Key Management
            </CardTitle>
            <CardDescription>Configure your Gemini API key for LLM-powered analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Key className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  type={showKey ? 'text' : 'password'}
                  value={tempKey}
                  onChange={(e) => { setTempKey(e.target.value); setSaved(false); }}
                  placeholder="Enter your Gemini API key"
                  className="pl-8 pr-8"
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveKey()}
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Button onClick={handleSaveKey} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
                {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saved ? 'Saved!' : 'Save Key'}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={apiKey ? 'default' : 'secondary'} className={`text-[10px] gap-1 ${apiKey ? 'bg-emerald-600' : ''}`}>
                {apiKey ? <Check className="w-2.5 h-2.5" /> : <Shield className="w-2.5 h-2.5" />}
                {apiKey ? 'API Key Connected' : 'No API Key'}
              </Badge>
              {apiKey && (
                <span className="text-[10px] text-muted-foreground">
                  Key ending in ...{apiKey.slice(-4)}
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground p-3 rounded-lg bg-muted/50">
              <strong>How to get a key:</strong> Visit{' '}
              <span className="text-emerald-600 font-medium">aistudio.google.com/apikey</span>{' '}
              to generate a free Gemini API key. The key is stored locally in your browser.
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Mode Configuration */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-600" />
              Pipeline Configuration
            </CardTitle>
            <CardDescription>Configure RAG pipeline behavior and retrieval parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mode toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border border-border hover:border-emerald-500/20 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-medium">Simulation Mode</span>
                  </div>
                  <button
                    onClick={() => setSimulationMode(!simulationMode)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      simulationMode ? 'bg-emerald-600' : 'bg-muted'
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      simulationMode ? 'translate-x-5' : ''
                    }`} />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  When enabled, uses simulated responses instead of real API calls. Useful for testing without consuming API quota.
                </p>
              </div>

              <div className="p-4 rounded-lg border border-border hover:border-emerald-500/20 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium">Embedding Mode</span>
                  </div>
                  <button
                    onClick={() => setUseEmbeddings(!useEmbeddings)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      useEmbeddings ? 'bg-emerald-600' : 'bg-muted'
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      useEmbeddings ? 'translate-x-5' : ''
                    }`} />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enable vector embeddings (Gemini Embedding 2) for semantic search. Disabling falls back to TF-IDF keyword matching.
                </p>
                {embeddingProgress !== null && useEmbeddings && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                      <span>Embedding progress</span>
                      <span>{Math.round(embeddingProgress)}%</span>
                    </div>
                    <Progress value={embeddingProgress} className="h-1.5" />
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Chunk configuration */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Layers className="w-3 h-3" />Chunk Configuration
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium mb-1.5 block">Chunk Size (chars)</label>
                  <Input
                    type="number"
                    value={config.chunkSize}
                    onChange={(e) => updateConfig({ chunkSize: parseInt(e.target.value) || 800 })}
                    min={200}
                    max={2000}
                    step={100}
                  />
                  <span className="text-[10px] text-muted-foreground mt-1 block">200–2000 characters per chunk</span>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1.5 block">Overlap Size</label>
                  <Input
                    type="number"
                    value={config.chunkOverlap}
                    onChange={(e) => updateConfig({ chunkOverlap: parseInt(e.target.value) || 120 })}
                    min={20}
                    max={400}
                    step={20}
                  />
                  <span className="text-[10px] text-muted-foreground mt-1 block">20–400 characters overlap between chunks</span>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1.5 block">Top-K Retrieval</label>
                  <Input
                    type="number"
                    value={config.topK}
                    onChange={(e) => updateConfig({ topK: parseInt(e.target.value) || 8 })}
                    min={1}
                    max={20}
                    step={1}
                  />
                  <span className="text-[10px] text-muted-foreground mt-1 block">Number of chunks to retrieve per query</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleResetConfig} className="gap-1.5">
                <RotateCcw className="w-3 h-3" />
                Reset to Defaults
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Model Configuration */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Gauge className="w-4 h-4 text-emerald-600" />
              Model Configuration
            </CardTitle>
            <CardDescription>Configure AI models used in the pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium mb-1.5 block">Embedding Model</label>
                <Select value={config.embeddingModel} onValueChange={(v) => updateConfig({ embeddingModel: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini-embedding-2">Gemini Embedding 2 (Recommended — 3072-dim)</SelectItem>
                    <SelectItem value="text-embedding-004">text-embedding-004 (Legacy — 768-dim)</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-[10px] text-muted-foreground mt-1 block">
                  Multimodal embeddings with task-specific optimization
                </span>
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block">Generation Model</label>
                <Select value={config.generationModel} onValueChange={(v) => updateConfig({ generationModel: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemma-4-31b-it">Gemma 4 31B IT (Recommended)</SelectItem>
                    <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash (Fast)</SelectItem>
                    <SelectItem value="gemma-4-26b-a4b-it">Gemma 4 26B A4B IT (MoE — Fast)</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-[10px] text-muted-foreground mt-1 block">
                  LLM model for synthesis and reasoning
                </span>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium mb-1.5 block">Embedding Dimensions</label>
                <Select
                  value={String(config.embeddingDimensions || 768)}
                  onValueChange={(v) => updateConfig({ embeddingDimensions: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="256">256 (Fast — low storage)</SelectItem>
                    <SelectItem value="512">512 (Balanced)</SelectItem>
                    <SelectItem value="768">768 (Default — good quality)</SelectItem>
                    <SelectItem value="1024">1024 (High quality)</SelectItem>
                    <SelectItem value="1536">1536 (Very high quality)</SelectItem>
                    <SelectItem value="3072">3072 (Maximum — Gemini Embedding 2 full)</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-[10px] text-muted-foreground mt-1 block">
                  Higher dimensions = better semantic understanding but more storage
                </span>
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block">Embedding Task Type</label>
                <Select
                  value={config.embeddingTaskType || 'RETRIEVAL_DOCUMENT'}
                  onValueChange={(v) => updateConfig({ embeddingTaskType: v as PipelineConfig['embeddingTaskType'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RETRIEVAL_DOCUMENT">Retrieval Document (Best for indexing)</SelectItem>
                    <SelectItem value="RETRIEVAL_QUERY">Retrieval Query (Best for queries)</SelectItem>
                    <SelectItem value="SEMANTIC_SIMILARITY">Semantic Similarity</SelectItem>
                    <SelectItem value="CLASSIFICATION">Classification</SelectItem>
                    <SelectItem value="CLUSTERING">Clustering</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-[10px] text-muted-foreground mt-1 block">
                  Optimizes embeddings for the intended use case
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Storage & Status */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-emerald-600" />
              Storage & Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3 rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <Database className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-xs font-medium">localStorage Usage</span>
                </div>
                <div className="text-lg font-bold">{estimatedStorageMB} MB</div>
                <div className="text-[10px] text-muted-foreground">of ~5 MB available (IndexedDB for vectors)</div>
              </div>
              <div className="p-3 rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-xs font-medium">Rate Limit Status</span>
                </div>
                <div className="text-lg font-bold text-emerald-600">OK</div>
                <div className="text-[10px] text-muted-foreground">
                  Embedding: 100 RPM / Generation: 15 RPM
                </div>
              </div>
              <div className="p-3 rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <Monitor className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-xs font-medium">Pipeline Mode</span>
                </div>
                <div className="text-lg font-bold capitalize">{simulationMode ? 'Simulation' : 'Live'}</div>
                <div className="text-[10px] text-muted-foreground">
                  {simulationMode ? 'Using simulated responses' : `Gemma 4 31B + Gemini Embedding 2 (${config.embeddingDimensions || 768}-dim)`}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
