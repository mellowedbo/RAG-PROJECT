# ============================================
# NEXUS — Agentic RAG for Finance
# Google Colab Notebook (Free Tier)
# ============================================
# This notebook runs the complete agentic RAG pipeline
# for financial document analysis. No API keys needed
# for the core pipeline (optional Gemini key for LLM).
# ============================================

# ╔══════════════════════════════════════════╗
# ║  Cell 1: Install Dependencies            ║
# ╚══════════════════════════════════════════╝
!pip install lancedb fastembed flashrank pydantic-settings pymupdf polars scikit-learn -q
print("✅ All dependencies installed successfully")

# ╔══════════════════════════════════════════╗
# ║  Cell 2: Clone & Initialize               ║
# ╚══════════════════════════════════════════╝
!git clone https://github.com/mellowedbo/RAG-PROJECT.git
%cd RAG-PROJECT/titanium_vault

from core.database.fusion_manager import fusion_db
from core.config import settings
from core.ingestion_v999 import semantic_chunking
from fastembed import TextEmbedding
import lancedb
import uuid
import asyncio
import time

# Initialize embedding model (runs on CPU, ~2s first load)
embedding_model = TextEmbedding(model_name=settings.VECTOR_MODEL_NAME)

print(f"🔌 Connected to: {settings.DB_PATH}")
print(f"📊 Embedding Model: {settings.VECTOR_MODEL_NAME} ({settings.VECTOR_DIM} dimensions)")
print(f"🔍 Reranker: {settings.RERANK_MODEL_NAME}")
print(f"✅ Pipeline initialized")

# ╔══════════════════════════════════════════╗
# ║  Cell 3: Ingest Financial Document        ║
# ╚══════════════════════════════════════════╝

# Replace this with any financial document text
financial_text = """
ITEM 1A. RISK FACTORS — Tesla, Inc. (2024 10-K)

We may be subject to legal proceedings, claims and litigation arising in
the ordinary course of business, including product liability claims, warranty
claims, consumer protection matters, intellectual property matters and
employment matters. We may also be subject to governmental investigations
and enforcement actions that may adversely affect our business.

We have identified a material weakness in our internal control over financial
reporting related to the design and operating effectiveness of controls over
the accuracy and completeness of certain accounting entries and processes.

Our business could be adversely affected by cybersecurity incidents, such as
ransomware attacks, data breaches, or other security incidents involving our
information technology systems or those of our third-party service providers.

Interest rate risk remains a significant factor. A 100 basis point parallel
shift in interest rates would result in an estimated $2.8 billion impact on
our fixed-income portfolio.

Revenue for the year ended December 31, 2024 was $96.8 billion, representing
an increase of 18% compared to the prior year. Automotive revenues were
$78.5 billion, an increase of 15% from 2023.

Forward Guidance: For 2025, we expect vehicle deliveries to grow by 20-25%,
energy storage deployments to grow by at least 50%, and total revenue to
exceed $110 billion.
"""

# Step 1: Semantic Chunking — cuts by meaning, not character count
chunks = semantic_chunking(financial_text, threshold=0.75)
print(f"📄 Created {len(chunks)} semantic chunks")

# Step 2: Generate Embeddings
vectors = list(embedding_model.embed(chunks))
print(f"🧮 Generated {len(vectors)} embeddings ({settings.VECTOR_DIM}d each)")

# Step 3: Insert into LanceDB with doubly-linked context graph
table = fusion_db.table
records = []

for i, (chunk, vector) in enumerate(zip(chunks, vectors)):
    records.append({
        "node_id": str(uuid.uuid4()),
        "parent_doc_id": str(uuid.uuid4()),
        "chunk_index": i,
        "vector": vector.tolist(),
        "content": chunk,
        "prev_node_id": records[-1]["node_id"] if records else None,
        "next_node_id": None,
        "source_filename": "financial_document.txt",
        "page_number": 1,
        "file_hash": f"doc_hash_{hash(financial_text) % 10000}",
    })

# Fix doubly-linked list pointers
for i in range(len(records) - 1):
    records[i]["next_node_id"] = records[i + 1]["node_id"]

# Batch insert
table.add(records)
fusion_db.optimize_indices()
print(f"✅ Indexed {len(records)} chunks in LanceDB")
print(f"📊 Total records in table: {table.count_rows()}")

# ╔══════════════════════════════════════════╗
# ║  Cell 4: Execute Agentic RAG Query        ║
# ╚══════════════════════════════════════════╝

query = "What are the key risk factors and financial outlook?"
query_vector = list(embedding_model.embed([query]))[0]

# Run the full 4-agent pipeline
print(f"\n🎯 Query: {query}")
print("⏳ Running agentic pipeline...")

start_time = time.time()

# Agent 1: Ingestion — already done (chunked above)
ingestion_time = 0

# Agent 2: Retrieval — hybrid FTS + Vector search
from core.engine_v999 import search_v999_optimized

results = await asyncio.run(
    search_v999_optimized(query, query_vector.tolist())
)
retrieval_time = time.time() - start_time

total_time = time.time() - start_time

