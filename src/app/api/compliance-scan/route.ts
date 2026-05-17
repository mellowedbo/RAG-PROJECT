import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { scanForCompliance } from '@/lib/rag/compliance';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentIds } = body;

    // Get chunks from specified documents or all
    const whereClause = documentIds?.length > 0
      ? { documentId: { in: documentIds } }
      : {};

    const chunks = await db.documentChunk.findMany({
      where: whereClause,
      select: {
        id: true,
        content: true,
        chunkIndex: true,
        section: true,
        documentId: true,
      },
    });

    if (chunks.length === 0) {
      return NextResponse.json({
        findings: [],
        summary: 'No documents to scan. Upload financial documents first.',
        stats: { totalFindings: 0, critical: 0, high: 0, medium: 0, low: 0 },
      });
    }

    // Run compliance scan
    const findings = scanForCompliance(chunks);

    // Build summary
    const stats = {
      totalFindings: findings.length,
      critical: findings.filter(f => f.severity === 'critical').length,
      high: findings.filter(f => f.severity === 'high').length,
      medium: findings.filter(f => f.severity === 'medium').length,
      low: findings.filter(f => f.severity === 'low').length,
    };

    const categories = [...new Set(findings.map(f => f.category))];

    let summary = `Compliance scan of ${chunks.length} chunks identified ${findings.length} findings across ${categories.length} categories.\n\n`;

    if (stats.critical > 0) {
      summary += `⚠️ ${stats.critical} CRITICAL finding(s) require immediate attention.\n`;
    }
    if (stats.high > 0) {
      summary += `🔴 ${stats.high} HIGH severity finding(s) identified.\n`;
    }
    if (stats.medium > 0) {
      summary += `🟡 ${stats.medium} MEDIUM severity finding(s) noted.\n`;
    }

    summary += `\nCategories scanned: ${categories.join(', ')}`;

    return NextResponse.json({
      findings,
      summary,
      stats,
      categories,
    });
  } catch (error) {
    console.error('Compliance scan error:', error);
    return NextResponse.json(
      { error: 'Compliance scan failed' },
      { status: 500 }
    );
  }
}
