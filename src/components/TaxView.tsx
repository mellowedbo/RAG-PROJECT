'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IndianRupee, Calculator, Receipt, Search, TrendingDown,
  ArrowRight, CheckCircle2, AlertCircle, Info, Sparkles,
  Send, Loader2, ChevronDown, ChevronUp, X, MessageSquare,
  Lightbulb, FileText, FolderOpen,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import MarkdownRenderer from '@/components/MarkdownRenderer';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { IncomeTaxInput, IncomeTaxResult, TaxSlab, GSTInput, GSTResult, TaxRegime } from '@/types';

// NEXUS — TaxView Component
// Indian Tax Calculator (FY 2024-25), GST, TDS, AI Assistant

// Utility: Indian Number Formatting
function formatINR(amount: number): string {
  const isNegative = amount < 0;
  const abs = Math.abs(Math.round(amount));
  const str = abs.toString();
  let result = '';

  // Last 3 digits
  if (str.length > 3) {
    result = str.slice(-3);
    let remaining = str.slice(0, -3);
    // Add commas every 2 digits from right
    while (remaining.length > 2) {
      result = remaining.slice(-2) + ',' + result;
      remaining = remaining.slice(0, -2);
    }
    result = remaining + ',' + result;
  } else {
    result = str;
  }

  return (isNegative ? '-' : '') + '₹' + result;
}

// (formatPercent removed — inline formatting used instead)

// Income Tax Calculation Engine

const OLD_REGIME_SLABS = [
  { range: 'Up to ₹2,50,000', rate: 0, taxableFrom: 0, taxableTo: 250000 },
  { range: '₹2,50,001 – ₹5,00,000', rate: 5, taxableFrom: 250001, taxableTo: 500000 },
  { range: '₹5,00,001 – ₹10,00,000', rate: 20, taxableFrom: 500001, taxableTo: 1000000 },
  { range: 'Above ₹10,00,000', rate: 30, taxableFrom: 1000001, taxableTo: Infinity },
];

const OLD_REGIME_SLABS_SENIOR = [
  { range: 'Up to ₹3,00,000', rate: 0, taxableFrom: 0, taxableTo: 300000 },
  { range: '₹3,00,001 – ₹5,00,000', rate: 5, taxableFrom: 300001, taxableTo: 500000 },
  { range: '₹5,00,001 – ₹10,00,000', rate: 20, taxableFrom: 500001, taxableTo: 1000000 },
  { range: 'Above ₹10,00,000', rate: 30, taxableFrom: 1000001, taxableTo: Infinity },
];

const OLD_REGIME_SLABS_SUPER_SENIOR = [
  { range: 'Up to ₹5,00,000', rate: 0, taxableFrom: 0, taxableTo: 500000 },
  { range: '₹5,00,001 – ₹10,00,000', rate: 20, taxableFrom: 500001, taxableTo: 1000000 },
  { range: 'Above ₹10,00,000', rate: 30, taxableFrom: 1000001, taxableTo: Infinity },
];

const NEW_REGIME_SLABS = [
  { range: 'Up to ₹3,00,000', rate: 0, taxableFrom: 0, taxableTo: 300000 },
  { range: '₹3,00,001 – ₹7,00,000', rate: 5, taxableFrom: 300001, taxableTo: 700000 },
  { range: '₹7,00,001 – ₹10,00,000', rate: 10, taxableFrom: 700001, taxableTo: 1000000 },
  { range: '₹10,00,001 – ₹12,00,000', rate: 15, taxableFrom: 1000001, taxableTo: 1200000 },
  { range: '₹12,00,001 – ₹15,00,000', rate: 20, taxableFrom: 1200001, taxableTo: 1500000 },
  { range: 'Above ₹15,00,000', rate: 30, taxableFrom: 1500001, taxableTo: Infinity },
];

function getOldRegimeSlabs(age: number): TaxSlab[] {
  if (age >= 80) return OLD_REGIME_SLABS_SUPER_SENIOR;
  if (age >= 60) return OLD_REGIME_SLABS_SENIOR;
  return OLD_REGIME_SLABS;
}

function calculateTaxOnSlabs(taxableIncome: number, slabs: TaxSlab[]): { tax: number; slabBreakdown: { range: string; rate: number; taxableAmount: number; taxAmount: number }[] } {
  let tax = 0;
  const slabBreakdown: { range: string; rate: number; taxableAmount: number; taxAmount: number }[] = [];

  for (const slab of slabs) {
    if (taxableIncome <= slab.taxableFrom - 1) break;
    const upperLimit = slab.taxableTo === Infinity ? taxableIncome : Math.min(taxableIncome, slab.taxableTo);
    const taxableInSlab = upperLimit - slab.taxableFrom + 1;
    const taxInSlab = (taxableInSlab * slab.rate) / 100;
    tax += taxInSlab;
    slabBreakdown.push({
      range: slab.range,
      rate: slab.rate,
      taxableAmount: taxableInSlab > 0 ? taxableInSlab : 0,
      taxAmount: Math.round(taxInSlab),
    });
  }

  return { tax: Math.round(tax), slabBreakdown };
}

function calculateSurcharge(income: number, tax: number, regime: TaxRegime): number {
  if (regime === 'new') {
    if (income > 20000000) return Math.round(tax * 0.25);
    if (income > 10000000) return Math.round(tax * 0.15);
    if (income > 5000000) return Math.round(tax * 0.10);
    return 0;
  }
  // Old regime
  if (income > 50000000) return Math.round(tax * 0.37); // marginal relief applies, simplified
  if (income > 20000000) return Math.round(tax * 0.25);
  if (income > 10000000) return Math.round(tax * 0.15);
  if (income > 5000000) return Math.round(tax * 0.10);
  return 0;
}

function calculateIncomeTax(input: IncomeTaxInput): IncomeTaxResult {
  const { annualIncome, regime, age, deductions80C, deductions80D, hraExemption, otherDeductions } = input;

  let totalDeductions = 0;
  let taxableIncome = annualIncome;

  if (regime === 'old') {
    const capped80C = Math.min(deductions80C, 150000);
    totalDeductions = capped80C + deductions80D + hraExemption + otherDeductions;
    taxableIncome = Math.max(0, annualIncome - totalDeductions);
  } else {
    // New regime: standard deduction ₹50,000
    totalDeductions = 50000;
    taxableIncome = Math.max(0, annualIncome - totalDeductions);
  }

  const slabs = regime === 'old' ? getOldRegimeSlabs(age) : NEW_REGIME_SLABS;
  const { tax: baseTax, slabBreakdown } = calculateTaxOnSlabs(taxableIncome, slabs);

  // Section 87A rebate (new regime: up to ₹7L taxable income → rebate up to ₹25,000)
  let rebate = 0;
  if (regime === 'new' && taxableIncome <= 700000) {
    rebate = Math.min(baseTax, 25000);
  }
  // Old regime: up to ₹5L taxable income → rebate up to ₹12,500
  if (regime === 'old' && taxableIncome <= 500000) {
    rebate = Math.min(baseTax, 12500);
  }

  const taxAfterRebate = Math.max(0, baseTax - rebate);

  // Surcharge
  const surcharge = calculateSurcharge(annualIncome, taxAfterRebate, regime);
  const taxWithSurcharge = taxAfterRebate + surcharge;

  // 4% Health & Education Cess
  const cess = Math.round(taxWithSurcharge * 0.04);
  const totalTax = taxWithSurcharge + cess;

  // Calculate comparison under both regimes
  const oldResult = calculateSingleRegime({ ...input, regime: 'old' });
  const newResult = calculateSingleRegime({ ...input, regime: 'new' });

  const comparison = {
    oldRegimeTax: oldResult.totalTax,
    newRegimeTax: newResult.totalTax,
    savings: Math.abs(oldResult.totalTax - newResult.totalTax),
    betterRegime: (oldResult.totalTax <= newResult.totalTax ? 'old' : 'new') as TaxRegime,
  };

  return {
    regime,
    grossIncome: annualIncome,
    totalDeductions,
    taxableIncome,
    taxAmount: taxAfterRebate,
    cess,
    totalTax,
    effectiveRate: annualIncome > 0 ? (totalTax / annualIncome) * 100 : 0,
    slabs: slabBreakdown.map(s => ({
      range: s.range,
      rate: s.rate,
      taxableFrom: 0,
      taxableTo: 0,
    })),
    comparison,
  };
}

