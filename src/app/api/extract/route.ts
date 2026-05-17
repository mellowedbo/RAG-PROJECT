import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const filename = file.name.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());
    let text = '';

    if (filename.endsWith('.txt') || filename.endsWith('.md')) {
      // Plain text — read as UTF-8
      text = buffer.toString('utf-8');
    } else if (filename.endsWith('.pdf')) {
      // PDF extraction using pdf-parse
      try {
        const pdfParse = (await import('pdf-parse')).default;
        const data = await pdfParse(buffer);
        text = data.text;
      } catch {
        return NextResponse.json(
          { error: 'PDF extraction failed. pdf-parse may not be installed or PDF may be scanned (image-only).' },
          { status: 422 }
        );
      }
    } else if (filename.endsWith('.docx')) {
      // Word extraction using mammoth
      try {
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ buffer });
        text = result.value;
      } catch {
        return NextResponse.json(
          { error: 'Word document extraction failed. mammoth may not be installed.' },
          { status: 422 }
        );
      }
    } else {
      return NextResponse.json(
        { error: `Unsupported file format: ${filename.split('.').pop()}. Supported: .txt, .md, .pdf, .docx` },
        { status: 400 }
      );
    }

    // Text cleaning
    text = text
      .replace(/\r\n/g, '\n')          // Normalize line endings
      .replace(/\n{3,}/g, '\n\n')      // Collapse multiple blank lines
      .replace(/[^\S\n]+$/gm, '')       // Trim trailing whitespace per line
      .replace(/^\s+$/gm, '')           // Remove whitespace-only lines
      .replace(/\t/g, '  ')             // Tabs to spaces
      .trim();

    if (text.length === 0) {
      return NextResponse.json(
        { error: 'No text could be extracted from this file. It may be a scanned PDF (image-only) or an empty document.' },
        { status: 422 }
      );
    }

    return NextResponse.json({
      text,
      filename: file.name,
      chars: text.length,
      words: text.split(/\s+/).filter(w => w.length > 0).length,
    });
  } catch (error) {
    console.error('File extraction error:', error);
    return NextResponse.json(
      { error: 'Failed to extract text from file.' },
      { status: 500 }
    );
  }
}

