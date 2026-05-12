import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';

/* ═══════════════════════════════════════════════════════════
   NEXUS — Gemini API Proxy Route
   Supports:
   - Generation: Gemma 4 31B IT (gemma-4-31b-it)
   - Embedding: Gemini Embedding 2 (gemini-embedding-2)
     with task_type and output_dimensionality support
   - Rate limiting: 10 req/day for demo key
   ═══════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      apiKey,
      systemPrompt,
      userPrompt,
      mode,
      texts,
      model,
      outputDimensionality,
      taskType,
    } = body as {
      apiKey?: string;
      systemPrompt?: string;
      userPrompt?: string;
      mode?: 'generate' | 'embed';
      texts?: string[];
      model?: string;
      outputDimensionality?: number;
      taskType?: string;
    };

    // Rate limiting for demo key usage
    const sessionId = request.headers.get('x-session-id') || 'anonymous';
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
    const { allowed, remaining } = checkRateLimit(sessionId, ip);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Maximum 10 requests per day for demo usage.' },
        { status: 429, headers: { 'X-RateLimit-Remaining': '0' } }
      );
    }

    // ─── Embedding mode (Gemini Embedding 2) ──────────────────
    if (mode === 'embed') {
      if (!apiKey || typeof apiKey !== 'string') {
        return NextResponse.json({ error: 'Gemini API key is required for embeddings' }, { status: 400 });
      }
      if (!texts || !Array.isArray(texts) || texts.length === 0) {
        return NextResponse.json({ error: 'texts array is required for embedding mode' }, { status: 400 });
      }

      // Cap batch size to 100 per request
      const batch = texts.slice(0, 100);
      const embeddingModel = model || 'gemini-embedding-2';

      const batchUrl = `https://generativelanguage.googleapis.com/v1beta/models/${embeddingModel}:batchEmbedContents?key=${apiKey}`;

      // Gemini Embedding 2 supports task_type and output_dimensionality
      const requests = batch.map(text => {
        const req: Record<string, unknown> = {
          model: `models/${embeddingModel}`,
          content: { parts: [{ text }] },
        };

        // Add task type for embedding optimization
        // Options: RETRIEVAL_QUERY, RETRIEVAL_DOCUMENT, SEMANTIC_SIMILARITY,
        //          CLASSIFICATION, CLUSTERING
        if (taskType) {
          req.taskType = taskType;
        }

        // Add output dimensionality (MRL support)
        // Gemini Embedding 2: up to 3072 dims, adjustable via output_dimensionality
        if (outputDimensionality && outputDimensionality >= 128 && outputDimensionality <= 3072) {
          req.outputDimensionality = outputDimensionality;
        }

        return req;
      });

      const embedRes = await fetch(batchUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests }),
      });

      if (!embedRes.ok) {
        const errData = await embedRes.json().catch(() => ({}));
        const errMsg = (errData as Record<string, unknown>)?.error
          ? ((errData as Record<string, unknown>).error as Record<string, unknown>)?.message || 'Embedding API error'
          : `Embedding API returned ${embedRes.status}`;
        return NextResponse.json(
          { error: typeof errMsg === 'string' ? errMsg : 'Embedding API error' },
          { status: embedRes.status }
        );
      }

      const embedData = await embedRes.json();
      const embeddings = (embedData?.embeddings as Array<{ values: number[] }>)?.map(
        (e) => e.values
      ) || [];

      return NextResponse.json(
        { embeddings },
        { headers: { 'X-RateLimit-Remaining': String(remaining) } }
      );
    }

    // ─── Generation mode (Gemma 4 31B IT) ────────────────────
    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json({ error: 'Gemini API key is required' }, { status: 400 });
    }
    if (!userPrompt || typeof userPrompt !== 'string') {
      return NextResponse.json({ error: 'User prompt is required' }, { status: 400 });
    }

    const genModel = model || 'gemma-4-31b-it';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${genModel}:generateContent?key=${apiKey}`;

    const geminiBody: Record<string, unknown> = {
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }],
        },
      ],
      generationConfig: {
        temperature: 1.0,    // Gemma 4 recommended
        topP: 0.95,          // Gemma 4 recommended
        topK: 64,            // Gemma 4 recommended
        maxOutputTokens: 8192,
      },
    };

    if (systemPrompt) {
      geminiBody.systemInstruction = {
        parts: [{ text: systemPrompt }],
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = (errorData as Record<string, unknown>)?.error
        ? ((errorData as Record<string, unknown>).error as Record<string, unknown>)?.message || 'Gemini API error'
        : `Gemini API returned ${response.status}`;
      return NextResponse.json(
        { error: typeof errorMessage === 'string' ? errorMessage : 'Gemini API error' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Gemma 4 with thinking mode may output thought channel
    // Extract the final text response
    const candidates = data?.candidates || [];
    let text = '';

    if (candidates.length > 0) {
      const parts = candidates[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.text && !part.thought) {
          text += part.text;
        }
      }
      // Fallback: if no non-thought text found, take any text
      if (!text) {
        for (const part of parts) {
          if (part.text) {
            text += part.text;
          }
        }
      }
    }

    if (!text) {
      return NextResponse.json(
        { error: 'No response generated by the model' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { response: text },
      { headers: { 'X-RateLimit-Remaining': String(remaining) } }
    );
  } catch (error) {
    console.error('Gemini API error:', error);
    return NextResponse.json(
      { error: 'Failed to call Gemini API. Check your API key and try again.' },
      { status: 500 }
    );
  }
}