print(f"\n⏱️  Pipeline Latency: {total_time*1000:.0f}ms")
print(f"📊 Results: {len(results)} relevant chunks found\n")

# Display results with scores
for r in results[:5]:
    score = r.get('score', 0)
    text = r.get('text', '')[:200]
    source = r.get('meta', {}).get('source', 'N/A')
    print(f"[{score:.3f}] {text}...")
    print(f"     📎 Source: {source}")
    print()

# ╔══════════════════════════════════════════╗
# ║  Cell 5: LLM Synthesis (Gemini - Free)    ║
# ╚══════════════════════════════════════════╝
# Optional: Use Google Gemini for synthesis
# This step is FREE using Google's API

!pip install google-generativeai -q

import google.generativeai as genai

# Option A: Use Colab secrets (recommended)
try:
    from google.colab import userdata
    api_key = userdata.get('GOOGLE_API_KEY')
    genai.configure(api_key=api_key)
except:
    # Option B: Paste your key directly
    # Get free key at: https://aistudio.google.com/apikey
    print("⚠️ Set your Google API key:")
    print("1. Go to https://aistudio.google.com/apikey")
    print("2. Create a free API key")
    print("3. Add it to Colab secrets as 'GOOGLE_API_KEY'")
    print("\nSkipping LLM synthesis - retrieval results shown above.")

model = genai.GenerativeModel('gemini-2.0-flash')

# Build context from retrieved chunks
context = "\n\n---\n\n".join([
    f"[Source {i+1}] {r['text']}" for i, r in enumerate(results[:5])
])

prompt = f"""Based on these financial document excerpts, provide a structured analysis:

QUERY: {query}

DOCUMENT EXCERPTS:
{context}

Provide your analysis with:
1. Key Findings
2. Risk Assessment
3. Financial Outlook
4. Limitations

Cite sources using [Source X] notation."""

response = model.generate_content(prompt)
print("\n" + "="*60)
print("NEXUS — Financial Intelligence Analysis")
print("="*60)
print(response.text)

# ╔══════════════════════════════════════════╗
# ║  Cell 6: Scale Up — Multiple PDFs          ║
# ╚══════════════════════════════════════════╝
# Load PDFs from Google Drive for scale testing

from google.colab import drive
drive.mount('/content/drive')

import os
import fitz  # PyMuPDF

pdf_dir = "/content/drive/MyDrive/financial_docs/"

if os.path.exists(pdf_dir):
    total_chunks = 0
    for filename in os.listdir(pdf_dir):
        if filename.endswith('.pdf'):
            doc = fitz.open(os.path.join(pdf_dir, filename))
            text = ""
            for page in doc:
                text += page.get_text()

            chunks = semantic_chunking(text, threshold=0.75)
            vectors = list(embedding_model.embed(chunks))

            records = []
            for i, (chunk, vector) in enumerate(zip(chunks, vectors)):
                records.append({
                    "node_id": str(uuid.uuid4()),
                    "parent_doc_id": str(uuid.uuid4()),
                    "chunk_index": i,
                    "vector": vector.tolist(),
                    "content": chunk,
                    "prev_node_id": records[-1]["node_id"] if records else None,
                    "next_node_id": None,
                    "source_filename": filename,
                    "page_number": 1,
                    "file_hash": f"hash_{hash(text) % 10000}",
                })

            for i in range(len(records) - 1):
                records[i]["next_node_id"] = records[i + 1]["node_id"]

            table.add(records)
            total_chunks += len(chunks)
            print(f"✅ {filename}: {len(chunks)} chunks indexed")

    fusion_db.optimize_indices()
    print(f"\n🚀 Total: {total_chunks} chunks across all PDFs")
    print(f"📊 Ready for queries against {table.count_rows()} total chunks")
else:
    print(f"📁 Create a 'financial_docs' folder in your Google Drive")
    print(f"   and upload PDF files (10-K, earnings, risk reports)")
    print(f"   Then re-run this cell to index them all.")

# ╔══════════════════════════════════════════╗
# ║  Cell 7: Interactive Query Loop            ║
# ╚══════════════════════════════════════════╝

def query_pipeline(question: str):
    """Full agentic RAG pipeline"""
    q_vec = list(embedding_model.embed([question]))[0]

    results = await asyncio.run(
        search_v999_optimized(question, q_vec.tolist())
    )

    if not results:
        return "No relevant information found."

    context = "\n\n".join([f"[Source {i+1}] {r['text']}" for i, r in enumerate(results[:5])])

    prompt = f"""Analyze these financial document excerpts:

QUERY: {question}

CONTEXT:
{context}

Provide structured analysis with citations [Source X]."""

    response = model.generate_content(prompt)
    return response.text

# Try it!
print("🤖 NEXUS Query Engine Ready!")
print("Ask any financial question. Type 'quit' to exit.\n")

while True:
    q = input("❓ Your question: ")
    if q.lower() in ['quit', 'exit', 'q']:
        break
    if q.strip():
        answer = query_pipeline(q)
        print(f"\n💡 {answer}\n")
        print("-" * 60)
