'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Key, Eye, EyeOff, Zap, Check, Shield, Database,
  Layers, Brain, Cpu, Gauge, Activity, HardDrive,
  FlaskConical, Monitor, Save, RotateCcw,
  Trash2, Download, Sparkles, AlertTriangle,
  ImageIcon, FileText, Loader2, CheckCircle2,
  XCircle, AlertCircle, Stethoscope, ArrowRight,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { PipelineConfig, ModelHealthStatus } from '@/types';
import { DEFAULT_CONFIG, EMBEDDING_MODELS, GENERATION_MODELS } from '@/types';

// Settings View

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

// Helper: get availability badge for a model
function getModelAvailabilityBadge(
  modelId: string,
  healthResults: ModelHealthStatus[] | null,
  isDeprecated?: boolean,
) {
  // Deprecated badge takes priority
  if (isDeprecated) {
    return (
      <Badge className="text-[9px] h-4 gap-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 shrink-0">
        <AlertCircle className="w-2.5 h-2.5" /> Deprecated
      </Badge>
    );
  }

  if (!healthResults) {
    return (
      <Badge variant="secondary" className="text-[9px] h-4 gap-0.5 shrink-0">
        Not tested
      </Badge>
    );
  }

  const result = healthResults.find(r => r.modelId === modelId);
  if (!result) {
    return (
      <Badge variant="secondary" className="text-[9px] h-4 gap-0.5 shrink-0">
        Not tested
      </Badge>
    );
  }

  if (result.available) {
    return (
      <Badge className="text-[9px] h-4 gap-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 shrink-0">
        <CheckCircle2 className="w-2.5 h-2.5" /> Available
      </Badge>
    );
  }

  return (
    <Badge className="text-[9px] h-4 gap-0.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 shrink-0">
      <XCircle className="w-2.5 h-2.5" /> Unavailable
    </Badge>
  );
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
  const [editKey, setEditKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isEditingKey, setIsEditingKey] = useState(false);

  // Health check state
  const [healthResults, setHealthResults] = useState<ModelHealthStatus[] | null>(null);
  const [healthCheckLoading, setHealthCheckLoading] = useState(false);
  const [healthCheckError, setHealthCheckError] = useState<string | null>(null);

  // Debounced input state for numeric config fields
  const [localChunkSize, setLocalChunkSize] = useState(String(config.chunkSize));
  const [localChunkOverlap, setLocalChunkOverlap] = useState(String(config.chunkOverlap));
  const [localTopK, setLocalTopK] = useState(String(config.topK));
  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const displayKey = isEditingKey ? editKey : apiKey;

  // Storage display — compute lazily on client to avoid hydration mismatch
  const storageMBRef = useRef('0.00');
  const [storageMB, setStorageMB] = useState('0.00');
  const storageComputed = useRef(false);

  // Compute storage after mount — use callback subscription pattern
  useEffect(() => {
    if (storageComputed.current) return;
    storageComputed.current = true;
    // Schedule outside the effect body to avoid cascading render lint
    const compute = () => {
      try {
        let total = 0;
        for (const key of Object.keys(localStorage)) {
          total += (localStorage.getItem(key) || '').length;
        }
        storageMBRef.current = (total / 1024 / 1024).toFixed(2);
      } catch {
        storageMBRef.current = '0.00';
      }
      setStorageMB(storageMBRef.current);
    };
    // Use requestAnimationFrame to defer the state update out of the effect body
    requestAnimationFrame(compute);
  }, []);

  // Sync local debounced state when external config changes
  useEffect(() => {
    setLocalChunkSize(String(config.chunkSize));
    setLocalChunkOverlap(String(config.chunkOverlap));
    setLocalTopK(String(config.topK));
  }, [config.chunkSize, config.chunkOverlap, config.topK]);

  // Debounced config update helper
  const debouncedUpdateConfig = useCallback(
    (key: string, partial: Partial<PipelineConfig>) => {
      // Clear existing timer for this key
      const existing = debounceTimers.current.get(key);
      if (existing) clearTimeout(existing);

      // Set new timer
      const timer = setTimeout(() => {
        onConfigChange({ ...config, ...partial });
        debounceTimers.current.delete(key);
      }, 500);
      debounceTimers.current.set(key, timer);
    },
    [config, onConfigChange],
  );

  // Cleanup debounce timers on unmount
  useEffect(() => {
    const timers = debounceTimers.current;
    return () => {
      timers.forEach(timer => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  // Health check handler
  const handleHealthCheck = useCallback(async () => {
    if (!apiKey) {
      setHealthCheckError('Please set and save your API key before testing models.');
      return;
    }

    setHealthCheckLoading(true);
    setHealthCheckError(null);

    try {
      const res = await fetch('/api/models/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const errMsg =
          (data as Record<string, unknown>)?.error || `Request failed with status ${res.status}`;
        setHealthCheckError(typeof errMsg === 'string' ? errMsg : 'Health check failed');
        return;
      }

      const data = (await res.json()) as {
        results: ModelHealthStatus[];
        cached?: boolean;
      };
      setHealthResults(data.results);
    } catch (err) {
      setHealthCheckError(
        err instanceof Error ? err.message : 'Failed to check model health',
      );
    } finally {
      setHealthCheckLoading(false);
    }
  }, [apiKey]);

  // Determine if currently selected generation model is unavailable
  const currentGenHealth = healthResults?.find(r => r.modelId === config.generationModel);
  const currentGenUnavailable = healthResults !== null && currentGenHealth && !currentGenHealth.available;

  // Find first available recommended generation model
  const recommendedAvailableModel = healthResults
    ? GENERATION_MODELS.find(
        m =>
          m.isRecommended &&
          healthResults.some(r => r.modelId === m.id && r.available),
      )
    : null;

  // First available generation model (any, as fallback)
  const firstAvailableGenModel = healthResults
    ? GENERATION_MODELS.find(m =>
        healthResults.some(r => r.modelId === m.id && r.available),
      )
    : null;

  const handleSwitchToAvailable = () => {
    const target = recommendedAvailableModel || firstAvailableGenModel;
    if (target) {
      updateConfig({ generationModel: target.id });
    }
  };

  const handleSaveKey = () => {
    setApiKey(displayKey);
    localStorage.setItem('nexus-gemini-key', displayKey);
    setSaved(true);
    setIsEditingKey(false);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateConfig = (partial: Partial<PipelineConfig>) => {
    onConfigChange({ ...config, ...partial });
  };

  const handleResetConfig = () => {
    onConfigChange({ ...DEFAULT_CONFIG });
  };

  const handleClearAllData = () => {
    // Clear localStorage
    const keysToKeep = ['nexus-gemini-key']; // keep API key
    const keptItems: Record<string, string> = {};
    keysToKeep.forEach(k => {
      const v = localStorage.getItem(k);
      if (v) keptItems[k] = v;
    });

    localStorage.clear();
    Object.entries(keptItems).forEach(([k, v]) => localStorage.setItem(k, v));

    // Clear IndexedDB
    try {
      indexedDB.databases().then(dbs => {
        dbs.forEach(db => {
          if (db.name) indexedDB.deleteDatabase(db.name);
        });
      }).catch(() => {});
    } catch {
      // Ignore
    }

    setShowClearConfirm(false);
    // Refresh storage display
    setStorageMB('0.00');
    // Reload page to reset all state
    window.location.reload();
  };

  const handleExportData = () => {
    try {
      const exportObj: Record<string, unknown> = {};
      for (const key of Object.keys(localStorage)) {
        if (key === 'nexus-gemini-key') continue; // Don't export API key
        try {
          exportObj[key] = JSON.parse(localStorage.getItem(key) || 'null');
        } catch {
          exportObj[key] = localStorage.getItem(key);
        }
      }
      exportObj._exportTimestamp = new Date().toISOString();
      exportObj._config = config;

      const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nexus-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed:', e);
    }
  };

  // Find currently selected models for display
  const selectedEmbeddingModel = EMBEDDING_MODELS.find(m => m.id === config.embeddingModel);
  const selectedGenerationModel = GENERATION_MODELS.find(m => m.id === config.generationModel);

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
              <div className="relative flex-1 max-w-md min-w-0">
                <Key className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  type={showKey ? 'text' : 'password'}
                  value={displayKey}
                  onChange={(e) => { if (!isEditingKey) { setIsEditingKey(true); setEditKey(e.target.value); } else { setEditKey(e.target.value); } setSaved(false); }}
                  onFocus={() => { if (!isEditingKey) { setIsEditingKey(true); setEditKey(apiKey); }}}
                  placeholder="Enter your Gemini API key"
                  className="pl-8 pr-8 min-w-0"
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

      {/* Model Selection — Expanded */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Gauge className="w-4 h-4 text-emerald-600" />
              Model Selection
            </CardTitle>
            <CardDescription>Choose AI models for embedding and generation in the RAG pipeline</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Embedding Models */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" /> Embedding Models
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {EMBEDDING_MODELS.map((model) => (
                  <motion.div
                    key={model.id}
                    whileHover={{ scale: 1.01 }}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all overflow-hidden ${
                      config.embeddingModel === model.id
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                        : 'border-border hover:border-emerald-500/30'
                    }`}
                    onClick={() => updateConfig({ embeddingModel: model.id })}
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <div className="min-w-0 overflow-hidden">
                        <div className="text-sm font-semibold flex items-center gap-1.5 truncate">
                          {model.name}
                          {model.isRecommended && (
                            <Badge className="text-[9px] h-4 bg-emerald-600 gap-0.5 shrink-0">
                              <Sparkles className="w-2.5 h-2.5" /> Recommended
                            </Badge>
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono truncate">{model.id}</div>
                      </div>
                      {config.embeddingModel === model.id && (
                        <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2 leading-relaxed break-words">{model.description}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-[9px] gap-0.5">
                        <Layers className="w-2.5 h-2.5" /> {model.dimensions}-dim
                      </Badge>
                      <Badge variant="secondary" className="text-[9px] gap-0.5">
                        <FileText className="w-2.5 h-2.5" /> {model.maxTokens} tokens
                      </Badge>
                      {model.isMultimodal && (
                        <Badge variant="secondary" className="text-[9px] gap-0.5 bg-purple-50 dark:bg-purple-950/30 text-purple-600">
                          <ImageIcon className="w-2.5 h-2.5" /> Multimodal
                        </Badge>
                      )}
                      {getModelAvailabilityBadge(model.id, healthResults, model.isDeprecated)}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Generation Models — Grouped by Tier */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Brain className="w-3 h-3" /> Generation Models
              </h4>
              <div className="space-y-4">
                {/* Stable tier */}
                {(() => {
                  const stableModels = GENERATION_MODELS.filter(m => m.tier === 'stable');
                  return stableModels.length > 0 ? (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="text-[9px] h-4 bg-emerald-600 gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Stable — Production Ready
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">Widely available, reliable for all users</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {stableModels.map((model) => (
                          <motion.div
                            key={model.id}
                            whileHover={{ scale: 1.01 }}
                            className={`p-3 rounded-lg border-2 cursor-pointer transition-all overflow-hidden ${
                              config.generationModel === model.id
                                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                                : 'border-border hover:border-emerald-500/30'
                            }`}
                            onClick={() => updateConfig({ generationModel: model.id })}
                          >
                            <div className="flex items-start justify-between mb-1.5">
                              <div className="min-w-0 overflow-hidden">
                                <div className="text-sm font-semibold flex items-center gap-1.5 truncate">
                                  {model.name}
                                  {model.isRecommended && (
                                    <Badge className="text-[9px] h-4 bg-emerald-600 gap-0.5 shrink-0">
                                      <Sparkles className="w-2.5 h-2.5" /> Recommended
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-[10px] text-muted-foreground font-mono truncate">{model.id}</div>
                              </div>
                              {config.generationModel === model.id && (
                                <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mb-2 leading-relaxed break-words">{model.description}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              {model.maxTokens && (
                                <Badge variant="secondary" className="text-[9px] gap-0.5">
                                  <Zap className="w-2.5 h-2.5" /> {model.maxTokens >= 1000 ? `${(model.maxTokens / 1000).toFixed(0)}K` : model.maxTokens} output
                                </Badge>
                              )}
                              {model.isMultimodal && (
                                <Badge variant="secondary" className="text-[9px] gap-0.5 bg-purple-50 dark:bg-purple-950/30 text-purple-600">
                                  <ImageIcon className="w-2.5 h-2.5" /> Multimodal
                                </Badge>
                              )}
                              {getModelAvailabilityBadge(model.id, healthResults, model.isDeprecated)}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Experimental tier */}
                {(() => {
                  const expModels = GENERATION_MODELS.filter(m => m.tier === 'experimental');
                  return expModels.length > 0 ? (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="text-[9px] h-4 bg-amber-500 gap-0.5 text-white">
                          <FlaskConical className="w-2.5 h-2.5" /> Experimental
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">May not be available in all regions — test first</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {expModels.map((model) => (
                          <motion.div
                            key={model.id}
                            whileHover={{ scale: 1.01 }}
                            className={`p-3 rounded-lg border-2 cursor-pointer transition-all overflow-hidden ${
                              config.generationModel === model.id
                                ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20'
                                : 'border-border hover:border-amber-500/30'
                            }`}
                            onClick={() => updateConfig({ generationModel: model.id })}
                          >
                            <div className="flex items-start justify-between mb-1.5">
                              <div className="min-w-0 overflow-hidden">
                                <div className="text-sm font-semibold flex items-center gap-1.5 truncate">
                                  {model.name}
                                  {model.isRecommended && (
                                    <Badge className="text-[9px] h-4 bg-emerald-600 gap-0.5 shrink-0">
                                      <Sparkles className="w-2.5 h-2.5" /> Recommended
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-[10px] text-muted-foreground font-mono truncate">{model.id}</div>
                              </div>
                              {config.generationModel === model.id && (
                                <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center shrink-0">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mb-2 leading-relaxed break-words">{model.description}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              {model.maxTokens && (
                                <Badge variant="secondary" className="text-[9px] gap-0.5">
                                  <Zap className="w-2.5 h-2.5" /> {model.maxTokens >= 1000 ? `${(model.maxTokens / 1000).toFixed(0)}K` : model.maxTokens} output
                                </Badge>
                              )}
                              {model.isMultimodal && (
                                <Badge variant="secondary" className="text-[9px] gap-0.5 bg-purple-50 dark:bg-purple-950/30 text-purple-600">
                                  <ImageIcon className="w-2.5 h-2.5" /> Multimodal
                                </Badge>
                              )}
                              {getModelAvailabilityBadge(model.id, healthResults, model.isDeprecated)}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Open-Weight tier */}
                {(() => {
                  const owModels = GENERATION_MODELS.filter(m => m.tier === 'open-weight');
                  return owModels.length > 0 ? (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="text-[9px] h-4 bg-violet-600 gap-0.5 text-white">
                          <Cpu className="w-2.5 h-2.5" /> Open-Weight / Gemma
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">Self-hostable models — availability varies by region, test before use</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {owModels.map((model) => (
                          <motion.div
                            key={model.id}
                            whileHover={{ scale: 1.01 }}
                            className={`p-3 rounded-lg border-2 cursor-pointer transition-all overflow-hidden ${
                              config.generationModel === model.id
                                ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-950/20'
                                : 'border-border hover:border-violet-500/30'
                            }`}
                            onClick={() => updateConfig({ generationModel: model.id })}
                          >
                            <div className="flex items-start justify-between mb-1.5">
                              <div className="min-w-0 overflow-hidden">
                                <div className="text-sm font-semibold flex items-center gap-1.5 truncate">
                                  {model.name}
                                  {model.isRecommended && (
                                    <Badge className="text-[9px] h-4 bg-emerald-600 gap-0.5 shrink-0">
                                      <Sparkles className="w-2.5 h-2.5" /> Recommended
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-[10px] text-muted-foreground font-mono truncate">{model.id}</div>
                              </div>
                              {config.generationModel === model.id && (
                                <div className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center shrink-0">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mb-2 leading-relaxed break-words">{model.description}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              {model.maxTokens && (
                                <Badge variant="secondary" className="text-[9px] gap-0.5">
                                  <Zap className="w-2.5 h-2.5" /> {model.maxTokens >= 1000 ? `${(model.maxTokens / 1000).toFixed(0)}K` : model.maxTokens} output
                                </Badge>
                              )}
                              {getModelAvailabilityBadge(model.id, healthResults, model.isDeprecated)}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            </div>

            <Separator />

            {/* Model Health Check */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Stethoscope className="w-3 h-3" /> Model Health Check
              </h4>
              <div className="space-y-3">
                {!apiKey && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="text-xs text-amber-700 dark:text-amber-400">
                      Please set and save your API key above before testing model availability.
                    </span>
                  </div>
                )}

                <Button
                  onClick={handleHealthCheck}
                  disabled={healthCheckLoading || !apiKey}
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                >
                  {healthCheckLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Stethoscope className="w-3.5 h-3.5" />
                  )}
                  {healthCheckLoading ? 'Testing Models...' : 'Test Model Availability'}
                </Button>

                {healthCheckError && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                    <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-red-700 dark:text-red-400">{healthCheckError}</span>
                  </div>
                )}

                {/* Currently selected model unavailable warning */}
                {currentGenUnavailable && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                        Your selected generation model ({selectedGenerationModel?.name || config.generationModel}) is currently unavailable.
                      </p>
                      {(recommendedAvailableModel || firstAvailableGenModel) && (
                        <Button
                          onClick={handleSwitchToAvailable}
                          variant="outline"
                          size="sm"
                          className="mt-2 gap-1.5 text-xs h-7 bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/60"
                        >
                          <ArrowRight className="w-3 h-3" />
                          Switch to {(recommendedAvailableModel || firstAvailableGenModel)?.name}
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Health check results table */}
                {healthResults && !healthCheckLoading && (
                  <div className="rounded-lg border border-border overflow-hidden">
                    <div className="max-h-72 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-muted/50 sticky top-0">
                          <tr>
                            <th className="text-left p-2 font-medium">Model</th>
                            <th className="text-center p-2 font-medium">Status</th>
                            <th className="text-right p-2 font-medium">Latency</th>
                          </tr>
                        </thead>
                        <tbody>
                          {healthResults.map((result) => {
                            const model = [...EMBEDDING_MODELS, ...GENERATION_MODELS].find(
                              m => m.id === result.modelId,
                            );
                            return (
                              <tr key={result.modelId} className="border-t border-border">
                                <td className="p-2">
                                  <div className="font-medium truncate">{model?.name || result.modelId}</div>
                                  <div className="text-[10px] text-muted-foreground font-mono truncate">{result.modelId}</div>
                                </td>
                                <td className="p-2 text-center">
                                  {result.available ? (
                                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                      <CheckCircle2 className="w-3.5 h-3.5" /> Available
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                                      <XCircle className="w-3.5 h-3.5" /> Unavailable
                                    </span>
                                  )}
                                </td>
                                <td className="p-2 text-right tabular-nums">
                                  {result.latencyMs !== null ? `${result.latencyMs}ms` : '—'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="p-2 bg-muted/30 border-t border-border text-[10px] text-muted-foreground text-right">
                      Tested at {healthResults[0] ? new Date(healthResults[0].testedAt).toLocaleTimeString() : 'N/A'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Embedding Configuration */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Embedding Configuration
            </CardTitle>
            <CardDescription>Fine-tune embedding dimensions and task optimization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="min-w-0">
                <label className="text-xs font-medium mb-1.5 block">Embedding Dimensions</label>
                <Select
                  value={String(config.embeddingDimensions || 768)}
                  onValueChange={(v) => updateConfig({ embeddingDimensions: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="128">128 (Minimal — fastest)</SelectItem>
                    <SelectItem value="256">256 (Fast — low storage)</SelectItem>
                    <SelectItem value="512">512 (Balanced)</SelectItem>
                    <SelectItem value="768">768 (Default — good quality)</SelectItem>
                    <SelectItem value="1024">1024 (High quality)</SelectItem>
                    <SelectItem value="1536">1536 (Very high quality)</SelectItem>
                    <SelectItem value="3072">3072 (Maximum — Gemini Embedding 2 full)</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-[10px] text-muted-foreground mt-1 block break-words">
                  Higher dimensions = better semantic understanding but more storage.
                  {selectedEmbeddingModel?.id === 'gemini-embedding-2' && ' Gemini Embedding 2 supports 128–3072 adjustable dimensions.'}
                </span>
              </div>
              <div className="min-w-0">
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
                <span className="text-[10px] text-muted-foreground mt-1 block break-words">
                  Optimizes embeddings for the intended use case
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Pipeline Configuration */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
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
                    role="switch"
                    aria-checked={simulationMode}
                    aria-label="Toggle simulation mode"
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
                    role="switch"
                    aria-checked={useEmbeddings}
                    aria-label="Toggle embedding mode"
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
                  Enable vector embeddings ({selectedEmbeddingModel?.name || config.embeddingModel}) for semantic search. Disabling falls back to TF-IDF keyword matching.
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
                <div className="min-w-0">
                  <label className="text-xs font-medium mb-1.5 block">Chunk Size (chars)</label>
                  <Input
                    type="number"
                    value={localChunkSize}
                    onChange={(e) => {
                      setLocalChunkSize(e.target.value);
                      const val = parseInt(e.target.value) || 800;
                      debouncedUpdateConfig('chunkSize', { chunkSize: Math.min(2000, Math.max(200, val)) });
                    }}
                    min={200}
                    max={2000}
                    step={100}
                    className="w-full max-w-full"
                  />
                  <span className="text-[10px] text-muted-foreground mt-1 block">200–2000 characters per chunk</span>
                </div>
                <div className="min-w-0">
                  <label className="text-xs font-medium mb-1.5 block">Overlap Size</label>
                  <Input
                    type="number"
                    value={localChunkOverlap}
                    onChange={(e) => {
                      setLocalChunkOverlap(e.target.value);
                      const val = parseInt(e.target.value) || 120;
                      debouncedUpdateConfig('chunkOverlap', { chunkOverlap: Math.min(400, Math.max(20, val)) });
                    }}
                    min={20}
                    max={400}
                    step={20}
                    className="w-full max-w-full"
                  />
                  <span className="text-[10px] text-muted-foreground mt-1 block">20–400 characters overlap between chunks</span>
                </div>
                <div className="min-w-0">
                  <label className="text-xs font-medium mb-1.5 block">Top-K Retrieval</label>
                  <Input
                    type="number"
                    value={localTopK}
                    onChange={(e) => {
                      setLocalTopK(e.target.value);
                      const val = parseInt(e.target.value) || 8;
                      debouncedUpdateConfig('topK', { topK: Math.min(20, Math.max(1, val)) });
                    }}
                    min={1}
                    max={20}
                    step={1}
                    className="w-full max-w-full"
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

      {/* Data Management */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-emerald-600" />
              Data Management
            </CardTitle>
            <CardDescription>Manage local storage, export data, and monitor storage usage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Storage Usage */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3 rounded-lg border border-border min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Database className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-xs font-medium">localStorage Usage</span>
                </div>
                <div className="text-lg font-bold">{storageMB} MB</div>
                <div className="text-[10px] text-muted-foreground">of ~5 MB available (IndexedDB for vectors)</div>
              </div>
              <div className="p-3 rounded-lg border border-border min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-xs font-medium">Rate Limit Status</span>
                </div>
                <div className="text-lg font-bold text-emerald-600">OK</div>
                <div className="text-[10px] text-muted-foreground">
                  Embedding: 100 RPM / Generation: 15 RPM
                </div>
              </div>
              <div className="p-3 rounded-lg border border-border min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Monitor className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-xs font-medium">Pipeline Mode</span>
                </div>
                <div className="text-lg font-bold capitalize">{simulationMode ? 'Simulation' : 'Live'}</div>
                <div className="text-[10px] text-muted-foreground">
                  {simulationMode ? 'Using simulated responses' : `${selectedGenerationModel?.name || config.generationModel} + ${selectedEmbeddingModel?.name || config.embeddingModel} (${config.embeddingDimensions || 768}-dim)`}
                </div>
              </div>
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleExportData}
              >
                <Download className="w-3.5 h-3.5" />
                Export Data as JSON
              </Button>

              <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/30"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear All Data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      Clear All Data?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all documents, chunks, journal entries, tax data, and analysis results from your browser. Your API key will be preserved. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleClearAllData}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Yes, Clear Everything
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
