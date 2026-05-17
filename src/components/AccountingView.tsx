'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Plus, Sparkles, ScanSearch, AlertTriangle, CheckCircle2,
  XCircle, ChevronDown, ChevronUp, Trash2, Loader2, FileSpreadsheet,
  Brain, Info, ShieldAlert, MessageSquareQuote, Lightbulb, ArrowRightLeft,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import type { JournalEntry, AccountingIssue, TrialBalanceEntry } from '@/types';

// Constants — Account Catalog (Indian Accounting Context)

interface AccountInfo {
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  normalBalance: 'debit' | 'credit';
}

const ACCOUNT_CATALOG: AccountInfo[] = [
  // Assets
  { name: 'Cash', type: 'asset', normalBalance: 'debit' },
  { name: 'Bank', type: 'asset', normalBalance: 'debit' },
  { name: 'Accounts Receivable', type: 'asset', normalBalance: 'debit' },
  { name: 'Inventory', type: 'asset', normalBalance: 'debit' },
  { name: 'Prepaid Expenses', type: 'asset', normalBalance: 'debit' },
  { name: 'Equipment', type: 'asset', normalBalance: 'debit' },
  { name: 'Furniture & Fixtures', type: 'asset', normalBalance: 'debit' },
  { name: 'Land & Building', type: 'asset', normalBalance: 'debit' },
  { name: 'Investments', type: 'asset', normalBalance: 'debit' },
  { name: 'Debtors', type: 'asset', normalBalance: 'debit' },
  { name: 'Bills Receivable', type: 'asset', normalBalance: 'debit' },
  // Liabilities
  { name: 'Accounts Payable', type: 'liability', normalBalance: 'credit' },
  { name: 'Loans', type: 'liability', normalBalance: 'credit' },
  { name: 'Bank Overdraft', type: 'liability', normalBalance: 'credit' },
  { name: 'Creditors', type: 'liability', normalBalance: 'credit' },
  { name: 'Bills Payable', type: 'liability', normalBalance: 'credit' },
  { name: 'Outstanding Expenses', type: 'liability', normalBalance: 'credit' },
  { name: 'Provision for Tax', type: 'liability', normalBalance: 'credit' },
  // Equity
  { name: 'Capital', type: 'equity', normalBalance: 'credit' },
  { name: 'Retained Earnings', type: 'equity', normalBalance: 'credit' },
  { name: 'Reserves & Surplus', type: 'equity', normalBalance: 'credit' },
  { name: 'Drawings', type: 'equity', normalBalance: 'debit' },
  // Revenue
  { name: 'Revenue', type: 'revenue', normalBalance: 'credit' },
  { name: 'Sales', type: 'revenue', normalBalance: 'credit' },
  { name: 'Service Income', type: 'revenue', normalBalance: 'credit' },
  { name: 'Interest Income', type: 'revenue', normalBalance: 'credit' },
  { name: 'Other Income', type: 'revenue', normalBalance: 'credit' },
  // Expenses
  { name: 'Rent Expense', type: 'expense', normalBalance: 'debit' },
  { name: 'Salary Expense', type: 'expense', normalBalance: 'debit' },
  { name: 'Purchase of Goods', type: 'expense', normalBalance: 'debit' },
  { name: 'Utilities Expense', type: 'expense', normalBalance: 'debit' },
  { name: 'Depreciation', type: 'expense', normalBalance: 'debit' },
  { name: 'Insurance Expense', type: 'expense', normalBalance: 'debit' },
  { name: 'Office Supplies', type: 'expense', normalBalance: 'debit' },
  { name: 'Interest Expense', type: 'expense', normalBalance: 'debit' },
  { name: 'Advertising Expense', type: 'expense', normalBalance: 'debit' },
  { name: 'GST Input Credit', type: 'asset', normalBalance: 'debit' },
  { name: 'GST Payable', type: 'liability', normalBalance: 'credit' },
];

const ACCOUNT_NAMES = ACCOUNT_CATALOG.map(a => a.name);

const ACCOUNT_MAP = new Map(ACCOUNT_CATALOG.map(a => [a.name, a]));

const NL_SAMPLE_PROMPTS = [
  'Record rent payment of ₹2,000 by cheque',
  'Record ₹10,000 loan from bank',
  'Record salary expense of ₹5,000 paid in cash',
  'Record a ₹5,000 sale on credit to John',
  'Record purchase of equipment for ₹25,000 via bank transfer',
  'Record capital introduction of ₹1,00,000 in cash',
  'Record GST payment of ₹3,500',
];

const STORAGE_KEY = 'nexus-journal-entries';