// Helper: calculate tax for a single regime without comparison (avoids infinite recursion)
function calculateSingleRegime(input: IncomeTaxInput & { regime: TaxRegime }): { totalTax: number } {
  const { annualIncome, regime, age, deductions80C, deductions80D, hraExemption, otherDeductions } = input;

  let totalDeductions = 0;
  let taxableIncome = annualIncome;

  if (regime === 'old') {
    const capped80C = Math.min(deductions80C, 150000);
    totalDeductions = capped80C + deductions80D + hraExemption + otherDeductions;
    taxableIncome = Math.max(0, annualIncome - totalDeductions);
  } else {
    totalDeductions = 50000;
    taxableIncome = Math.max(0, annualIncome - totalDeductions);
  }

  const slabs = regime === 'old' ? getOldRegimeSlabs(age) : NEW_REGIME_SLABS;
  const { tax: baseTax } = calculateTaxOnSlabs(taxableIncome, slabs);

  let rebate = 0;
  if (regime === 'new' && taxableIncome <= 700000) {
    rebate = Math.min(baseTax, 25000);
  }
  if (regime === 'old' && taxableIncome <= 500000) {
    rebate = Math.min(baseTax, 12500);
  }

  const taxAfterRebate = Math.max(0, baseTax - rebate);
  const surcharge = calculateSurcharge(annualIncome, taxAfterRebate, regime);
  const taxWithSurcharge = taxAfterRebate + surcharge;
  const cess = Math.round(taxWithSurcharge * 0.04);

  return { totalTax: taxWithSurcharge + cess };
}

// GST Calculation Engine

function calculateGST(input: GSTInput): GSTResult {
  const { amount, gstRate, gstType, isInclusive } = input;

  let baseAmount: number;
  let gstAmount: number;
  let totalAmount: number;

  if (isInclusive) {
    baseAmount = Math.round((amount * 100) / (100 + gstRate));
    gstAmount = amount - baseAmount;
    totalAmount = amount;
  } else {
    baseAmount = amount;
    gstAmount = Math.round((amount * gstRate) / 100);
    totalAmount = amount + gstAmount;
  }

  if (gstType === 'cgst_sgst') {
    const half = gstAmount / 2;
    return {
      baseAmount,
      gstAmount,
      totalAmount,
      cgst: Math.round(half),
      sgst: Math.round(half),
      igst: 0,
      rate: gstRate,
    };
  } else {
    return {
      baseAmount,
      gstAmount,
      totalAmount,
      cgst: 0,
      sgst: 0,
      igst: gstAmount,
      rate: gstRate,
    };
  }
}

// TDS Rate Data

interface TDSRateEntry {
  section: string;
  description: string;
  rate: string;
  threshold: string;
  specialNotes: string;
  category: string;
}

const TDS_RATES: TDSRateEntry[] = [
  { section: '192', description: 'Salary', rate: 'Slab rates', threshold: 'Basic exemption limit', specialNotes: 'Employer deducts based on estimated income; considers 80C, HRA etc.', category: 'Salary' },
  { section: '192A', description: 'EPF withdrawal (before 5 years)', rate: '10%', threshold: '₹50,000', specialNotes: 'No TDS if PAN submitted & amount < ₹50,000; 20% if no PAN', category: 'Salary' },
  { section: '193', description: 'Interest on securities', rate: '10%', threshold: '₹5,000', specialNotes: '20% if no PAN; no TDS on certain government securities', category: 'Interest' },
  { section: '194', description: 'Dividend', rate: '10%', threshold: '₹5,000', specialNotes: '20% if no PAN', category: 'Investment' },
  { section: '194A', description: 'Interest other than securities (FD, savings)', rate: '10%', threshold: '₹40,000 (₹50,000 for seniors)', specialNotes: 'Bank FD interest; 20% if no PAN', category: 'Interest' },
  { section: '194B', description: 'Winnings from lottery, crossword, puzzles', rate: '30%', threshold: '₹10,000', specialNotes: 'No threshold for lottery distribution; surcharge + cess applicable', category: 'Other' },
  { section: '194BB', description: 'Winnings from horse races', rate: '30%', threshold: '₹10,000', specialNotes: 'Surcharge + cess applicable', category: 'Other' },
  { section: '194C', description: 'Contractor payments (individual/HUF)', rate: '1%', threshold: '₹30,000 single / ₹1,00,000 annual', specialNotes: '2% for companies; no TDS if PAN provided & below threshold', category: 'Business' },
  { section: '194D', description: 'Insurance commission', rate: '5%', threshold: '₹15,000', specialNotes: '10% for corporate agents; 20% if no PAN', category: 'Business' },
  { section: '194G', description: 'Commission on sale of lottery tickets', rate: '5%', threshold: '₹1,000', specialNotes: '20% if no PAN', category: 'Business' },
  { section: '194H', description: 'Commission / brokerage', rate: '5%', threshold: '₹15,000', specialNotes: '20% if no PAN; insurance commission covered u/s 194D', category: 'Business' },
  { section: '194I', description: 'Rent — Plant & machinery', rate: '2%', threshold: '₹1,80,000/year', specialNotes: '10% for land/building rent; 20% if no PAN', category: 'Rent' },
  { section: '194I', description: 'Rent — Land / building', rate: '10%', threshold: '₹2,40,000/year', specialNotes: '2% for plant/machinery; 20% if no PAN', category: 'Rent' },
  { section: '194J', description: 'Professional / technical fees', rate: '10%', threshold: '₹30,000', specialNotes: 'Includes legal, medical, engineering, architectural, accounting; 20% if no PAN', category: 'Professional' },
  { section: '194J', description: 'Fees for technical services (call center)', rate: '2%', threshold: '₹30,000', specialNotes: 'Reduced rate for call center services only', category: 'Professional' },
  { section: '194K', description: 'Income from mutual fund units / securities', rate: '10%', threshold: '₹5,000', specialNotes: 'No TDS on equity MF if PAN provided; only on debt MF', category: 'Investment' },
  { section: '194L', description: 'Compensation on acquisition of capital asset', rate: '10%', threshold: '₹2,50,000', specialNotes: '20% if no PAN', category: 'Capital' },
  { section: '194LA', description: 'Compensation on compulsory acquisition', rate: '10%', threshold: '₹2,50,000', specialNotes: '20% if no PAN', category: 'Capital' },
  { section: '194M', description: 'Payment to resident contractor (individual/HUF not audited)', rate: '5%', threshold: '₹50,00,000', specialNotes: 'Only if total payment exceeds ₹50L in a year', category: 'Business' },
  { section: '194N', description: 'Cash withdrawal from bank', rate: '2%', threshold: '₹1 Crore (₹20L if no ITR)', specialNotes: '5% above ₹1 Cr; 2% between ₹20L-1Cr if no ITR filed', category: 'Banking' },
  { section: '194O', description: 'E-commerce participant sales', rate: '1%', threshold: '₹5,00,000', specialNotes: 'Applicable on gross amount; 5% if no PAN', category: 'Digital' },
  { section: '194P', description: 'Senior citizen FD interest (75+)', rate: 'Nil', threshold: 'N/A', specialNotes: 'No TDS if only pension + FD income; bank verifies via Form 12BBA', category: 'Senior' },
  { section: '194Q', description: 'Purchase of goods (buyer turnover > ₹10 Cr)', rate: '0.1%', threshold: '₹50,00,000', specialNotes: '0.1% if PAN; 5% if no PAN; only for buyers with turnover > ₹10 Cr', category: 'Business' },
  { section: '195', description: 'Payments to non-residents', rate: '20%', threshold: 'No threshold', specialNotes: 'Rate varies by DTAA; subject to surcharge + cess; must file Form 15CA/CB', category: 'International' },
  { section: '196A', description: 'Income from foreign securities (non-resident)', rate: '20%', threshold: 'No threshold', specialNotes: 'Subject to surcharge + cess', category: 'International' },
  { section: '196B', description: 'Income from units (offshore fund)', rate: '10%', threshold: 'No threshold', specialNotes: 'Subject to surcharge + cess', category: 'International' },
  { section: '196C', description: 'Income from foreign institutional investors', rate: '20%', threshold: 'No threshold', specialNotes: '10% for certain categories; subject to surcharge + cess', category: 'International' },
  { section: '196D', description: 'Income of foreign institutional investors from securities', rate: '20%', threshold: 'No threshold', specialNotes: 'Subject to surcharge + cess', category: 'International' },
];

