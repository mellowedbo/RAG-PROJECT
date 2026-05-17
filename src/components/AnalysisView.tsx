'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  Calculator, FileSpreadsheet, Brain, Sparkles, Info,
  Loader2, XCircle, RefreshCw, Search, Lightbulb,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import type { FinancialRatio } from '@/types';

// Constants — Financial Data Input Fields

interface FinancialInputField {
  key: string;
  label: string;
  placeholder: string;
  group: 'income' | 'balance' | 'market';
}

const FINANCIAL_INPUTS: FinancialInputField[] = [
  // Income Statement
  { key: 'revenue', label: 'Revenue', placeholder: 'e.g. 96800000', group: 'income' },
  { key: 'netIncome', label: 'Net Income', placeholder: 'e.g. 15000000', group: 'income' },
  { key: 'ebit', label: 'EBIT', placeholder: 'e.g. 22000000', group: 'income' },
  { key: 'interestExpense', label: 'Interest Expense', placeholder: 'e.g. 3000000', group: 'income' },
  // Balance Sheet
  { key: 'totalAssets', label: 'Total Assets', placeholder: 'e.g. 200000000', group: 'balance' },
  { key: 'totalLiabilities', label: 'Total Liabilities', placeholder: 'e.g. 80000000', group: 'balance' },
  { key: 'currentAssets', label: 'Current Assets', placeholder: 'e.g. 60000000', group: 'balance' },
  { key: 'currentLiabilities', label: 'Current Liabilities', placeholder: 'e.g. 30000000', group: 'balance' },
  { key: 'inventory', label: 'Inventory', placeholder: 'e.g. 15000000', group: 'balance' },
  { key: 'shareholdersEquity', label: "Shareholders' Equity", placeholder: 'e.g. 120000000', group: 'balance' },
  { key: 'cash', label: 'Cash', placeholder: 'e.g. 25000000', group: 'balance' },
  { key: 'accountsReceivable', label: 'Accounts Receivable', placeholder: 'e.g. 18000000', group: 'balance' },
  // Market Data
  { key: 'marketPricePerShare', label: 'Market Price Per Share', placeholder: 'e.g. 250', group: 'market' },
  { key: 'eps', label: 'EPS (Earnings Per Share)', placeholder: 'e.g. 12.5', group: 'market' },
  { key: 'dividendsPerShare', label: 'Dividends Per Share', placeholder: 'e.g. 3.2', group: 'market' },
];

// Ratio Definitions & Benchmarks

interface RatioDefinition {
  name: string;
  formula: string;
  category: FinancialRatio['category'];
  unit: FinancialRatio['unit'];
  calculate: (d: Record<string, number>) => number | null;
  benchmark: { healthy: string; warning: string; danger: string };
  interpret: (v: number) => 'healthy' | 'warning' | 'danger';
}

const RATIO_DEFINITIONS: RatioDefinition[] = [
  // Liquidity
  {
    name: 'Current Ratio',
    formula: 'Current Assets / Current Liabilities',
    category: 'liquidity',
    unit: 'ratio',
    calculate: (d) => d.currentLiabilities ? d.currentAssets / d.currentLiabilities : null,
    benchmark: { healthy: '> 2.0', warning: '1.0 – 2.0', danger: '< 1.0' },
    interpret: (v) => v >= 2.0 ? 'healthy' : v >= 1.0 ? 'warning' : 'danger',
  },
  {
    name: 'Quick Ratio',
    formula: '(Current Assets - Inventory) / Current Liabilities',
    category: 'liquidity',
    unit: 'ratio',
    calculate: (d) => d.currentLiabilities ? (d.currentAssets - d.inventory) / d.currentLiabilities : null,
    benchmark: { healthy: '> 1.0', warning: '0.5 – 1.0', danger: '< 0.5' },
    interpret: (v) => v >= 1.0 ? 'healthy' : v >= 0.5 ? 'warning' : 'danger',
  },
  {
    name: 'Cash Ratio',
    formula: 'Cash / Current Liabilities',
    category: 'liquidity',
    unit: 'ratio',
    calculate: (d) => d.currentLiabilities ? d.cash / d.currentLiabilities : null,
    benchmark: { healthy: '> 0.5', warning: '0.2 – 0.5', danger: '< 0.2' },
    interpret: (v) => v >= 0.5 ? 'healthy' : v >= 0.2 ? 'warning' : 'danger',
  },

  // Profitability
  {
    name: 'Gross Profit Margin',
    formula: '(Revenue - COGS) / Revenue ≈ Net Income / Revenue (simplified)',
    category: 'profitability',
    unit: 'percent',
    calculate: (d) => d.revenue ? (d.revenue - (d.revenue - d.netIncome)) / d.revenue * 100 : null,
    benchmark: { healthy: '> 20%', warning: '10% – 20%', danger: '< 10%' },
    interpret: (v) => v >= 20 ? 'healthy' : v >= 10 ? 'warning' : 'danger',
  },
  {
    name: 'Net Profit Margin',
    formula: 'Net Income / Revenue × 100',
    category: 'profitability',
    unit: 'percent',
    calculate: (d) => d.revenue ? (d.netIncome / d.revenue) * 100 : null,
    benchmark: { healthy: '> 10%', warning: '5% – 10%', danger: '< 5%' },
    interpret: (v) => v >= 10 ? 'healthy' : v >= 5 ? 'warning' : 'danger',
  },
  {
    name: 'Return on Assets (ROA)',
    formula: 'Net Income / Total Assets × 100',
    category: 'profitability',
    unit: 'percent',
    calculate: (d) => d.totalAssets ? (d.netIncome / d.totalAssets) * 100 : null,
    benchmark: { healthy: '> 5%', warning: '2% – 5%', danger: '< 2%' },
    interpret: (v) => v >= 5 ? 'healthy' : v >= 2 ? 'warning' : 'danger',
  },
  {
    name: 'Return on Equity (ROE)',
    formula: 'Net Income / Shareholders\' Equity × 100',
    category: 'profitability',
    unit: 'percent',
    calculate: (d) => d.shareholdersEquity ? (d.netIncome / d.shareholdersEquity) * 100 : null,
    benchmark: { healthy: '> 15%', warning: '8% – 15%', danger: '< 8%' },
    interpret: (v) => v >= 15 ? 'healthy' : v >= 8 ? 'warning' : 'danger',
  },
  {
    name: 'EBIT Margin',
    formula: 'EBIT / Revenue × 100',
    category: 'profitability',
    unit: 'percent',
    calculate: (d) => d.revenue ? (d.ebit / d.revenue) * 100 : null,
    benchmark: { healthy: '> 15%', warning: '7% – 15%', danger: '< 7%' },
    interpret: (v) => v >= 15 ? 'healthy' : v >= 7 ? 'warning' : 'danger',
  },

  // Leverage
  {
    name: 'Debt-to-Equity Ratio',
    formula: 'Total Liabilities / Shareholders\' Equity',
    category: 'leverage',
    unit: 'ratio',
    calculate: (d) => d.shareholdersEquity ? d.totalLiabilities / d.shareholdersEquity : null,
    benchmark: { healthy: '< 0.5', warning: '0.5 – 1.5', danger: '> 1.5' },
    interpret: (v) => v <= 0.5 ? 'healthy' : v <= 1.5 ? 'warning' : 'danger',
  },
  {
    name: 'Debt Ratio',
    formula: 'Total Liabilities / Total Assets',
    category: 'leverage',
    unit: 'percent',
    calculate: (d) => d.totalAssets ? (d.totalLiabilities / d.totalAssets) * 100 : null,
    benchmark: { healthy: '< 40%', warning: '40% – 60%', danger: '> 60%' },
    interpret: (v) => v <= 40 ? 'healthy' : v <= 60 ? 'warning' : 'danger',
  },
  {
    name: 'Interest Coverage Ratio',
    formula: 'EBIT / Interest Expense',
    category: 'leverage',
    unit: 'ratio',
    calculate: (d) => d.interestExpense ? d.ebit / d.interestExpense : null,
    benchmark: { healthy: '> 5.0', warning: '2.0 – 5.0', danger: '< 2.0' },
    interpret: (v) => v >= 5 ? 'healthy' : v >= 2 ? 'warning' : 'danger',
  },
  {
    name: 'Equity Multiplier',
    formula: 'Total Assets / Shareholders\' Equity',
    category: 'leverage',
    unit: 'ratio',
    calculate: (d) => d.shareholdersEquity ? d.totalAssets / d.shareholdersEquity : null,
    benchmark: { healthy: '< 2.0', warning: '2.0 – 3.0', danger: '> 3.0' },
    interpret: (v) => v <= 2 ? 'healthy' : v <= 3 ? 'warning' : 'danger',
  },

  // Efficiency
  {
    name: 'Asset Turnover',
    formula: 'Revenue / Total Assets',
    category: 'efficiency',
    unit: 'ratio',
    calculate: (d) => d.totalAssets ? d.revenue / d.totalAssets : null,
    benchmark: { healthy: '> 1.0', warning: '0.5 – 1.0', danger: '< 0.5' },
    interpret: (v) => v >= 1 ? 'healthy' : v >= 0.5 ? 'warning' : 'danger',
  },
  {
    name: 'Inventory Turnover',
    formula: 'Revenue / Inventory (approximation)',
    category: 'efficiency',
    unit: 'ratio',
    calculate: (d) => d.inventory ? d.revenue / d.inventory : null,
    benchmark: { healthy: '> 6.0', warning: '3.0 – 6.0', danger: '< 3.0' },
    interpret: (v) => v >= 6 ? 'healthy' : v >= 3 ? 'warning' : 'danger',
  },
  {
    name: 'Receivables Turnover',
    formula: 'Revenue / Accounts Receivable',
    category: 'efficiency',
    unit: 'ratio',
    calculate: (d) => d.accountsReceivable ? d.revenue / d.accountsReceivable : null,
    benchmark: { healthy: '> 8.0', warning: '4.0 – 8.0', danger: '< 4.0' },
    interpret: (v) => v >= 8 ? 'healthy' : v >= 4 ? 'warning' : 'danger',
  },
  {
    name: 'Payables Turnover',
    formula: 'Revenue / Total Liabilities (approximation)',
    category: 'efficiency',
    unit: 'ratio',
    calculate: (d) => d.totalLiabilities ? d.revenue / d.totalLiabilities : null,
    benchmark: { healthy: '> 5.0', warning: '2.5 – 5.0', danger: '< 2.5' },
    interpret: (v) => v >= 5 ? 'healthy' : v >= 2.5 ? 'warning' : 'danger',
  },

  // Market
  {
    name: 'P/E Ratio',
    formula: 'Market Price Per Share / EPS',
    category: 'market',
    unit: 'ratio',
    calculate: (d) => d.eps ? d.marketPricePerShare / d.eps : null,
    benchmark: { healthy: '10 – 25', warning: '25 – 40 or < 10', danger: '> 40 or < 0' },
    interpret: (v) => (v >= 10 && v <= 25) ? 'healthy' : (v > 25 && v <= 40) || (v > 0 && v < 10) ? 'warning' : 'danger',
  },
  {
    name: 'Dividend Yield',
    formula: 'Dividends Per Share / Market Price Per Share × 100',
    category: 'market',
    unit: 'percent',
    calculate: (d) => d.marketPricePerShare ? (d.dividendsPerShare / d.marketPricePerShare) * 100 : null,
    benchmark: { healthy: '2% – 5%', warning: '1% – 2% or > 5%', danger: '< 1%' },
    interpret: (v) => (v >= 2 && v <= 5) ? 'healthy' : (v >= 1 && v < 2) || (v > 5 && v <= 8) ? 'warning' : 'danger',
  },
  {
    name: 'Dividend Payout Ratio',
    formula: 'Dividends Per Share / EPS × 100',
    category: 'market',
    unit: 'percent',
    calculate: (d) => d.eps ? (d.dividendsPerShare / d.eps) * 100 : null,
    benchmark: { healthy: '30% – 60%', warning: '60% – 80% or < 30%', danger: '> 80%' },
    interpret: (v) => (v >= 30 && v <= 60) ? 'healthy' : (v > 60 && v <= 80) || (v >= 10 && v < 30) ? 'warning' : 'danger',
  },
];