// Helpers

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function loadEntries(): JournalEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveEntries(entries: JournalEntry[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

// Accounting Logic

function computeTrialBalance(entries: JournalEntry[]): TrialBalanceEntry[] {
  const balances = new Map<string, { debit: number; credit: number }>();

  for (const entry of entries) {
    // Debit account receives a debit
    const d = balances.get(entry.debitAccount) || { debit: 0, credit: 0 };
    d.debit += entry.amount;
    balances.set(entry.debitAccount, d);

    // Credit account receives a credit
    const c = balances.get(entry.creditAccount) || { debit: 0, credit: 0 };
    c.credit += entry.amount;
    balances.set(entry.creditAccount, c);
  }

  const result: TrialBalanceEntry[] = [];
  for (const [name, bal] of balances) {
    const info = ACCOUNT_MAP.get(name);
    // Net the balance according to normal balance side
    const net = bal.debit - bal.credit;
    if (info?.normalBalance === 'debit') {
      if (net >= 0) {
        result.push({ accountName: name, debit: net, credit: 0 });
      } else {
        result.push({ accountName: name, debit: 0, credit: Math.abs(net) });
      }
    } else {
      if (net <= 0) {
        result.push({ accountName: name, debit: 0, credit: Math.abs(net) });
      } else {
        result.push({ accountName: name, debit: net, credit: 0 });
      }
    }
  }

  // Sort: Assets, Expenses, Liabilities, Equity, Revenue
  const typeOrder: Record<string, number> = { asset: 0, expense: 1, liability: 2, equity: 3, revenue: 4 };
  result.sort((a, b) => {
    const ta = ACCOUNT_MAP.get(a.accountName)?.type || 'asset';
    const tb = ACCOUNT_MAP.get(b.accountName)?.type || 'asset';
    return (typeOrder[ta] ?? 5) - (typeOrder[tb] ?? 5) || a.accountName.localeCompare(b.accountName);
  });

  return result;
}

function scanForIssues(entries: JournalEntry[]): AccountingIssue[] {
  const issues: AccountingIssue[] = [];

  // 1. Unbalanced entries (each entry should have debit == credit by design, but check)
  for (const entry of entries) {
    if (entry.debitAccount === entry.creditAccount) {
      issues.push({
        id: uid(),
        severity: 'critical',
        category: 'Unbalanced Entry',
        description: `Entry "${entry.description}" debits and credits the same account (${entry.debitAccount}).`,
        suggestion: 'A journal entry must involve at least two different accounts. Please correct this entry.',
        relatedEntries: [entry.id],
      });
    }
  }

  // 2. Revenue recorded as liability
  for (const entry of entries) {
    const creditInfo = ACCOUNT_MAP.get(entry.creditAccount);
    if (creditInfo?.type === 'liability' && (entry.description.toLowerCase().includes('sale') || entry.description.toLowerCase().includes('revenue') || entry.description.toLowerCase().includes('income'))) {
      issues.push({
        id: uid(),
        severity: 'warning',
        category: 'Misclassification',
        description: `Entry "${entry.description}" appears to record revenue but credits a liability account (${entry.creditAccount}).`,
        suggestion: 'Revenue should be credited to a Revenue account, not a Liability account. Consider using "Revenue" or "Sales" instead.',
        relatedEntries: [entry.id],
      });
    }
  }

  // 3. Expenses recorded as assets
  for (const entry of entries) {
    const debitInfo = ACCOUNT_MAP.get(entry.debitAccount);
    if (debitInfo?.type === 'asset' && (entry.description.toLowerCase().includes('rent') || entry.description.toLowerCase().includes('salary') || entry.description.toLowerCase().includes('expense') || entry.description.toLowerCase().includes('utilities'))) {
      issues.push({
        id: uid(),
        severity: 'warning',
        category: 'Misclassification',
        description: `Entry "${entry.description}" appears to record an expense but debits an asset account (${entry.debitAccount}).`,
        suggestion: 'Operating expenses like rent, salary, and utilities should be debited to Expense accounts, not Asset accounts.',
        relatedEntries: [entry.id],
      });
    }
  }

  // 4. Negative balances in asset accounts
  const trialBal = computeTrialBalance(entries);
  for (const tb of trialBal) {
    const info = ACCOUNT_MAP.get(tb.accountName);
    if (info?.type === 'asset' && tb.credit > 0 && tb.debit === 0) {
      issues.push({
        id: uid(),
        severity: 'critical',
        category: 'Negative Asset Balance',
        description: `Asset account "${tb.accountName}" has a negative (credit) balance of ${formatCurrency(tb.credit)}.`,
        suggestion: 'Asset accounts should normally have a debit balance. Review entries affecting this account for errors or investigate if this is a bank overdraft situation.',
        relatedEntries: entries.filter(e => e.debitAccount === tb.accountName || e.creditAccount === tb.accountName).map(e => e.id),
      });
    }
  }

  // 5. Unusual account combinations
  const unusualPairs = [
    ['Revenue', 'Salary Expense'],
    ['Sales', 'Rent Expense'],
    ['Capital', 'Utilities Expense'],
  ];
  for (const entry of entries) {
    for (const [a, b] of unusualPairs) {
      if ((entry.debitAccount === a && entry.creditAccount === b) || (entry.debitAccount === b && entry.creditAccount === a)) {
        issues.push({
          id: uid(),
          severity: 'info',
          category: 'Unusual Combination',
          description: `Entry "${entry.description}" pairs ${a} with ${b}, which is an unusual accounting combination.`,
          suggestion: 'Review whether this entry reflects the actual transaction correctly. Such pairings are uncommon in standard practice.',
          relatedEntries: [entry.id],
        });
      }
    }
  }

  // 6. Missing contra entries for cash/bank transactions
  for (const entry of entries) {
    const isCashBank = entry.debitAccount === 'Cash' || entry.debitAccount === 'Bank' ||
                       entry.creditAccount === 'Cash' || entry.creditAccount === 'Bank';
    if (!isCashBank && entry.isVerified) {
      // Verified non-cash entry — check if there should be a contra
      const debitInfo = ACCOUNT_MAP.get(entry.debitAccount);
      const creditInfo = ACCOUNT_MAP.get(entry.creditAccount);
      if (debitInfo?.type === 'asset' && creditInfo?.type === 'asset') {
        issues.push({
          id: uid(),
          severity: 'info',
          category: 'Potential Missing Contra',
          description: `Entry "${entry.description}" involves two asset accounts without Cash/Bank. This may need a contra entry.`,
          suggestion: 'Transactions between two asset accounts often involve Cash or Bank as an intermediary. Verify if a contra entry is needed.',
          relatedEntries: [entry.id],
        });
      }
    }
  }

  // 7. Trial balance check
  const totalDebit = trialBal.reduce((s, t) => s + t.debit, 0);
  const totalCredit = trialBal.reduce((s, t) => s + t.credit, 0);
  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    issues.push({
      id: uid(),
      severity: 'critical',
      category: 'Trial Balance Imbalance',
      description: `Trial balance is not balanced. Debits total ${formatCurrency(totalDebit)} but credits total ${formatCurrency(totalCredit)}. Difference: ${formatCurrency(Math.abs(totalDebit - totalCredit))}.`,
      suggestion: 'Investigate the discrepancy. Check for data entry errors, duplicate entries, or missing journal entries.',
      relatedEntries: entries.map(e => e.id),
    });
  }

  return issues;
}

// Component Props

interface AccountingViewProps {
  apiKey: string;
  generationModel: string;
  simulationMode: boolean;
  isProcessing: boolean;
  setIsProcessing: (v: boolean) => void;
  chunks: { id: string; documentId: string; content: string; chunkIndex: number; section: string | null; wordCount: number; charCount: number; embedding?: number[] }[];
}

// AccountingView Component

export default function AccountingView({
  apiKey,
  generationModel,
  simulationMode,
  isProcessing: _isProcessing,
  setIsProcessing,
  chunks,
}: AccountingViewProps) {

  // State
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [issues, setIssues] = useState<AccountingIssue[]>([]);
  const [trialBalance, setTrialBalance] = useState<TrialBalanceEntry[]>([]);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('journal');

  // Manual entry form
  const [formDate, setFormDate] = useState(todayISO());
  const [formDesc, setFormDesc] = useState('');
  const [formDebit, setFormDebit] = useState('');
  const [formCredit, setFormCredit] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formNarration, setFormNarration] = useState('');

  // Natural language input
  const [nlInput, setNlInput] = useState('');
  const [isParsingNL, setIsParsingNL] = useState(false);

  // Issue scanning
  const [isScanning, setIsScanning] = useState(false);

  // AI analysis
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // RAG document analysis
  const [ragChunks, setRagChunks] = useState<{ content: string; section: string | null; documentTitle: string }[]>([]);
  const [isRagSearching, setIsRagSearching] = useState(false);
  const [showRagResults, setShowRagResults] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = loadEntries();
    setJournalEntries(saved);
  }, []);

  // Persist to localStorage whenever entries change
  useEffect(() => {
    if (journalEntries.length > 0 || localStorage.getItem(STORAGE_KEY)) {
      saveEntries(journalEntries);
      setTrialBalance(computeTrialBalance(journalEntries));
    }
  }, [journalEntries]);

  // Add Manual Entry
  const addManualEntry = useCallback(() => {
    if (!formDate || !formDesc.trim() || !formDebit || !formCredit || !formAmount || Number(formAmount) <= 0) {
      return;
    }

    const entry: JournalEntry = {
      id: uid(),
      date: formDate,
      description: formDesc.trim(),
      debitAccount: formDebit,
      creditAccount: formCredit,
      amount: Number(formAmount),
      narration: formNarration.trim() || undefined,
      isVerified: false,
      issues: [],
    };

    setJournalEntries(prev => [...prev, entry]);
    // Reset form
    setFormDesc('');
    setFormAmount('');
    setFormNarration('');
  }, [formDate, formDesc, formDebit, formCredit, formAmount, formNarration]);

  // Parse Natural Language Entry via LLM
  const parseNaturalLanguage = useCallback(async () => {
    if (!nlInput.trim()) return;

    if (!apiKey && !simulationMode) {
      // Fallback: simple pattern matching
      const amountMatch = nlInput.match(/[\$₹]?\s*([\d,]+(?:\.\d+)?)/);
      const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;

      const _isCash = nlInput.toLowerCase().includes('cash');
      const isBank = nlInput.toLowerCase().includes('cheque') || nlInput.toLowerCase().includes('bank') || nlInput.toLowerCase().includes('transfer');
      const isCredit = nlInput.toLowerCase().includes('credit') || nlInput.toLowerCase().includes('on credit');

      let debitAccount = 'Cash';
      let creditAccount = 'Revenue';
      let description = nlInput.trim();

      if (nlInput.toLowerCase().includes('rent')) {
        debitAccount = 'Rent Expense'; creditAccount = isBank ? 'Bank' : 'Cash';
      } else if (nlInput.toLowerCase().includes('salary')) {
        debitAccount = 'Salary Expense'; creditAccount = isBank ? 'Bank' : 'Cash';
      } else if (nlInput.toLowerCase().includes('sale') || nlInput.toLowerCase().includes('sold')) {
        debitAccount = isCredit ? 'Accounts Receivable' : (isBank ? 'Bank' : 'Cash');
        creditAccount = 'Revenue';
      } else if (nlInput.toLowerCase().includes('purchase') || nlInput.toLowerCase().includes('bought')) {
        debitAccount = 'Purchase of Goods'; creditAccount = isCredit ? 'Accounts Payable' : (isBank ? 'Bank' : 'Cash');
      } else if (nlInput.toLowerCase().includes('loan')) {
        if (nlInput.toLowerCase().includes('from')) {
          debitAccount = 'Bank'; creditAccount = 'Loans';
        } else {
          debitAccount = 'Loans'; creditAccount = 'Bank';
        }
      } else if (nlInput.toLowerCase().includes('capital') || nlInput.toLowerCase().includes('invested')) {
        debitAccount = isBank ? 'Bank' : 'Cash'; creditAccount = 'Capital';
      } else if (nlInput.toLowerCase().includes('equipment') || nlInput.toLowerCase().includes('machine')) {
        debitAccount = 'Equipment'; creditAccount = isBank ? 'Bank' : 'Cash';
      }

      if (amount > 0) {
        const entry: JournalEntry = {
          id: uid(),
          date: todayISO(),
          description,
          debitAccount,
          creditAccount,
          amount,
          narration: `Auto-parsed from: "${nlInput}" (offline mode)`,
          isVerified: false,
          issues: [],
        };
        setJournalEntries(prev => [...prev, entry]);
        setNlInput('');
      }
      return;
    }

    setIsParsingNL(true);
    try {
      const systemPrompt = `You are a professional Indian accountant. Parse the user's natural language description into a double-entry journal entry. 

Available accounts: ${ACCOUNT_NAMES.join(', ')}

Respond in EXACTLY this JSON format (no markdown, no backticks, just raw JSON):
{
  "date": "YYYY-MM-DD",
  "description": "Brief description",
  "debitAccount": "Account Name from the list",
  "creditAccount": "Account Name from the list",
  "amount": number,
  "narration": "Detailed narration as per Indian accounting practice"
}

Rules:
- Use account names EXACTLY from the provided list
- Every transaction must follow double-entry principles
- Use INR currency context (amounts in ₹)
- The debit and credit MUST be different accounts
- If the transaction involves cash payment, credit Cash; if bank/cheque, credit Bank
- If sale on credit, debit Accounts Receivable; if cash sale, debit Cash/Bank
- If purchase on credit, credit Accounts Payable; if cash purchase, credit Cash/Bank
- Rent/Salary/Utilities → debit respective Expense account
- Capital introduced → credit Capital
- Loan received → credit Loans`;

      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          systemPrompt,
          userPrompt: nlInput,
          model: generationModel,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to parse natural language entry');
      }

      const data = await res.json();
      const parsed = JSON.parse(data.response);

      // Validate parsed data
      if (!parsed.debitAccount || !parsed.creditAccount || !parsed.amount || parsed.debitAccount === parsed.creditAccount) {
        throw new Error('Invalid journal entry parsed from AI');
      }

      const entry: JournalEntry = {
        id: uid(),
        date: parsed.date || todayISO(),
        description: parsed.description || nlInput.trim(),
        debitAccount: parsed.debitAccount,
        creditAccount: parsed.creditAccount,
        amount: Number(parsed.amount),
        narration: parsed.narration || `Parsed from: "${nlInput}"`,
        isVerified: false,
        issues: [],
      };

      setJournalEntries(prev => [...prev, entry]);
      setNlInput('');
    } catch (err) {
      console.error('NL parse error:', err);
      // Fallback to simple parsing
      const amountMatch = nlInput.match(/[\$₹]?\s*([\d,]+(?:\.\d+)?)/);
      const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;
      if (amount > 0) {
        const _isCash = nlInput.toLowerCase().includes('cash');
        const isBank = nlInput.toLowerCase().includes('cheque') || nlInput.toLowerCase().includes('bank');
        let debitAccount = 'Cash';
        let creditAccount = 'Revenue';

        if (nlInput.toLowerCase().includes('rent')) { debitAccount = 'Rent Expense'; creditAccount = isBank ? 'Bank' : 'Cash'; }
        else if (nlInput.toLowerCase().includes('salary')) { debitAccount = 'Salary Expense'; creditAccount = isBank ? 'Bank' : 'Cash'; }
        else if (nlInput.toLowerCase().includes('sale')) { debitAccount = isBank ? 'Bank' : 'Cash'; creditAccount = 'Revenue'; }
        else if (nlInput.toLowerCase().includes('loan')) { debitAccount = 'Bank'; creditAccount = 'Loans'; }
        else if (nlInput.toLowerCase().includes('capital')) { debitAccount = isBank ? 'Bank' : 'Cash'; creditAccount = 'Capital'; }

        const entry: JournalEntry = {
          id: uid(),
          date: todayISO(),
          description: nlInput.trim(),
          debitAccount,
          creditAccount,
          amount,
          narration: `Fallback parsed from: "${nlInput}"`,
          isVerified: false,
          issues: [],
        };
        setJournalEntries(prev => [...prev, entry]);
        setNlInput('');
      }
    } finally {
      setIsParsingNL(false);
    }
  }, [nlInput, apiKey, generationModel, simulationMode]);

  // Delete Entry
  const deleteEntry = useCallback((id: string) => {
    setJournalEntries(prev => prev.filter(e => e.id !== id));
    setIssues(prev => prev.filter(i => !i.relatedEntries.includes(id)));
    if (expandedEntryId === id) setExpandedEntryId(null);
  }, [expandedEntryId]);

  // Toggle Verify
  const toggleVerify = useCallback((id: string) => {
    setJournalEntries(prev => prev.map(e => e.id === id ? { ...e, isVerified: !e.isVerified } : e));
  }, []);

  // Scan for Issues
  const handleScan = useCallback(() => {
    if (journalEntries.length === 0) return;
    setIsScanning(true);
    // Slight delay for UI feedback
    setTimeout(() => {
      const found = scanForIssues(journalEntries);
      setIssues(found);
      setIsScanning(false);
    }, 600);
  }, [journalEntries]);

  // Offline Rule-Based Analysis
  const generateOfflineAnalysis = useCallback((): string => {
    if (journalEntries.length === 0) return 'No journal entries to analyze.';

    const totalDebitAmt = trialBalance.reduce((s, t) => s + t.debit, 0);
    const totalCreditAmt = trialBalance.reduce((s, t) => s + t.credit, 0);
    const balanced = Math.abs(totalDebitAmt - totalCreditAmt) < 0.01;

    // Group entries by account type
    const accountTypes = new Map<string, Set<string>>();
    for (const entry of journalEntries) {
      const dInfo = ACCOUNT_MAP.get(entry.debitAccount);
      const cInfo = ACCOUNT_MAP.get(entry.creditAccount);
      if (dInfo) {
        if (!accountTypes.has(dInfo.type)) accountTypes.set(dInfo.type, new Set());
        accountTypes.get(dInfo.type)!.add(entry.debitAccount);
      }
      if (cInfo) {
        if (!accountTypes.has(cInfo.type)) accountTypes.set(cInfo.type, new Set());
        accountTypes.get(cInfo.type)!.add(entry.creditAccount);
      }
    }

    // Compute health score
    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;
    let healthScore = 50; // Base score
    if (balanced) healthScore += 25; // Trial balance is balanced
    else healthScore -= 20;
    if (criticalCount === 0) healthScore += 10;
    else healthScore -= criticalCount * 5;
    if (warningCount === 0) healthScore += 5;
    else healthScore -= warningCount * 3;
    const verifiedCount = journalEntries.filter(e => e.isVerified).length;
    const verifyPct = journalEntries.length > 0 ? verifiedCount / journalEntries.length : 0;
    healthScore += Math.round(verifyPct * 10);
    healthScore = Math.max(0, Math.min(100, healthScore));

    const healthLabel = healthScore >= 80 ? 'Good' : healthScore >= 60 ? 'Fair' : healthScore >= 40 ? 'Needs Attention' : 'Critical';
    const healthEmoji = healthScore >= 80 ? '🟢' : healthScore >= 60 ? '🟡' : healthScore >= 40 ? '🟠' : '🔴';

    let md = `## 📊 Accounting Assessment (Rule-Based Analysis)\n\n`;
    md += `> **Health Score: ${healthEmoji} ${healthScore}/100 — ${healthLabel}**\n\n`;

    // 1. Trial Balance Status
    md += `### 1. Trial Balance Status\n\n`;
    md += balanced
      ? `✅ **Balanced** — Total Debits (${formatCurrency(totalDebitAmt)}) equal Total Credits (${formatCurrency(totalCreditAmt)}). Double-entry principle is maintained.\n\n`
      : `❌ **Imbalanced** — Debits (${formatCurrency(totalDebitAmt)}) differ from Credits (${formatCurrency(totalCreditAmt)}) by ${formatCurrency(Math.abs(totalDebitAmt - totalCreditAmt))}. Investigation required.\n\n`;

    // 2. Account Distribution
    md += `### 2. Account Distribution\n\n`;
    md += `| Type | Accounts Used |\n|------|--------------|\n`;
    for (const [type, accounts] of accountTypes) {
      md += `| ${type.charAt(0).toUpperCase() + type.slice(1)} | ${[...accounts].join(', ')} |\n`;
    }
    md += `\n`;

    // 3. Entry Quality Review
    md += `### 3. Entry Quality Review\n\n`;
    md += `- **Total Entries:** ${journalEntries.length}\n`;
    md += `- **Verified Entries:** ${verifiedCount} (${Math.round(verifyPct * 100)}%)\n`;
    md += `- **Unverified Entries:** ${journalEntries.length - verifiedCount}\n`;

    const avgAmount = journalEntries.reduce((s, e) => s + e.amount, 0) / journalEntries.length;
    md += `- **Average Entry Amount:** ${formatCurrency(avgAmount)}\n`;
    md += `- **Largest Entry:** ${formatCurrency(Math.max(...journalEntries.map(e => e.amount)))}\n`;
    md += `- **Smallest Entry:** ${formatCurrency(Math.min(...journalEntries.map(e => e.amount)))}\n\n`;

    // 4. Issues Detected
    md += `### 4. Issues Detected\n\n`;
    if (issues.length === 0) {
      md += `✅ No issues detected in the current scan. Run "Scan for Issues" first for a comprehensive check.\n\n`;
    } else {
      md += `| Severity | Category | Description |\n|----------|----------|-------------|\n`;
      for (const issue of issues) {
        const icon = issue.severity === 'critical' ? '🔴' : issue.severity === 'warning' ? '🟡' : 'ℹ️';
        md += `| ${icon} ${issue.severity} | ${issue.category} | ${issue.description.slice(0, 80)}${issue.description.length > 80 ? '...' : ''} |\n`;
      }
      md += `\n`;
      if (issues.some(i => i.severity === 'critical')) {
        md += `⚠️ **Critical issues require immediate attention.** Review the Issues tab for detailed suggestions.\n\n`;
      }
    }

    // 5. Compliance Notes
    md += `### 5. Compliance Notes\n\n`;
    const hasGST = journalEntries.some(e => e.debitAccount.includes('GST') || e.creditAccount.includes('GST'));
    if (!hasGST) {
      md += `- ⚠️ **No GST entries detected.** If your business is registered under GST, ensure all taxable transactions include appropriate GST accounting entries.\n`;
    } else {
      md += `- ✅ GST entries are present in the records.\n`;
    }
    const hasDepreciation = journalEntries.some(e => e.debitAccount === 'Depreciation');
    if (!hasDepreciation && accountTypes.has('asset')) {
      md += `- 💡 **No depreciation entries found.** If you have fixed assets (Equipment, Furniture, Land & Building), ensure depreciation is recorded as per Schedule II of the Companies Act 2013.\n`;
    }
    if (accountTypes.has('revenue')) {
      md += `- 💡 Revenue accounts detected — ensure proper recognition as per Ind AS 115 (Revenue from Contracts with Customers).\n`;
    }
    md += `- 📋 All entries should comply with Indian Accounting Standards (Ind AS) and the Companies Act 2013.\n\n`;

    // 6. Key Insights
    md += `### 6. Key Insights\n\n`;
    const assetAccounts = trialBalance.filter(t => ACCOUNT_MAP.get(t.accountName)?.type === 'asset');
    const liabilityAccounts = trialBalance.filter(t => ACCOUNT_MAP.get(t.accountName)?.type === 'liability');
    const revenueAccounts = trialBalance.filter(t => ACCOUNT_MAP.get(t.accountName)?.type === 'revenue');
    const expenseAccounts = trialBalance.filter(t => ACCOUNT_MAP.get(t.accountName)?.type === 'expense');

    const totalAssets = assetAccounts.reduce((s, t) => s + t.debit - t.credit, 0);
    const totalLiabilities = liabilityAccounts.reduce((s, t) => s + t.credit - t.debit, 0);
    const totalRevenue = revenueAccounts.reduce((s, t) => s + t.credit - t.debit, 0);
    const totalExpenses = expenseAccounts.reduce((s, t) => s + t.debit - t.credit, 0);

    if (totalRevenue > 0 && totalExpenses > 0) {
      const netProfit = totalRevenue - totalExpenses;
      md += `- **Net Position:** ${netProfit >= 0 ? 'Profit' : 'Loss'} of ${formatCurrency(Math.abs(netProfit))}\n`;
    }
    if (totalAssets > 0 && totalLiabilities > 0) {
      const debtToAsset = totalLiabilities / totalAssets;
      md += `- **Debt-to-Asset Ratio:** ${debtToAsset.toFixed(2)} ${debtToAsset > 0.5 ? '(⚠️ high leverage)' : '(✅ healthy)'}\n`;
    }
    md += `- **Accounts Tracked:** ${trialBalance.length} across ${accountTypes.size} categories\n`;
    md += `\n*This is a rule-based analysis. Add a Gemini API key for AI-powered insights with contextual understanding.*\n`;

    return md;
  }, [journalEntries, trialBalance, issues]);

  // RAG Document Search
  const handleRAGSearch = useCallback(() => {
    if (chunks.length === 0) return;
    setIsRagSearching(true);
    setShowRagResults(true);

    // Search for accounting-related chunks using keyword matching with expanded terms
    const accountingKeywords = [
      'accounting', 'journal', 'ledger', 'debit', 'credit', 'balance', 'trial balance',
      'entry', 'bookkeeping', 'revenue', 'expense', 'asset', 'liability', 'equity',
      'income', 'profit', 'loss', 'gst', 'tax', 'depreciation', 'audit',
      'financial statement', 'ind as', 'gaap',
      // Accounting-specific terms added
      'receivable', 'payable', 'accounts receivable', 'accounts payable',
      'contra', 'posting', 'double entry', 'general ledger', 'subsidiary',
      'accrual', 'cash basis', 'prepaid', 'outstanding', 'provision',
      'amortization', 'impairment', 'reconciliation', 'adjusting entry',
      'closing entry', 'opening balance', 'carrying value', 'write off',
      'bad debt', 'allowance', 'inventory valuation', 'fifo', 'lifo',
      'working capital', 'current ratio', 'quick ratio',
    ];
    const entryKeywords = journalEntries.flatMap(e => [e.debitAccount.toLowerCase(), e.creditAccount.toLowerCase(), e.description.toLowerCase()]);

    const scored = chunks.map(chunk => {
      const lower = chunk.content.toLowerCase();
      let score = 0;
      for (const kw of accountingKeywords) {
        // Count occurrences for better scoring (TF-IDF-like)
        const regex = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        const matches = lower.match(regex);
        if (matches) score += matches.length * 2;
      }
      for (const kw of entryKeywords) {
        if (lower.includes(kw)) score += 3;
      }
      return { chunk, score };
    }).filter(s => s.score > 0).sort((a, b) => b.score - a.score).slice(0, 8);

    // Build results with document titles
    const results = scored.map(s => ({
      content: s.chunk.content,
      section: s.chunk.section,
      documentTitle: s.chunk.documentId, // We'll use the id as fallback
    }));

    setRagChunks(results);
    setIsRagSearching(false);
  }, [chunks, journalEntries]);

  // AI Analysis
  const handleAIAnalysis = useCallback(async () => {
    if (journalEntries.length === 0) return;
    if (!apiKey && !simulationMode) {
      // Use offline rule-based analysis instead of just a warning
      setIsAnalyzing(true);
      setAiAnalysis('');
      // Simulate brief delay for UX
      await new Promise(r => setTimeout(r, 400));
      setAiAnalysis(generateOfflineAnalysis());
      setIsAnalyzing(false);
      return;
    }

    setIsAnalyzing(true);
    setIsProcessing(true);
    setAiAnalysis('');

    try {
      const entriesText = journalEntries.map((e, i) =>
        `${i + 1}. Date: ${e.date} | ${e.description} | Dr: ${e.debitAccount} | Cr: ${e.creditAccount} | Amount: ₹${e.amount.toLocaleString('en-IN')} | Narration: ${e.narration || 'N/A'} | Verified: ${e.isVerified ? 'Yes' : 'No'}`
      ).join('\n');

      const trialBalText = trialBalance.map(t =>
        `${t.accountName}: Debit ₹${t.debit.toLocaleString('en-IN')} | Credit ₹${t.credit.toLocaleString('en-IN')}`
      ).join('\n');

      const issuesText = issues.length > 0
        ? issues.map(i => `- [${i.severity.toUpperCase()}] ${i.category}: ${i.description}`).join('\n')
        : 'No issues detected in basic scan.';

      // Include RAG context if chunks are available
      const accountingChunks = chunks.filter(c => {
        const lower = c.content.toLowerCase();
        return lower.includes('accounting') || lower.includes('journal') || lower.includes('ledger') ||
               lower.includes('debit') || lower.includes('credit') || lower.includes('balance') ||
               lower.includes('revenue') || lower.includes('expense') || lower.includes('asset') ||
               lower.includes('liability') || lower.includes('gst') || lower.includes('tax') ||
               lower.includes('financial') || lower.includes('income') || lower.includes('profit');
      }).slice(0, 5);

      const ragContext = accountingChunks.length > 0
        ? `\n\n**Relevant Document Excerpts:**\n${accountingChunks.map((c, i) => `[Source ${i + 1}${c.section ? ` | ${c.section}` : ''}]: ${c.content.slice(0, 400)}`).join('\n\n')}\n\nUse the above document context to provide more specific, contextual analysis where applicable.`
        : '';

      const systemPrompt = `You are NEXUS Accounting AI, an expert Indian chartered accountant powered by Gemini AI. Analyze the provided journal entries and provide comprehensive insights.${accountingChunks.length > 0 ? ' Also reference the provided financial document excerpts where relevant.' : ''}

Provide your analysis in the following structured format:

## 📊 Accounting Assessment

### 1. Entry Quality Review
Review each journal entry for proper double-entry bookkeeping compliance, correct account classification, and adherence to Indian Accounting Standards (Ind AS).

### 2. Improper Practices Identified
Identify any improper accounting practices such as:
- Wrong account classification
- Missing contra entries  
- Revenue/expense misclassification
- Non-compliance with Ind AS
- GST implications not accounted for

### 3. Corrections Suggested
For each issue found, provide the corrected journal entry format.

### 4. Compliance Notes
Note any Indian regulatory considerations (Companies Act 2013, GST, Income Tax Act).

### 5. Summary
Brief overall assessment of the accounting records.

Be specific, professional, and use proper Indian accounting terminology. Use ₹ for amounts.`;

      const userPrompt = `Please analyze the following accounting records:

**Journal Entries:**
${entriesText}

**Trial Balance:**
${trialBalText}

**Detected Issues:**
${issuesText}

Total entries: ${journalEntries.length}
Total debit balance: ₹${trialBalance.reduce((s, t) => s + t.debit, 0).toLocaleString('en-IN')}
Total credit balance: ₹${trialBalance.reduce((s, t) => s + t.credit, 0).toLocaleString('en-IN')}${ragContext}`;

      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          systemPrompt,
          userPrompt,
          model: generationModel,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error((errData as Record<string, string>).error || 'AI analysis failed');
      }

      const data = await res.json();
      setAiAnalysis(data.response);
    } catch (err) {
      setAiAnalysis(`❌ Analysis failed: ${err instanceof Error ? err.message : 'Unknown error'}. Please check your API key and try again.`);
    } finally {
      setIsAnalyzing(false);
      setIsProcessing(false);
    }
  }, [journalEntries, trialBalance, issues, apiKey, generationModel, simulationMode, setIsProcessing, chunks, generateOfflineAnalysis]);

  // Clear All
  const clearAll = useCallback(() => {
    setJournalEntries([]);
    setIssues([]);
    setTrialBalance([]);
    setAiAnalysis('');
    setExpandedEntryId(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Derived Values
  const totalDebit = trialBalance.reduce((s, t) => s + t.debit, 0);
  const totalCredit = trialBalance.reduce((s, t) => s + t.credit, 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;
  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const infoCount = issues.filter(i => i.severity === 'info').length;

  // Render

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-emerald-600/20 bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-950/20">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  Accounting Intelligence
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Double-entry bookkeeping with AI-powered analysis &amp; Indian accounting standards compliance
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {!apiKey && !simulationMode && (
                  <Badge variant="outline" className="text-[10px] gap-1 border-emerald-500/30 text-emerald-600">
                    <Lightbulb className="w-2.5 h-2.5" />
                    Works offline — add API key for AI insights
                  </Badge>
                )}
                {journalEntries.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAll}
                    className="text-xs gap-1 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear All
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Standalone Mode Banner */}
      {!apiKey && !simulationMode && (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-xs text-amber-600 flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-500/20">
            <AlertCircle className="w-4 h-4 shrink-0" />
            AI Analysis requires an API key. Journal entries, trial balance, and issue scanning work without an API key.
          </div>
        </motion.div>
      )}

      {/* Stats Row */}
      {journalEntries.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-emerald-600">{journalEntries.length}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Journal Entries</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className={`text-2xl font-bold ${isBalanced ? 'text-emerald-600' : 'text-red-500'}`}>
                {isBalanced ? '✓' : '✗'}
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Trial Balance</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-amber-500">{warningCount + criticalCount}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Issues Found</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalDebit)}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Debit</div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="journal" className="text-xs gap-1">
            <Plus className="w-3 h-3 hidden sm:inline" />
            Journal
          </TabsTrigger>
          <TabsTrigger value="entries" className="text-xs gap-1">
            <FileSpreadsheet className="w-3 h-3 hidden sm:inline" />
            Entries
            {journalEntries.length > 0 && (
              <Badge variant="secondary" className="text-[9px] h-4 px-1">{journalEntries.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="issues" className="text-xs gap-1">
            <ShieldAlert className="w-3 h-3 hidden sm:inline" />
            Issues
            {issues.length > 0 && (
              <Badge variant="secondary" className="text-[9px] h-4 px-1">{issues.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="analysis" className="text-xs gap-1">
            <Brain className="w-3 h-3 hidden sm:inline" />
            AI Analysis
          </TabsTrigger>
        </TabsList>

        {/* Tab: Journal Entry Creator */}
        <TabsContent value="journal" className="space-y-4 mt-4">
          {/* Manual Entry Form */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                Create Journal Entry
              </CardTitle>
              <CardDescription className="text-xs">
                Record a double-entry transaction with debit and credit accounts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Date */}
                <div className="space-y-1.5 min-w-0">
                  <Label className="text-xs font-medium">Date</Label>
                  <Input
                    type="date"
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="h-9 text-sm w-full max-w-full"
                  />
                </div>
                {/* Amount */}
                <div className="space-y-1.5 min-w-0">
                  <Label className="text-xs font-medium">Amount (₹)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 5000"
                    value={formAmount}
                    onChange={e => setFormAmount(e.target.value)}
                    className="h-9 text-sm w-full max-w-full"
                  />
                </div>
              </div>

              <div className="space-y-1.5 min-w-0">
                <Label className="text-xs font-medium">Description</Label>
                <Input
                  placeholder="e.g. Rent payment for March 2025"
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  className="h-9 text-sm w-full max-w-full"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Debit Account */}
                <div className="space-y-1.5 min-w-0">
                  <Label className="text-xs font-medium flex items-center gap-1">
                    <ArrowRightLeft className="w-3 h-3 text-emerald-600" />
                    Debit Account (Dr)
                  </Label>
                  <Select value={formDebit} onValueChange={setFormDebit}>
                    <SelectTrigger className="h-9 text-sm min-w-0">
                      <SelectValue placeholder="Select debit account" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACCOUNT_CATALOG.map(a => (
                        <SelectItem key={a.name} value={a.name}>
                          <span className="flex items-center gap-2">
                            {a.name}
                            <span className="text-[10px] text-muted-foreground">({a.type})</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Credit Account */}
                <div className="space-y-1.5 min-w-0">
                  <Label className="text-xs font-medium flex items-center gap-1">
                    <ArrowRightLeft className="w-3 h-3 text-amber-500" />
                    Credit Account (Cr)
                  </Label>
                  <Select value={formCredit} onValueChange={setFormCredit}>
                    <SelectTrigger className="h-9 text-sm min-w-0">
                      <SelectValue placeholder="Select credit account" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACCOUNT_CATALOG.map(a => (
                        <SelectItem key={a.name} value={a.name}>
                          <span className="flex items-center gap-2">
                            {a.name}
                            <span className="text-[10px] text-muted-foreground">({a.type})</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5 min-w-0">
                <Label className="text-xs font-medium">Narration (Optional)</Label>
                <Input
                  placeholder="e.g. Being rent paid for office premises for the month of March"
                  value={formNarration}
                  onChange={e => setFormNarration(e.target.value)}
                  className="h-9 text-sm w-full max-w-full"
                />
              </div>

              <Button
                onClick={addManualEntry}
                disabled={!formDate || !formDesc.trim() || !formDebit || !formCredit || !formAmount || Number(formAmount) <= 0}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Create Entry
              </Button>
            </CardContent>
          </Card>

          {/* Natural Language Entry */}
          <Card className="border-emerald-600/20 overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Natural Language Entry
              </CardTitle>
              <CardDescription className="text-xs">
                Describe the transaction in plain English — AI will parse it into a proper journal entry
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="e.g. Record rent payment of ₹2,000 by cheque"
                value={nlInput}
                onChange={e => setNlInput(e.target.value)}
                className="min-h-[80px] text-sm resize-none min-w-0"
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey && nlInput.trim()) {
                    e.preventDefault();
                    parseNaturalLanguage();
                  }
                }}
              />
              <Button
                onClick={parseNaturalLanguage}
                disabled={!nlInput.trim() || isParsingNL}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              >
                {isParsingNL ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {isParsingNL ? 'Parsing...' : 'Parse & Create Entry'}
              </Button>

              {/* Sample Prompts */}
              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Try these examples</Label>
                <div className="flex flex-wrap gap-1.5">
                  {NL_SAMPLE_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => setNlInput(prompt)}
                      className="text-[10px] px-2 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors text-wrap break-words max-w-[260px]"
                    >
                      {prompt.length > 40 ? prompt.slice(0, 40) + '...' : prompt}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search Accounting Documents */}
          {chunks.length > 0 && (
            <Card className="border-emerald-600/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ScanSearch className="w-4 h-4 text-emerald-600" />
                  Search Accounting Documents
                </CardTitle>
                <CardDescription className="text-xs">
                  Search your uploaded documents for accounting data — debit, credit, journal, ledger, receivable, payable &amp; more
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleRAGSearch}
                  disabled={isRagSearching}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                  size="sm"
                >
                  {isRagSearching ? <Loader2 className="w-3 h-3 animate-spin" /> : <ScanSearch className="w-3 h-3" />}
                  {isRagSearching ? 'Searching Documents...' : 'Search Accounting Documents'}
                </Button>
                {showRagResults && ragChunks.length > 0 && (
                  <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border">
                    <div className="text-[11px] font-medium text-emerald-600 mb-2">
                      Found {ragChunks.length} matching chunks
                    </div>
                    <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                      {ragChunks.slice(0, 5).map((chunk, i) => (
                        <div key={i} className="p-2 rounded border border-border bg-background text-[10px] text-muted-foreground leading-relaxed break-words">
                          {chunk.section && <Badge variant="outline" className="text-[8px] h-3.5 mr-1">{chunk.section}</Badge>}
                          {chunk.content.slice(0, 150)}{chunk.content.length > 150 ? '...' : ''}
                        </div>
                      ))}
                    </div>
                    {ragChunks.length > 5 && (
                      <div className="text-[10px] text-muted-foreground mt-1.5">+{ragChunks.length - 5} more results in the Analysis tab</div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="entries" className="space-y-4 mt-4">
          {journalEntries.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <FileSpreadsheet className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm font-medium">No journal entries yet</p>
                  <p className="text-xs mt-1">Create entries using the Journal tab to get started</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Trial Balance Quick View */}
              {trialBalance.length > 0 && (
                <Card className="border-emerald-600/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      Trial Balance
                      <Badge variant={isBalanced ? 'default' : 'destructive'} className="text-[9px] h-5">
                        {isBalanced ? 'Balanced' : 'Imbalanced'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Account</TableHead>
                            <TableHead className="text-xs text-right">Debit (₹)</TableHead>
                            <TableHead className="text-xs text-right">Credit (₹)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {trialBalance.map(tb => (
                            <TableRow key={tb.accountName}>
                              <TableCell className="text-xs font-medium min-w-0">
                                <span className="break-all">{tb.accountName}</span>
                                <span className="ml-1.5 text-[9px] text-muted-foreground">
                                  ({ACCOUNT_MAP.get(tb.accountName)?.type || 'unknown'})
                                </span>
                              </TableCell>
                              <TableCell className={`text-xs text-right font-mono ${tb.debit > 0 ? 'text-emerald-600 font-semibold' : 'text-muted-foreground'}`}>
                                {tb.debit > 0 ? formatCurrency(tb.debit) : '—'}
                              </TableCell>
                              <TableCell className={`text-xs text-right font-mono ${tb.credit > 0 ? 'text-amber-600 font-semibold' : 'text-muted-foreground'}`}>
                                {tb.credit > 0 ? formatCurrency(tb.credit) : '—'}
                              </TableCell>
                            </TableRow>
                          ))}
                          {/* Totals */}
                          <TableRow className="border-t-2 border-emerald-600/30">
                            <TableCell className="text-xs font-bold">Total</TableCell>
                            <TableCell className={`text-xs text-right font-mono font-bold ${!isBalanced ? 'text-red-500' : 'text-emerald-600'}`}>
                              {formatCurrency(totalDebit)}
                            </TableCell>
                            <TableCell className={`text-xs text-right font-mono font-bold ${!isBalanced ? 'text-red-500' : 'text-amber-600'}`}>
                              {formatCurrency(totalCredit)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                    {!isBalanced && (
                      <div className="mt-2 p-2 rounded-md bg-red-500/10 border border-red-500/20">
                        <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Imbalance: {formatCurrency(Math.abs(totalDebit - totalCredit))}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Entries Table */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    Journal Entries
                    <Badge variant="secondary" className="text-[9px] h-5">{journalEntries.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-[70vh]">
                    <div className="space-y-2 pr-2">
                      <AnimatePresence>
                        {journalEntries.map((entry, i) => {
                          const isExpanded = expandedEntryId === entry.id;
                          const entryIssues = issues.filter(iss => iss.relatedEntries.includes(entry.id));
                          const status = !entry.isVerified
                            ? 'unverified'
                            : entryIssues.some(iss => iss.severity === 'critical')
                              ? 'issues'
                              : 'verified';

                          return (
                            <motion.div
                              key={entry.id}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              transition={{ delay: i * 0.02 }}
                              className={`rounded-lg border transition-colors cursor-pointer ${
                                status === 'verified' ? 'border-emerald-500/20 bg-emerald-500/5' :
                                status === 'issues' ? 'border-red-500/20 bg-red-500/5' :
                                'border-amber-500/20 bg-amber-500/5'
                              }`}
                              onClick={() => setExpandedEntryId(isExpanded ? null : entry.id)}
                            >
                              <div className="p-3">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {/* Status badge */}
                                  {status === 'verified' ? (
                                    <Badge variant="outline" className="text-[9px] h-5 text-emerald-600 border-emerald-500/30 gap-0.5">
                                      <CheckCircle2 className="w-2.5 h-2.5" /> Verified
                                    </Badge>
                                  ) : status === 'issues' ? (
                                    <Badge variant="outline" className="text-[9px] h-5 text-red-600 border-red-500/30 gap-0.5">
                                      <XCircle className="w-2.5 h-2.5" /> Issues
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-[9px] h-5 text-amber-600 border-amber-500/30 gap-0.5">
                                      <AlertTriangle className="w-2.5 h-2.5" /> Unverified
                                    </Badge>
                                  )}

                                  <span className="text-[10px] text-muted-foreground font-mono">{entry.date}</span>
                                  <span className="text-xs font-medium flex-1 min-w-0 truncate">{entry.description}</span>
                                  <span className="text-xs font-bold text-emerald-600 font-mono">{formatCurrency(entry.amount)}</span>
                                  <button
                                    onClick={e => { e.stopPropagation(); setExpandedEntryId(isExpanded ? null : entry.id); }}
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                  >
                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                  </button>
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                                  <span>Dr: <span className="font-medium text-emerald-700 dark:text-emerald-400">{entry.debitAccount}</span></span>
                                  <span>Cr: <span className="font-medium text-amber-700 dark:text-amber-400">{entry.creditAccount}</span></span>
                                </div>
                              </div>

                              {/* Expanded details */}
                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="px-3 pb-3 pt-0 border-t border-border/50">
                                      <div className="pt-2 space-y-2">
                                        {entry.narration && (
                                          <div>
                                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Narration</span>
                                            <p className="text-xs mt-0.5 italic text-muted-foreground">&ldquo;{entry.narration}&rdquo;</p>
                                          </div>
                                        )}

                                        {/* Accounting entry visualization */}
                                        <div className="grid grid-cols-2 gap-3 p-2 bg-muted/30 rounded-md min-w-0">
                                          <div className="min-w-0 overflow-hidden">
                                            <span className="text-[10px] text-muted-foreground">Debit (Dr)</span>
                                            <p className="text-xs font-semibold text-emerald-600 truncate">{entry.debitAccount}</p>
                                            <p className="text-sm font-bold font-mono">{formatCurrency(entry.amount)}</p>
                                          </div>
                                          <div className="min-w-0 overflow-hidden">
                                            <span className="text-[10px] text-muted-foreground">Credit (Cr)</span>
                                            <p className="text-xs font-semibold text-amber-600 truncate">{entry.creditAccount}</p>
                                            <p className="text-sm font-bold font-mono">{formatCurrency(entry.amount)}</p>
                                          </div>
                                        </div>

                                        {/* Issues for this entry */}
                                        {entryIssues.length > 0 && (
                                          <div className="space-y-1">
                                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Issues</span>
                                            {entryIssues.map(iss => (
                                              <div key={iss.id} className={`p-1.5 rounded text-[10px] ${
                                                iss.severity === 'critical' ? 'bg-red-500/10 text-red-600 dark:text-red-400' :
                                                iss.severity === 'warning' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                                                'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                              }`}>
                                                <span className="font-semibold">[{iss.severity.toUpperCase()}]</span> {iss.description}
                                              </div>
                                            ))}
                                          </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 pt-1">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-[10px] h-6 gap-1"
                                            onClick={e => { e.stopPropagation(); toggleVerify(entry.id); }}
                                          >
                                            {entry.isVerified ? (
                                              <><XCircle className="w-3 h-3" /> Unverify</>
                                            ) : (
                                              <><CheckCircle2 className="w-3 h-3" /> Verify</>
                                            )}
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-[10px] h-6 gap-1 text-destructive hover:text-destructive"
                                            onClick={e => { e.stopPropagation(); deleteEntry(entry.id); }}
                                          >
                                            <Trash2 className="w-3 h-3" /> Delete
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Tab: Issues */}
        <TabsContent value="issues" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ScanSearch className="w-4 h-4 text-emerald-600" />
                    Improper Accounting Detection
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Scan journal entries for unbalanced entries, misclassifications, and accounting standard violations
                  </CardDescription>
                </div>
                <Button
                  onClick={handleScan}
                  disabled={isScanning || journalEntries.length === 0}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                >
                  {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanSearch className="w-4 h-4" />}
                  {isScanning ? 'Scanning...' : 'Scan for Issues'}
                </Button>
              </div>
            </CardHeader>
          </Card>

          {isScanning && (
            <Card>
              <CardContent className="py-8">
                <div className="flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
                  <p className="text-sm font-medium">Scanning {journalEntries.length} entries for accounting issues...</p>
                </div>
              </CardContent>
            </Card>
          )}

          {issues.length > 0 && !isScanning && (
            <>
              {/* Issue stats */}
              <div className="grid grid-cols-3 gap-3 min-w-0">
                <Card className="border-red-500/20">
                  <CardContent className="p-3 text-center">
                    <div className="text-2xl font-bold text-red-500">{criticalCount}</div>
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-red-500">Critical</div>
                  </CardContent>
                </Card>
                <Card className="border-amber-500/20">
                  <CardContent className="p-3 text-center">
                    <div className="text-2xl font-bold text-amber-500">{warningCount}</div>
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-amber-500">Warning</div>
                  </CardContent>
                </Card>
                <Card className="border-blue-500/20">
                  <CardContent className="p-3 text-center">
                    <div className="text-2xl font-bold text-blue-500">{infoCount}</div>
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-blue-500">Info</div>
                  </CardContent>
                </Card>
              </div>

              {/* Issues list */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-emerald-600" />
                    Detected Issues
                    <Badge variant="secondary" className="text-[9px] h-5">{issues.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-[70vh]">
                    <div className="space-y-2 pr-2">
                      {issues.map((issue, i) => (
                        <motion.div
                          key={issue.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className={`p-3 rounded-lg border ${
                            issue.severity === 'critical' ? 'border-red-500/30 bg-red-500/5' :
                            issue.severity === 'warning' ? 'border-amber-500/30 bg-amber-500/5' :
                            'border-blue-500/30 bg-blue-500/5'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <Badge
                              variant="outline"
                              className={`text-[9px] h-5 ${
                                issue.severity === 'critical' ? 'text-red-600 border-red-500/30' :
                                issue.severity === 'warning' ? 'text-amber-600 border-amber-500/30' :
                                'text-blue-600 border-blue-500/30'
                              }`}
                            >
                              {issue.severity === 'critical' ? <XCircle className="w-2.5 h-2.5 mr-0.5" /> :
                               issue.severity === 'warning' ? <AlertTriangle className="w-2.5 h-2.5 mr-0.5" /> :
                               <Info className="w-2.5 h-2.5 mr-0.5" />}
                              {issue.severity.toUpperCase()}
                            </Badge>
                            <Badge variant="secondary" className="text-[9px] h-5">{issue.category}</Badge>
                          </div>
                          <p className="text-xs font-medium mb-1 break-words">{issue.description}</p>
                          <div className="flex items-start gap-1">
                            <Lightbulb className="w-3 h-3 text-emerald-600 mt-0.5 shrink-0" />
                            <p className="text-[11px] text-muted-foreground break-words">{issue.suggestion}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </>
          )}

          {issues.length === 0 && !isScanning && journalEntries.length > 0 && (
            <Card>
              <CardContent className="py-8">
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <CheckCircle2 className="w-10 h-10 mb-3 text-emerald-600 opacity-50" />
                  <p className="text-sm font-medium">No issues detected yet</p>
                  <p className="text-xs mt-1">Click &quot;Scan for Issues&quot; to check your entries</p>
                </div>
              </CardContent>
            </Card>
          )}

          {journalEntries.length === 0 && (
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <FileSpreadsheet className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm font-medium">No entries to scan</p>
                  <p className="text-xs mt-1">Create journal entries first, then scan for issues</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: AI Analysis */}
        <TabsContent value="analysis" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Brain className="w-4 h-4 text-emerald-600" />
                    AI-Powered Accounting Analysis
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    {apiKey || simulationMode
                      ? `Comprehensive analysis using ${generationModel || 'Gemini AI'} — identifies improper practices, suggests corrections, and checks Ind AS compliance`
                      : 'Rule-based analysis of your journal entries, trial balance, and detected issues — works offline'
                    }
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    onClick={handleAIAnalysis}
                    disabled={isAnalyzing || journalEntries.length === 0}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                  >
                    {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {isAnalyzing ? 'Analyzing...' : (apiKey || simulationMode) ? 'Analyze with AI' : 'Analyze (Offline)'}
                  </Button>
                  {chunks.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRAGSearch}
                      disabled={isRagSearching || journalEntries.length === 0}
                      className="text-xs gap-1"
                    >
                      {isRagSearching ? <Loader2 className="w-3 h-3 animate-spin" /> : <ScanSearch className="w-3 h-3" />}
                      Analyze with Documents
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* RAG Document Chunks */}
          {showRagResults && ragChunks.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    Relevant Document Excerpts
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setShowRagResults(false)} className="h-6 text-xs">
                    Hide
                  </Button>
                </div>
                <CardDescription className="text-xs">
                  {ragChunks.length} matching chunks from your uploaded documents — providing context for your accounting entries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[300px]">
                  <div className="space-y-3">
                    {ragChunks.map((chunk, i) => (
                      <div key={i} className="p-3 rounded-lg border border-border bg-muted/30">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Badge variant="secondary" className="text-[9px] h-4">
                            Source {i + 1}
                          </Badge>
                          {chunk.section && (
                            <Badge variant="outline" className="text-[9px] h-4">
                              {chunk.section}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed break-words">
                          {chunk.content.slice(0, 300)}{chunk.content.length > 300 ? '...' : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {isAnalyzing && (
            <Card>
              <CardContent className="py-8">
                <div className="flex flex-col items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                  >
                    <Brain className="w-10 h-10 text-emerald-600 mb-3" />
                  </motion.div>
                  <p className="text-sm font-medium">Analyzing {journalEntries.length} journal entries with AI...</p>
                  <p className="text-xs text-muted-foreground mt-1">Checking for improper practices, misclassifications, and compliance issues</p>
                </div>
              </CardContent>
            </Card>
          )}

          {aiAnalysis && !isAnalyzing && (
            <Card className="border-emerald-600/20 max-h-[70vh] flex flex-col overflow-hidden">
              <CardHeader className="pb-2 shrink-0">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageSquareQuote className="w-4 h-4 text-emerald-600" />
                  AI Analysis Report
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 min-h-0 overflow-y-auto">
                <div className="pr-1">
                  <MarkdownRenderer content={aiAnalysis} />
                </div>
              </CardContent>
            </Card>
          )}

          {!aiAnalysis && !isAnalyzing && journalEntries.length === 0 && (
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <Brain className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm font-medium">No entries to analyze</p>
                  <p className="text-xs mt-1">Create journal entries first, then run AI analysis</p>
                </div>
              </CardContent>
            </Card>
          )}

          {!aiAnalysis && !isAnalyzing && journalEntries.length > 0 && (
            <Card>
              <CardContent className="py-8">
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <Sparkles className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm font-medium">Ready for AI analysis</p>
                  <p className="text-xs mt-1">Click &quot;Analyze with AI&quot; to get comprehensive insights on your {journalEntries.length} journal entries</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