const GST_RATE_ITEMS: { rate: number; label: string; items: string[] }[] = [
  { rate: 5, label: '5% GST', items: ['Essential food items (packed)', 'Medicines & pharma', 'Textiles (below ₹1000)', 'Footwear (below ₹500)', 'Transport services', 'Restaurant (non-AC)', 'LPG cylinder', 'Tea & coffee'] },
  { rate: 12, label: '12% GST', items: ['Processed food', 'Textiles (above ₹1000)', 'Footwear (above ₹500)', 'Restaurant (AC)', 'Business class air travel', 'Mobile phones', 'Medical devices', 'Frozen meat products'] },
  { rate: 18, label: '18% GST', items: ['Most services (IT, banking, telecom)', 'AC restaurants', 'FMCG (soap, shampoo, cosmetics)', 'Electronics & appliances', 'Financial services', 'Construction services', 'Alcohol-removed products', 'Sugar boiled confectionery'] },
  { rate: 28, label: '28% GST', items: ['Luxury cars', 'Motorcycles (>350cc)', 'Aerated drinks', 'Tobacco & cigarettes', 'Cement', 'Air conditioners', 'Dishwashers', '5-star hotel stays'] },
];

// Component Props

interface TaxViewProps {
  apiKey: string;
  generationModel: string;
  simulationMode: boolean;
  chunks: { id: string; documentId: string; content: string; chunkIndex: number; section: string | null; wordCount: number; charCount: number; embedding?: number[] }[];
  isProcessing: boolean;
  setIsProcessing: (v: boolean) => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Slab Breakdown Detail

interface SlabBreakdownDetail {
  range: string;
  rate: number;
  taxableAmount: number;
  taxAmount: number;
}

function getDetailedBreakdown(taxableIncome: number, regime: TaxRegime, age: number): SlabBreakdownDetail[] {
  const slabs = regime === 'old' ? getOldRegimeSlabs(age) : NEW_REGIME_SLABS;
  const result: SlabBreakdownDetail[] = [];

  for (const slab of slabs) {
    if (taxableIncome <= slab.taxableFrom - 1) break;
    const upperLimit = slab.taxableTo === Infinity ? taxableIncome : Math.min(taxableIncome, slab.taxableTo);
    const taxableInSlab = Math.max(0, upperLimit - slab.taxableFrom + 1);
    const taxInSlab = (taxableInSlab * slab.rate) / 100;
    result.push({
      range: slab.range,
      rate: slab.rate,
      taxableAmount: taxableInSlab,
      taxAmount: Math.round(taxInSlab),
    });
  }

  return result;
}

// TaxView Component

export default function TaxView({
  apiKey,
  generationModel,
  simulationMode,
  chunks,
  isProcessing,
  setIsProcessing,
}: TaxViewProps) {
  const [activeTab, setActiveTab] = useState('income-tax');

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-2 border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-sm font-semibold">Indian Tax Intelligence — FY 2024-25</div>
                <div className="text-xs text-muted-foreground">
                  Income Tax (Old & New Regime), GST Calculator, TDS Rate Lookup, and AI Tax Assistant — all calculations as per Indian tax law
                </div>
                {!apiKey && !simulationMode && (
                  <div className="mt-1.5">
                    <Badge variant="outline" className="text-[10px] gap-1 border-emerald-500/30 text-emerald-600">
                      <Lightbulb className="w-2.5 h-2.5" />
                      Works offline — add API key for AI insights
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="income-tax" className="text-xs gap-1">
            <IndianRupee className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Income Tax</span>
          </TabsTrigger>
          <TabsTrigger value="gst" className="text-xs gap-1">
            <Receipt className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">GST</span>
          </TabsTrigger>
          <TabsTrigger value="tds" className="text-xs gap-1">
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">TDS Rates</span>
          </TabsTrigger>
          <TabsTrigger value="ai-assistant" className="text-xs gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AI Assistant</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="income-tax" className="mt-4">
          <IncomeTaxTab />
        </TabsContent>
        <TabsContent value="gst" className="mt-4">
          <GSTTab />
        </TabsContent>
        <TabsContent value="tds" className="mt-4">
          <TDSTab />
        </TabsContent>
        <TabsContent value="ai-assistant" className="mt-4">
          <AIAssistantTab
            apiKey={apiKey}
            generationModel={generationModel}
            simulationMode={simulationMode}
            chunks={chunks}
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Income Tax Tab

function IncomeTaxTab() {
  const [annualIncome, setAnnualIncome] = useState('1200000');
  const [ageGroup, setAgeGroup] = useState<'below60' | '60to80' | 'above80'>('below60');
  const [regime, setRegime] = useState<TaxRegime>('new');
  const [deductions80C, setDeductions80C] = useState('150000');
  const [deductions80D, setDeductions80D] = useState('25000');
  const [hraExemption, setHraExemption] = useState('0');
  const [otherDeductions, setOtherDeductions] = useState('0');
  const [result, setResult] = useState<IncomeTaxResult | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const handleCalculate = () => {
    const income = parseFloat(annualIncome) || 0;
    const age = ageGroup === 'above80' ? 85 : ageGroup === '60to80' ? 65 : 35;
    const input: IncomeTaxInput = {
      annualIncome: income,
      regime,
      age,
      deductions80C: parseFloat(deductions80C) || 0,
      deductions80D: parseFloat(deductions80D) || 0,
      hraExemption: parseFloat(hraExemption) || 0,
      otherDeductions: parseFloat(otherDeductions) || 0,
    };
    const taxResult = calculateIncomeTax(input);
    setResult(taxResult);
    setShowBreakdown(true);
  };

  const ageNum = ageGroup === 'above80' ? 85 : ageGroup === '60to80' ? 65 : 35;
  const breakdown = result ? getDetailedBreakdown(result.taxableIncome, regime, ageNum) : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      {/* Input Panel */}
      <div className="lg:col-span-2 space-y-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-600" />
                Income Tax Calculator
              </CardTitle>
              <CardDescription className="text-xs">FY 2024-25 (Assessment Year 2025-26)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Annual Income */}
              <div className="space-y-1.5 min-w-0">
                <label className="text-xs font-medium text-muted-foreground">Annual Income (₹)</label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={annualIncome}
                    onChange={(e) => setAnnualIncome(e.target.value)}
                    className="pl-9 w-full max-w-full"
                    placeholder="12,00,000"
                  />
                </div>
              </div>

              {/* Age Group */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Age Group</label>
                <Select value={ageGroup} onValueChange={(v) => setAgeGroup(v as 'below60' | '60to80' | 'above80')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="below60">Below 60 years</SelectItem>
                    <SelectItem value="60to80">60 – 80 years (Senior Citizen)</SelectItem>
                    <SelectItem value="above80">Above 80 years (Super Senior)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tax Regime */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Tax Regime</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setRegime('old')}
                    className={`flex-1 p-2.5 rounded-lg border text-sm font-medium transition-all ${
                      regime === 'old'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600'
                        : 'border-border hover:border-emerald-500/30 text-muted-foreground'
                    }`}
                  >
                    Old Regime
                  </button>
                  <button
                    onClick={() => setRegime('new')}
                    className={`flex-1 p-2.5 rounded-lg border text-sm font-medium transition-all ${
                      regime === 'new'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600'
                        : 'border-border hover:border-emerald-500/30 text-muted-foreground'
                    }`}
                  >
                    New Regime
                  </button>
                </div>
              </div>

              <Separator />

              {/* Deductions */}
              <AnimatePresence mode="wait">
                {regime === 'old' ? (
                  <motion.div
                    key="old-deductions"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 overflow-y-auto max-h-[50vh]"
                  >
                    <div className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                      <TrendingDown className="w-3 h-3" />
                      Deductions (Old Regime)
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-muted-foreground">Section 80C <span className="text-[10px]">(max ₹1.5L)</span></label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger><Info className="w-3 h-3 text-muted-foreground" /></TooltipTrigger>
                            <TooltipContent className="text-xs max-w-[250px]">PPF, ELSS, LIC, EPF, NSC, 5-year FD, home loan principal, children's tuition fees. Max ₹1,50,000.</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input type="number" value={deductions80C} onChange={(e) => setDeductions80C(e.target.value)} className="pl-9 h-9 text-sm w-full max-w-full" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-muted-foreground">Section 80D (Health Insurance)</label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger><Info className="w-3 h-3 text-muted-foreground" /></TooltipTrigger>
                            <TooltipContent className="text-xs max-w-[250px]">Self/family: ₹25,000 (₹50,000 for seniors). Parents: additional ₹25,000 (₹50,000 if senior). Preventive health checkup: ₹5,000 within limit.</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input type="number" value={deductions80D} onChange={(e) => setDeductions80D(e.target.value)} className="pl-9 h-9 text-sm w-full max-w-full" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">HRA Exemption</label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input type="number" value={hraExemption} onChange={(e) => setHraExemption(e.target.value)} className="pl-9 h-9 text-sm w-full max-w-full" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">Other Deductions (80E, 80G, 80TTA etc.)</label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input type="number" value={otherDeductions} onChange={(e) => setOtherDeductions(e.target.value)} className="pl-9 h-9 text-sm w-full max-w-full" />
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="new-deductions"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 rounded-lg bg-muted/50 border border-border"
                  >
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                      <div className="text-xs text-muted-foreground leading-relaxed">
                        <span className="font-medium text-foreground">New Regime:</span> Only standard deduction of ₹50,000 is allowed. No 80C, 80D, HRA, or other deductions.
                        <div className="mt-1 text-amber-600">Rebate u/s 87A: No tax if taxable income ≤ ₹7,00,000</div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button onClick={handleCalculate} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                <Calculator className="w-4 h-4" />
                Calculate Tax
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Results Panel */}
      <div className="lg:col-span-3 space-y-4">
        {result && result.comparison && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Regime Comparison Banner */}
            <Card className={`border-2 ${result.comparison.betterRegime === regime ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  {result.comparison.betterRegime === regime ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  )}
                  <span className="text-sm font-semibold">
                    {result.comparison.betterRegime === regime
                      ? `${regime === 'old' ? 'Old' : 'New'} Regime is better for you!`
                      : `Consider switching to ${result.comparison.betterRegime === 'old' ? 'Old' : 'New'} Regime`}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 min-w-0">
                  <div className={`p-3 rounded-lg border min-w-0 ${result.comparison.betterRegime === 'old' ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border'}`}>
                    <div className="text-[10px] text-muted-foreground mb-1">Old Regime</div>
                    <div className={`text-sm font-bold ${result.comparison.betterRegime === 'old' ? 'text-emerald-600' : ''}`}>
                      {formatINR(result.comparison.oldRegimeTax)}
                    </div>
                    {result.comparison.betterRegime === 'old' && (
                      <Badge className="mt-1 text-[9px] h-4 bg-emerald-600">Best</Badge>
                    )}
                  </div>
                  <div className={`p-3 rounded-lg border min-w-0 ${result.comparison.betterRegime === 'new' ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border'}`}>
                    <div className="text-[10px] text-muted-foreground mb-1">New Regime</div>
                    <div className={`text-sm font-bold ${result.comparison.betterRegime === 'new' ? 'text-emerald-600' : ''}`}>
                      {formatINR(result.comparison.newRegimeTax)}
                    </div>
                    {result.comparison.betterRegime === 'new' && (
                      <Badge className="mt-1 text-[9px] h-4 bg-emerald-600">Best</Badge>
                    )}
                  </div>
                  <div className="p-3 rounded-lg border border-border min-w-0">
                    <div className="text-[10px] text-muted-foreground mb-1">You Save</div>
                    <div className="text-sm font-bold text-emerald-600">{formatINR(result.comparison.savings)}</div>
                    <div className="text-[9px] text-muted-foreground">with {result.comparison.betterRegime === 'old' ? 'Old' : 'New'} Regime</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {result && (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-emerald-600" />
                    Tax Summary — {regime === 'old' ? 'Old' : 'New'} Regime
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[
                      { label: 'Gross Annual Income', value: formatINR(result.grossIncome), highlight: false },
                      { label: `Less: Deductions ${regime === 'new' ? '(Standard ₹50,000)' : ''}`, value: `- ${formatINR(result.totalDeductions)}`, highlight: false },
                      { label: 'Taxable Income', value: formatINR(result.taxableIncome), highlight: true },
                      { label: 'Tax on Income', value: formatINR(result.taxAmount), highlight: false },
                      { label: 'Add: Health & Education Cess (4%)', value: formatINR(result.cess), highlight: false },
                      { label: 'Total Tax Payable', value: formatINR(result.totalTax), highlight: true, large: true },
                      { label: 'Effective Tax Rate', value: result.effectiveRate.toFixed(2) + '%', highlight: false },
                    ].map((row, i) => (
                      <div key={i} className={`flex items-center justify-between py-1.5 ${row.highlight ? '' : ''} ${i === 4 ? 'border-t border-border pt-2' : ''}`}>
                        <span className={`text-xs ${row.highlight ? 'font-semibold' : 'text-muted-foreground'}`}>{row.label}</span>
                        <span className={`text-xs font-mono ${row.large ? 'text-lg font-bold text-emerald-600' : row.highlight ? 'font-semibold' : ''}`}>
                          {row.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-emerald-600" />
                      Slab-wise Breakdown
                    </CardTitle>
                    <button
                      onClick={() => setShowBreakdown(!showBreakdown)}
                      className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      {showBreakdown ? 'Hide' : 'Show'}
                      {showBreakdown ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>
                </CardHeader>
                <AnimatePresence>
                  {showBreakdown && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <CardContent>
                        <div className="overflow-x-auto">
                        <Table>

                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-[10px]">Income Slab</TableHead>
                              <TableHead className="text-[10px] text-right">Rate</TableHead>
                              <TableHead className="text-[10px] text-right">Taxable Amount</TableHead>
                              <TableHead className="text-[10px] text-right">Tax</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {breakdown.map((slab, i) => (
                              <TableRow key={i}>
                                <TableCell className="text-xs py-1.5 break-words">{slab.range}</TableCell>
                                <TableCell className="text-xs py-1.5 text-right font-mono">{slab.rate}%</TableCell>
                                <TableCell className="text-xs py-1.5 text-right font-mono">{formatINR(slab.taxableAmount)}</TableCell>
                                <TableCell className="text-xs py-1.5 text-right font-mono font-medium">{formatINR(slab.taxAmount)}</TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="border-t-2">
                              <TableCell colSpan={3} className="text-xs py-1.5 font-semibold text-right">Total Tax</TableCell>
                              <TableCell className="text-xs py-1.5 text-right font-mono font-bold text-emerald-600">{formatINR(result.taxAmount)}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell colSpan={3} className="text-xs py-1.5 text-muted-foreground text-right">+ Health & Education Cess (4%)</TableCell>
                              <TableCell className="text-xs py-1.5 text-right font-mono">{formatINR(result.cess)}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell colSpan={3} className="text-xs py-1.5 font-bold text-right">Total Tax Payable</TableCell>
                              <TableCell className="text-xs py-1.5 text-right font-mono font-bold text-emerald-600 text-sm">{formatINR(result.totalTax)}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                        </div>
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>

            {/* Regime slab reference */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Info className="w-4 h-4 text-emerald-600" />
                    {regime === 'old' ? 'Old' : 'New'} Regime Tax Slabs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(regime === 'old' ? getOldRegimeSlabs(ageNum) : NEW_REGIME_SLABS).map((slab, i) => (
                      <div key={i} className={`flex items-center justify-between p-2 rounded-lg border ${
                        result.taxableIncome >= slab.taxableFrom && result.taxableIncome > 0
                          ? 'border-emerald-500/30 bg-emerald-500/5'
                          : 'border-border'
                      }`}>
                        <span className="text-[11px]">{slab.range}</span>
                        <Badge variant="secondary" className="text-[10px] h-4 font-mono">{slab.rate}%</Badge>
                      </div>
                    ))}
                  </div>
                  {regime === 'new' && (
                    <div className="mt-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-400">
                      <AlertCircle className="w-3 h-3 inline mr-1" />
                      Rebate u/s 87A: If taxable income ≤ ₹7,00,000, tax is nil (rebate up to ₹25,000)
                    </div>
                  )}
                  {regime === 'old' && (
                    <div className="mt-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-400">
                      <AlertCircle className="w-3 h-3 inline mr-1" />
                      Rebate u/s 87A: If taxable income ≤ ₹5,00,000, tax is nil (rebate up to ₹12,500)
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}

        {!result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card>
              <CardContent className="p-8">
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <IndianRupee className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-sm font-medium">Enter your income details and calculate</p>
                  <p className="text-xs mt-1 opacity-70">See slab-wise breakdown and regime comparison</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// GST Calculator Tab

function GSTTab() {
  const [amount, setAmount] = useState('10000');
  const [gstRate, setGstRate] = useState('18');
  const [gstType, setGstType] = useState<'cgst_sgst' | 'igst'>('cgst_sgst');
  const [isInclusive, setIsInclusive] = useState(false);
  const [expandedRate, setExpandedRate] = useState<number | null>(null);

  const handleCalculate = () => {
    // Result is computed inline below, this just triggers a re-render if needed
  };

  // Compute result inline instead of useEffect to avoid cascading renders
  const parsedAmount = parseFloat(amount) || 0;
  const result: GSTResult | null = parsedAmount > 0
    ? calculateGST({ amount: parsedAmount, gstRate: parseFloat(gstRate), gstType, isInclusive })
    : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      {/* Input Panel */}
      <div className="lg:col-span-2 space-y-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" />
                GST Calculator
              </CardTitle>
              <CardDescription className="text-xs">Calculate CGST, SGST & IGST</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5 min-w-0">
                <label className="text-xs font-medium text-muted-foreground">Amount (₹)</label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-9 w-full max-w-full"
                    placeholder="10,000"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">GST Rate</label>
                <div className="grid grid-cols-4 gap-2">
                  {['5', '12', '18', '28'].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => setGstRate(rate)}
                      className={`p-2 rounded-lg border text-sm font-mono font-medium transition-all ${
                        gstRate === rate
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600'
                          : 'border-border hover:border-emerald-500/30 text-muted-foreground'
                      }`}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Supply Type</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setGstType('cgst_sgst')}
                    className={`flex-1 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                      gstType === 'cgst_sgst'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600'
                        : 'border-border hover:border-emerald-500/30 text-muted-foreground'
                    }`}
                  >
                    Intra-state
                    <div className="text-[10px] text-muted-foreground mt-0.5">CGST + SGST</div>
                  </button>
                  <button
                    onClick={() => setGstType('igst')}
                    className={`flex-1 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                      gstType === 'igst'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600'
                        : 'border-border hover:border-emerald-500/30 text-muted-foreground'
                    }`}
                  >
                    Inter-state
                    <div className="text-[10px] text-muted-foreground mt-0.5">IGST</div>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Amount Type</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsInclusive(false)}
                    className={`flex-1 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                      !isInclusive
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600'
                        : 'border-border hover:border-emerald-500/30 text-muted-foreground'
                    }`}
                  >
                    Exclusive of GST
                  </button>
                  <button
                    onClick={() => setIsInclusive(true)}
                    className={`flex-1 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                      isInclusive
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600'
                        : 'border-border hover:border-emerald-500/30 text-muted-foreground'
                    }`}
                  >
                    Inclusive of GST
                  </button>
                </div>
              </div>

              <Button onClick={handleCalculate} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                <Receipt className="w-4 h-4" />
                Calculate GST
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Results Panel */}
      <div className="lg:col-span-3 space-y-4">
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-emerald-600" />
                  GST Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3 min-w-0">
                    <div className="p-3 rounded-lg border border-border text-center min-w-0">
                      <div className="text-[10px] text-muted-foreground mb-1">Base Amount</div>
                      <div className="text-sm font-bold font-mono break-words">{formatINR(result.baseAmount)}</div>
                    </div>
                    <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 text-center min-w-0">
                      <div className="text-[10px] text-muted-foreground mb-1">GST Amount</div>
                      <div className="text-sm font-bold font-mono text-emerald-600 break-words">{formatINR(result.gstAmount)}</div>
                    </div>
                    <div className="p-3 rounded-lg border border-border text-center min-w-0">
                      <div className="text-[10px] text-muted-foreground mb-1">Total Amount</div>
                      <div className="text-sm font-bold font-mono break-words">{formatINR(result.totalAmount)}</div>
                    </div>
                  </div>

                  <Separator />

                  <div className="text-xs font-semibold text-muted-foreground">Tax Split</div>
                  <div className="grid grid-cols-3 gap-3 min-w-0">
                    {gstType === 'cgst_sgst' ? (
                      <>
                        <div className="p-3 rounded-lg border border-border text-center min-w-0">
                          <div className="text-[10px] text-muted-foreground mb-1">CGST ({result.rate / 2}%)</div>
                          <div className="text-sm font-bold font-mono">{formatINR(result.cgst)}</div>
                        </div>
                        <div className="p-3 rounded-lg border border-border text-center min-w-0">
                          <div className="text-[10px] text-muted-foreground mb-1">SGST ({result.rate / 2}%)</div>
                          <div className="text-sm font-bold font-mono">{formatINR(result.sgst)}</div>
                        </div>
                        <div className="p-3 rounded-lg border border-border text-center opacity-50 min-w-0">
                          <div className="text-[10px] text-muted-foreground mb-1">IGST</div>
                          <div className="text-sm font-bold font-mono">—</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-3 rounded-lg border border-border text-center opacity-50 min-w-0">
                          <div className="text-[10px] text-muted-foreground mb-1">CGST</div>
                          <div className="text-sm font-bold font-mono">—</div>
                        </div>
                        <div className="p-3 rounded-lg border border-border text-center opacity-50 min-w-0">
                          <div className="text-[10px] text-muted-foreground mb-1">SGST</div>
                          <div className="text-sm font-bold font-mono">—</div>
                        </div>
                        <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 text-center min-w-0">
                          <div className="text-[10px] text-muted-foreground mb-1">IGST ({result.rate}%)</div>
                          <div className="text-sm font-bold font-mono text-emerald-600">{formatINR(result.igst)}</div>
                        </div>
                      </>
                    )}
                  </div>

                  {isInclusive && (
                    <div className="p-2.5 rounded-lg bg-muted/50 border border-border text-xs text-muted-foreground flex items-start gap-2">
                      <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>The entered amount of {formatINR(parseFloat(amount) || 0)} includes {result.rate}% GST. The base price before GST is {formatINR(result.baseAmount)}.</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* GST Rate Reference */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Info className="w-4 h-4 text-emerald-600" />
                Quick GST Rate Reference
              </CardTitle>
              <CardDescription className="text-xs">Common items under each GST slab</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 overflow-hidden">
                {GST_RATE_ITEMS.map((item) => (
                  <div key={item.rate} className="border rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedRate(expandedRate === item.rate ? null : item.rate)}
                      className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Badge className={`text-[10px] font-mono ${
                          item.rate === 5 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : item.rate === 12 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : item.rate === 18 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {item.rate}%
                        </Badge>
                        <span className="text-xs font-medium">{item.label}</span>
                      </div>
                      {expandedRate === item.rate ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </button>
                    <AnimatePresence>
                      {expandedRate === item.rate && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-3 flex flex-wrap gap-1.5">
                            {item.items.map((i) => (
                              <Badge key={i} variant="secondary" className="text-[10px] h-5">{i}</Badge>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

// TDS Rates Tab

function TDSTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', ...new Set(TDS_RATES.map(r => r.category))];

  const filtered = TDS_RATES.filter((entry) => {
    const matchesSearch = searchQuery === '' ||
      entry.section.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.rate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.specialNotes.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || entry.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Search className="w-4 h-4 text-emerald-600" />
              TDS Rate Lookup
            </CardTitle>
            <CardDescription className="text-xs">Search by section number or description — FY 2024-25 rates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search section number or description (e.g., 194J, professional, commission)..."
                className="pl-9"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category filters */}
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-[10px] px-2.5 py-1 rounded-full border transition-all ${
                    selectedCategory === cat
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 font-medium'
                      : 'border-border hover:border-emerald-500/30 text-muted-foreground'
                  }`}
                >
                  {cat === 'all' ? 'All' : cat}
                </button>
              ))}
            </div>

            {/* Results count */}
            <div className="text-[10px] text-muted-foreground">
              Showing {filtered.length} of {TDS_RATES.length} sections
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
            <ScrollArea className="max-h-[50vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[10px] w-[80px]">Section</TableHead>
                    <TableHead className="text-[10px]">Description</TableHead>
                    <TableHead className="text-[10px] w-[80px] text-right">TDS Rate</TableHead>
                    <TableHead className="text-[10px] w-[140px]">Threshold</TableHead>
                    <TableHead className="text-[10px] hidden md:table-cell">Special Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((entry, i) => (
                    <TableRow key={`${entry.section}-${i}`} className="hover:bg-emerald-500/5 transition-colors">
                      <TableCell className="text-xs py-2">
                        <Badge variant="secondary" className="text-[10px] font-mono h-5">§{entry.section}</Badge>
                      </TableCell>
                      <TableCell className="text-xs py-2">
                        <div className="font-medium">{entry.description}</div>
                        <div className="text-[10px] text-muted-foreground md:hidden mt-0.5">{entry.specialNotes}</div>
                      </TableCell>
                      <TableCell className="text-xs py-2 text-right font-mono font-medium text-emerald-600">
                        {entry.rate}
                      </TableCell>
                      <TableCell className="text-[11px] py-2 text-muted-foreground">
                        {entry.threshold}
                      </TableCell>
                      <TableCell className="text-[11px] py-2 text-muted-foreground hidden md:table-cell max-w-[250px]">
                        {entry.specialNotes}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-sm">
                        No TDS sections found matching &ldquo;{searchQuery}&rdquo;
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Important note */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <span className="font-medium">Important:</span> If PAN is not provided, TDS is deducted at 20% or the rate applicable, whichever is higher.
            Surcharge and Health & Education Cess of 4% are applicable over and above the TDS rates shown.
            Rates are as per Income Tax Act, FY 2024-25. Always verify with the latest CBDT notifications.
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// AI Tax Assistant Tab

// Tax-related keywords for TF-IDF-like scoring (module-level constant to avoid re-creation on every render)
const TAX_KEYWORDS = [
  'tax', 'income tax', 'gst', 'tds', 'slab', 'deduction', 'exemption', 'regime',
  'section 80c', 'section 80d', '80c', '80d', '80e', '80g', '80tta', '80ttb',
  'capital gains', 'surcharge', 'cess', 'rebate', '87a', 'pan', 'itr', 'return',
  'hra', 'pf', 'epf', 'ppf', 'elss', 'nps', 'nsc', 'lic',
  'cgst', 'sgst', 'igst', 'input tax credit', 'itc', 'reverse charge',
  'withholding', 'advance tax', 'self-assessment', 'tax audit', 'form 16',
  'form 26as', 'tcs', 'dtaa', 'residential status', 'assessment year',
  'financial year', 'fiscal', 'compliance', 'penalty', 'interest',
];

interface AIAssistantTabProps {
  apiKey: string;
  generationModel: string;
  simulationMode: boolean;
  chunks: { id: string; documentId: string; content: string; chunkIndex: number; section: string | null; wordCount: number; charCount: number; embedding?: number[] }[];
  isProcessing: boolean;
  setIsProcessing: (v: boolean) => void;
}

function AIAssistantTab({
  apiKey,
  generationModel,
  simulationMode,
  chunks,
  isProcessing: _isProcessing,
  setIsProcessing,
}: AIAssistantTabProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [taxDocChunks, setTaxDocChunks] = useState<{ content: string; section: string | null; documentId: string; score: number }[]>([]);
  const [isSearchingDocs, setIsSearchingDocs] = useState(false);
  const [showTaxDocResults, setShowTaxDocResults] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const sampleQuestions = [
    "What's my tax liability based on these documents?",
    "Can I claim deduction for home loan interest?",
    "What's the GST rate on restaurant services?",
    "Explain Section 80C deductions",
    "How does the new tax regime compare to old?",
    "What TDS applies on professional fees?",
  ];

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Search tax-related chunks using TF-IDF-like scoring
  const searchTaxChunks = useCallback((query?: string) => {
    setIsSearchingDocs(true);
    setShowTaxDocResults(true);

    const queryTerms = query ? query.toLowerCase().split(/\s+/).filter(t => t.length > 2) : [];

    const scored = chunks.map(chunk => {
      const lower = chunk.content.toLowerCase();
      let score = 0;

      // Score based on tax keyword presence
      for (const kw of TAX_KEYWORDS) {
        const regex = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        const matches = lower.match(regex);
        if (matches) {
          score += matches.length * 2; // TF component
        }
      }

      // Boost score if query terms match
      for (const term of queryTerms) {
        const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        const matches = lower.match(regex);
        if (matches) {
          score += matches.length * 3;
        }
      }

      // Penalize very long chunks (IDF-like normalization)
      const lengthPenalty = Math.log(chunk.content.length / 500 + 1);
      score = score / lengthPenalty;

      return { chunk, score };
    }).filter(s => s.score > 0).sort((a, b) => b.score - a.score).slice(0, 8);

    const results = scored.map(s => ({
      content: s.chunk.content,
      section: s.chunk.section,
      documentId: s.chunk.documentId,
      score: Math.round(s.score * 10) / 10,
    }));

    setTaxDocChunks(results);
    setIsSearchingDocs(false);
  }, [chunks]);

  const handleSend = async (question?: string) => {
    const q = question || input.trim();
    if (!q) return;

    const userMessage: ChatMessage = { role: 'user', content: q, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsProcessing(true);

    try {
      // Search for tax-relevant chunks using TF-IDF scoring
      const queryTerms = q.toLowerCase().split(/\s+/).filter(t => t.length > 2);
      const scoredChunks = chunks.map(chunk => {
        const lower = chunk.content.toLowerCase();
        let score = 0;

        for (const kw of TAX_KEYWORDS) {
          const regex = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
          const matches = lower.match(regex);
          if (matches) score += matches.length * 2;
        }

        for (const term of queryTerms) {
          const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
          const matches = lower.match(regex);
          if (matches) score += matches.length * 3;
        }

        const lengthPenalty = Math.log(chunk.content.length / 500 + 1);
        score = score / lengthPenalty;

        return { chunk, score };
      }).filter(s => s.score > 0).sort((a, b) => b.score - a.score).slice(0, 6);

      const relevantChunks = scoredChunks.length > 0
        ? scoredChunks.map((s, i) => `[Source ${i + 1}${s.chunk.section ? ` | ${s.chunk.section}` : ''} | Relevance: ${Math.round(s.score)}]: ${s.chunk.content.slice(0, 400)}`).join('\n\n')
        : chunks.slice(0, 4).map((c, i) => `[Source ${i + 1}${c.section ? ` | ${c.section}` : ''}]: ${c.content.slice(0, 300)}`).join('\n\n');

      const hasTaxContext = scoredChunks.length > 0;

      const systemPrompt = `You are NEXUS Tax Assistant, an expert in Indian taxation (FY 2024-25). You specialize in:
- Income Tax (Old & New Regime), deductions, exemptions, slab rates
- GST (CGST, SGST, IGST), rates, compliance
- TDS rates, sections, thresholds
- Indian financial regulations and compliance

${hasTaxContext ? `**IMPORTANT: The user has uploaded financial documents containing tax-related information. Use the provided document excerpts as primary context for your answer. Reference specific document sources when citing information.**` : 'No specific document context is available. Provide general tax guidance.'}

RULES:
1. Provide accurate, up-to-date Indian tax information only
2. Use ₹ for currency and Indian number formatting (e.g., ₹1,50,000)
3. Always mention which regime/slab/rate you're referencing
4. If asked about a specific document, reference the provided context
5. If information is insufficient, say so clearly
6. Add disclaimers where appropriate (e.g., "consult a CA")
7. Be concise but thorough
8. When document excerpts are provided, prioritize information from those documents over general knowledge`;

      const userPrompt = relevantChunks
        ? `Based on the following financial document excerpts:\n\n${relevantChunks}\n\nUser Question: ${q}`
        : `User Question: ${q}`;

      if (simulationMode) {
        // Simulation mode: generate a helpful response without API
        await new Promise(resolve => setTimeout(resolve, 1500));
        const simResponse = generateSimulationResponse(q);
        const assistantMessage: ChatMessage = { role: 'assistant', content: simResponse, timestamp: new Date() };
        setMessages(prev => [...prev, assistantMessage]);
      } else if (!apiKey) {
        // Offline: provide rule-based response + document tax analysis fallback
        await new Promise(resolve => setTimeout(resolve, 800));
        let offlineResponse = generateOfflineTaxResponse(q);

        // If tax-relevant document chunks exist, append them as "Document Tax Analysis"
        if (scoredChunks.length > 0) {
          offlineResponse += `\n\n---\n📄 **Document Tax Analysis** (from your uploaded documents):\n\n`;
          scoredChunks.slice(0, 4).forEach((s, i) => {
            offlineResponse += `**Source ${i + 1}${s.chunk.section ? ` — ${s.chunk.section}` : ''}:**\n> ${s.chunk.content.slice(0, 250)}${s.chunk.content.length > 250 ? '...' : ''}\n\n`;
          });
          offlineResponse += `*These excerpts were found by searching your documents for tax-related content.*`;
        }

        const assistantMessage: ChatMessage = { role: 'assistant', content: offlineResponse, timestamp: new Date() };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
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

        const data = await res.json();
        if (data.error) {
          const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: `❌ Error: ${data.error}`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, assistantMessage]);
        } else {
          const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: data.response || 'No response generated.',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, assistantMessage]);
        }
      }
    } catch (err) {
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: `❌ Failed to get response: ${err instanceof Error ? err.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      {/* Chat Area */}
      <div className="lg:col-span-3 space-y-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="min-h-[500px] flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  AI Tax Assistant
                </CardTitle>
                <div className="flex items-center gap-2">
                  {simulationMode && (
                    <Badge variant="secondary" className="text-[10px] gap-1">
                      <Info className="w-2.5 h-2.5" />
                      Simulation
                    </Badge>
                  )}
                  {chunks.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] gap-1">
                      <MessageSquare className="w-2.5 h-2.5" />
                      {chunks.length} chunks
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {!apiKey && !simulationMode && (
                <div className="text-xs text-amber-600 flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-500/20 mb-3">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  AI Tax Advisor requires an API key. Use the calculators below for standalone tax computation.
                </div>
              )}

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto max-h-[400px] space-y-3 mb-3 pr-1">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Sparkles className="w-10 h-10 mb-3 opacity-20" />
                    <p className="text-sm font-medium">Ask me anything about Indian taxation</p>
                    <p className="text-xs mt-1 opacity-70">Income Tax, GST, TDS — powered by your financial documents</p>
                    {!apiKey && !simulationMode && (
                      <div className="mt-4 space-y-3">
                        <div className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">Quick Tax Reference (Offline)</div>
                        <div className="grid grid-cols-1 gap-2 text-left max-h-[200px] overflow-y-auto">
                          <div className="p-2 rounded border border-border bg-muted/30">
                            <div className="text-[11px] font-medium">💡 Tax Saving Tips</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">Max out 80C (₹1.5L), add 80D health insurance, use NPS u/s 80CCD(1B) for extra ₹50K</div>
                          </div>
                          <div className="p-2 rounded border border-border bg-muted/30">
                            <div className="text-[11px] font-medium">⚖️ Regime Comparison</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">New regime: lower rates, no deductions. Old regime: higher rates but 80C+80D+HRA can save more</div>
                          </div>
                          <div className="p-2 rounded border border-border bg-muted/30">
                            <div className="text-[11px] font-medium">📋 Old Regime Deductions Checklist</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">80C: PPF/ELSS/LIC, 80D: Health Ins, 80E: Education loan, 80G: Donations, 24(b): Home loan interest</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] p-3 rounded-lg text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-emerald-600 text-white rounded-br-none'
                        : 'bg-muted border border-border rounded-bl-none'
                    }`}>
                      <div className="break-words [overflow-wrap:break-word]">
                        {msg.role === 'assistant' ? (
                          <MarkdownRenderer content={msg.content} />
                        ) : (
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        )}
                      </div>
                      <div className={`text-[9px] mt-1 ${msg.role === 'user' ? 'text-emerald-200' : 'text-muted-foreground'}`}>
                        {msg.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted border border-border p-3 rounded-lg rounded-bl-none">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                        <span className="text-xs text-muted-foreground">Analyzing your tax question...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                  placeholder="Ask about income tax, GST, TDS, deductions..."
                  disabled={isLoading}
                  className="flex-1 min-w-0"
                />
                <Button
                  onClick={() => handleSend()}
                  disabled={isLoading || !input.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shrink-0"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Sidebar: Sample Questions + Info */}
      <div className="space-y-4">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-emerald-600" />
                Sample Questions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {sampleQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  disabled={isLoading}
                  className="w-full text-left text-[11px] px-2.5 py-2 rounded-lg border border-border hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all duration-200 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {q}
                </button>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-emerald-600" />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-[11px] text-muted-foreground leading-relaxed space-y-1.5">
                <p><span className="text-foreground font-medium">1.</span> Ask any Indian tax question</p>
                <p><span className="text-foreground font-medium">2.</span> AI searches your uploaded financial documents for relevant context</p>
                <p><span className="text-foreground font-medium">3.</span> Get accurate, citation-backed answers</p>
                <p><span className="text-foreground font-medium">4.</span> Cross-reference with the calculators above</p>
              </div>
              <Separator />
              <div className="text-[10px] text-muted-foreground">
                <p>Powered by {simulationMode ? 'Simulation Mode' : generationModel || 'Gemini AI'}</p>
                <p className="mt-1 text-amber-600">⚠️ AI responses are for guidance only. Consult a CA for official tax advice.</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Search Tax Documents Button */}
        {chunks.length > 0 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xs flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-emerald-600" />
                  Search Tax Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-[11px] text-muted-foreground">
                  Search uploaded documents for tax-related content using TF-IDF relevance scoring.
                </p>
                <Button
                  onClick={() => searchTaxChunks()}
                  disabled={isSearchingDocs}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs"
                  size="sm"
                >
                  {isSearchingDocs ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                  {isSearchingDocs ? 'Searching...' : 'Search Tax Documents'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tax Document Insights Card */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                Tax Document Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const taxRelevantChunks = chunks.filter(c => {
                  const lower = c.content.toLowerCase();
                  return TAX_KEYWORDS.some(kw => lower.includes(kw));
                });
                const taxDocIds = [...new Set(taxRelevantChunks.map(c => c.documentId))];

                if (chunks.length === 0) {
                  return (
                    <div className="text-center py-3">
                      <FolderOpen className="w-6 h-6 mx-auto mb-2 text-muted-foreground/40" />
                      <p className="text-[11px] text-muted-foreground">No documents uploaded yet.</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Upload financial documents to find tax-related content.</p>
                    </div>
                  );
                }

                if (taxRelevantChunks.length === 0) {
                  return (
                    <div className="text-center py-3">
                      <Search className="w-6 h-6 mx-auto mb-2 text-muted-foreground/40" />
                      <p className="text-[11px] text-muted-foreground">No tax-related content found.</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Upload tax documents, returns, or financial statements for analysis.</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="text-lg font-bold text-emerald-600">{taxRelevantChunks.length}</div>
                      <div className="text-[10px] text-muted-foreground">tax-relevant chunks across {taxDocIds.length} document(s)</div>
                    </div>
                    <div className="space-y-1">
                      {taxDocIds.slice(0, 5).map((docId, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[11px]">
                          <FileText className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span className="text-muted-foreground truncate">{docId}</span>
                          <Badge variant="secondary" className="text-[8px] h-3.5 ml-auto shrink-0">
                            {taxRelevantChunks.filter(c => c.documentId === docId).length} chunks
                          </Badge>
                        </div>
                      ))}
                      {taxDocIds.length > 5 && (
                        <div className="text-[10px] text-muted-foreground">+{taxDocIds.length - 5} more document(s)</div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </motion.div>

        {/* Tax Document Search Results */}
        {showTaxDocResults && taxDocChunks.length > 0 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    Tax Document Results
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setShowTaxDocResults(false)} className="h-5 text-[10px]">
                    <X className="w-3 h-3" />
                  </Button>
                </div>
                <CardDescription className="text-[10px]">{taxDocChunks.length} tax-relevant chunks found</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[250px]">
                  <div className="space-y-2">
                    {taxDocChunks.map((chunk, i) => (
                      <div key={i} className="p-2 rounded-lg border border-border bg-muted/30">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Badge variant="secondary" className="text-[8px] h-3.5">#{i + 1}</Badge>
                          <Badge variant="outline" className="text-[8px] h-3.5">Score: {chunk.score}</Badge>
                          {chunk.section && (
                            <Badge variant="outline" className="text-[8px] h-3.5">{chunk.section}</Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-relaxed break-words">
                          {chunk.content.slice(0, 200)}{chunk.content.length > 200 ? '...' : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Offline Tax Response Generator

function generateOfflineTaxResponse(question: string): string {
  const q = question.toLowerCase();

  // Reuse the simulation response for known topics, but add an offline note
  const baseResponse = generateSimulationResponse(question);

  // For unrecognized questions, provide generic offline help
  if (baseResponse.includes('I understand your question about:')) {
    // Provide structured offline guidance instead
    let response = `📝 **Offline Tax Guidance**\n\n`;
    response += `I can help with the following without an API key:\n\n`;

    if (q.includes('save') || q.includes('saving') || q.includes('reduce') || q.includes('minimize')) {
      response += `💡 **Tax Saving Tips (FY 2024-25):**\n\n`;
      response += `**Old Regime (with deductions):**\n`;
      response += `• Maximize 80C: ₹1,50,000 (PPF, ELSS, LIC, EPF, NSC, home loan principal)\n`;
      response += `• Section 80D: ₹25,000 (₹50,000 for seniors) for health insurance\n`;
      response += `• NPS u/s 80CCD(1B): Additional ₹50,000 deduction\n`;
      response += `• HRA exemption if you're salaried and paying rent\n`;
      response += `• Home loan interest u/s 24(b): Up to ₹2,00,000\n`;
      response += `• 80E: Education loan interest (no limit)\n`;
      response += `• 80TTA/80TTB: Savings/FD interest (₹10,000/₹50,000 for seniors)\n\n`;
      response += `**New Regime:**\n`;
      response += `• Only standard deduction of ₹50,000\n`;
      response += `• No other deductions allowed\n`;
      response += `• Best for those with minimal deductions\n`;
    } else if (q.includes('regime') || q.includes('old') || q.includes('new') || q.includes('compare') || q.includes('better')) {
      response += `⚖️ **Regime Comparison (FY 2024-25):**\n\n`;
      response += `| Feature | Old Regime | New Regime |\n|---------|-----------|------------|\n`;
      response += `| Basic Exemption | ₹2.5L (₹3L/₹5L senior) | ₹3L |\n`;
      response += `| Deductions | 80C, 80D, HRA, etc. | Only ₹50K standard |\n`;
      response += `| 87A Rebate | Taxable ≤ ₹5L → ₹12,500 | Taxable ≤ ₹7L → ₹25,000 |\n`;
      response += `| Slabs | 0/5/20/30% | 0/5/10/15/20/30% |\n\n`;
      response += `**Rule of thumb:** If total deductions > ₹2.5L, Old Regime likely saves more.\n`;
      response += `Use the Income Tax Calculator above for an exact comparison!\n`;
    } else if (q.includes('deduct') || q.includes('80c') || q.includes('80d') || q.includes('section')) {
      response += `📋 **Common Deductions Checklist (Old Regime):**\n\n`;
      response += `1. **80C (₹1.5L):** PPF, ELSS, LIC, EPF, NSC, 5-yr FD, home loan principal, tuition fees\n`;
      response += `2. **80CCD(1B) (₹50K):** NPS contribution\n`;
      response += `3. **80D (₹25K/₹50K):** Health insurance premium\n`;
      response += `4. **80E:** Education loan interest (no limit)\n`;
      response += `5. **80G:** Donations to approved charities (50%/100%)\n`;
      response += `6. **80TTA (₹10K):** Savings account interest\n`;
      response += `7. **80TTB (₹50K):** Senior citizen deposit interest\n`;
      response += `8. **24(b) (₹2L):** Home loan interest\n`;
      response += `9. **HRA:** House Rent Allowance exemption\n\n`;
      response += `⚠️ These deductions are NOT available under the New Regime.\n`;
    } else if (q.includes('gst')) {
      response += `💰 **GST Rate Reference:**\n\n`;
      response += `• **5%:** Essential food, medicines, textiles (<₹1K), transport\n`;
      response += `• **12%:** Processed food, mobile phones, business class travel\n`;
      response += `• **18%:** Most services (IT, banking, telecom), FMCG, electronics\n`;
      response += `• **28%:** Luxury cars, tobacco, cement, ACs, 5-star hotels\n`;
      response += `• **0% (Exempt):** Fresh produce, milk, bread, education, healthcare\n\n`;
      response += `Use the GST Calculator tab for specific calculations.\n`;
    } else if (q.includes('tds')) {
      response += `📄 **Common TDS Rates:**\n\n`;
      response += `• Salary (192): As per slab rates\n`;
      response += `• Professional fees (194J): 10% (threshold ₹30K)\n`;
      response += `• Contractor (194C): 1-2% (threshold ₹30K/₹1L)\n`;
      response += `• Rent (194I): 2-10% (threshold ₹1.8L/₹2.4L)\n`;
      response += `• Commission (194H): 5% (threshold ₹15K)\n`;
      response += `• Interest on FD (194A): 10% (threshold ₹40K)\n\n`;
      response += `Check the TDS Rates tab for the complete reference table.\n`;
    } else {
      response += `• **Income Tax:** Slabs, deductions, regime comparison\n`;
      response += `• **GST:** Rates, calculations, CGST/SGST/IGST\n`;
      response += `• **TDS:** Section-wise rates and thresholds\n`;
      response += `• **Deductions:** 80C, 80D, HRA, home loan interest\n\n`;
      response += `Try asking about: "tax saving tips", "regime comparison", "80C deductions", "GST rates", or "TDS on professional fees"\n\n`;
      response += `💡 Use the Income Tax, GST, and TDS calculators for instant results!\n`;
    }

    response += `\n---\n*This is a rule-based response. Add a Gemini API key for personalized, contextual advice.*`;
    return response;
  }

  return baseResponse + `\n\n---\n*This is a rule-based response. Add a Gemini API key for personalized, contextual advice.*`;
}

// Simulation Response Generator

function generateSimulationResponse(question: string): string {
  const q = question.toLowerCase();

  if (q.includes('tax liability') || q.includes('taxable') || q.includes('how much tax')) {
    return `📊 Tax Liability Estimation (FY 2024-25)

Based on your documents, here's a quick estimate:

**Old Regime (with deductions):**
• Use Section 80C (max ₹1,50,000) for PPF, ELSS, LIC
• Section 80D for health insurance (₹25,000/₹50,000)
• HRA exemption if you're salaried
• Home loan interest u/s 24(b) up to ₹2,00,000

**New Regime (simplified):**
• Only standard deduction of ₹50,000
• No other deductions allowed
• Rebate u/s 87A if taxable income ≤ ₹7,00,000

💡 Use the Income Tax Calculator above with your actual income and deductions for an accurate comparison between both regimes.

⚠️ This is a simulation. Upload your financial documents and add your API key for personalized analysis.`;
  }

  if (q.includes('80c') || q.includes('deduction') || q.includes('section 80')) {
    return `📋 Section 80C Deductions (FY 2024-25)

**Maximum deduction: ₹1,50,000**

Eligible investments:
• PPF (Public Provident Fund)
• ELSS (Equity Linked Savings Scheme)
• Life Insurance Premium
• EPF (Employee Provident Fund)
• NSC (National Savings Certificate)
• 5-year Fixed Deposits
• Home Loan Principal Repayment
• Children's Tuition Fees
• Sukanya Samriddhi Yojana
• Senior Citizens Savings Scheme

**Other key deductions:**
• 80D: Health Insurance (₹25,000 / ₹50,000 for seniors)
• 80E: Education Loan Interest (no limit)
• 80G: Donations to approved charities (50%/100%)
• 80TTA: Savings Account Interest (₹10,000)
• 80TTB: Senior Citizen Interest (₹50,000)
• 24(b): Home Loan Interest (₹2,00,000)

⚠️ Old Regime only. New Regime doesn't allow these deductions.`;
  }

  if (q.includes('gst') && (q.includes('restaurant') || q.includes('food'))) {
    return `🍽️ GST on Restaurant Services

• Non-AC restaurants: 5% GST (no ITC)
• AC/restaurants with liquor: 18% GST
• 5-star hotels: 18% GST
• Delivery apps (Swiggy/Zomato): 5% GST on restaurant portion
• Outdoor catering / events: 18% GST

Note: Restaurants with turnover up to ₹1.5 Cr can opt for composition scheme at 5%.
⚠️ Rates subject to change per GST Council decisions.`;
  }

  if (q.includes('gst')) {
    return `💰 GST Rate Reference (FY 2024-25)

**5% GST:** Essential food, medicines, textiles (<₹1,000), transport
**12% GST:** Processed food, mobile phones, business class travel
**18% GST:** Most services (IT, banking, telecom), FMCG, electronics
**28% GST:** Luxury cars, tobacco, cement, ACs, 5-star hotels

Use the GST Calculator above for specific calculations with CGST/SGST/IGST split.

⚠️ Some items are exempt (0%): Fresh produce, milk, bread, education, healthcare.`;
  }

  if (q.includes('tds') || q.includes('professional fee')) {
    return `📄 TDS on Professional Fees

**Section 194J:** TDS @ 10% on professional/technical fees
• Threshold: ₹30,000 per financial year
• Applies to: Legal, medical, engineering, architectural, accounting, consulting
• No PAN → TDS @ 20%
• Call center services: Special rate of 2%

Use the TDS Rates tab for a complete searchable reference table.

⚠️ Surcharge + 4% Health & Education Cess applicable over TDS.`;
  }

  if (q.includes('regime') || q.includes('old vs new') || q.includes('compare')) {
    return `⚖️ Old vs New Tax Regime Comparison (FY 2024-25)

**Old Regime — Best if you have deductions:**
• Slabs: 0% / 5% / 20% / 30%
• Basic exemption: ₹2.5L (₹3L senior, ₹5L super senior)
• All deductions allowed (80C, 80D, HRA, etc.)
• Rebate u/s 87A: taxable income ≤ ₹5L

**New Regime — Best if minimal deductions:**
• Slabs: 0% / 5% / 10% / 15% / 20% / 30%
• Basic exemption: ₹3L
• Only ₹50,000 standard deduction
• Rebate u/s 87A: taxable income ≤ ₹7L
• More slabs = lower rates at middle income levels

**Rule of thumb:**
• If 80C + 80D + HRA > ₹2.5L → Old Regime likely better
• If deductions < ₹1.5L → New Regime likely better

Use the Income Tax Calculator above with your actual numbers for an exact comparison!`;
  }

  return `🤔 I understand your question about: "${question}"

I can help with:
• **Income Tax:** Slabs, deductions, regime comparison
• **GST:** Rates, calculations, CGST/SGST/IGST
• **TDS:** Section-wise rates and thresholds
• **Investments:** 80C, 80D, ELSS, PPF guidance

For personalized answers based on your financial documents, add your Gemini API key in Settings.

💡 Try the calculators above for instant, accurate results!`;
}
