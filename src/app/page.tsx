'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Search, FileSearch, Sparkles, TrendingUp, Shield,
  BarChart3, Zap, ArrowRight,
  Activity, CheckCircle2, AlertCircle, Cpu, Database,
  Layers, Network, Send, Terminal,
  Upload, FileText, Trash2, Loader2, Download, Scan,
  FolderOpen, BookOpen, LayoutDashboard,
  AlertTriangle, RefreshCw, Code2, Copy, Check,
  FileCheck, Scale, Gauge, CircleDot,
  Key, Eye, EyeOff, Play, FlaskConical, Monitor, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  BarChart, Bar, CartesianGrid, PieChart, Pie, Cell,
} from 'recharts';

/* ═══════════════════════ Types ═══════════════════════ */

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

interface ChunkInfo {
  id: string;
  documentId: string;
  content: string;
  chunkIndex: number;
  section: string | null;
  wordCount: number;
  charCount: number;
}

interface AgentStep {
  agent: string;
  status: string;
  duration: number;
  output: string;
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

interface QueryMetrics {
  chunksSearched: number;
  chunksRetrieved: number;
  retrievalMs: number;
  synthesisMs: number;
  totalLatencyMs: number;
  confidenceScore: number;
}

type AppMode = 'demo' | 'test';

/* ═══════════════════════ Constants ═══════════════════════ */

const EMERALD = '#059669';
const EMERALD_LIGHT = '#10b981';

const PERFORMANCE_DATA = [
  { name: 'Jan', queries: 1200, accuracy: 88, latency: 890 },
  { name: 'Feb', queries: 1800, accuracy: 90, latency: 720 },
  { name: 'Mar', queries: 2400, accuracy: 91, latency: 650 },
  { name: 'Apr', queries: 2100, accuracy: 92, latency: 580 },
  { name: 'May', queries: 3200, accuracy: 93, latency: 510 },
  { name: 'Jun', queries: 3800, accuracy: 94, latency: 470 },
  { name: 'Jul', queries: 4200, accuracy: 95, latency: 430 },
];

const SAMPLE_QUERIES = [
  'What are the key risk factors identified across all documents?',
  'What is the revenue growth and forward guidance for Tesla?',
  'Are there any compliance or regulatory issues at Goldman Sachs?',
  'What cybersecurity risks are disclosed across the portfolio?',
  'Identify any material weaknesses in internal controls',
  'What is the credit risk and liquidity position at JP Morgan?',
  'Summarize operational risk events and their financial impact',
  'What are the sanctions and anti-corruption investigation details?',
];

const SEVERITY_CONFIG = {
  critical: { color: 'bg-red-500', text: 'text-red-600', border: 'border-red-500/30', bg: 'bg-red-500/5', label: 'CRITICAL' },
  high: { color: 'bg-orange-500', text: 'text-orange-600', border: 'border-orange-500/30', bg: 'bg-orange-500/5', label: 'HIGH' },
  medium: { color: 'bg-yellow-500', text: 'text-yellow-600', border: 'border-yellow-500/30', bg: 'bg-yellow-500/5', label: 'MEDIUM' },
  low: { color: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-500/30', bg: 'bg-blue-500/5', label: 'LOW' },
};

/* ═══════════════════════ Pre-loaded Demo Documents ═══════════════════════ */

const DEMO_DOCUMENTS: DocInfo[] = [
  {
    id: 'demo-tesla-10k',
    title: 'Tesla Inc. — 2024 Annual Report (10-K)',
    filename: 'tesla_2024_10k.txt',
    docType: '10k',
    sector: 'Automotive & Technology',
    wordCount: 487,
    chunkCount: 6,
    status: 'chunked',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-goldman-earnings',
    title: 'Goldman Sachs — Q4 2024 Earnings Release',
    filename: 'goldman_sachs_q4_2024.txt',
    docType: 'earnings',
    sector: 'Financial Services',
    wordCount: 412,
    chunkCount: 5,
    status: 'chunked',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-jpmorgan-risk',
    title: 'JP Morgan — 2024 Risk Assessment Report',
    filename: 'jpmorgan_2024_risk.txt',
    docType: 'risk_assessment',
    sector: 'Financial Services',
    wordCount: 520,
    chunkCount: 6,
    status: 'chunked',
    createdAt: new Date().toISOString(),
  },
];

const DEMO_CHUNKS: ChunkInfo[] = [
  // Tesla chunks
  { id: 'tc1', documentId: 'demo-tesla-10k', content: 'Tesla, Inc. was incorporated in the State of Delaware on July 1, 2003. We design, develop, manufacture and sell high-performance fully electric vehicles and energy generation and storage systems. As of December 31, 2024, we produced our vehicles at our manufacturing facilities in Fremont, California; Austin, Texas; Shanghai, China; and Berlin, Germany. Revenue for the year ended December 31, 2024 was $96.8 billion, representing an increase of 18% compared to the prior year. Automotive revenues were $78.5 billion, an increase of 15% from 2023. Energy generation and storage revenues were $14.2 billion, an increase of 67% year-over-year.', chunkIndex: 0, section: 'ITEM 1. BUSINESS', wordCount: 82, charCount: 520 },
  { id: 'tc2', documentId: 'demo-tesla-10k', content: 'You should carefully consider the risks described below. We may be subject to legal proceedings, claims and litigation arising in the ordinary course of business, including product liability claims, warranty claims, consumer protection matters, intellectual property matters and employment matters. We may also be subject to governmental investigations and enforcement actions that may adversely affect our business, financial condition, results of operations or cash flows.', chunkIndex: 1, section: 'ITEM 1A. RISK FACTORS', wordCount: 58, charCount: 380 },
  { id: 'tc3', documentId: 'demo-tesla-10k', content: 'We have identified a material weakness in our internal control over financial reporting related to the design and operating effectiveness of controls over the accuracy and completeness of certain accounting entries and processes. While we are implementing remediation measures, there can be no assurance that our remediation efforts will be successful.', chunkIndex: 2, section: 'ITEM 1A. RISK FACTORS', wordCount: 48, charCount: 320 },
  { id: 'tc4', documentId: 'demo-tesla-10k', content: 'Our business could be adversely affected by cybersecurity incidents, such as ransomware attacks, data breaches, or other security incidents involving our information technology systems or those of our third-party service providers. Interest rate risk remains a significant factor. A 100 basis point parallel shift in interest rates would result in an estimated $2.8 billion impact on our fixed-income portfolio. Currency risk from our international operations also exposes us to foreign exchange fluctuations.', chunkIndex: 3, section: 'ITEM 1A. RISK FACTORS', wordCount: 63, charCount: 410 },
  { id: 'tc5', documentId: 'demo-tesla-10k', content: 'Total automotive revenues increased $10.2 billion, or 15%, in 2024 compared to 2023. This increase was primarily due to an increase in total vehicle deliveries, partially offset by a decrease in average selling price. We delivered approximately 1.81 million vehicles in 2024, representing an increase of 7% from 2023. Energy storage deployments reached 31.4 GWh in 2024, representing an increase of 113% from 2023. Gross margin decreased from 18.2% in 2023 to 17.1% in 2024.', chunkIndex: 4, section: 'ITEM 7. MD&A', wordCount: 72, charCount: 470 },
  { id: 'tc6', documentId: 'demo-tesla-10k', content: 'We are not in compliance with certain covenants under our credit agreement related to financial reporting deadlines. While we are in discussions with our lenders regarding a waiver, there can be no assurance that such waiver will be obtained on favorable terms, or at all. Forward Guidance: For 2025, we expect vehicle deliveries to grow by 20-25%, energy storage deployments to grow by at least 50%, and total revenue to exceed $110 billion. We anticipate achieving a full-year gross margin of approximately 18-19%.', chunkIndex: 5, section: 'ITEM 7. MD&A', wordCount: 70, charCount: 460 },

  // Goldman Sachs chunks
  { id: 'gc1', documentId: 'demo-goldman-earnings', content: 'Net revenues for the fourth quarter of 2024 were $13.9 billion, 23% higher than the fourth quarter of 2023 and 8% higher than the third quarter of 2024. Net earnings for the fourth quarter of 2024 were $4.1 billion, an increase of 105% compared to the fourth quarter of 2023. Net revenues for the full year 2024 were $53.2 billion, 16% higher than 2023. Net earnings for the full year 2024 were $15.3 billion, 68% higher than 2023.', chunkIndex: 0, section: 'Q4 2024 EARNINGS', wordCount: 72, charCount: 470 },
  { id: 'gc2', documentId: 'demo-goldman-earnings', content: 'Net revenues in Global Banking & Markets were $33.9 billion for 2024, 24% higher than 2023. Investment Banking revenues were $8.2 billion, 24% higher than 2023. FICC revenues were $14.8 billion, essentially unchanged compared to 2023. Equities revenues were $10.9 billion, 21% higher than 2023. Diluted earnings per common share were $42.14 for 2024, compared to $25.39 for 2023. The annualized return on average common shareholders\' equity was 14.3%.', chunkIndex: 1, section: 'GLOBAL BANKING & MARKETS', wordCount: 72, charCount: 460 },
  { id: 'gc3', documentId: 'demo-goldman-earnings', content: 'We are subject to credit risk from counterparty defaults, which may increase during periods of economic uncertainty or market disruption. Our credit risk exposure is concentrated in financial institutions, sovereign entities, and corporate borrowers. As of December 2024, our total credit exposure was $187 billion. Interest rate risk remains a significant factor affecting our net interest income and the value of our fixed-income portfolios.', chunkIndex: 2, section: 'RISK FACTORS', wordCount: 56, charCount: 370 },
  { id: 'gc4', documentId: 'demo-goldman-earnings', content: 'We are subject to ongoing regulatory investigations by the SEC, CFTC, and other governmental authorities related to our trading practices, compliance with sanctions regulations, and anti-money laundering controls. Our operations are subject to anti-corruption laws, including the FCPA and UK Bribery Act. We have identified certain transactions in our Asia-Pacific operations that may have violated these laws and have voluntarily disclosed these matters to regulators.', chunkIndex: 3, section: 'RISK FACTORS', wordCount: 62, charCount: 410 },
  { id: 'gc5', documentId: 'demo-goldman-earnings', content: 'Cybersecurity risk continues to be a significant concern. We experienced a data breach in Q3 2024 affecting approximately 12,000 client accounts. We identified a related party transaction with an affiliated entity totaling $340 million that was not properly disclosed in prior period financial statements. We have restated our previously issued financial results to correct this disclosure. Our Liquidity Coverage Ratio was 128% as of December 2024, above the 100% regulatory minimum but below our internal target of 135%.', chunkIndex: 4, section: 'RISK FACTORS', wordCount: 70, charCount: 470 },

  // JP Morgan chunks
  { id: 'jc1', documentId: 'demo-jpmorgan-risk', content: 'This report provides a comprehensive assessment of the principal risks facing JP Morgan Chase as of December 31, 2024. Total credit exposure was $1.2 trillion as of December 2024. Our allowance for credit losses was $22.3 billion, representing 1.86% of total loans. The firm\'s credit risk profile has improved modestly over the past year, with non-performing loans declining by 8% to $12.1 billion.', chunkIndex: 0, section: 'CREDIT RISK', wordCount: 58, charCount: 380 },
  { id: 'jc2', documentId: 'demo-jpmorgan-risk', content: 'Credit risk concentration remains elevated in commercial real estate (CRE), where we have $178 billion in total exposure. CRE loan delinquencies increased to 3.2% from 2.1% in the prior year, reflecting stress in the office and retail segments. We have increased our CRE-specific reserve by $1.8 billion to $5.6 billion.', chunkIndex: 1, section: 'CREDIT RISK', wordCount: 46, charCount: 310 },
  { id: 'jc3', documentId: 'demo-jpmorgan-risk', content: 'Value-at-Risk (VaR) at the 99% confidence level was $98 million as of December 2024, compared to $87 million at year-end 2023. The increase reflects higher volatility in interest rate and credit spreads. Our stress testing indicates potential trading losses of up to $18 billion under severely adverse scenarios. A 200 basis point parallel increase in rates would reduce net interest income by approximately $5.4 billion over the next 12 months.', chunkIndex: 2, section: 'MARKET RISK', wordCount: 68, charCount: 450 },
  { id: 'jc4', documentId: 'demo-jpmorgan-risk', content: 'We continue to face significant operational risk from cybersecurity threats, technology failures, and compliance breaches. During 2024, we experienced 14 significant operational loss events totaling $892 million, including a technology failure in payments processing that resulted in $340 million in remediation costs, a data breach affecting 28,000 customer accounts, and regulatory fines of $198 million related to deficiencies in our anti-money laundering monitoring systems.', chunkIndex: 3, section: 'OPERATIONAL RISK', wordCount: 62, charCount: 410 },
  { id: 'jc5', documentId: 'demo-jpmorgan-risk', content: 'We are currently subject to 23 active regulatory investigations and enforcement proceedings. Sanctions compliance: We identified potential violations of OFAC sanctions regulations in our correspondent banking division. Anti-corruption: Our operations in three countries are under investigation for potential violations of the Foreign Corrupt Practices Act (FCPA). Market manipulation: We are defending against allegations of market manipulation in our precious metals trading desk. The aggregate potential financial exposure is estimated at $2.8-4.2 billion.', chunkIndex: 4, section: 'REGULATORY AND COMPLIANCE RISK', wordCount: 72, charCount: 490 },
  { id: 'jc6', documentId: 'demo-jpmorgan-risk', content: 'We have identified climate-related financial risk as a growing concern. Our financed emissions portfolio totals approximately 340 million tonnes of CO2 equivalent. Physical risk exposure to climate events is concentrated in our mortgage and CRE portfolios in coastal regions, with estimated potential losses of $8-12 billion under severe climate scenarios over the next decade. For 2025, we anticipate credit costs to increase by 15-20% driven primarily by CRE deterioration.', chunkIndex: 5, section: 'CLIMATE AND ESG RISK', wordCount: 66, charCount: 450 },
];

/* ═══════════════════════ RAG Utilities (Client-Side) ═══════════════════════ */

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for',
  'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
  'before', 'after', 'above', 'below', 'between', 'out', 'off', 'over',
  'under', 'again', 'further', 'then', 'once', 'and', 'but', 'or', 'nor',
  'not', 'so', 'yet', 'both', 'either', 'neither', 'each', 'every', 'all',
  'any', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'only',
  'own', 'same', 'than', 'too', 'very', 'just', 'because', 'if', 'when',
  'where', 'how', 'what', 'which', 'who', 'whom', 'this', 'that', 'these',
  'those', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'him',
  'his', 'she', 'her', 'it', 'its', 'they', 'them', 'their',
]);

