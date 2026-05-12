import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { chunkText } from '@/lib/rag/chunker';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, docType, sector, filename } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    if (content.length > 500000) {
      return NextResponse.json(
        { error: 'Content too long (max 500,000 characters)' },
        { status: 400 }
      );
    }

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Step 1: Create document
    const document = await db.document.create({
      data: {
        title: title.trim(),
        filename: filename || `${title.trim().replace(/\s+/g, '_')}.txt`,
        docType: docType || 'custom',
        sector: sector || null,
        content: content.trim(),
        wordCount: content.trim().split(/\s+/).filter(w => w.length > 0).length,
        status: 'uploaded',
        chunkCount: 0,
      },
    });

    // Step 2: Chunk the document
    const chunks = chunkText(content, {
      maxChunkSize: 800,
      minChunkSize: 80,
      overlapSize: 60,
    });

    // Step 3: Store chunks
    if (chunks.length > 0) {
      await db.documentChunk.createMany({
        data: chunks.map(chunk => ({
          documentId: document.id,
          content: chunk.content,
          chunkIndex: chunk.chunkIndex,
          section: chunk.section,
          wordCount: chunk.wordCount,
          charCount: chunk.charCount,
        })),
      });
    }

    // Update document status
    await db.document.update({
      where: { id: document.id },
      data: {
        chunkCount: chunks.length,
        status: 'chunked',
      },
    });

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        title: document.title,
        filename: document.filename,
        docType: document.docType,
        sector: document.sector,
        wordCount: document.wordCount,
        chunkCount: chunks.length,
        status: 'chunked',
      },
    });
  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process document' },
      { status: 500 }
    );
  }
}
