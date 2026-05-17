/**
 * Chunking Engine
 * Recursive character splitting with section-heading awareness
 */

export interface ChunkOutput {
  content: string;
  chunkIndex: number;
  section: string | null;
  wordCount: number;
  charCount: number;
}

/**
 * Recursive character text splitter.
 * Tries separators in priority order: double newline, single newline,
 * sentence boundary, space, then character-level as last resort.
 */
export function chunkTextRecursive(
  text: string,
  options: { chunkSize?: number; overlap?: number; minChunkSize?: number } = {}
): ChunkOutput[] {
  const {
    chunkSize = 800,
    overlap = 120,
    minChunkSize = 80,
  } = options;

  if (!text || text.trim().length === 0) return [];

  const separators = ['\n\n', '\n', '. ', '? ', '! ', '; ', ', ', ' '];

  const rawChunks = splitRecursive(text, separators, chunkSize, overlap, 0);

  // Post-process: detect section headings and assign metadata
  const sectionRegex = /^(?:ITEM\s+\d+[A-Z]?\.?|PART\s+[IVX]+|SECTION\s+\d+|RISK\s+FACTORS|MD&A|MANAGEMENT.S\s+DISCUSSION|EXECUTIVE\s+SUMMARY|CREDIT\s+RISK|MARKET\s+RISK|OPERATIONAL\s+RISK|REGULATORY|COMPLIANCE|FINANCIAL\s+HIGHLIGHTS|CLIMATE|ESG)/i;

  const chunks: ChunkOutput[] = [];
  let currentSection: string | null = null;

  for (let i = 0; i < rawChunks.length; i++) {
    const raw = rawChunks[i].trim();
    if (raw.length < minChunkSize && i < rawChunks.length - 1) {
      // Too small — merge with next chunk
      rawChunks[i + 1] = raw + '\n\n' + rawChunks[i + 1];
      continue;
    }

    const sectionMatch = raw.match(sectionRegex);
    if (sectionMatch) {
      currentSection = sectionMatch[0].toUpperCase();
    }

    const words = raw.split(/\s+/).filter(w => w.length > 0);
    chunks.push({
      content: raw,
      chunkIndex: chunks.length,
      section: currentSection,
      wordCount: words.length,
      charCount: raw.length,
    });
  }

  return chunks;
}

function splitRecursive(
  text: string,
  separators: string[],
  chunkSize: number,
  overlap: number,
  sepIndex: number
): string[] {
  if (text.length <= chunkSize) return [text];

  // If we've exhausted all separators, do character-level split
  if (sepIndex >= separators.length) {
    const result: string[] = [];
    for (let i = 0; i < text.length; i += chunkSize - overlap) {
      result.push(text.slice(i, i + chunkSize));
    }
    return result;
  }

  const sep = separators[sepIndex];
  const parts = text.split(sep);
  const result: string[] = [];
  let current = '';

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const candidate = current ? current + sep + part : part;

    if (candidate.length > chunkSize && current.length > 0) {
      result.push(current);
      // Keep overlap from end of current chunk
      const overlapText = current.length > overlap ? current.slice(-overlap) : current;
      current = overlapText + sep + part;

      // If even a single part exceeds chunkSize, recurse with next separator
      if (part.length > chunkSize) {
        const subParts = splitRecursive(part, separators, chunkSize, overlap, sepIndex + 1);
        // The last subPart goes into current (it may still accumulate)
        result.push(...subParts.slice(0, -1));
        current = subParts[subParts.length - 1] || '';
      }
    } else {
      current = candidate;
    }
  }

  if (current.trim()) {
    result.push(current);
  }

  // Check if any chunks are still too long — recurse them with next separator
  const final: string[] = [];
  for (const chunk of result) {
    if (chunk.length > chunkSize * 1.5) {
      final.push(...splitRecursive(chunk, separators, chunkSize, overlap, sepIndex + 1));
    } else {
      final.push(chunk);
    }
  }

  return final;
}

/**
 * Legacy paragraph-based chunker (backward compatible).
 * Kept for Demo Mode which uses pre-chunked data.
 */
export function chunkTextParagraph(
  text: string,
  maxChunkSize = 800,
  minChunkSize = 80,
  overlapSize = 60
): ChunkOutput[] {
  if (!text || text.trim().length === 0) return [];

  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const chunks: ChunkOutput[] = [];
  let currentChunk = '';
  let chunkIndex = 0;
  let currentSection: string | null = null;

  const sectionRegex = /^(?:ITEM\s+\d+[A-Z]?|PART\s+[IVX]+|SECTION\s+\d+|CHAPTER\s+\d+|RISK\s+FACTORS|MD&A)/i;

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    const sectionMatch = trimmed.match(sectionRegex);
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
      currentSection = sectionMatch[0].toUpperCase();
    } else if (
      currentChunk.length + trimmed.length > maxChunkSize &&
      currentChunk.trim().length >= minChunkSize
    ) {
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
