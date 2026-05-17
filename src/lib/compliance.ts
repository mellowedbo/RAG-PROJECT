/**
 * Compliance Scanner
 * Regex pattern matching against SEC, SOX, FCPA, GDPR, OFAC, Basel III
 */

import type { ComplianceFinding } from '@/types';

/** Minimal input shape required by the compliance scanner */
export interface ComplianceChunkInput {
  content: string;
  chunkIndex: number;
}

interface CompliancePattern {
  category: string;
  patterns: {
    regex: RegExp;
    severity: ComplianceFinding['severity'];
    description: string;
    reference: string;
  }[];
}

export const COMPLIANCE_PATTERNS: CompliancePattern[] = [
  {
    category: 'Risk Disclosure',
    patterns: [
      { regex: /may\s+(?:adversely\s+)?affect\s+(?:our\s+)?(?:business|results|financial|operations)/i, severity: 'high', description: 'General risk factor identified', reference: 'SEC Reg S-K Item 105' },
      { regex: /subject\s+to\s+(?:various\s+)?(?:legal|regulatory|governmental)\s+(?:proceedings|actions|investigations)/i, severity: 'critical', description: 'Legal/regulatory proceeding detected', reference: 'SEC Reg S-K Item 103' },
      { regex: /(?:material\s+)?weakness(?:es)?\s+(?:in\s+)?(?:our\s+)?internal\s+control/i, severity: 'critical', description: 'Internal control weakness disclosed', reference: 'SOX Section 404' },
      { regex: /(?:significant\s+)?deficiency(?:ies)?\s+(?:identified|in|related)/i, severity: 'high', description: 'Control deficiency identified', reference: 'SOX Section 404' },
      { regex: /(?:substantial|significant)\s+doubt\s+(?:about\s+)?(?:our\s+)?ability\s+to\s+continue/i, severity: 'critical', description: 'Going concern uncertainty', reference: 'ASC 205-40' },
    ],
  },
  {
    category: 'Financial Reporting',
    patterns: [
      { regex: /restat(?:e|ed|ement|ing)\s+(?:of\s+)?(?:our\s+)?(?:previously\s+)?(?:issued\s+)?financial/i, severity: 'critical', description: 'Financial restatement indicated', reference: 'SEC Form 8-K Item 4.02' },
      { regex: /(?:impairment|write-?down|write-?off)\s+(?:charge|loss|expense)/i, severity: 'high', description: 'Impairment charge identified', reference: 'ASC 360-10' },
      { regex: /(?:going\s+concern|substantial\s+doubt)/i, severity: 'critical', description: 'Going concern issue detected', reference: 'ASC 205-40' },
      { regex: /(?:related\s+party|affiliated?\s+entity)\s+(?:transaction|relationship)/i, severity: 'medium', description: 'Related party transaction identified', reference: 'ASC 850' },
    ],
  },
  {
    category: 'Regulatory Compliance',
    patterns: [
      { regex: /not\s+in\s+compliance\s+with/i, severity: 'high', description: 'Covenant compliance issue', reference: 'Credit Agreement' },
      { regex: /violation\s+of\s+(?:the\s+)?(?:terms|covenants|agreement)/i, severity: 'high', description: 'Agreement violation detected', reference: 'Contract Law' },
      { regex: /(?:sanctions|embargo|ofac)/i, severity: 'critical', description: 'Sanctions reference detected', reference: 'OFAC / International Sanctions' },
      { regex: /(?:anti-?corruption|fcpa|bribery|kickback)/i, severity: 'critical', description: 'Anti-corruption reference detected', reference: 'FCPA / UK Bribery Act' },
      { regex: /(?:data\s+privacy|gdpr|ccpa|personal\s+data)/i, severity: 'medium', description: 'Data privacy regulation reference', reference: 'GDPR / CCPA' },
      { regex: /(?:cybersecurity|data\s+breach|security\s+incident|ransomware)/i, severity: 'high', description: 'Cybersecurity risk identified', reference: 'SEC Cyber Disclosure Rules' },
    ],
  },
  {
    category: 'Market Risk',
    patterns: [
      { regex: /(?:interest\s+rate|currency|foreign\s+exchange)\s+risk/i, severity: 'medium', description: 'Market risk factor identified', reference: 'SEC Reg S-K Item 305' },
      { regex: /(?:credit\s+risk|counterparty\s+risk|default\s+risk)/i, severity: 'high', description: 'Credit risk exposure identified', reference: 'Basel III / CCAR' },
      { regex: /liquidity\s+risk/i, severity: 'high', description: 'Liquidity risk identified', reference: 'Basel III LCR' },
      { regex: /(?:value[- ]at[- ]risk|var\b)/i, severity: 'medium', description: 'VaR metric disclosed', reference: 'Basel III / FRB SR 11-7' },
    ],
  },
  {
    category: 'Climate & ESG',
    patterns: [
      { regex: /climate[- ]?related\s+(?:financial\s+)?risk/i, severity: 'medium', description: 'Climate-related financial risk', reference: 'TCFD / SEC Climate Rules' },
      { regex: /financed\s+emissions/i, severity: 'low', description: 'Financed emissions disclosed', reference: 'GHG Protocol / PCAF' },
    ],
  },
];

export function scanForCompliance(chunks: ComplianceChunkInput[]): ComplianceFinding[] {
  const findings: ComplianceFinding[] = [];

  for (const chunk of chunks) {
    for (const category of COMPLIANCE_PATTERNS) {
      for (const pattern of category.patterns) {
        const match = chunk.content.match(pattern.regex);
        if (match) {
          const matchIndex = match.index || 0;
          const start = Math.max(0, matchIndex - 60);
          const end = Math.min(chunk.content.length, matchIndex + match[0].length + 60);
          const excerpt =
            (start > 0 ? '...' : '') +
            chunk.content.slice(start, end) +
            (end < chunk.content.length ? '...' : '');

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

  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 } as const;
  findings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  return findings;
}