// Helper Functions

function formatNumber(value: number, unit: FinancialRatio['unit']): string {
  if (unit === 'percent') {
    return `${value.toFixed(2)}%`;
  }
  if (unit === 'currency') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
  return value.toFixed(2);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getHealthColor(status: 'healthy' | 'warning' | 'danger'): string {
  switch (status) {
    case 'healthy': return 'text-emerald-600';
    case 'warning': return 'text-amber-500';
    case 'danger': return 'text-red-500';
  }
}

function getHealthBg(status: 'healthy' | 'warning' | 'danger'): string {
  switch (status) {
    case 'healthy': return 'bg-emerald-500/10 border-emerald-500/20';
    case 'warning': return 'bg-amber-500/10 border-amber-500/20';
    case 'danger': return 'bg-red-500/10 border-red-500/20';
  }
}

function getHealthIcon(status: 'healthy' | 'warning' | 'danger') {
  switch (status) {
    case 'healthy': return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    case 'danger': return <XCircle className="w-4 h-4 text-red-500" />;
  }
}

function getHealthBadge(status: 'healthy' | 'warning' | 'danger'): string {
  switch (status) {
    case 'healthy': return 'Healthy';
    case 'warning': return 'Warning';
    case 'danger': return 'Danger';
  }
}

const CATEGORY_COLORS: Record<FinancialRatio['category'], string> = {
  liquidity: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  profitability: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  leverage: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  efficiency: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  market: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
};

const CATEGORY_LABELS: Record<FinancialRatio['category'], string> = {
  liquidity: 'Liquidity',
  profitability: 'Profitability',
  leverage: 'Leverage',
  efficiency: 'Efficiency',
  market: 'Market',
};

// Component Props

interface AnalysisViewProps {
  apiKey: string;
  generationModel: string;
  simulationMode: boolean;
  chunks: { id: string; documentId: string; content: string; chunkIndex: number; section: string | null; wordCount: number; charCount: number; embedding?: number[] }[];
  documents: { id: string; title: string; docType: string; sector: string | null }[];
  isProcessing: boolean;
  setIsProcessing: (v: boolean) => void;
}

// AnalysisView Component

export default function AnalysisView({
  apiKey,
  generationModel,
  simulationMode,
  chunks,
  documents,
  isProcessing: _isProcessing,
  setIsProcessing,
}: AnalysisViewProps) {

  // State: Financial Inputs
  const [financialData, setFinancialData] = useState<Record<string, string>>({});

  // State: Balance Sheet
  const [balanceSheetText, setBalanceSheetText] = useState('');
  const [balanceSheetAnalysis, setBalanceSheetAnalysis] = useState<{
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    currentAssets: number;
    fixedAssets: number;
    currentLiabilities: number;
    longTermDebt: number;
    isValid: boolean;
    difference: number;
    composition: {
      currentAssetsPct: number;
      fixedAssetsPct: number;
      debtPct: number;
      equityPct: number;
      currentLiabPct: number;
      longTermDebtPct: number;
    };
  } | null>(null);
  const [isParsingBS, setIsParsingBS] = useState(false);

  // State: AI Analysis
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [ragAnalysis, setRagAnalysis] = useState('');
  const [isRagAnalyzing, setIsRagAnalyzing] = useState(false);

  // State: Active Tab
  const [activeTab, setActiveTab] = useState('calculator');

  // Computed: Calculate All Ratios
  const calculatedRatios = useMemo(() => {
    const numericData: Record<string, number> = {};
    for (const [key, val] of Object.entries(financialData)) {
      const num = parseFloat(val);
      if (!isNaN(num) && num !== 0) {
        numericData[key] = num;
      }
    }

    const ratios: FinancialRatio[] = [];

    for (const def of RATIO_DEFINITIONS) {
      const rawValue = def.calculate(numericData);
      if (rawValue !== null && isFinite(rawValue)) {
        const status = def.interpret(rawValue);
        ratios.push({
          name: def.name,
          formula: def.formula,
          value: rawValue,
          unit: def.unit,
          category: def.category,
          interpretation: getHealthBadge(status),
          isHealthy: status === 'healthy',
        });
      }
    }

    return ratios;
  }, [financialData]);

  // Computed: Ratio Stats
  const ratioStats = useMemo(() => {
    const healthy = calculatedRatios.filter(r => r.interpretation === 'Healthy').length;
    const warning = calculatedRatios.filter(r => r.interpretation === 'Warning').length;
    const danger = calculatedRatios.filter(r => r.interpretation === 'Danger').length;
    return { healthy, warning, danger, total: calculatedRatios.length };
  }, [calculatedRatios]);

  // Handler: Update Financial Input
  const updateInput = useCallback((key: string, value: string) => {
    setFinancialData(prev => ({ ...prev, [key]: value }));
  }, []);

  // Offline SWOT Generation
  const generateOfflineSWOT = useCallback((): string => {
    if (calculatedRatios.length === 0) return 'No ratios calculated.';

    const healthyRatios = calculatedRatios.filter(r => r.interpretation === 'Healthy');
    const warningRatios = calculatedRatios.filter(r => r.interpretation === 'Warning');
    const dangerRatios = calculatedRatios.filter(r => r.interpretation === 'Danger');

    // Health score based on ratio distribution
    const totalRatios = calculatedRatios.length;
    const healthScore = Math.round(
      (healthyRatios.length * 100 + warningRatios.length * 50 + dangerRatios.length * 0) / totalRatios
    );

    let md = `## 💪 SWOT Financial Analysis (Rule-Based)\n\n`;
    md += `> **Overall Score: ${healthScore}/100** — ${healthScore >= 70 ? '🟢 Strong' : healthScore >= 50 ? '🟡 Moderate' : '🔴 Weak'}\n\n`;

    // Strengths
    md += `### 💪 Strengths\n\n`;
    if (healthyRatios.length === 0) {
      md += `No ratios are currently in the "Healthy" range. Consider reviewing your financial inputs.\n\n`;
    } else {
      for (const r of healthyRatios) {
        md += `- **${r.name}** (${r.category}): ${formatNumber(r.value, r.unit)} — Healthy ✅\n`;
        // Add context
        if (r.name === 'Current Ratio') md += `  → Good short-term liquidity, able to meet obligations\n`;
        else if (r.name === 'Quick Ratio') md += `  → Strong acid-test, can cover liabilities without selling inventory\n`;
        else if (r.name === 'Net Profit Margin') md += `  → Efficient cost management and pricing\n`;
        else if (r.name === 'ROE') md += `  → Effective use of shareholder equity to generate profits\n`;
        else if (r.name === 'ROA') md += `  → Efficient asset utilization\n`;
        else if (r.name === 'Debt-to-Equity Ratio') md += `  → Conservative leverage, lower financial risk\n`;
        else if (r.name === 'Interest Coverage Ratio') md += `  → Comfortable debt servicing capacity\n`;
        else if (r.name === 'Asset Turnover') md += `  → Efficient revenue generation from assets\n`;
        else if (r.name === 'P/E Ratio') md += `  → Reasonable market valuation\n`;
      }
      md += `\n`;
    }

    // Weaknesses
    md += `### ⚠️ Weaknesses\n\n`;
    if (dangerRatios.length === 0) {
      md += `No ratios are in the "Danger" zone. Great financial health!\n\n`;
    } else {
      for (const r of dangerRatios) {
        md += `- **${r.name}** (${r.category}): ${formatNumber(r.value, r.unit)} — Danger 🔴\n`;
        if (r.name === 'Current Ratio') md += `  → May struggle to meet short-term obligations\n`;
        else if (r.name === 'Quick Ratio') md += `  → Insufficient liquid assets for immediate liabilities\n`;
        else if (r.name === 'Net Profit Margin') md += `  → Low profitability — review cost structure\n`;
        else if (r.name === 'ROE') md += `  → Poor return on shareholder investment\n`;
        else if (r.name === 'Debt-to-Equity Ratio') md += `  → High leverage, increased financial risk\n`;
        else if (r.name === 'Interest Coverage Ratio') md += `  → Difficulty servicing debt obligations\n`;
        else if (r.name === 'P/E Ratio') md += `  → Potentially overvalued or negative earnings\n`;
      }
      md += `\n`;
    }
    if (warningRatios.length > 0) {
      md += `**Approaching concern:**\n`;
      for (const r of warningRatios) {
        md += `- **${r.name}**: ${formatNumber(r.value, r.unit)} — Warning 🟡\n`;
      }
      md += `\n`;
    }

    // Opportunities
    md += `### 🔮 Opportunities\n\n`;
    const highROE = calculatedRatios.find(r => r.name === 'ROE' && r.interpretation === 'Healthy');
    const lowPE = calculatedRatios.find(r => r.name === 'P/E Ratio' && r.value > 0 && r.value < 15);
    const lowDebt = calculatedRatios.find(r => r.name === 'Debt-to-Equity Ratio' && r.interpretation === 'Healthy');
    const goodLiquidity = calculatedRatios.find(r => r.name === 'Current Ratio' && r.interpretation === 'Healthy');

    if (highROE) md += `- High ROE (${formatNumber(highROE.value, highROE.unit)}) suggests potential for expansion — consider reinvesting profits\n`;
    if (lowPE) md += `- Low P/E ratio (${formatNumber(lowPE.value, lowPE.unit)}) may indicate undervaluation — potential investment opportunity\n`;
    if (lowDebt) md += `- Low debt-to-equity (${formatNumber(lowDebt.value, lowDebt.unit)}) — capacity to take on strategic debt for growth\n`;
    if (goodLiquidity) md += `- Strong liquidity position — ability to capitalize on market opportunities\n`;
    const goodTurnover = calculatedRatios.find(r => r.name === 'Asset Turnover' && r.interpretation === 'Healthy');
    if (goodTurnover) md += `- Efficient asset utilization — can scale operations without proportional asset increase\n`;
    if (!highROE && !lowPE && !lowDebt && !goodLiquidity && !goodTurnover) {
      md += `- Focus on improving weak ratios first to unlock growth potential\n`;
    }
    md += `\n`;

    // Threats
    md += `### 🚩 Threats\n\n`;
    const highDebt = calculatedRatios.find(r => r.name === 'Debt-to-Equity Ratio' && r.interpretation === 'Danger');
    const lowCoverage = calculatedRatios.find(r => r.name === 'Interest Coverage Ratio' && r.interpretation === 'Danger');
    const poorLiquidity = calculatedRatios.find(r => r.name === 'Current Ratio' && r.interpretation === 'Danger');
    const lowMargin = calculatedRatios.find(r => r.name === 'Net Profit Margin' && r.interpretation === 'Danger');

    if (highDebt) md += `- High leverage (${formatNumber(highDebt.value, highDebt.unit)}) — vulnerable to interest rate increases\n`;
    if (lowCoverage) md += `- Low interest coverage (${formatNumber(lowCoverage.value, lowCoverage.unit)}) — risk of default on debt obligations\n`;
    if (poorLiquidity) md += `- Poor liquidity — risk of cash flow crisis if revenue declines\n`;
    if (lowMargin) md += `- Low profit margin (${formatNumber(lowMargin.value, lowMargin.unit)}) — limited buffer against cost increases\n`;
    if (!highDebt && !lowCoverage && !poorLiquidity && !lowMargin) {
      md += `- No critical threats identified — financial position appears stable\n`;
    }
    md += `\n`;

    // Recommendations
    md += `### 📋 Key Recommendations\n\n`;
    const recs: string[] = [];
    if (poorLiquidity) recs.push('Improve liquidity by negotiating longer payment terms or securing a credit line');
    if (highDebt) recs.push('Reduce leverage through debt repayment or equity infusion');
    if (lowMargin) recs.push('Review cost structure and pricing strategy to improve profitability');
    if (lowCoverage) recs.push('Refinance debt at lower rates or increase operating income');
    if (recs.length === 0) recs.push('Maintain current financial discipline and monitor key ratios regularly');
    recs.forEach((r, i) => { md += `${i + 1}. ${r}\n`; });
    md += `\n*This is a rule-based analysis. Add a Gemini API key for AI-powered insights with industry benchmarks.*\n`;

    return md;
  }, [calculatedRatios]);

  // Handler: Parse Balance Sheet via AI
  const parseBalanceSheet = useCallback(async () => {
    if (!balanceSheetText.trim()) return;

    if (!apiKey && !simulationMode) {
      // Fallback: simple regex-based parsing
      tryParseBalanceSheetLocally();
      return;
    }

    setIsParsingBS(true);
    try {
      const systemPrompt = `You are a financial data extraction expert. Extract balance sheet data from the provided text.
Return ONLY a JSON object with these fields (use 0 if not found, no extra text, no markdown):
{
  "totalAssets": number,
  "totalLiabilities": number,
  "totalEquity": number,
  "currentAssets": number,
  "fixedAssets": number,
  "currentLiabilities": number,
  "longTermDebt": number
}`;

      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          systemPrompt,
          userPrompt: `Extract balance sheet data from:\n\n${balanceSheetText}`,
          model: generationModel,
        }),
      });

      if (!res.ok) throw new Error('Failed to parse balance sheet');

      const data = await res.json();
      const jsonStr = data.response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(jsonStr);

      applyBalanceSheetAnalysis(parsed);
    } catch {
      tryParseBalanceSheetLocally();
    } finally {
      setIsParsingBS(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- tryParseBalanceSheetLocally and applyBalanceSheetAnalysis are stable callbacks; balanceSheetText already in deps
  }, [balanceSheetText, apiKey, generationModel, simulationMode]);

  // Local Balance Sheet Parsing Fallback
  const tryParseBalanceSheetLocally = useCallback(() => {
    const text = balanceSheetText.toLowerCase();
    const extractNumber = (label: string): number => {
      const patterns = [
        new RegExp(`${label}[\\s:\\-–=]*[\\$₹]?[\\s]*([\\d,]+(?:\\.\\d+)?)`, 'i'),
        new RegExp(`([\\d,]+(?:\\.\\d+)?)[\\s]*${label}`, 'i'),
      ];
      for (const pat of patterns) {
        const match = text.match(pat);
        if (match) return parseFloat(match[1].replace(/,/g, ''));
      }
      return 0;
    };

    applyBalanceSheetAnalysis({
      totalAssets: extractNumber('total assets'),
      totalLiabilities: extractNumber('total liabilities'),
      totalEquity: extractNumber('total equity|shareholders'),
      currentAssets: extractNumber('current assets'),
      fixedAssets: extractNumber('fixed assets|non-current assets|property'),
      currentLiabilities: extractNumber('current liabilities'),
      longTermDebt: extractNumber('long.term debt|long.term liabilities|non-current liabilities'),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps -- applyBalanceSheetAnalysis has stable identity (empty deps)
  }, [balanceSheetText]);

  // Apply Balance Sheet Analysis
  const applyBalanceSheetAnalysis = useCallback((data: {
    totalAssets: number; totalLiabilities: number; totalEquity: number;
    currentAssets: number; fixedAssets: number;
    currentLiabilities: number; longTermDebt: number;
  }) => {
    const ta = data.totalAssets || 0;
    const tl = data.totalLiabilities || 0;
    const te = data.totalEquity || 0;
    const ca = data.currentAssets || 0;
    const fa = data.fixedAssets || (ta - ca);
    const cl = data.currentLiabilities || 0;
    const ltd = data.longTermDebt || (tl - cl);

    const diff = Math.abs(ta - (tl + te));
    const isValid = diff < 0.01 * Math.max(ta, 1);

    setBalanceSheetAnalysis({
      totalAssets: ta,
      totalLiabilities: tl,
      totalEquity: te,
      currentAssets: ca,
      fixedAssets: fa,
      currentLiabilities: cl,
      longTermDebt: ltd,
      isValid,
      difference: diff,
      composition: {
        currentAssetsPct: ta ? (ca / ta) * 100 : 0,
        fixedAssetsPct: ta ? (fa / ta) * 100 : 0,
        debtPct: (tl + te) ? (tl / (tl + te)) * 100 : 0,
        equityPct: (tl + te) ? (te / (tl + te)) * 100 : 0,
        currentLiabPct: tl ? (cl / tl) * 100 : 0,
        longTermDebtPct: tl ? (ltd / tl) * 100 : 0,
      },
    });
  }, []);

  // Handler: RAG Document Analysis
  const handleRAGAnalysis = useCallback(async () => {
    if (chunks.length === 0) return;

    setIsRagAnalyzing(true);
    setRagAnalysis('');

    // Search chunks for financial data
    const financialChunks = chunks.filter(c => {
      const lower = c.content.toLowerCase();
      return lower.includes('revenue') || lower.includes('income') || lower.includes('assets') ||
             lower.includes('liabilities') || lower.includes('equity') || lower.includes('profit') ||
             lower.includes('ebit') || lower.includes('cash') || lower.includes('debt') ||
             lower.includes('ratio') || lower.includes('financial') || lower.includes('balance sheet');
    }).slice(0, 10);

    if (financialChunks.length === 0) {
      setRagAnalysis('No financial data found in the uploaded documents. Try uploading financial statements, 10-K reports, or earnings releases.');
      setIsRagAnalyzing(false);
      return;
    }

    // Offline mode: show matched document chunks
    if (!apiKey && !simulationMode) {
      const docNames = [...new Set(financialChunks.map(c => {
        const doc = documents.find(d => d.id === c.documentId);
        return doc?.title || 'Unknown';
      }))];

      let md = `## 📄 Document Analysis (Offline)\n\n`;
      md += `Found ${financialChunks.length} relevant chunks from ${docNames.length} document(s): **${docNames.join(', ')}**\n\n`;

      // Try to extract financial figures from chunks
      const figurePatterns: { key: string; patterns: string[] }[] = [
        { key: 'revenue', patterns: ['revenue', 'total revenue', 'net revenue', 'sales'] },
        { key: 'netIncome', patterns: ['net income', 'net profit', 'net earnings'] },
        { key: 'totalAssets', patterns: ['total assets'] },
        { key: 'totalLiabilities', patterns: ['total liabilities', 'total debt'] },
        { key: 'shareholdersEquity', patterns: ["shareholders' equity", 'total equity', 'stockholders equity'] },
        { key: 'ebit', patterns: ['ebit', 'operating income', 'operating profit'] },
        { key: 'cash', patterns: ['cash and cash equivalents', 'cash'] },
        { key: 'currentAssets', patterns: ['current assets', 'total current assets'] },
        { key: 'currentLiabilities', patterns: ['current liabilities', 'total current liabilities'] },
        { key: 'eps', patterns: ['earnings per share', 'eps'] },
      ];

      const extractedFigures: Record<string, { value: string; source: string }> = {};
      for (const fp of figurePatterns) {
        for (const chunk of financialChunks) {
          const lower = chunk.content.toLowerCase();
          for (const pattern of fp.patterns) {
            const regex = new RegExp(`${pattern}[^]*?([$₹]?[\\s]*([\\d,]+(?:\\.\\d+)?))`, 'i');
            const match = lower.match(regex);
            if (match && match[2]) {
              const value = match[2].replace(/,/g, '');
              if (parseFloat(value) > 0 && !extractedFigures[fp.key]) {
                extractedFigures[fp.key] = { value, source: chunk.content.slice(0, 80) };
              }
            }
          }
        }
      }

      if (Object.keys(extractedFigures).length > 0) {
        md += `### 📊 Extracted Financial Figures\n\n`;
        md += `| Metric | Value |\n|--------|-------|\n`;
        for (const [key, data] of Object.entries(extractedFigures)) {
          const label = FINANCIAL_INPUTS.find(f => f.key === key)?.label || key;
          md += `| ${label} | ${data.value} |\n`;
        }
        md += `\n💡 Click **"Use Document Data"** below to auto-fill these values in the calculator.\n\n`;
      }

      md += `### 📄 Matched Document Excerpts\n\n`;
      financialChunks.forEach((c, i) => {
        md += `**Source ${i + 1}${c.section ? ` — ${c.section}` : ''}:**\n`;
        md += `> ${c.content.slice(0, 300)}${c.content.length > 300 ? '...' : ''}\n\n`;
      });

      md += `\n*Add a Gemini API key for AI-powered analysis with ratio calculations and insights from these documents.*`;
      setRagAnalysis(md);
      setIsRagAnalyzing(false);
      return;
    }

    setIsProcessing(true);

    try {
      const chunksContext = financialChunks.map((c, i) =>
        `[Chunk ${i + 1} | Section: ${c.section || 'General'}]\n${c.content}`
      ).join('\n\n---\n\n');

      const docNames = [...new Set(financialChunks.map(c => {
        const doc = documents.find(d => d.id === c.documentId);
        return doc?.title || 'Unknown';
      }))];

      const systemPrompt = `You are NEXUS Financial AI, an expert financial analyst powered by Gemini AI. Analyze the provided financial document excerpts and extract key financial data.

Provide your analysis in this structured format:

## 📊 Extracted Financial Data
List all financial figures found (revenue, net income, total assets, liabilities, equity, etc.)

## 📈 Ratio Analysis
Calculate and present key financial ratios from the extracted data:
- Current Ratio, Quick Ratio
- Net Profit Margin, ROA, ROE
- Debt-to-Equity, Interest Coverage
- Asset Turnover, P/E Ratio (if data available)

## 🔍 Key Insights
Provide 3-5 key insights about the financial health based on the extracted data.

## ⚠️ Limitations
Note any missing data that prevents full analysis.

Use precise numbers and cite sources. Format amounts with proper notation ($, %).`;

      const userPrompt = `Analyze these financial document excerpts for financial data and ratios:

**Documents:** ${docNames.join(', ')}
**Chunks analyzed:** ${financialChunks.length} of ${chunks.length}

${chunksContext}`;

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
        throw new Error((errData as Record<string, string>).error || 'RAG analysis failed');
      }

      const data = await res.json();
      setRagAnalysis(data.response);
    } catch (err) {
      setRagAnalysis(`❌ Analysis failed: ${err instanceof Error ? err.message : 'Unknown error'}. Please check your API key and try again.`);
    } finally {
      setIsRagAnalyzing(false);
      setIsProcessing(false);
    }
  }, [chunks, documents, apiKey, generationModel, simulationMode, setIsProcessing]);

  // Handler: AI Financial Advisor
  const handleAIAdvisor = useCallback(async () => {
    if (calculatedRatios.length === 0) {
      setAiAnalysis('⚠️ Please enter financial data and calculate ratios first, then request analysis.');
      return;
    }
    if (!apiKey && !simulationMode) {
      // Generate offline SWOT analysis from computed ratios
      setIsAnalyzing(true);
      setAiAnalysis('');
      await new Promise(r => setTimeout(r, 400));
      setAiAnalysis(generateOfflineSWOT());
      setIsAnalyzing(false);
      return;
    }

    setIsAnalyzing(true);
    setIsProcessing(true);
    setAiAnalysis('');

    try {
      const ratiosText = calculatedRatios.map(r =>
        `${r.name} (${r.category}): ${formatNumber(r.value, r.unit)} — ${r.interpretation}`
      ).join('\n');

      const sector = documents[0]?.sector || 'General';
      const docTitles = documents.map(d => d.title).join(', ') || 'No documents';

      const systemPrompt = `You are NEXUS Financial Advisor AI, an expert financial analyst powered by Gemini AI. Based on the provided financial ratios, generate a comprehensive financial analysis.

Provide your analysis in EXACTLY this format:

## 💪 SWOT Financial Analysis

### Strengths
List 3-5 financial strengths with specific ratio references.

### Weaknesses
List 3-5 financial weaknesses with specific ratio references.

### Opportunities
List 3-5 opportunities based on the financial position.

### Threats
List 3-5 financial threats or risks.

## 🏭 Industry Comparison (${sector})
Compare the ratios to typical ${sector} industry benchmarks and note where the company outperforms or underperforms.

## 📋 Recommendations
Provide 5-7 specific, actionable recommendations for improving the company's financial position, prioritized by impact.

## 🚩 Red Flags & Warnings
List any critical red flags that require immediate attention.

## 📊 Overall Assessment
Provide a one-paragraph overall financial health summary with a rating (Excellent / Good / Fair / Poor / Critical).

Be specific, quantitative, and actionable. Reference actual ratio values in your analysis.`;

      const userPrompt = `Analyze these financial ratios for a company in the ${sector} sector:

**Ratios Calculated:**
${ratiosText}

**Summary Stats:**
- Healthy ratios: ${ratioStats.healthy}/${ratioStats.total}
- Warning ratios: ${ratioStats.warning}/${ratioStats.total}
- Danger ratios: ${ratioStats.danger}/${ratioStats.total}

**Source Documents:** ${docTitles}

Financial Data Inputs:
${Object.entries(financialData).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('\n')}

Provide a comprehensive SWOT financial analysis with industry comparison and actionable recommendations.`;

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
  }, [calculatedRatios, ratioStats, documents, financialData, apiKey, generationModel, simulationMode, setIsProcessing, generateOfflineSWOT]);

  // Handler: Load Sample Data
  const loadSampleData = useCallback(() => {
    setFinancialData({
      revenue: '96800000',
      netIncome: '15000000',
      ebit: '22000000',
      interestExpense: '3000000',
      totalAssets: '200000000',
      totalLiabilities: '80000000',
      currentAssets: '60000000',
      currentLiabilities: '30000000',
      inventory: '15000000',
      shareholdersEquity: '120000000',
      cash: '25000000',
      accountsReceivable: '18000000',
      marketPricePerShare: '250',
      eps: '12.5',
      dividendsPerShare: '3.2',
    });
  }, []);

  // Handler: Clear All Data
  const clearAllData = useCallback(() => {
    setFinancialData({});
    setBalanceSheetText('');
    setBalanceSheetAnalysis(null);
    setAiAnalysis('');
    setRagAnalysis('');
  }, []);

  // Handler: Use RAG data for calculator
  const applyRagToCalculator = useCallback(() => {
    if (chunks.length === 0) return;

    // Search chunks for financial figures
    const financialChunks = chunks.filter(c => {
      const lower = c.content.toLowerCase();
      return lower.includes('revenue') || lower.includes('income') || lower.includes('assets') ||
             lower.includes('liabilities') || lower.includes('equity') || lower.includes('profit') ||
             lower.includes('ebit') || lower.includes('cash') || lower.includes('debt') ||
             lower.includes('financial') || lower.includes('balance sheet');
    }).slice(0, 10);

    if (financialChunks.length === 0) return;

    const figurePatterns: { key: string; patterns: string[] }[] = [
      { key: 'revenue', patterns: ['revenue', 'total revenue', 'net revenue', 'sales'] },
      { key: 'netIncome', patterns: ['net income', 'net profit', 'net earnings'] },
      { key: 'ebit', patterns: ['ebit', 'operating income', 'operating profit'] },
      { key: 'interestExpense', patterns: ['interest expense', 'interest cost'] },
      { key: 'totalAssets', patterns: ['total assets'] },
      { key: 'totalLiabilities', patterns: ['total liabilities', 'total debt'] },
      { key: 'currentAssets', patterns: ['current assets', 'total current assets'] },
      { key: 'currentLiabilities', patterns: ['current liabilities', 'total current liabilities'] },
      { key: 'inventory', patterns: ['inventory', 'total inventory', 'stock'] },
      { key: 'shareholdersEquity', patterns: ["shareholders' equity", 'total equity', 'stockholders equity'] },
      { key: 'cash', patterns: ['cash and cash equivalents', 'cash'] },
      { key: 'accountsReceivable', patterns: ['accounts receivable', 'trade receivables'] },
      { key: 'marketPricePerShare', patterns: ['market price per share', 'share price', 'stock price'] },
      { key: 'eps', patterns: ['earnings per share', 'eps'] },
      { key: 'dividendsPerShare', patterns: ['dividends per share', 'dividend per share'] },
    ];

    const newData: Record<string, string> = { ...financialData };
    for (const fp of figurePatterns) {
      if (newData[fp.key]) continue; // Don't overwrite existing data
      for (const chunk of financialChunks) {
        const lower = chunk.content.toLowerCase();
        for (const pattern of fp.patterns) {
          const regex = new RegExp(`${pattern}[^]*?([$₹]?[\\s]*([\\d,]+(?:\\.\\d+)?))`, 'i');
          const match = lower.match(regex);
          if (match && match[2]) {
            const value = match[2].replace(/,/g, '');
            if (parseFloat(value) > 0) {
              newData[fp.key] = value;
              break;
            }
          }
        }
        if (newData[fp.key]) break;
      }
    }

    setFinancialData(newData);
  }, [chunks, financialData]);

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
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  Financial Analysis Engine
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Ratio calculator, balance sheet analyzer &amp; AI-powered financial intelligence
                </CardDescription>
                {!apiKey && !simulationMode && (
                  <Badge variant="outline" className="text-[10px] gap-1 border-emerald-500/30 text-emerald-600 mt-1">
                    <Lightbulb className="w-2.5 h-2.5" />
                    Works offline — add API key for AI insights
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadSampleData}
                  className="text-xs gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Sample Data
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllData}
                  className="text-xs gap-1 text-destructive hover:text-destructive"
                >
                  Clear All
                </Button>
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
            AI Financial Advisor requires an API key. Ratio calculations and SWOT analysis work standalone.
          </div>
        </motion.div>
      )}

      {/* Stats Row */}
      {calculatedRatios.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 md:grid-cols-4 gap-3 min-w-0">
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-emerald-600">{ratioStats.total}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Ratios Calculated</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-emerald-600">{ratioStats.healthy}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Healthy</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-amber-500">{ratioStats.warning}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Warning</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-red-500">{ratioStats.danger}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Danger</div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calculator" className="text-xs gap-1">
            <Calculator className="w-3 h-3 hidden sm:inline" />
            Ratio Calculator
          </TabsTrigger>
          <TabsTrigger value="balance-sheet" className="text-xs gap-1">
            <FileSpreadsheet className="w-3 h-3 hidden sm:inline" />
            Balance Sheet
          </TabsTrigger>
          <TabsTrigger value="ai-analysis" className="text-xs gap-1">
            <Brain className="w-3 h-3 hidden sm:inline" />
            AI Analysis
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Ratio Calculator */}
        <TabsContent value="calculator" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Input Panel */}
            <div className="lg:col-span-1 min-w-0">
              <Card className="max-h-[80vh] flex flex-col">
                <CardHeader className="pb-3 shrink-0">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-emerald-600" />
                    Financial Data Input
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Enter values to auto-calculate all ratios
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden min-h-0">
                  <ScrollArea className="h-full pr-3">
                    <div className="space-y-4">
                      {/* Income Statement Group */}
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <TrendingUp className="w-3 h-3 text-emerald-600" />
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Income Statement</span>
                        </div>
                        <div className="space-y-2">
                          {FINANCIAL_INPUTS.filter(f => f.group === 'income').map(field => (
                            <div key={field.key} className="space-y-1 min-w-0">
                              <Label className="text-[11px] font-medium">{field.label}</Label>
                              <Input
                                type="number"
                                min="0"
                                step="any"
                                placeholder={field.placeholder}
                                value={financialData[field.key] || ''}
                                onChange={e => updateInput(field.key, e.target.value)}
                                className="h-8 text-xs w-full max-w-full"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      {/* Balance Sheet Group */}
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Balance Sheet</span>
                        </div>
                        <div className="space-y-2">
                          {FINANCIAL_INPUTS.filter(f => f.group === 'balance').map(field => (
                            <div key={field.key} className="space-y-1 min-w-0">
                              <Label className="text-[11px] font-medium">{field.label}</Label>
                              <Input
                                type="number"
                                min="0"
                                step="any"
                                placeholder={field.placeholder}
                                value={financialData[field.key] || ''}
                                onChange={e => updateInput(field.key, e.target.value)}
                                className="h-8 text-xs w-full max-w-full"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      {/* Market Data Group */}
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <BarChart3 className="w-3 h-3 text-emerald-600" />
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Market Data</span>
                        </div>
                        <div className="space-y-2">
                          {FINANCIAL_INPUTS.filter(f => f.group === 'market').map(field => (
                            <div key={field.key} className="space-y-1 min-w-0">
                              <Label className="text-[11px] font-medium">{field.label}</Label>
                              <Input
                                type="number"
                                min="0"
                                step="any"
                                placeholder={field.placeholder}
                                value={financialData[field.key] || ''}
                                onChange={e => updateInput(field.key, e.target.value)}
                                className="h-8 text-xs w-full max-w-full"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Ratios Results Panel */}
            <div className="lg:col-span-2">
              <Card className="max-h-[80vh] flex flex-col">
                <CardHeader className="pb-3 shrink-0">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-emerald-600" />
                      Calculated Ratios
                    </CardTitle>
                    {calculatedRatios.length > 0 && (
                      <Badge variant="secondary" className="text-[10px]">
                        {calculatedRatios.length} of {RATIO_DEFINITIONS.length}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden min-h-0">
                  {calculatedRatios.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                      <Calculator className="w-10 h-10 mb-3 opacity-30" />
                      <p className="text-sm font-medium">Enter financial data to calculate ratios</p>
                      <p className="text-xs mt-1 opacity-70">All ratios update automatically as you type</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-full">
                      <div className="space-y-4 pr-3">
                        {/* Group ratios by category */}
                        {(['liquidity', 'profitability', 'leverage', 'efficiency', 'market'] as const).map(category => {
                          const categoryRatios = calculatedRatios.filter(r => r.category === category);
                          if (categoryRatios.length === 0) return null;

                          return (
                            <motion.div
                              key={category}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={`text-[10px] border ${CATEGORY_COLORS[category]}`}>
                                  {CATEGORY_LABELS[category]}
                                </Badge>
                                <Separator className="flex-1" />
                              </div>
                              <div className="space-y-2">
                                {categoryRatios.map((ratio, idx) => {
                                  const status = ratio.interpretation as 'healthy' | 'warning' | 'danger';
                                  const def = RATIO_DEFINITIONS.find(d => d.name === ratio.name);
                                  return (
                                    <motion.div
                                      key={ratio.name}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: idx * 0.05, duration: 0.2 }}
                                      className={`p-3 rounded-lg border ${getHealthBg(status)}`}
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                            {getHealthIcon(status)}
                                            <span className="text-sm font-medium">{ratio.name}</span>
                                          </div>
                                          <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                                            {ratio.formula}
                                          </p>
                                          {def && (
                                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                              <Info className="w-2.5 h-2.5 inline mr-0.5" />
                                              Benchmark — Healthy: {def.benchmark.healthy} | Warning: {def.benchmark.warning} | Danger: {def.benchmark.danger}
                                            </p>
                                          )}
                                        </div>
                                        <div className="text-right shrink-0">
                                          <div className={`text-lg font-bold ${getHealthColor(status)}`}>
                                            {formatNumber(ratio.value, ratio.unit)}
                                          </div>
                                          <Badge
                                            variant="outline"
                                            className={`text-[9px] ${getHealthColor(status)} border-current`}
                                          >
                                            {ratio.interpretation}
                                          </Badge>
                                        </div>
                                      </div>
                                    </motion.div>
                                  );
                                })}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>

              {/* Ratio Summary Table */}
              {calculatedRatios.length > 0 && (
                <Card className="mt-4">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Info className="w-4 h-4 text-emerald-600" />
                      Ratio Summary Table
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                    <ScrollArea className="max-h-[300px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-[10px]">Ratio</TableHead>
                            <TableHead className="text-[10px]">Category</TableHead>
                            <TableHead className="text-[10px]">Value</TableHead>
                            <TableHead className="text-[10px]">Status</TableHead>
                            <TableHead className="text-[10px] hidden md:table-cell">Benchmark</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {calculatedRatios.map(ratio => {
                            const status = ratio.interpretation as 'healthy' | 'warning' | 'danger';
                            const def = RATIO_DEFINITIONS.find(d => d.name === ratio.name);
                            return (
                              <TableRow key={ratio.name}>
                                <TableCell className="text-xs font-medium">{ratio.name}</TableCell>
                                <TableCell>
                                  <Badge className={`text-[9px] border ${CATEGORY_COLORS[ratio.category]}`}>
                                    {CATEGORY_LABELS[ratio.category]}
                                  </Badge>
                                </TableCell>
                                <TableCell className={`text-xs font-bold ${getHealthColor(status)}`}>
                                  {formatNumber(ratio.value, ratio.unit)}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    {getHealthIcon(status)}
                                    <span className={`text-[10px] ${getHealthColor(status)}`}>{ratio.interpretation}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-[10px] text-muted-foreground hidden md:table-cell">
                                  {def ? `✓ ${def.benchmark.healthy}` : ''}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Balance Sheet Analyzer */}
        <TabsContent value="balance-sheet" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Balance Sheet Input */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  Balance Sheet Input
                </CardTitle>
                <CardDescription className="text-xs">
                  Paste or type a balance sheet in structured format — AI will extract and validate the data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder={`Paste your balance sheet here, e.g.:

Balance Sheet as of Dec 31, 2024

ASSETS
  Current Assets: $60,000,000
  Fixed Assets: $140,000,000
  Total Assets: $200,000,000

LIABILITIES
  Current Liabilities: $30,000,000
  Long-term Debt: $50,000,000
  Total Liabilities: $80,000,000

EQUITY
  Shareholders' Equity: $120,000,000`}
                  value={balanceSheetText}
                  onChange={e => setBalanceSheetText(e.target.value)}
                  className="min-h-[280px] text-xs font-mono resize-none min-w-0"
                />
                <Button
                  onClick={parseBalanceSheet}
                  disabled={!balanceSheetText.trim() || isParsingBS}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                >
                  {isParsingBS ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  {isParsingBS ? 'Analyzing...' : 'Analyze Balance Sheet'}
                </Button>
              </CardContent>
            </Card>

            {/* Balance Sheet Results */}
            <div className="space-y-4">
              {balanceSheetAnalysis ? (
                <>
                  {/* Accounting Equation Validation */}
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className={balanceSheetAnalysis.isValid ? 'border-emerald-500/30' : 'border-red-500/30'}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          {balanceSheetAnalysis.isValid ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          )}
                          Accounting Equation Validation
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="p-3 rounded-lg bg-muted/50 text-center">
                          <div className="text-xs text-muted-foreground mb-1">Assets = Liabilities + Equity</div>
                          <div className="flex items-center justify-center gap-3">
                            <span className="text-sm font-bold">{formatCurrency(balanceSheetAnalysis.totalAssets)}</span>
                            <span className="text-muted-foreground">=</span>
                            <span className="text-sm font-bold">{formatCurrency(balanceSheetAnalysis.totalLiabilities)}</span>
                            <span className="text-muted-foreground">+</span>
                            <span className="text-sm font-bold">{formatCurrency(balanceSheetAnalysis.totalEquity)}</span>
                          </div>
                        </div>

                        <Alert variant={balanceSheetAnalysis.isValid ? 'default' : 'destructive'}>
                          <AlertDescription className="text-xs">
                            {balanceSheetAnalysis.isValid ? (
                              <span className="flex items-center gap-1.5 text-emerald-600">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Balance sheet is balanced! The accounting equation holds true.
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Balance sheet is NOT balanced. Difference: {formatCurrency(balanceSheetAnalysis.difference)}
                              </span>
                            )}
                          </AlertDescription>
                        </Alert>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Composition Analysis */}
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-emerald-600" />
                          Composition Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Asset Composition */}
                        <div>
                          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Asset Composition
                          </div>
                          <div className="space-y-2">
                            <div>
                              <div className="flex items-center justify-between text-xs mb-0.5">
                                <span>Current Assets</span>
                                <span className="font-medium">{formatCurrency(balanceSheetAnalysis.currentAssets)} ({balanceSheetAnalysis.composition.currentAssetsPct.toFixed(1)}%)</span>
                              </div>
                              <Progress value={balanceSheetAnalysis.composition.currentAssetsPct} className="h-2" />
                            </div>
                            <div>
                              <div className="flex items-center justify-between text-xs mb-0.5">
                                <span>Fixed Assets</span>
                                <span className="font-medium">{formatCurrency(balanceSheetAnalysis.fixedAssets)} ({balanceSheetAnalysis.composition.fixedAssetsPct.toFixed(1)}%)</span>
                              </div>
                              <Progress value={balanceSheetAnalysis.composition.fixedAssetsPct} className="h-2" />
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* Financing Composition */}
                        <div>
                          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Financing Composition (Debt vs Equity)
                          </div>
                          <div className="space-y-2">
                            <div>
                              <div className="flex items-center justify-between text-xs mb-0.5">
                                <span className="flex items-center gap-1">
                                  <TrendingDown className="w-3 h-3 text-orange-500" />
                                  Debt
                                </span>
                                <span className="font-medium">{formatCurrency(balanceSheetAnalysis.totalLiabilities)} ({balanceSheetAnalysis.composition.debtPct.toFixed(1)}%)</span>
                              </div>
                              <Progress value={balanceSheetAnalysis.composition.debtPct} className="h-2" />
                            </div>
                            <div>
                              <div className="flex items-center justify-between text-xs mb-0.5">
                                <span className="flex items-center gap-1">
                                  <TrendingUp className="w-3 h-3 text-emerald-600" />
                                  Equity
                                </span>
                                <span className="font-medium">{formatCurrency(balanceSheetAnalysis.totalEquity)} ({balanceSheetAnalysis.composition.equityPct.toFixed(1)}%)</span>
                              </div>
                              <Progress value={balanceSheetAnalysis.composition.equityPct} className="h-2" />
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* Liability Breakdown */}
                        <div>
                          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Liability Breakdown
                          </div>
                          <div className="space-y-2">
                            <div>
                              <div className="flex items-center justify-between text-xs mb-0.5">
                                <span>Current Liabilities</span>
                                <span className="font-medium">{formatCurrency(balanceSheetAnalysis.currentLiabilities)} ({balanceSheetAnalysis.composition.currentLiabPct.toFixed(1)}%)</span>
                              </div>
                              <Progress value={balanceSheetAnalysis.composition.currentLiabPct} className="h-2" />
                            </div>
                            <div>
                              <div className="flex items-center justify-between text-xs mb-0.5">
                                <span>Long-term Debt</span>
                                <span className="font-medium">{formatCurrency(balanceSheetAnalysis.longTermDebt)} ({balanceSheetAnalysis.composition.longTermDebtPct.toFixed(1)}%)</span>
                              </div>
                              <Progress value={balanceSheetAnalysis.composition.longTermDebtPct} className="h-2" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </>
              ) : (
                <Card>
                  <CardContent className="py-16">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <FileSpreadsheet className="w-10 h-10 mb-3 opacity-30" />
                      <p className="text-sm font-medium">Paste a balance sheet to analyze</p>
                      <p className="text-xs mt-1 opacity-70">AI will validate the accounting equation and show composition analysis</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tab 3: AI Analysis */}
        <TabsContent value="ai-analysis" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* RAG-Powered Document Analysis */}
            <Card className="max-h-[80vh] flex flex-col">
              <CardHeader className="pb-3 shrink-0">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  RAG Document Analysis
                </CardTitle>
                <CardDescription className="text-xs">
                  Search uploaded documents for financial data, extract numbers, and generate AI analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 flex-1 overflow-y-auto min-h-0">
                {/* Document Status */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>{chunks.length} chunks available from {documents.length} documents</span>
                </div>

                {documents.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {documents.slice(0, 5).map(doc => (
                      <Badge key={doc.id} variant="secondary" className="text-[10px] gap-1">
                        <FileSpreadsheet className="w-2.5 h-2.5" />
                        {doc.title}
                      </Badge>
                    ))}
                    {documents.length > 5 && (
                      <Badge variant="secondary" className="text-[10px]">
                        +{documents.length - 5} more
                      </Badge>
                    )}
                  </div>
                )}

                <Button
                  onClick={handleRAGAnalysis}
                  disabled={isRagAnalyzing || chunks.length === 0}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shrink-0"
                >
                  {isRagAnalyzing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {isRagAnalyzing ? 'Analyzing Documents...' : (apiKey || simulationMode) ? 'Analyze Documents' : 'Analyze Documents (Offline)'}
                </Button>

                {chunks.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={applyRagToCalculator}
                    className="w-full text-xs gap-1"
                  >
                    <FileSpreadsheet className="w-3 h-3" />
                    Use Document Data
                  </Button>
                )}

                {/* RAG Results */}
                {ragAnalysis && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <Separator className="my-2" />
                    <ScrollArea className="max-h-[400px]">
                      <div className="pr-3">
                        <MarkdownRenderer content={ragAnalysis} />
                      </div>
                    </ScrollArea>
                  </motion.div>
                )}
              </CardContent>
            </Card>

            {/* AI Financial Advisor */}
            <Card className="max-h-[80vh] flex flex-col">
              <CardHeader className="pb-3 shrink-0">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Brain className="w-4 h-4 text-emerald-600" />
                  AI Financial Advisor
                </CardTitle>
                <CardDescription className="text-xs">
                  Get SWOT-style financial analysis, industry comparison, and actionable recommendations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 flex-1 overflow-y-auto min-h-0">
                {/* Current Ratios Summary */}
                {calculatedRatios.length > 0 ? (
                  <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Current Ratios Summary
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-lg font-bold text-emerald-600">{ratioStats.healthy}</div>
                        <div className="text-[9px] text-muted-foreground">Healthy</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-amber-500">{ratioStats.warning}</div>
                        <div className="text-[9px] text-muted-foreground">Warning</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-red-500">{ratioStats.danger}</div>
                        <div className="text-[9px] text-muted-foreground">Danger</div>
                      </div>
                    </div>
                    <Progress
                      value={ratioStats.total > 0 ? (ratioStats.healthy / ratioStats.total) * 100 : 0}
                      className="h-1.5"
                    />
                  </div>
                ) : (
                  <Alert>
                    <Info className="w-4 h-4" />
                    <AlertDescription className="text-xs">
                      Enter financial data in the Ratio Calculator tab first, then come back for AI analysis.
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleAIAdvisor}
                  disabled={isAnalyzing || calculatedRatios.length === 0}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                >
                  {isAnalyzing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Brain className="w-4 h-4" />
                  )}
                  {isAnalyzing ? 'Generating Analysis...' : (apiKey || simulationMode) ? 'Get AI Analysis' : 'Get Analysis (Offline)'}
                </Button>

                {/* AI Results */}
                {aiAnalysis && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <Separator className="my-2" />
                    <ScrollArea className="max-h-[400px]">
                      <div className="pr-3">
                        <MarkdownRenderer content={aiAnalysis} />
                      </div>
                    </ScrollArea>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Combined Analysis View */}
          {(ragAnalysis || aiAnalysis) && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-emerald-600" />
                    Quick Reference — Ratio Benchmarks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                  <ScrollArea className="max-h-[250px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-[10px]">Category</TableHead>
                          <TableHead className="text-[10px]">Ratio</TableHead>
                          <TableHead className="text-[10px]">Healthy</TableHead>
                          <TableHead className="text-[10px]">Warning</TableHead>
                          <TableHead className="text-[10px]">Danger</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {RATIO_DEFINITIONS.map(def => (
                          <TableRow key={def.name}>
                            <TableCell>
                              <Badge className={`text-[9px] border ${CATEGORY_COLORS[def.category]}`}>
                                {CATEGORY_LABELS[def.category]}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs font-medium">{def.name}</TableCell>
                            <TableCell className="text-[10px] text-emerald-600">{def.benchmark.healthy}</TableCell>
                            <TableCell className="text-[10px] text-amber-500">{def.benchmark.warning}</TableCell>
                            <TableCell className="text-[10px] text-red-500">{def.benchmark.danger}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
