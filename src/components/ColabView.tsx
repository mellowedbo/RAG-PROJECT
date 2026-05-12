'use client';

import { useState } from 'react';
import {
  Terminal, Brain, Database, Layers,
  Download, Code2, Copy, Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

/* ═══════════════════════ Colab View ═══════════════════════ */

interface ColabViewProps {
  colabCode: string;
}

export default function ColabView({
  colabCode,
}: ColabViewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(colabCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = colabCode;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([colabCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nexus_finance_rag_notebook.py';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2"><Terminal className="w-4 h-4 text-emerald-600" />Python Notebook — NEXUS RAG</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Self-contained Colab notebook. Uses Gemma 4 31B IT + Gemini Embedding 2. No server needed.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              <Button size="sm" onClick={handleDownload} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
                <Download className="w-3 h-3" />Download .py
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { title: 'Chunking Engine', desc: 'Recursive splitting with section awareness', icon: Layers },
          { title: 'Gemini Embedding 2', desc: '3072-dim vectors with task optimization', icon: Database },
          { title: 'Gemma 4 31B IT', desc: 'Advanced reasoning and financial analysis', icon: Brain },
        ].map((item) => (
          <Card key={item.title}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1"><item.icon className="w-4 h-4 text-emerald-600" /><span className="text-sm font-medium">{item.title}</span></div>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Code2 className="w-4 h-4 text-emerald-600" />Complete Notebook Code</CardTitle></CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[500px]">
            <pre className="text-xs font-mono leading-relaxed p-4 rounded-lg bg-muted/50 overflow-x-auto">
              <code>{colabCode}</code>
            </pre>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
