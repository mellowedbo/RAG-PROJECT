'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Network, Search, FolderOpen, LayoutDashboard, Shield, Terminal,
  Key, Eye, EyeOff, Zap, Check, Monitor, FlaskConical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AppMode } from '@/types';

/* ═══════════════════════ API Key Input ═══════════════════════ */

function ApiKeyInput({
  apiKey,
  setApiKey,
}: {
  apiKey: string;
  setApiKey: (k: string) => void;
}) {
  const [showKey, setShowKey] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setApiKey(tempKey);
    localStorage.setItem('nexus-gemini-key', tempKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1 max-w-[280px]">
        <Key className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          type={showKey ? 'text' : 'password'}
          value={tempKey}
          onChange={(e) => { setTempKey(e.target.value); setSaved(false); }}
          placeholder="Gemini API Key"
          className="pl-8 pr-8 h-8 text-xs"
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
        <button
          onClick={() => setShowKey(!showKey)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
      </div>
      <Button
        size="sm"
        onClick={handleSave}
        className="h-8 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
      >
        {saved ? <Check className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
        {saved ? 'Saved' : 'Connect'}
      </Button>
    </div>
  );
}

/* ═══════════════════════ Navigation ═══════════════════════ */

interface NavigationProps {
  activeTab: string;
  onTabChange: (t: string) => void;
  appMode: AppMode;
  onModeChange: (m: AppMode) => void;
  apiKey: string;
  setApiKey: (k: string) => void;
}

export default function Navigation({
  activeTab,
  onTabChange,
  appMode,
  onModeChange,
  apiKey,
  setApiKey,
}: NavigationProps) {
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
        scrolled ? 'bg-background/80 backdrop-blur-xl border-b border-border shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Network className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">NEXUS</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-mono">RAG</Badge>
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

          <div className="flex items-center gap-3">
            {/* Mode toggle */}
            <div className="flex items-center bg-muted rounded-lg p-0.5">
              <button
                onClick={() => onModeChange('demo')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  appMode === 'demo'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Monitor className="w-3 h-3" />
                Demo
              </button>
              <button
                onClick={() => onModeChange('test')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  appMode === 'test'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <FlaskConical className="w-3 h-3" />
                Test
              </button>
            </div>

            {/* API Key */}
            <div className="hidden lg:block">
              <ApiKeyInput apiKey={apiKey} setApiKey={setApiKey} />
            </div>

            {/* Mobile selector */}
            <div className="md:hidden">
              <Select value={activeTab} onValueChange={onTabChange}>
                <SelectTrigger className="w-[120px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tabs.map((tab) => (
                    <SelectItem key={tab.id} value={tab.id}>{tab.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Mobile API key row */}
        <div className="lg:hidden pb-2">
          <ApiKeyInput apiKey={apiKey} setApiKey={setApiKey} />
        </div>
      </div>
    </motion.nav>
  );
}
