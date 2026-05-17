import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { db } from '@/lib/db';
import { scoreChunksByRelevance } from '@/lib/rag/chunker';

let zaiInstance: InstanceType<typeof ZAI> | null = null;

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { query, documentIds, domain } = body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // AGENT 1: RETRIEVAL AGENT
    // Fetch all chunks from specified documents (or all if none specified)
    const whereClause = documentIds?.length > 0
      ? { documentId: { in: documentIds } }
      : {};

    const allChunks = await db.documentChunk.findMany({
      where: whereClause,
      select: {
        id: true,
        content: true,
        documentId: true,
        chunkIndex: true,
        section: true,
      },
    });

    if (allChunks.length === 0) {
      return NextResponse.json({
        response: 'No documents have been uploaded yet. Please upload financial documents first, then run your query.',
        agentTrace: [
          { agent: 'Retrieval Agent', status: 'failed', duration: 0, output: 'No chunks found in database' },
        ],
        metrics: { chunksSearched: 0, chunksRetrieved: 0, latencyMs: Date.now() - startTime },
        citedChunks: [],
      });
    }

    const retrievalStart = Date.now();

    // AGENT 2: RANKING AGENT
    // Score and rank chunks by relevance
    const topChunks = scoreChunksByRelevance(query, allChunks, 8);
    const rankingDuration = Date.now() - retrievalStart;

    // Filter out zero-score chunks
    const relevantChunks = topChunks.filter(c => c.score > 0);

    if (relevantChunks.length === 0) {
      // Fallback: use top chunks even if score is 0
      const fallbackChunks = topChunks.slice(0, 5);
      if (fallbackChunks.length === 0) {
        return NextResponse.json({
          response: 'I could not find any relevant information in the uploaded documents for your query. Try uploading more specific financial documents or rephrasing your question.',
          agentTrace: [
            { agent: 'Retrieval Agent', status: 'completed', duration: retrievalStart - startTime, output: `${allChunks.length} chunks searched` },
            { agent: 'Ranking Agent', status: 'completed', duration: rankingDuration, output: 'No highly relevant chunks found' },
          ],
          metrics: { chunksSearched: allChunks.length, chunksRetrieved: 0, latencyMs: Date.now() - startTime, confidenceScore: 0 },
          citedChunks: [],
        });
      }
    }

    const finalChunks = relevantChunks.length > 0 ? relevantChunks : topChunks.slice(0, 5);

    // AGENT 3: REASONING AGENT (LLM)
    // Build context from retrieved chunks with citations
    const contextBlocks = finalChunks.map((chunk, i) => {
      const doc = chunk.documentId;
      return `[Source ${i + 1} | Doc: ${doc.slice(0, 8)}... | Chunk: ${chunk.chunkIndex}${chunk.section ? ` | Section: ${chunk.section}` : ''}]\n${chunk.content}`;
    });

    const contextText = contextBlocks.join('\n\n---\n\n');

    const zai = await getZAI();

    const systemPrompt = `You are NEXUS, a financial intelligence analyst. You analyze financial documents and provide precise, evidence-based insights.

RULES:
1. ONLY use information from the provided source documents. Never fabricate data.
2. Always cite your sources using [Source X] notation.
3. If the documents don't contain enough information to answer fully, say so explicitly.
4. Structure your response with clear sections:
   - **Key Findings**: Main insights directly answering the query
   - **Evidence**: Specific data points with citations
   - **Risk Assessment**: Any risk factors identified (if applicable)
   - **Limitations**: What the documents don't cover
5. Use precise financial terminology and be quantitative when possible.
6. If multiple documents contain conflicting information, highlight the discrepancy.`;

    const userPrompt = `Based on the following financial document excerpts, please analyze:

QUERY: ${query}

DOCUMENT EXCERPTS:
${contextText}

Provide a thorough, citation-grounded analysis.`;

    const synthesisStart = Date.now();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      thinking: { type: 'disabled' },
    });
    const synthesisDuration = Date.now() - synthesisStart;

    const response = completion.choices?.[0]?.message?.content;

    if (!response) {
      return NextResponse.json(
        { error: 'No response generated' },
        { status: 500 }
      );
    }

    // AGENT 4: SYNTHESIS METRICS
    const totalLatency = Date.now() - startTime;
    const avgScore = finalChunks.reduce((acc, c) => acc + c.score, 0) / finalChunks.length;
    const confidenceScore = Math.min(0.99, Math.max(0.1, avgScore / 10));

    // Store analysis session
    try {
      await db.analysisSession.create({
        data: {
          title: query.slice(0, 100),
          domain: domain || 'finance',
          status: 'completed',
          query,
          response,
          citedChunks: JSON.stringify(finalChunks.map(c => c.id)),
          agentTrace: JSON.stringify([
            { agent: 'Retrieval Agent', status: 'completed', duration: retrievalStart - startTime, output: `Searched ${allChunks.length} chunks across ${new Set(allChunks.map(c => c.documentId)).size} documents` },
            { agent: 'Ranking Agent', status: 'completed', duration: rankingDuration, output: `Top ${finalChunks.length} chunks selected (avg score: ${avgScore.toFixed(2)})` },
            { agent: 'Reasoning Agent', status: 'completed', duration: synthesisDuration, output: `LLM synthesis with ${finalChunks.length} cited sources` },
            { agent: 'Synthesis Agent', status: 'completed', duration: Date.now() - synthesisStart, output: `Analysis completed with confidence ${(confidenceScore * 100).toFixed(1)}%` },
          ]),
          metrics: JSON.stringify({
            chunksSearched: allChunks.length,
            chunksRetrieved: finalChunks.length,
            retrievalMs: rankingDuration,
            synthesisMs: synthesisDuration,
            totalLatencyMs: totalLatency,
            confidenceScore: confidenceScore,
          }),
          documentIds: JSON.stringify([...new Set(finalChunks.map(c => c.documentId))]),
        },
      });
    } catch (e) {
      // Don't fail if session storage fails
      console.error('Session storage error:', e);
    }

    return NextResponse.json({
      response,
      agentTrace: [
        { agent: 'Retrieval Agent', status: 'completed', duration: retrievalStart - startTime, output: `Searched ${allChunks.length} chunks across ${new Set(allChunks.map(c => c.documentId)).size} documents` },
        { agent: 'Ranking Agent', status: 'completed', duration: rankingDuration, output: `Top ${finalChunks.length} chunks selected (avg relevance: ${avgScore.toFixed(2)})` },
        { agent: 'Reasoning Agent', status: 'completed', duration: synthesisDuration, output: `LLM synthesis with ${finalChunks.length} cited sources` },
        { agent: 'Synthesis Agent', status: 'completed', duration: totalLatency - synthesisDuration, output: `Analysis completed | Confidence: ${(confidenceScore * 100).toFixed(1)}% | Latency: ${totalLatency}ms` },
      ],
      metrics: {
        chunksSearched: allChunks.length,
        chunksRetrieved: finalChunks.length,
        retrievalMs: rankingDuration,
        synthesisMs: synthesisDuration,
        totalLatencyMs: totalLatency,
        confidenceScore,
      },
      citedChunks: finalChunks.map((c, i) => ({
        index: i + 1,
        chunkId: c.id,
        documentId: c.documentId,
        chunkIndex: c.chunkIndex,
        section: c.section,
        score: c.score,
        preview: c.content.slice(0, 150) + (c.content.length > 150 ? '...' : ''),
      })),
    });
  } catch (error) {
    console.error('Finance query error:', error);
    return NextResponse.json(
      { error: 'Analysis failed. Please try again.' },
      { status: 500 }
    );
  }
}
