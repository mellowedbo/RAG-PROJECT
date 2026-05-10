/**
 * RAG Pipeline - Text Chunking Engine
 * 
 * Implements semantic-aware chunking with:
 * - Sentence boundary detection
 * - Section heading recognition
 * - Overlap for context preservation
 * - Word count and metadata tracking
 */

export interface ChunkResult {
  content: string;
  chunkIndex: number;
  section: string | null;
  wordCount: number;
  charCount: number;
}

const SECTION_PATTERNS = [
  /^(?:#{1,6}\s|.?\d+\.?\s+[A-Z][A-Z\s]{3,}|ITEM\s+\d+|PART\s+[IVX]+|SECTION\s+\d+|CHAPTER\s+\d+)/m,
];

/**
 * Split text into semantic chunks with overlap.
 * Tries section boundaries first, then paragraph boundaries,
 * then sentence boundaries as fallback.
 */
export function chunkText(
  text: string,
  options: {
    maxChunkSize?: number;
    minChunkSize?: number;
    overlapSize?: number;
  } = {}
): ChunkResult[] {
  const {
    maxChunkSize = 800,
    minChunkSize = 100,
    overlapSize = 80,
  } = options;

  if (!text || text.trim().length === 0) return [];

  // Step 1: Detect sections
  const sections = splitBySections(text);

  // Step 2: Within each section, split into paragraphs
  const chunks: ChunkResult[] = [];
  let chunkIndex = 0;

  for (const section of sections) {
    const paragraphs = splitIntoParagraphs(section.content);

    let currentChunk = '';
    let currentSection = section.heading;

    for (const para of paragraphs) {
      const paraTrimmed = para.trim();
      if (!paraTrimmed) continue;

      // If adding this paragraph exceeds max size, flush current chunk
      if (currentChunk && (currentChunk.length + paraTrimmed.length) > maxChunkSize) {
        // Only add if it meets minimum size
        if (currentChunk.trim().length >= minChunkSize) {
          chunks.push(createChunk(currentChunk, chunkIndex, currentSection));
          chunkIndex++;

          // Create overlap from end of current chunk
          const overlapText = getOverlapTail(currentChunk, overlapSize);
          currentChunk = overlapText + '\n\n' + paraTrimmed;
        } else {
          // Too small, keep accumulating
          currentChunk += '\n\n' + paraTrimmed;
        }
      } else {
        currentChunk = currentChunk ? currentChunk + '\n\n' + paraTrimmed : paraTrimmed;
      }
    }

    // Flush remaining chunk
    if (currentChunk.trim().length >= minChunkSize) {
      chunks.push(createChunk(currentChunk, chunkIndex, currentSection));
      chunkIndex++;
    } else if (currentChunk.trim().length > 0 && chunks.length > 0) {
      // Merge small tail into previous chunk
      const prev = chunks[chunks.length - 1];
      prev.content += '\n\n' + currentChunk.trim();
      prev.wordCount = countWords(prev.content);
      prev.charCount = prev.content.length;
    } else if (currentChunk.trim().length > 0) {
      chunks.push(createChunk(currentChunk, chunkIndex, currentSection));
      chunkIndex++;
    }
  }

  return chunks;
}

function createChunk(content: string, index: number, section: string | null): ChunkResult {
  return {
    content: content.trim(),
    chunkIndex: index,
    section,
    wordCount: countWords(content),
    charCount: content.trim().length,
  };
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

function getOverlapTail(text: string, overlapSize: number): string {
  const words = text.split(/\s+/);
  if (words.length <= overlapSize) return text;
  return words.slice(-overlapSize).join(' ');
}

interface SectionBlock {
  heading: string | null;
  content: string;
}

function splitBySections(text: string): SectionBlock[] {
  const lines = text.split('\n');
  const sections: SectionBlock[] = [];
  let currentHeading: string | null = null;
  let currentContent: string[] = [];

  for (const line of lines) {
    const isSection = SECTION_PATTERNS.some(p => p.test(line.trim()));

    if (isSection && currentContent.length > 0) {
      sections.push({
        heading: currentHeading,
        content: currentContent.join('\n'),
      });
      currentHeading = line.trim();
      currentContent = [];
    } else if (isSection) {
      currentHeading = line.trim();
    } else {
      currentContent.push(line);
    }
  }

  if (currentContent.length > 0) {
    sections.push({
      heading: currentHeading,
      content: currentContent.join('\n'),
    });
  }

  return sections;
}

function splitIntoParagraphs(text: string): string[] {
  // Split on double newlines (paragraph boundaries)
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);

  // Further split very long paragraphs by sentences
  const result: string[] = [];
  for (const para of paragraphs) {
    if (para.length > 1500) {
      const sentences = splitIntoSentences(para);
      let current = '';
      for (const sentence of sentences) {
        if ((current + ' ' + sentence).length > 1200 && current.length > 0) {
          result.push(current.trim());
          current = sentence;
        } else {
          current = current ? current + ' ' + sentence : sentence;
        }
      }
      if (current.trim()) result.push(current.trim());
    } else {
      result.push(para);
    }
  }

  return result;
}

function splitIntoSentences(text: string): string[] {
  // Simple sentence splitting - handles common financial document patterns
  const sentences = text.split(/(?<=[.!?])\s+/);
  return sentences.filter(s => s.trim().length > 0);
}

/**
 * Keyword search scoring - TF-IDF inspired
 * Returns chunks ranked by relevance to the query
 */
export function scoreChunksByRelevance(
  query: string,
  chunks: { id: string; content: string; documentId: string; chunkIndex: number; section: string | null }[],
  topK: number = 10
): { id: string; content: string; documentId: string; chunkIndex: number; section: string | null; score: number }[] {
  const queryTerms = extractTerms(query);
  if (queryTerms.length === 0) return chunks.slice(0, topK).map(c => ({ ...c, score: 0 }));

  // Calculate document frequency for each term
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

  // Score each chunk
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

    // Bonus for section heading match
    if (chunk.section) {
      for (const qt of queryTerms) {
        if (chunk.section.toLowerCase().includes(qt)) {
          score *= 1.5;
        }
      }
    }

    // Normalize by chunk length to avoid bias toward long chunks
    const normalizedScore = score / Math.max(Math.sqrt(chunkTerms.length), 1);

    return { ...chunk, score: normalizedScore };
  });

  // Sort by score descending and return top K
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

function extractTerms(text: string): string[] {
  // Simple tokenization and lowercasing
  const stopWords = new Set([
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

  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));
}
