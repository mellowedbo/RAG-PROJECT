'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Upload, FileText, Trash2, Loader2,
  FolderOpen, Monitor, AlertCircle, CheckCircle2, FileUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { DocInfo, ChunkInfo, AppMode } from '@/types';

// Documents View

interface DocumentsViewProps {
  documents: DocInfo[];
  chunks: ChunkInfo[];
  appMode: AppMode;
  onUploadFile: (file: File) => void;
  onUploadText: (title: string, content: string, docType: string, sector: string) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
  isUploading: boolean;
  uploadError: string | null;
  uploadSuccess: boolean;
}

export default function DocumentsView({
  documents,
  chunks,
  appMode,
  onUploadFile,
  onUploadText,
  onDelete,
  onRefresh,
  isUploading,
  uploadError,
  uploadSuccess,
}: DocumentsViewProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [docType, setDocType] = useState('custom');
  const [sector, setSector] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMethod, setUploadMethod] = useState<'file' | 'text'>('file');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTextUpload = () => {
    if (!title.trim() || !content.trim()) return;
    onUploadText(title.trim(), content, docType, sector);
    setTitle('');
    setContent('');
    setDocType('custom');
    setSector('');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-fill title from filename if empty
      if (!title.trim()) {
        setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
      }
    }
  };

  const handleFileUpload = () => {
    if (!selectedFile || !title.trim()) return;
    onUploadFile(selectedFile);
    setSelectedFile(null);
    setTitle('');
    setDocType('custom');
    setSector('');
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload form - only in test mode */}
      {appMode === 'test' && (
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="w-4 h-4 text-emerald-600" />
              Upload Financial Document
            </CardTitle>
            <CardDescription className="break-words">
              Upload a file or paste financial document text. The system will automatically chunk, embed with Gemini Embedding 2, and index it for semantic RAG retrieval. Stored in your browser.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {uploadError && (
              <div className="text-sm text-red-600 flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
                <AlertCircle className="w-4 h-4 shrink-0" />{uploadError}
              </div>
            )}
            {uploadSuccess && (
              <div className="text-sm text-emerald-600 flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
                <CheckCircle2 className="w-4 h-4 shrink-0" />Document uploaded and chunked successfully!
              </div>
            )}

            {/* Upload method toggle */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5 w-fit">
              <button
                onClick={() => setUploadMethod('file')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  uploadMethod === 'file'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <FileUp className="w-3 h-3" />
                File Upload
              </button>
              <button
                onClick={() => setUploadMethod('text')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  uploadMethod === 'text'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <FileText className="w-3 h-3" />
                Paste Text
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1 min-w-0">
                <label className="text-xs font-medium mb-1.5 block">Document Title</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Apple 10-K 2024" className="min-w-0" />
              </div>
              <div className="min-w-0">
                <label className="text-xs font-medium mb-1.5 block">Type</label>
                <Select value={docType} onValueChange={setDocType}>
                  <SelectTrigger className="min-w-0"><SelectValue /></SelectTrigger>
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
              <div className="min-w-0">
                <label className="text-xs font-medium mb-1.5 block">Sector (optional)</label>
                <Input value={sector} onChange={(e) => setSector(e.target.value)} placeholder="e.g., Technology" className="min-w-0" />
              </div>
            </div>

            {/* File upload area */}
            {uploadMethod === 'file' && (
              <div>
                <label className="text-xs font-medium mb-1.5 block">Upload File</label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-emerald-500/30 transition-colors overflow-hidden">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <FileUp className="w-8 h-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Click to select a file or drag and drop
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Supports PDF, DOCX, TXT
                    </span>
                  </label>
                </div>
                {selectedFile && (
                  <div className="mt-2 p-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium truncate">{selectedFile.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                        {selectedFile.type && ` • ${selectedFile.type}`}
                      </div>
                    </div>
                    <button
                      onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                      className="text-muted-foreground hover:text-foreground shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                )}
                <Button onClick={handleFileUpload} disabled={isUploading || !selectedFile || !title.trim()} className="mt-3 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {isUploading ? 'Processing...' : 'Upload & Chunk File'}
                </Button>
              </div>
            )}

            {/* Text paste fallback */}
            {uploadMethod === 'text' && (
              <div>
                <label className="text-xs font-medium mb-1.5 block">Document Content</label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste financial document text here..."
                  className="min-h-[180px] font-mono text-xs min-w-0"
                />
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[11px] text-muted-foreground">{content.split(/\s+/).filter((w) => w).length} words</span>
                  <span className="text-[11px] text-muted-foreground">{content.length.toLocaleString()} characters</span>
                </div>
                <Button onClick={handleTextUpload} disabled={isUploading || !title.trim() || !content.trim()} className="mt-3 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {isUploading ? 'Processing...' : 'Upload & Chunk'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {appMode === 'demo' && (
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-emerald-600">
              <Monitor className="w-4 h-4" />
              <span className="font-medium">Demo Mode</span>
              <span className="text-muted-foreground">— Documents are pre-loaded. Switch to Test mode to upload your own.</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document list */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-emerald-600" />
                Indexed Documents
                <Badge variant="secondary" className="text-[10px] ml-1">{documents.length}</Badge>
              </CardTitle>
              <CardDescription className="mt-1">
                {chunks.length} chunks indexed for retrieval
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onRefresh} className="h-8 text-xs gap-1.5">
              <svg className="w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No documents indexed yet</p>
              <p className="text-xs mt-1">
                {appMode === 'demo' ? 'Demo documents should be loading...' : 'Upload a document above to get started.'}
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[50vh]">
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
                          <Badge variant="secondary" className="text-[9px] h-4 capitalize">{doc.docType.replace('_', ' ')}</Badge>
                          <span>{doc.chunkCount} chunks</span>
                          <span>•</span>
                          <span>{doc.wordCount.toLocaleString()} words</span>
                          {doc.sector && <><span>•</span><span>{doc.sector}</span></>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <Badge variant="outline" className={`text-[9px] h-5 ${doc.status === 'chunked' ? 'border-emerald-500/30 text-emerald-600' : 'border-amber-500/30 text-amber-600'}`}>
                        {doc.status}
                      </Badge>
                      {appMode === 'test' && (
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(doc.id)} disabled={deletingId === doc.id} className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
                          {deletingId === doc.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                        </Button>
                      )}
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
