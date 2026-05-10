export interface AgentStep {
  id: string;
  agent: string;
  action: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  duration?: number;
  output?: string;
  icon: string;
}

export interface FinanceMetric {
  label: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
}

export interface WorkflowNode {
  id: string;
  label: string;
  description: string;
  type: 'ingestion' | 'retrieval' | 'reasoning' | 'synthesis';
  icon: string;
  details: string[];
}

export const WORKFLOW_NODES: WorkflowNode[] = [
  {
    id: 'ingestion',
    label: 'Ingestion Agent',
    description: 'Semantic chunking with neural topic detection — not naive character splitting',
    type: 'ingestion',
    icon: 'FileSearch',
    details: [
      'Embedding-based topic boundary detection (cosine similarity thresholding)',
      'Context-preserving chunk linkage (doubly-linked list structure)',
      'Idempotent document processing via file hashing',
      'Support for PDF, earnings reports, 10-K filings',
    ],
  },
  {
    id: 'retrieval',
    label: 'Retrieval Agent',
    description: 'Hybrid fusion search combining dense vectors with sparse keyword matching',
    type: 'retrieval',
    icon: 'Search',
    details: [
      'Parallel FTS + Vector search (50 candidates each)',
      'LanceDB hybrid storage with IVF-PQ quantization (96x compression)',
      'Cosine similarity with nprobes=20 for recall optimization',
      'Deduplication via node_id before reranking',
    ],
  },
  {
    id: 'reasoning',
    label: 'Reasoning Agent',
    description: 'Cross-encoder reranking for precision — the judgment layer',
    type: 'reasoning',
    icon: 'Brain',
    details: [
      'TinyBERT-L-2 cross-encoder reranking (~4MB, instant on CPU)',
      'Score normalization across heterogeneous retrieval sources',
      'Non-blocking async execution preserving event loop',
      'Context window expansion via graph-edge traversal',
    ],
  },
  {
    id: 'synthesis',
    label: 'Synthesis Agent',
    description: 'LLM-powered financial insight generation with grounded evidence',
    type: 'synthesis',
    icon: 'Sparkles',
    details: [
      'Chain-of-thought financial reasoning',
      'Citation-grounded response generation',
      'Multi-document cross-referencing',
      'Risk-adjusted confidence scoring',
    ],
  },
];

export const FINANCE_METRICS: FinanceMetric[] = [
  { label: 'Query Accuracy', value: '94.7%', change: '+12.3%', changeType: 'positive' },
  { label: 'Retrieval Latency', value: '47ms', change: '-38%', changeType: 'positive' },
  { label: 'Index Compression', value: '96x', change: 'IVF-PQ', changeType: 'neutral' },
  { label: 'Rerank Precision', value: '91.2%', change: '+8.7%', changeType: 'positive' },
];

export const USE_CASES = [
  {
    id: 'earnings',
    title: 'Earnings Call Analysis',
    description: 'Automated extraction of key metrics, sentiment, and forward guidance from quarterly earnings transcripts',
    metric: '10K+ pages analyzed',
    icon: 'TrendingUp',
  },
  {
    id: 'risk',
    title: 'Risk Assessment Engine',
    description: 'Multi-document risk factor aggregation from 10-K filings with cross-company comparison',
    metric: '94.7% accuracy',
    icon: 'Shield',
  },
  {
    id: 'compliance',
    title: 'Regulatory Compliance',
    description: 'Automated scanning of regulatory documents for compliance gaps and policy violations',
    metric: '3x faster review',
    icon: 'FileCheck',
  },
  {
    id: 'market',
    title: 'Market Intelligence',
    description: 'Real-time synthesis of market reports, analyst notes, and macro indicators into actionable insights',
    metric: '47ms retrieval',
    icon: 'BarChart3',
  },
  {
    id: 'portfolio',
    title: 'Portfolio Due Diligence',
    description: 'Cross-referencing investment thesis with historical performance data and risk disclosures',
    metric: 'Zero hallucination',
    icon: 'Briefcase',
  },
  {
    id: 'credit',
    title: 'Credit Analysis',
    description: 'Automated credit risk profiling from financial statements, covenant tracking, and covenant breach detection',
    metric: '96x compression',
    icon: 'Landmark',
  },
];

export const SAMPLE_QUERIES = [
  'What are the key risk factors in Tesla\'s latest 10-K filing?',
  'Compare revenue growth between Apple and Microsoft in Q4 2024',
  'What forward guidance did Netflix provide in their last earnings call?',
  'Identify potential compliance gaps in banking sector regulations',
  'Summarize the macro risk indicators from the latest Fed minutes',
];

export const AGENT_TRACE_STEPS: AgentStep[] = [
  {
    id: '1',
    agent: 'Ingestion Agent',
    action: 'Semantic chunking with topic boundary detection',
    status: 'completed',
    duration: 234,
    output: '47 semantic chunks identified across 3 documents',
    icon: 'FileSearch',
  },
  {
    id: '2',
    agent: 'Retrieval Agent',
    action: 'Hybrid fusion search (FTS + Vector)',
    status: 'completed',
    duration: 47,
    output: '100 candidates retrieved (50 FTS + 50 Vector), 23 unique after dedup',
    icon: 'Search',
  },
  {
    id: '3',
    agent: 'Reasoning Agent',
    action: 'Cross-encoder reranking with TinyBERT',
    status: 'completed',
    duration: 12,
    output: 'Top 5 results reranked with confidence scores > 0.82',
    icon: 'Brain',
  },
  {
    id: '4',
    agent: 'Synthesis Agent',
    action: 'LLM insight generation with grounded evidence',
    status: 'completed',
    duration: 1890,
    output: 'Financial analysis synthesized with 4 citation references',
    icon: 'Sparkles',
  },
];
