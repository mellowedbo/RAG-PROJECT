import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const documents = await db.document.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        filename: true,
        docType: true,
        sector: true,
        wordCount: true,
        chunkCount: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { chunks: true },
        },
      },
    });

    const totalChunks = documents.reduce((acc, d) => acc + d.chunkCount, 0);
    const totalWords = documents.reduce((acc, d) => acc + d.wordCount, 0);

    return NextResponse.json({
      documents,
      stats: {
        totalDocuments: documents.length,
        totalChunks,
        totalWords,
        byType: documents.reduce((acc, d) => {
          acc[d.docType] = (acc[d.docType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
    });
  } catch (error) {
    console.error('Document list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}
