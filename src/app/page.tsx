'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

import Navigation from '@/components/Navigation';
import DashboardView from '@/components/DashboardView';
import DocumentsView from '@/components/DocumentsView';
import QueryView from '@/components/QueryView';
import ComplianceView from '@/components/ComplianceView';
import ColabView from '@/components/ColabView';
import SettingsView from '@/components/SettingsView';

import type {
  DocInfo, ChunkInfo, AgentStep, CitedChunk,
  ComplianceFinding, QueryMetrics, AppMode, PipelineConfig,
} from '@/types';
import { DEFAULT_CONFIG } from '@/types';

/* ═══════════════════════ Constants ═══════════════════════ */

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

/* ═══════════════════════ Colab Code ═══════════════════════ */

const COLAB_CODE = `# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  NEXUS — Agentic RAG for Financial Intelligence | Google Colab Notebook ║
# ║  4-Agent Pipeline: Ingestion → Retrieval → Reasoning → Synthesis       ║
# ║  Powered by Google Gemini 2.0 Flash (Free Tier)                        ║
# ╚══════════════════════════════════════════════════════════════════════════╝
#
# Paste this entire file into a single Colab cell, or split at the
# "# ═══ CELL BREAK ═══" markers for multi-cell usage.
# Get a free Gemini API key at: https://aistudio.google.com/apikey
# ════════════════════════════════════════════════════════════════════════════

# ═══ CELL 1: Install Dependencies ═════════════════════════════════════════

!pip install -q google-generativeai pandas matplotlib

import os, sys, json, re, math, time, textwrap
from datetime import datetime
from collections import Counter

import google.generativeai as genai
import pandas as pd
import matplotlib.pyplot as plt

# ═══ CELL 2: Configure Gemini API ═════════════════════════════════════════

GEMINI_KEY = None
try:
    from google.colab import userdata
    GEMINI_KEY = userdata.get('GOOGLE_API_KEY')
except:
    pass

if not GEMINI_KEY:
    GEMINI_KEY = input("  Enter your Gemini API key: ").strip()

if GEMINI_KEY:
    genai.configure(api_key=GEMINI_KEY)
    model = genai.GenerativeModel('gemini-2.0-flash')
    print("✓ Gemini API configured")
else:
    model = None
    print("⚠ No API key — retrieval-only mode")

print("\\nNEXUS RAG Pipeline Ready.")
`;