function extractTerms(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

function scoreChunksByRelevance(
  query: string,
  chunks: ChunkInfo[],
  topK: number = 8
): (ChunkInfo & { score: number })[] {
  const queryTerms = extractTerms(query);
  if (queryTerms.length === 0) return chunks.slice(0, topK).map(c => ({ ...c, score: 0 }));

  const df: Record<string, number> = {};
  const totalDocs = chunks.length;

  for (const term of queryTerms) {
    df[term] = 0;
    for (const chunk of chunks) {
      if (chunk.content.toLowerCase().includes(term)) {
        df[term]++;
      }
    }
  }

  const scored = chunks.map(chunk => {
    const chunkTerms = extractTerms(chunk.content);
    const chunkTermFreq: Record<string, number> = {};
    for (const t of chunkTerms) {
      chunkTermFreq[t] = (chunkTermFreq[t] || 0) + 1;
    }

    let score = 0;
    for (const qt of queryTerms) {
      const tf = chunkTermFreq[qt] || 0;
      const idf = Math.log((totalDocs + 1) / ((df[qt] || 0) + 1)) + 1;
      score += tf * idf;
    }

    if (chunk.section) {
      for (const qt of queryTerms) {
        if (chunk.section.toLowerCase().includes(qt)) {
          score *= 1.5;
        }
      }
    }

    const normalizedScore = score / Math.max(Math.sqrt(chunkTerms.length), 1);
    return { ...chunk, score: normalizedScore };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, topK);
}

function chunkText(
  text: string,
  maxChunkSize = 800,
  minChunkSize = 80,
  overlapSize = 60
): Omit<ChunkInfo, 'id' | 'documentId'>[] {
  if (!text || text.trim().length === 0) return [];
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const chunks: Omit<ChunkInfo, 'id' | 'documentId'>[] = [];
  let currentChunk = '';
  let chunkIndex = 0;
  let currentSection: string | null = null;

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    const sectionMatch = trimmed.match(/^(?:ITEM\s+\d+|PART\s+[IVX]+|SECTION\s+\d+|CHAPTER\s+\d+|[A-Z][A-Z\s]{3,})/);
    if (sectionMatch) {
      if (currentChunk.trim().length >= minChunkSize) {
        const words = currentChunk.trim().split(/\s+/).filter(w => w.length > 0);
        chunks.push({
          content: currentChunk.trim(),
          chunkIndex,
          section: currentSection,
          wordCount: words.length,
          charCount: currentChunk.trim().length,
        });
        chunkIndex++;
        const overlapWords = currentChunk.trim().split(/\s+/).slice(-overlapSize).join(' ');
        currentChunk = overlapWords + '\n\n' + trimmed;
      } else {
        currentChunk = currentChunk ? currentChunk + '\n\n' + trimmed : trimmed;
      }
      currentSection = sectionMatch[0];
    } else if ((currentChunk.length + trimmed.length) > maxChunkSize && currentChunk.trim().length >= minChunkSize) {
      const words = currentChunk.trim().split(/\s+/).filter(w => w.length > 0);
      chunks.push({
        content: currentChunk.trim(),
        chunkIndex,
        section: currentSection,
        wordCount: words.length,
        charCount: currentChunk.trim().length,
      });
      chunkIndex++;
      const overlapWords = currentChunk.trim().split(/\s+/).slice(-overlapSize).join(' ');
      currentChunk = overlapWords + '\n\n' + trimmed;
    } else {
      currentChunk = currentChunk ? currentChunk + '\n\n' + trimmed : trimmed;
    }
  }

  if (currentChunk.trim().length > 0) {
    const words = currentChunk.trim().split(/\s+/).filter(w => w.length > 0);
    chunks.push({
      content: currentChunk.trim(),
      chunkIndex,
      section: currentSection,
      wordCount: words.length,
      charCount: currentChunk.trim().length,
    });
  }

  return chunks;
}

/* ═══════════════════════ Compliance Scanner ═══════════════════════ */

const COMPLIANCE_PATTERNS: {
  category: string;
  patterns: { regex: RegExp; severity: ComplianceFinding['severity']; description: string; reference: string }[];
}[] = [
  {
    category: 'Risk Disclosure',
    patterns: [
      { regex: /may\s+(?:adversely\s+)?affect\s+(?:our\s+)?(?:business|results|financial|operations)/i, severity: 'high', description: 'General risk factor identified', reference: 'SEC Reg S-K Item 105' },
      { regex: /subject\s+to\s+(?:various\s+)?(?:legal|regulatory|governmental)\s+(?:proceedings|actions|investigations)/i, severity: 'critical', description: 'Legal/regulatory proceeding detected', reference: 'SEC Reg S-K Item 103' },
      { regex: /(?:material\s+)?weakness(?:es)?\s+(?:in\s+)?(?:our\s+)?internal\s+control/i, severity: 'critical', description: 'Internal control weakness disclosed', reference: 'SOX Section 404' },
    ],
  },
  {
    category: 'Financial Reporting',
    patterns: [
      { regex: /restat(?:e|ed|ement|ing)\s+(?:of\s+)?(?:our\s+)?(?:previously\s+)?(?:issued\s+)?financial/i, severity: 'critical', description: 'Financial restatement indicated', reference: 'SEC Form 8-K Item 4.02' },
      { regex: /(?:impairment|write-?down|write-?off)\s+(?:charge|loss|expense)/i, severity: 'high', description: 'Impairment charge identified', reference: 'ASC 360-10' },
      { regex: /(?:related\s+party|affiliated?\s+entity)\s+(?:transaction|relationship)/i, severity: 'medium', description: 'Related party transaction identified', reference: 'ASC 850' },
    ],
  },
  {
    category: 'Regulatory Compliance',
    patterns: [
      { regex: /not\s+in\s+compliance\s+with/i, severity: 'high', description: 'Covenant compliance issue', reference: 'Credit Agreement' },
      { regex: /(?:sanctions|embargo|ofac)/i, severity: 'critical', description: 'Sanctions reference detected', reference: 'OFAC / International Sanctions' },
      { regex: /(?:anti-?corruption|fcpa|bribery)/i, severity: 'critical', description: 'Anti-corruption reference detected', reference: 'FCPA / UK Bribery Act' },
      { regex: /(?:data\s+breach|cyber)/i, severity: 'high', description: 'Cybersecurity risk identified', reference: 'SEC Cyber Disclosure Rules' },
    ],
  },
  {
    category: 'Market Risk',
    patterns: [
      { regex: /(?:interest\s+rate|currency|foreign\s+exchange)\s+risk/i, severity: 'medium', description: 'Market risk factor identified', reference: 'SEC Reg S-K Item 305' },
      { regex: /(?:credit\s+risk|counterparty\s+risk|default\s+risk)/i, severity: 'high', description: 'Credit risk exposure identified', reference: 'Basel III / CCAR' },
      { regex: /liquidity\s+risk/i, severity: 'high', description: 'Liquidity risk identified', reference: 'Basel III LCR' },
    ],
  },
];

function scanForCompliance(chunks: ChunkInfo[]): ComplianceFinding[] {
  const findings: ComplianceFinding[] = [];
  for (const chunk of chunks) {
    for (const category of COMPLIANCE_PATTERNS) {
      for (const pattern of category.patterns) {
        const match = chunk.content.match(pattern.regex);
        if (match) {
          const matchIndex = match.index || 0;
          const start = Math.max(0, matchIndex - 60);
          const end = Math.min(chunk.content.length, matchIndex + match[0].length + 60);
          const excerpt = (start > 0 ? '...' : '') + chunk.content.slice(start, end) + (end < chunk.content.length ? '...' : '');
          findings.push({
            category: category.category,
            severity: pattern.severity,
            description: pattern.description,
            reference: pattern.reference,
            chunkIndex: chunk.chunkIndex,
            excerpt,
          });
        }
      }
    }
  }
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  findings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  return findings;
}

/* ═══════════════════════ Colab Code ═══════════════════════ */

const COLAB_CODE = `# ╔══════════════════════════════════════════════════════════════╗
# ║  NEXUS — Agentic RAG for Finance | Google Colab Notebook   ║
# ╚══════════════════════════════════════════════════════════════╝

!pip install -q google-generativeai requests pandas matplotlib

import google.generativeai as genai
import json, re, math, time
import pandas as pd
import matplotlib.pyplot as plt

# ─── Step 1: Configure Gemini API ───────────────────────────
GEMINI_KEY = input("Enter your Gemini API key: ").strip()
genai.configure(api_key=GEMINI_KEY)
model = genai.GenerativeModel('gemini-2.0-flash')
print("✓ Gemini API configured")

# ─── Step 2: Load Sample Financial Documents ────────────────
documents = [
    {"title": "Tesla 10-K 2024", "type": "10-K",
     "content": "Revenue was $96.8B (+18% YoY). Automotive $78.5B (+15%). Energy $14.2B (+67%). Material weakness in internal controls. Cybersecurity risk. Interest rate risk: $2.8B impact per 100bp shift. Forward: 2025 revenue >$110B, deliveries +20-25%."},
    {"title": "Goldman Sachs Q4 2024", "type": "Earnings",
     "content": "Q4 revenue $13.9B (+23% YoY). FY revenue $53.2B (+16%). Net earnings $15.3B (+68%). EPS $42.14. Credit exposure $187B. SEC/CFTC investigations. FCPA violations in Asia-Pacific. Data breach affecting 12K accounts. LCR 128% (target 135%)."},
    {"title": "JP Morgan Risk 2024", "type": "Risk Assessment",
     "content": "Credit exposure $1.2T. CRE delinquencies 3.2% (up from 2.1%). VaR $98M. 23 active regulatory investigations. OFAC sanctions violations. FCPA investigations in 3 countries. Operational losses $892M. Climate risk: $8-12B potential losses."},
]

# ─── Step 3: Chunking Engine ────────────────────────────────
def chunk_text(text, max_size=800, overlap=60):
    paragraphs = [p.strip() for p in text.split('\\n\\n') if p.strip()]
    chunks = []
    current = ""
    for para in paragraphs:
        if len(current) + len(para) > max_size and len(current) > 80:
            chunks.append(current)
            words = current.split()
            current = " ".join(words[-overlap:]) + "\\n\\n" + para
        else:
            current = current + "\\n\\n" + para if current else para
    if current.strip():
        chunks.append(current)
    return chunks

all_chunks = []
for doc in documents:
    chunks = chunk_text(doc["content"])
    for i, chunk in enumerate(chunks):
        all_chunks.append({"doc": doc["title"], "index": i, "content": chunk})
print(f"✓ Loaded {len(documents)} documents, {len(all_chunks)} chunks")

# ─── Step 4: TF-IDF Retrieval ──────────────────────────────
def tfidf_score(query, chunk_text):
    q_terms = set(re.findall(r'[a-z]{3,}', query.lower()))
    c_terms = re.findall(r'[a-z]{3,}', chunk_text.lower())
    if not q_terms: return 0
    score = sum(c_terms.count(t) for t in q_terms)
    return score / max(len(c_terms) ** 0.5, 1)

def retrieve(query, top_k=5):
    scored = [(tfidf_score(query, c["content"]), c) for c in all_chunks]
    scored.sort(key=lambda x: -x[0])
    return scored[:top_k]

# ─── Step 5: RAG Query Pipeline ─────────────────────────────
def rag_query(question):
    t0 = time.time()
    results = retrieve(question)
    retrieval_ms = int((time.time() - t0) * 1000)

    context = "\\n---\\n".join(
        f"[Source: {r[1]['doc']} | Chunk {r[1]['index']} | Score: {r[0]:.2f}]\\n{r[1]['content']}"
        for r in results if r[0] > 0
    )

    t1 = time.time()
    prompt = f"""You are NEXUS, a financial intelligence analyst. Analyze the following document excerpts and answer the query with citations.

QUERY: {question}

DOCUMENT EXCERPTS:
{context}

Provide:
- **Key Findings**: Main insights with citations [Source X]
- **Evidence**: Specific data points
- **Risk Assessment**: Any risks identified
- **Limitations**: What's not covered"""

    response = model.generate_content(prompt)
    synthesis_ms = int((time.time() - t1) * 1000)

    print("\\n" + "="*60)
    print("NEXUS ANALYSIS OUTPUT")
    print("="*60)
    print(response.text)
    print("\\n" + "="*60)
    print("PIPELINE METRICS")
    print("="*60)
    print(f"  Retrieval:    {retrieval_ms}ms")
    print(f"  Synthesis:    {synthesis_ms}ms")
    print(f"  Total:        {retrieval_ms + synthesis_ms}ms")
    print(f"  Sources used: {len([r for r in results if r[0] > 0])}")
    return response.text

# ─── Step 6: Run Demo Queries ───────────────────────────────
queries = [
    "What are the key risk factors across documents?",
    "What is Tesla's revenue growth and forward guidance?",
    "What compliance issues exist at Goldman Sachs?",
    "What are the sanctions and FCPA investigation details?",
]

for q in queries:
    print(f"\\n>>> {q}")
    rag_query(q)
    print("\\n" + "-"*60)

# ─── Step 7: Compliance Scanner ─────────────────────────────
patterns = [
    ("Material Weakness", r"material weakness", "SOX 404"),
    ("Sanctions", r"(?:sanctions|ofac)", "OFAC"),
    ("FCPA", r"(?:fcpa|anti-?corruption|bribery)", "FCPA"),
    ("Data Breach", r"data breach", "SEC Cyber Rules"),
    ("Interest Rate Risk", r"interest rate risk", "SEC 305"),
    ("Restatement", r"restat", "SEC 8-K 4.02"),
]

findings = []
for chunk in all_chunks:
    for name, pattern, ref in patterns:
        if re.search(pattern, chunk["content"], re.I):
            findings.append({"finding": name, "ref": ref, "source": chunk["doc"]})

print("\\n" + "="*60)
print("COMPLIANCE SCAN RESULTS")
print("="*60)
for f in findings:
    print(f"  ⚠ {f['finding']} [{f['ref']}] — {f['source']}")
print(f"\\nTotal findings: {len(findings)}")
`;

/* ═══════════════════════ Gemini API Key Input ═══════════════════════ */

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

function Navigation({
  activeTab,
  onTabChange,
  appMode,
  onModeChange,
  apiKey,
  setApiKey,
}: {
  activeTab: string;
  onTabChange: (t: string) => void;
  appMode: AppMode;
  onModeChange: (m: AppMode) => void;
  apiKey: string;
  setApiKey: (k: string) => void;
}) {
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

/* ═══════════════════════ Dashboard ═══════════════════════ */

function DashboardView({
  documents,
  chunks,
  queryCount,
  appMode,
}: {
  documents: DocInfo[];
  chunks: ChunkInfo[];
  queryCount: number;
  appMode: AppMode;
}) {
  const totalChunks = chunks.length;
  const totalWords = documents.reduce((a, d) => a + d.wordCount, 0);
  const byType = documents.reduce((acc, d) => { acc[d.docType] = (acc[d.docType] || 0) + 1; return acc; }, {} as Record<string, number>);
  const pieData = Object.entries(byType).map(([name, value]) => ({ name: name.replace('_', ' '), value }));
  const PIE_COLORS = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'];

  const statCards = [
    { label: 'Documents', value: documents.length, icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    { label: 'Total Chunks', value: totalChunks, icon: Layers, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
    { label: 'Total Words', value: totalWords.toLocaleString(), icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30' },
    { label: 'Queries Run', value: queryCount, icon: Brain, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/30' },
  ];

  return (
    <div className="space-y-6">
      {/* Mode banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className={`border-2 ${appMode === 'demo' ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {appMode === 'demo' ? (
                <Monitor className="w-5 h-5 text-emerald-600" />
              ) : (
                <FlaskConical className="w-5 h-5 text-amber-600" />
              )}
              <div>
                <div className="text-sm font-semibold">
                  {appMode === 'demo' ? 'Demo Mode — Pre-loaded Financial Documents' : 'Test Mode — Your Documents, Local Storage'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {appMode === 'demo'
                    ? '3 pre-indexed financial documents with 17 chunks ready for RAG queries. Add your Gemini API key for LLM-powered analysis.'
                    : 'Upload your own financial documents. Data persists in browser localStorage. Add your Gemini API key for LLM analysis.'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Query Performance
              </CardTitle>
              <CardDescription>Simulated pipeline throughput trends</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={PERFORMANCE_DATA}>
                  <defs>
                    <linearGradient id="gradQueries" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={EMERALD} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={EMERALD} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="queries" stroke={EMERALD} fillOpacity={1} fill="url(#gradQueries)" strokeWidth={2} name="Queries" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Gauge className="w-4 h-4 text-emerald-600" />
                Latency Optimization
              </CardTitle>
              <CardDescription>Average response latency (ms) over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={PERFORMANCE_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="latency" fill={EMERALD_LIGHT} radius={[4, 4, 0, 0]} name="Latency (ms)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                Document Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                      {pieData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[180px] text-muted-foreground text-sm">No documents yet</div>
              )}
              <div className="flex flex-wrap gap-3 justify-center mt-2">
                {pieData.map((entry, i) => (
                  <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="capitalize">{entry.name}</span>
                    <span className="text-muted-foreground">({entry.value})</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-600" />
                Multi-Agent Pipeline Architecture
              </CardTitle>
              <CardDescription>Agentic RAG workflow with specialized reasoning agents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { name: 'Retrieval', desc: 'TF-IDF + keyword scoring', pct: 94, icon: Database },
                  { name: 'Ranking', desc: 'Relevance normalization', pct: 91, icon: Gauge },
                  { name: 'Reasoning', desc: 'Gemini LLM synthesis', pct: 88, icon: Brain },
                  { name: 'Citation', desc: 'Source traceability', pct: 96, icon: FileCheck },
                ].map((agent, i) => (
                  <motion.div
                    key={agent.name}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + i * 0.08 }}
                    className="p-3 rounded-lg border border-border hover:border-emerald-500/30 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-md bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                        <agent.icon className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold">{agent.name}</div>
                        <div className="text-[10px] text-muted-foreground">{agent.desc}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-muted-foreground">Effectiveness</span>
                      <span className="text-[10px] font-medium text-emerald-600">{agent.pct}%</span>
                    </div>
                    <Progress value={agent.pct} className="h-1.5" />
                  </motion.div>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-[10px] gap-1"><Zap className="w-2.5 h-2.5" /> Real-time</Badge>
                <Badge variant="secondary" className="text-[10px] gap-1"><Layers className="w-2.5 h-2.5" /> Multi-source</Badge>
                <Badge variant="secondary" className="text-[10px] gap-1"><Network className="w-2.5 h-2.5" /> Agentic</Badge>
                <Badge variant="secondary" className="text-[10px] gap-1"><FileCheck className="w-2.5 h-2.5" /> Cited</Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

/* ═══════════════════════ Documents View ═══════════════════════ */

function DocumentsView({
  documents,
  chunks,
  onRefresh,
  appMode,
}: {
  documents: DocInfo[];
  chunks: ChunkInfo[];
  onRefresh: () => void;
  appMode: AppMode;
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [docType, setDocType] = useState('custom');
  const [sector, setSector] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleUpload = async () => {
    if (!title.trim() || !content.trim()) return;
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);
    try {
      const newChunks = chunkText(content);
      const docId = `test-${Date.now()}`;
      const docInfo: DocInfo = {
        id: docId,
        title: title.trim(),
        filename: `${title.trim().replace(/\s+/g, '_')}.txt`,
        docType,
        sector: sector || null,
        wordCount: content.trim().split(/\s+/).filter(w => w).length,
        chunkCount: newChunks.length,
        status: 'chunked',
        createdAt: new Date().toISOString(),
      };

      const chunkInfos: ChunkInfo[] = newChunks.map((c, i) => ({
        ...c,
        id: `${docId}-chunk-${i}`,
        documentId: docId,
      }));

      // Save to localStorage
      const existingDocs = JSON.parse(localStorage.getItem('nexus-docs') || '[]');
      const existingChunks = JSON.parse(localStorage.getItem('nexus-chunks') || '[]');
      localStorage.setItem('nexus-docs', JSON.stringify([...existingDocs, docInfo]));
      localStorage.setItem('nexus-chunks', JSON.stringify([...existingChunks, ...chunkInfos]));

      setTitle('');
      setContent('');
      setDocType('custom');
      setSector('');
      setUploadSuccess(true);
      onRefresh();
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const existingDocs = JSON.parse(localStorage.getItem('nexus-docs') || '[]');
      const existingChunks = JSON.parse(localStorage.getItem('nexus-chunks') || '[]');
      localStorage.setItem('nexus-docs', JSON.stringify(existingDocs.filter((d: DocInfo) => d.id !== id)));
      localStorage.setItem('nexus-chunks', JSON.stringify(existingChunks.filter((c: ChunkInfo) => c.documentId !== id)));
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload form - only in test mode */}
      {appMode === 'test' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="w-4 h-4 text-emerald-600" />
              Upload Financial Document
            </CardTitle>
            <CardDescription>
              Paste financial document text. The system will automatically chunk and index it for RAG retrieval. Stored in your browser localStorage.
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="text-xs font-medium mb-1.5 block">Document Title</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Apple 10-K 2024" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block">Type</label>
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
                <label className="text-xs font-medium mb-1.5 block">Sector (optional)</label>
                <Input value={sector} onChange={(e) => setSector(e.target.value)} placeholder="e.g., Technology" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block">Document Content</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste financial document text here..."
                className="min-h-[180px] font-mono text-xs"
              />
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[11px] text-muted-foreground">{content.split(/\s+/).filter((w) => w).length} words</span>
                <span className="text-[11px] text-muted-foreground">{content.length.toLocaleString()} characters</span>
              </div>
            </div>
            <Button onClick={handleUpload} disabled={isUploading || !title.trim() || !content.trim()} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {isUploading ? 'Processing...' : 'Upload & Chunk'}
            </Button>
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
              <RefreshCw className="w-3 h-3" /> Refresh
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
            <ScrollArea className="max-h-[400px]">
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

/* ═══════════════════════ Query View ═══════════════════════ */

function QueryView({
  documents,
  chunks,
  onQueryComplete,
  apiKey,
}: {
  documents: DocInfo[];
  chunks: ChunkInfo[];
  onQueryComplete: () => void;
  apiKey: string;
}) {
  const [query, setQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<QueryMetrics | null>(null);
  const [citedChunks, setCitedChunks] = useState<CitedChunk[]>([]);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(false);

  const runAnalysis = useCallback(
    async (queryText: string) => {
      if (!queryText.trim()) return;
      abortRef.current = false;
      setIsAnalyzing(true);
      setResult(null);
      setMetrics(null);
      setCitedChunks([]);
      setError(null);

      const startTime = Date.now();
      setAgentSteps([
        { agent: 'Retrieval Agent', status: 'running', duration: 0, output: 'Searching document chunks...' },
        { agent: 'Ranking Agent', status: 'pending', duration: 0, output: '' },
        { agent: 'Reasoning Agent', status: 'pending', duration: 0, output: '' },
        { agent: 'Synthesis Agent', status: 'pending', duration: 0, output: '' },
      ]);

      try {
        // Agent 1: Retrieval
        const retrievalStart = Date.now();
        const allChunks = chunks;
        if (allChunks.length === 0) {
          throw new Error('No documents available. Upload documents first or switch to Demo mode.');
        }
        setAgentSteps(prev => prev.map((s, i) => i === 0 ? { ...s, status: 'completed', duration: Date.now() - retrievalStart, output: `Found ${allChunks.length} chunks across ${documents.length} documents` } : s));

        // Agent 2: Ranking
        const rankingStart = Date.now();
        const topChunks = scoreChunksByRelevance(queryText, allChunks, 8);
        const relevantChunks = topChunks.filter(c => c.score > 0);
        const finalChunks = relevantChunks.length > 0 ? relevantChunks : topChunks.slice(0, 5);
        setAgentSteps(prev => prev.map((s, i) => i === 1 ? { ...s, status: 'completed', duration: Date.now() - rankingStart, output: `Top ${finalChunks.length} chunks selected (avg score: ${(finalChunks.reduce((a, c) => a + c.score, 0) / finalChunks.length).toFixed(2)})` } : i === 0 ? s : { ...s, status: i === 2 ? 'running' : 'pending' }));

        if (!apiKey) {
          // No API key - show retrieval results without LLM synthesis
          const totalLatency = Date.now() - startTime;
          const avgScore = finalChunks.reduce((a, c) => a + c.score, 0) / finalChunks.length;
          const confidenceScore = Math.min(0.99, Math.max(0.1, avgScore / 10));

          setAgentSteps(prev => prev.map((s, i) => {
            if (i === 2) return { ...s, status: 'completed', duration: 0, output: 'Skipped — No Gemini API key provided' };
            if (i === 3) return { ...s, status: 'completed', duration: 0, output: 'Retrieval-only mode. Add Gemini API key for LLM analysis.' };
            return s;
          }));

          setResult(`## Retrieval Results (No LLM Synthesis)\n\nAdd your **Gemini API key** in the navigation bar to enable full LLM-powered analysis.\n\n### Top Retrieved Chunks:\n\n${finalChunks.map((c, i) => `**Source ${i + 1}** [${c.section || 'General'} | Score: ${c.score.toFixed(2)}]\n${c.content.slice(0, 200)}${c.content.length > 200 ? '...' : ''}`).join('\n\n---\n\n')}`);
          setMetrics({
            chunksSearched: allChunks.length,
            chunksRetrieved: finalChunks.length,
            retrievalMs: Date.now() - rankingStart,
            synthesisMs: 0,
            totalLatencyMs: totalLatency,
            confidenceScore,
          });
          setCitedChunks(finalChunks.map((c, i) => ({
            index: i + 1,
            chunkId: c.id,
            documentId: c.documentId,
            chunkIndex: c.chunkIndex,
            section: c.section,
            score: c.score,
            preview: c.content.slice(0, 150) + (c.content.length > 150 ? '...' : ''),
          })));
          onQueryComplete();
          setIsAnalyzing(false);
          return;
        }

        // Agent 3: LLM Reasoning
        const synthesisStart = Date.now();
        const contextBlocks = finalChunks.map((chunk, i) => {
          const doc = documents.find(d => d.id === chunk.documentId);
          return `[Source ${i + 1} | Doc: ${doc?.title || 'Unknown'} | Section: ${chunk.section || 'General'}]\n${chunk.content}`;
        });
        const contextText = contextBlocks.join('\n\n---\n\n');

        const systemPrompt = `You are NEXUS, a financial intelligence analyst. You analyze financial documents and provide precise, evidence-based insights.

RULES:
1. ONLY use information from the provided source documents. Never fabricate data.
2. Always cite your sources using [Source X] notation.
3. If the documents don't contain enough information, say so explicitly.
4. Structure your response with:
   - **Key Findings**: Main insights directly answering the query
   - **Evidence**: Specific data points with citations
   - **Risk Assessment**: Any risk factors identified
   - **Limitations**: What the documents don't cover
5. Use precise financial terminology and be quantitative when possible.`;

        const userPrompt = `Based on the following financial document excerpts, analyze:\n\nQUERY: ${queryText}\n\nDOCUMENT EXCERPTS:\n${contextText}\n\nProvide a thorough, citation-grounded analysis.`;

        const geminiRes = await fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey, systemPrompt, userPrompt }),
        });

        if (!geminiRes.ok) {
          const errData = await geminiRes.json().catch(() => ({}));
          throw new Error((errData as Record<string, string>).error || 'Gemini API call failed');
        }

        const geminiData = await geminiRes.json();
        const response = geminiData.response;
        const synthesisDuration = Date.now() - synthesisStart;

        if (abortRef.current) return;

        setAgentSteps(prev => prev.map((s, i) => {
          if (i === 2) return { ...s, status: 'completed', duration: synthesisDuration, output: `LLM synthesis with ${finalChunks.length} cited sources` };
          if (i === 3) return { ...s, status: 'running', duration: 0, output: '' };
          return s;
        }));

        // Agent 4: Synthesis metrics
        const totalLatency = Date.now() - startTime;
        const avgScore = finalChunks.reduce((a, c) => a + c.score, 0) / finalChunks.length;
        const confidenceScore = Math.min(0.99, Math.max(0.1, avgScore / 10));

        setAgentSteps(prev => prev.map((s, i) => {
          if (i === 3) return { ...s, status: 'completed', duration: totalLatency - synthesisDuration, output: `Analysis completed | Confidence: ${(confidenceScore * 100).toFixed(1)}% | Latency: ${totalLatency}ms` };
          return s;
        }));

        setResult(response);
        setMetrics({
          chunksSearched: allChunks.length,
          chunksRetrieved: finalChunks.length,
          retrievalMs: Date.now() - rankingStart,
          synthesisMs: synthesisDuration,
          totalLatencyMs: totalLatency,
          confidenceScore,
        });
        setCitedChunks(finalChunks.map((c, i) => ({
          index: i + 1,
          chunkId: c.id,
          documentId: c.documentId,
          chunkIndex: c.chunkIndex,
          section: c.section,
          score: c.score,
          preview: c.content.slice(0, 150) + (c.content.length > 150 ? '...' : ''),
        })));
        onQueryComplete();
      } catch (err) {
        if (abortRef.current) return;
        const msg = err instanceof Error ? err.message : 'Analysis failed';
        setError(msg);
        setAgentSteps(prev => prev.map(s => s.status === 'running' ? { ...s, status: 'failed', output: msg } : s));
      } finally {
        setIsAnalyzing(false);
      }
    },
    [chunks, documents, apiKey, onQueryComplete]
  );

  const handleSampleQuery = (sq: string) => {
    setQuery(sq);
    runAnalysis(sq);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <div className="lg:col-span-3 space-y-4">
        <Card>
          <CardContent className="pt-6 space-y-4">
            {!apiKey && (
              <div className="text-xs text-amber-600 flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-500/20">
                <Key className="w-3.5 h-3.5 shrink-0" />
                Add your Gemini API key above for full LLM-powered analysis. Without it, only retrieval results are shown.
              </div>
            )}

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && runAnalysis(query)}
                  placeholder={chunks.length === 0 ? 'No documents available...' : 'Ask a financial question...'}
                  className="pl-9"
                  disabled={isAnalyzing || chunks.length === 0}
                />
              </div>
              <Button onClick={() => runAnalysis(query)} disabled={isAnalyzing || !query.trim() || chunks.length === 0} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shrink-0">
                {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Analyze
              </Button>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Sample Queries — Click to Run</label>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_QUERIES.map((sq) => (
                  <button
                    key={sq}
                    onClick={() => handleSampleQuery(sq)}
                    disabled={isAnalyzing || chunks.length === 0}
                    className="text-[11px] px-2.5 py-1 rounded-full border border-border hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all duration-200 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sq}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="min-h-[300px]">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                Analysis Output
              </CardTitle>
              {metrics && (
                <Badge variant="secondary" className="text-[10px] gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                  {(metrics.confidenceScore * 100).toFixed(0)}% confidence
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="text-sm text-red-600 flex items-center gap-2 mb-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
                <AlertCircle className="w-4 h-4 shrink-0" />{error}
              </div>
            )}

            {isAnalyzing && !result && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
                <p className="text-sm text-muted-foreground">Running multi-agent analysis...</p>
              </div>
            )}

            {result ? (
              <ScrollArea className="max-h-[500px]">
                <div className="space-y-4 pr-3">
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">{result}</div>
                  {citedChunks.length > 0 && (
                    <div>
                      <Separator className="mb-3" />
                      <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                        <BookOpen className="w-3 h-3" />Cited Sources ({citedChunks.length})
                      </h4>
                      <div className="space-y-2">
                        {citedChunks.map((chunk) => (
                          <motion.div key={chunk.chunkId} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="p-2.5 rounded-lg border border-border text-xs hover:border-emerald-500/20 transition-colors">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <Badge variant="secondary" className="text-[9px] h-4">Source {chunk.index}</Badge>
                              <span className="text-muted-foreground">Chunk #{chunk.chunkIndex}</span>
                              {chunk.section && <><span className="text-muted-foreground">•</span><span className="text-muted-foreground">{chunk.section}</span></>}
                              <span className="text-emerald-600 ml-auto font-medium">Score: {chunk.score.toFixed(2)}</span>
                            </div>
                            <p className="text-muted-foreground leading-relaxed">{chunk.preview}</p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            ) : !isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Brain className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm font-medium">
                  {chunks.length === 0 ? 'Upload documents first, then run queries' : 'Select a query or type your own to begin analysis'}
                </p>
                <p className="text-xs mt-1 opacity-70">The multi-agent RAG pipeline will retrieve, rank, and synthesize insights</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Agent trace sidebar */}
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
              <div className="text-sm text-muted-foreground text-center py-8">Start an analysis to see the agent trace</div>
            ) : (
              agentSteps.map((step, i) => (
                <motion.div
                  key={`${step.agent}-${i}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.3 }}
                  className={`p-3 rounded-lg border transition-all duration-300 ${
                    step.status === 'running' ? 'border-amber-500/30 bg-amber-500/5'
                    : step.status === 'completed' ? 'border-emerald-500/30 bg-emerald-500/5'
                    : step.status === 'failed' ? 'border-red-500/30 bg-red-500/5'
                    : 'border-border'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {step.status === 'running' && <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />}
                      {step.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      {step.status === 'failed' && <AlertCircle className="w-4 h-4 text-red-500" />}
                      {step.status === 'pending' && <CircleDot className="w-4 h-4 text-muted-foreground opacity-40" />}
                      <span className="text-sm font-medium">{step.agent}</span>
                    </div>
                    {step.duration > 0 && <Badge variant="secondary" className="text-[10px] font-mono">{step.duration}ms</Badge>}
                  </div>
                  {step.output && (
                    <p className={`text-xs mt-1.5 ${step.status === 'completed' ? 'text-emerald-600' : step.status === 'failed' ? 'text-red-600' : 'text-muted-foreground'}`}>
                      → {step.output}
                    </p>
                  )}
                </motion.div>
              ))
            )}

            {isAnalyzing && agentSteps.length > 0 && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Pipeline Progress</span>
                  <span>{agentSteps.filter(s => s.status === 'completed').length}/{agentSteps.length}</span>
                </div>
                <Progress value={(agentSteps.filter(s => s.status === 'completed').length / Math.max(agentSteps.length, 1)) * 100} className="h-1.5" />
              </div>
            )}

            {metrics && !isAnalyzing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 pt-3 border-t">
                <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Gauge className="w-3 h-3" />Pipeline Metrics
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Chunks Searched', value: metrics.chunksSearched, icon: Database },
                    { label: 'Chunks Retrieved', value: metrics.chunksRetrieved, icon: FileSearch },
                    { label: 'Retrieval Time', value: `${metrics.retrievalMs}ms`, icon: Zap },
                    { label: 'LLM Synthesis', value: metrics.synthesisMs > 0 ? `${metrics.synthesisMs}ms` : 'N/A', icon: Brain },
                    { label: 'Total Latency', value: `${metrics.totalLatencyMs}ms`, icon: Activity },
                    { label: 'Confidence', value: `${(metrics.confidenceScore * 100).toFixed(1)}%`, icon: CheckCircle2 },
                  ].map((m) => (
                    <div key={m.label} className="p-2 rounded-md border border-border flex items-center gap-2">
                      <m.icon className="w-3 h-3 text-emerald-600 shrink-0" />
                      <div>
                        <div className="text-[10px] text-muted-foreground">{m.label}</div>
                        <div className="text-xs font-semibold">{m.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ═══════════════════════ Compliance View ═══════════════════════ */

function ComplianceView({ chunks }: { chunks: ChunkInfo[] }) {
  const [findings, setFindings] = useState<ComplianceFinding[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [stats, setStats] = useState<{ totalFindings: number; critical: number; high: number; medium: number; low: number } | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  const runScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      const results = scanForCompliance(chunks);
      const scanStats = {
        totalFindings: results.length,
        critical: results.filter(f => f.severity === 'critical').length,
        high: results.filter(f => f.severity === 'high').length,
        medium: results.filter(f => f.severity === 'medium').length,
        low: results.filter(f => f.severity === 'low').length,
      };
      const cats = [...new Set(results.map(f => f.category))];
      let scanSummary = `Compliance scan of ${chunks.length} chunks identified ${results.length} findings across ${cats.length} categories.\n\n`;
      if (scanStats.critical > 0) scanSummary += `⚠️ ${scanStats.critical} CRITICAL finding(s) require immediate attention.\n`;
      if (scanStats.high > 0) scanSummary += `🔴 ${scanStats.high} HIGH severity finding(s) identified.\n`;
      if (scanStats.medium > 0) scanSummary += `🟡 ${scanStats.medium} MEDIUM severity finding(s) noted.\n`;
      scanSummary += `\nCategories scanned: ${cats.join(', ')}`;

      setFindings(results);
      setStats(scanStats);
      setSummary(scanSummary);
      setCategories(cats);
      setIsScanning(false);
    }, 800);
  };

  const filteredFindings = filterSeverity === 'all' ? findings : findings.filter(f => f.severity === filterSeverity);
  const severityCounts = stats ? [
    { severity: 'critical', count: stats.critical, color: '#ef4444' },
    { severity: 'high', count: stats.high, color: '#f97316' },
    { severity: 'medium', count: stats.medium, color: '#eab308' },
    { severity: 'low', count: stats.low, color: '#3b82f6' },
  ].filter(s => s.count > 0) : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-600" />Regulatory Compliance Scanner
              </CardTitle>
              <CardDescription className="mt-1">Scans for regulatory compliance issues, risk disclosures, and control deficiencies</CardDescription>
            </div>
            <Button onClick={runScan} disabled={isScanning || chunks.length === 0} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
              {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scan className="w-4 h-4" />}
              {isScanning ? 'Scanning...' : 'Run Compliance Scan'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {isScanning && (
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
              <p className="text-sm font-medium">Scanning {chunks.length} chunks for compliance issues...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {stats && !isScanning && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card><CardContent className="p-3 text-center"><div className="text-2xl font-bold">{stats.totalFindings}</div><div className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Findings</div></CardContent></Card>
            {severityCounts.map(s => (
              <Card key={s.severity}><CardContent className="p-3 text-center"><div className="text-2xl font-bold" style={{ color: s.color }}>{s.count}</div><div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: s.color }}>{s.severity}</div></CardContent></Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-1">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4 text-emerald-600" />Severity Distribution</CardTitle></CardHeader>
              <CardContent>
                {severityCounts.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={severityCounts} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis type="number" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                      <YAxis dataKey="severity" type="category" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" width={60} />
                      <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {severityCounts.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (<div className="flex items-center justify-center h-[180px] text-sm text-muted-foreground">No findings</div>)}
                {categories.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Categories</div>
                    <div className="flex flex-wrap gap-1">{categories.map(cat => (<Badge key={cat} variant="secondary" className="text-[10px]">{cat}</Badge>))}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-emerald-600" />Findings<Badge variant="secondary" className="text-[10px]">{filteredFindings.length}</Badge></CardTitle>
                  <div className="flex items-center gap-1">
                    {['all', 'critical', 'high', 'medium', 'low'].map(sev => (
                      <button key={sev} onClick={() => setFilterSeverity(sev)} className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors capitalize ${filterSeverity === sev ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600' : 'border-border text-muted-foreground hover:border-emerald-500/30'}`}>{sev}</button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredFindings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">No findings to display</div>
                ) : (
                  <ScrollArea className="max-h-[500px]">
                    <div className="space-y-2 pr-2">
                      {filteredFindings.map((finding, i) => {
                        const config = SEVERITY_CONFIG[finding.severity];
                        return (
                          <motion.div key={`${finding.chunkIndex}-${i}`} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className={`p-3 rounded-lg border ${config.border} ${config.bg}`}>
                            <div className="flex items-center gap-2 mb-1.5">
                              <Badge variant="outline" className={`text-[9px] h-5 ${config.text} border-current`}>{config.label}</Badge>
                              <Badge variant="secondary" className="text-[9px] h-5">{finding.category}</Badge>
                              <span className="text-[10px] text-muted-foreground ml-auto">{finding.reference}</span>
                            </div>
                            <p className="text-xs font-medium mb-1">{finding.description}</p>
                            <p className="text-[11px] text-muted-foreground italic">&ldquo;{finding.excerpt.slice(0, 150)}{finding.excerpt.length > 150 ? '...' : ''}&rdquo;</p>
                          </motion.div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>

          {summary && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileCheck className="w-4 h-4 text-emerald-600" />Scan Summary</CardTitle></CardHeader>
              <CardContent><p className="text-sm whitespace-pre-wrap leading-relaxed">{summary}</p></CardContent>
            </Card>
          )}
        </>
      )}

      {!stats && !isScanning && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <Shield className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">{chunks.length === 0 ? 'Upload documents first to run compliance scans' : 'Click "Run Compliance Scan" to analyze documents'}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ═══════════════════════ Colab View ═══════════════════════ */

function ColabView() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(COLAB_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = COLAB_CODE;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([COLAB_CODE], { type: 'text/plain' });
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
              <CardDescription className="mt-1">Self-contained Colab notebook. Uses your Gemini API key. No server needed.</CardDescription>
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
          { title: 'Chunking Engine', desc: 'Client-side text splitting with overlap', icon: Layers },
          { title: 'TF-IDF Retrieval', desc: 'Term frequency scoring for relevance', icon: Database },
          { title: 'Gemini Synthesis', desc: 'LLM-powered financial analysis', icon: Brain },
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
              <code>{COLAB_CODE}</code>
            </pre>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════ Main Page ═══════════════════════ */

function getInitialDocuments(mode: AppMode): DocInfo[] {
  if (mode === 'demo') return DEMO_DOCUMENTS;
  if (typeof window !== 'undefined') {
    try { return JSON.parse(localStorage.getItem('nexus-docs') || '[]'); } catch { return []; }
  }
  return [];
}

function getInitialChunks(mode: AppMode): ChunkInfo[] {
  if (mode === 'demo') return DEMO_CHUNKS;
  if (typeof window !== 'undefined') {
    try { return JSON.parse(localStorage.getItem('nexus-chunks') || '[]'); } catch { return []; }
  }
  return [];
}

function getInitialApiKey(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('nexus-gemini-key') || '';
  }
  return '';
}

export default function NexusPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [appMode, setAppMode] = useState<AppMode>('demo');
  const [documents, setDocuments] = useState<DocInfo[]>(() => getInitialDocuments('demo'));
  const [chunks, setChunks] = useState<ChunkInfo[]>(() => getInitialChunks('demo'));
  const [queryCount, setQueryCount] = useState(0);
  const [apiKey, setApiKey] = useState(() => getInitialApiKey());
  const [isReady, setIsReady] = useState(true);

  // Load documents based on mode
  const loadDataForMode = useCallback((mode: AppMode) => {
    if (mode === 'demo') {
      setDocuments(DEMO_DOCUMENTS);
      setChunks(DEMO_CHUNKS);
    } else {
      const savedDocs = JSON.parse(localStorage.getItem('nexus-docs') || '[]');
      const savedChunks = JSON.parse(localStorage.getItem('nexus-chunks') || '[]');
      setDocuments(savedDocs);
      setChunks(savedChunks);
    }
  }, []);

  const handleModeChange = useCallback((mode: AppMode) => {
    setAppMode(mode);
    loadDataForMode(mode);
  }, [loadDataForMode]);

  const handleRefresh = useCallback(() => {
    loadDataForMode(appMode);
  }, [appMode, loadDataForMode]);

  const handleQueryComplete = useCallback(() => {
    setQueryCount(c => c + 1);
  }, []);

  const tabContent = {
    dashboard: <DashboardView documents={documents} chunks={chunks} queryCount={queryCount} appMode={appMode} />,
    documents: <DocumentsView documents={documents} chunks={chunks} onRefresh={handleRefresh} appMode={appMode} />,
    query: <QueryView documents={documents} chunks={chunks} onQueryComplete={handleQueryComplete} apiKey={apiKey} />,
    compliance: <ComplianceView chunks={chunks} />,
    colab: <ColabView />,
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} appMode={appMode} onModeChange={handleModeChange} apiKey={apiKey} setApiKey={setApiKey} />

      <main className="flex-1 pt-20 pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  NEXUS
                  <span className="text-muted-foreground font-normal text-lg">Finance RAG</span>
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Multi-agent retrieval-augmented generation for enterprise financial intelligence
                </p>
              </div>
              <div className="flex items-center gap-2">
                {appMode === 'demo' ? (
                  <Badge className="text-[10px] gap-1 bg-emerald-600 text-white"><Monitor className="w-2.5 h-2.5" />Demo</Badge>
                ) : (
                  <Badge className="text-[10px] gap-1 bg-amber-600 text-white"><FlaskConical className="w-2.5 h-2.5" />Test</Badge>
                )}
                {documents.length > 0 && (
                  <Badge variant="outline" className="text-[10px] gap-1">
                    <Database className="w-2.5 h-2.5" />{documents.length} docs • {chunks.length} chunks
                  </Badge>
                )}
                {apiKey && (
                  <Badge variant="outline" className="text-[10px] gap-1 text-emerald-600 border-emerald-500/30">
                    <Key className="w-2.5 h-2.5" />Gemini Connected
                  </Badge>
                )}
              </div>
            </div>
          </motion.div>

          {isReady && (
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                {tabContent[activeTab as keyof typeof tabContent]}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </main>

      <footer className="mt-auto border-t bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-5 h-5 rounded bg-emerald-600 flex items-center justify-center"><Network className="w-3 h-3 text-white" /></div>
              <span className="font-medium">NEXUS</span>
              <span>•</span>
              <span>Agentic Intelligence for Finance</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><Cpu className="w-3 h-3" />Multi-Agent RAG</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Shield className="w-3 h-3" />Compliance Engine</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Zap className="w-3 h-3" />Real-time</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