/* ═══════════════════════ RAG Utilities ═══════════════════════ */

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

  // Query state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
  const [queryResult, setQueryResult] = useState<string | null>(null);
  const [queryMetrics, setQueryMetrics] = useState<QueryMetrics | null>(null);
  const [citedChunks, setCitedChunks] = useState<CitedChunk[]>([]);
  const [queryError, setQueryError] = useState<string | null>(null);
  const abortRef = useRef(false);

  // Compliance state
  const [complianceFindings, setComplianceFindings] = useState<ComplianceFinding[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [complianceStats, setComplianceStats] = useState<{
    totalFindings: number; critical: number; high: number; medium: number; low: number;
  } | null>(null);
  const [complianceSummary, setComplianceSummary] = useState<string | null>(null);
  const [complianceCategories, setComplianceCategories] = useState<string[]>([]);
  const [filterSeverity, setFilterSeverity] = useState('all');

  // Documents upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Settings state
  const [simulationMode, setSimulationMode] = useState(false);
  const [useEmbeddings, setUseEmbeddings] = useState(true);
  const [config, setConfig] = useState<PipelineConfig>(DEFAULT_CONFIG);
  const [embeddingProgress, setEmbeddingProgress] = useState<number | null>(null);

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

  /* ═══════════════════════ Query Handler ═══════════════════════ */

  const runAnalysis = useCallback(
    async (queryText: string) => {
      if (!queryText.trim()) return;
      abortRef.current = false;
      setIsAnalyzing(true);
      setQueryResult(null);
      setQueryMetrics(null);
      setCitedChunks([]);
      setQueryError(null);

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

          setQueryResult(`## Retrieval Results (No LLM Synthesis)\n\nAdd your **Gemini API key** in the navigation bar to enable full LLM-powered analysis.\n\n### Top Retrieved Chunks:\n\n${finalChunks.map((c, i) => `**Source ${i + 1}** [${c.section || 'General'} | Score: ${c.score.toFixed(2)}]\n${c.content.slice(0, 200)}${c.content.length > 200 ? '...' : ''}`).join('\n\n---\n\n')}`);
          setQueryMetrics({
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
          setQueryCount(c => c + 1);
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

        setQueryResult(response);
        setQueryMetrics({
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
        setQueryCount(c => c + 1);
      } catch (err) {
        if (abortRef.current) return;
        const msg = err instanceof Error ? err.message : 'Analysis failed';
        setQueryError(msg);
        setAgentSteps(prev => prev.map(s => s.status === 'running' ? { ...s, status: 'failed', output: msg } : s));
      } finally {
        setIsAnalyzing(false);
      }
    },
    [chunks, documents, apiKey]
  );

  /* ═══════════════════════ Document Upload Handlers ═══════════════════════ */

  const handleUploadText = useCallback((title: string, content: string, docType: string, sector: string) => {
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);
    try {
      const newChunks = chunkText(content);
      const docId = `test-${Date.now()}`;
      const docInfo: DocInfo = {
        id: docId,
        title,
        filename: `${title.replace(/\s+/g, '_')}.txt`,
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

      setUploadSuccess(true);
      handleRefresh();
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [handleRefresh]);

  const handleUploadFile = useCallback(async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);
    try {
      // Read the file content
      let text = '';
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        text = await file.text();
      } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        // Try to extract text via API
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/extract', { method: 'POST', body: formData });
        if (res.ok) {
          const data = await res.json();
          text = data.text || '';
        } else {
          throw new Error('PDF extraction failed. Please paste the text directly instead.');
        }
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx')) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/extract', { method: 'POST', body: formData });
        if (res.ok) {
          const data = await res.json();
          text = data.text || '';
        } else {
          throw new Error('DOCX extraction failed. Please paste the text directly instead.');
        }
      } else {
        // Try reading as plain text
        text = await file.text();
      }

      if (!text.trim()) {
        throw new Error('No text could be extracted from the file. Please paste the content directly.');
      }

      // Use the upload text handler
      handleUploadText(
        file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
        text,
        'custom',
        ''
      );
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'File upload failed');
      setIsUploading(false);
    }
  }, [handleUploadText]);

  const handleDeleteDocument = useCallback(async (id: string) => {
    try {
      const existingDocs = JSON.parse(localStorage.getItem('nexus-docs') || '[]');
      const existingChunks = JSON.parse(localStorage.getItem('nexus-chunks') || '[]');
      localStorage.setItem('nexus-docs', JSON.stringify(existingDocs.filter((d: DocInfo) => d.id !== id)));
      localStorage.setItem('nexus-chunks', JSON.stringify(existingChunks.filter((c: ChunkInfo) => c.documentId !== id)));
      handleRefresh();
    } catch (e) {
      console.error(e);
    }
  }, [handleRefresh]);

  /* ═══════════════════════ Compliance Handler ═══════════════════════ */

  const handleRunComplianceScan = useCallback(() => {
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

      setComplianceFindings(results);
      setComplianceStats(scanStats);
      setComplianceSummary(scanSummary);
      setComplianceCategories(cats);
      setIsScanning(false);
    }, 800);
  }, [chunks]);

  /* ═══════════════════════ Tab Content ═══════════════════════ */

  const tabContent: Record<string, React.ReactNode> = {
    dashboard: <DashboardView documents={documents} chunks={chunks} queryCount={queryCount} appMode={appMode} />,
    documents: <DocumentsView
      documents={documents}
      chunks={chunks}
      appMode={appMode}
      onUploadFile={handleUploadFile}
      onUploadText={handleUploadText}
      onDelete={handleDeleteDocument}
      onRefresh={handleRefresh}
      isUploading={isUploading}
      uploadError={uploadError}
      uploadSuccess={uploadSuccess}
    />,
    query: <QueryView
      chunks={chunks}
      apiKey={apiKey}
      isAnalyzing={isAnalyzing}
      agentSteps={agentSteps}
      result={queryResult}
      metrics={queryMetrics}
      citedChunks={citedChunks}
      error={queryError}
      onRunQuery={runAnalysis}
      sampleQueries={SAMPLE_QUERIES}
    />,
    compliance: <ComplianceView
      chunks={chunks}
      findings={complianceFindings}
      isScanning={isScanning}
      stats={complianceStats}
      summary={complianceSummary}
      categories={complianceCategories}
      filterSeverity={filterSeverity}
      setFilterSeverity={setFilterSeverity}
      onRunScan={handleRunComplianceScan}
    />,
    colab: <ColabView colabCode={COLAB_CODE} />,
    settings: <SettingsView
      apiKey={apiKey}
      setApiKey={setApiKey}
      simulationMode={simulationMode}
      setSimulationMode={setSimulationMode}
      useEmbeddings={useEmbeddings}
      setUseEmbeddings={setUseEmbeddings}
      config={config}
      onConfigChange={setConfig}
      embeddingProgress={embeddingProgress}
    />,
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} appMode={appMode} onModeChange={handleModeChange} apiKey={apiKey} setApiKey={setApiKey} />

      <main className="flex-1 pt-20 pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">NEXUS Finance RAG</h1>
                <p className="text-sm text-muted-foreground">Multi-agent financial intelligence pipeline with Gemini-powered analysis</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Pipeline Active
                </div>
                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-emerald-600 font-medium">{documents.length} docs • {chunks.length} chunks</span>
              </div>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {tabContent[activeTab] || tabContent.dashboard}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <footer className="border-t py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs text-muted-foreground">
          <span>NEXUS Finance RAG — Agentic Pipeline</span>
          <span>Gemini 2.0 Flash • TF-IDF Retrieval • Client-Side Processing</span>
        </div>
      </footer>
    </div>
  );
}
