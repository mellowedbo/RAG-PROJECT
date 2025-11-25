from datetime import datetime
from typing import Optional, List
from lancedb.pydantic import LanceModel, Vector
from core.config import settings

class SemanticNode(LanceModel):
    """
    The Atomic Unit of the Knowledge Graph.

    Architecture:
    - Hybrid Storage: Dense Vector + Sparse Keyword (Content)
    - Graph-Lite: Doubly Linked List (prev/next) for context window expansion.
    - Lineage: parent_doc_id allowing for cascading deletes.
    """

    # --- Identity ---
    node_id: str             # UUID v4: Unique Chunk ID
    parent_doc_id: str       # UUID v4: ID of the source PDF/File
    chunk_index: int         # Integer sequence for sorting (0, 1, 2...)

    # --- Semantics ---
    # The actual vector embedding (Fixed dimension via Config)
    vector: Vector(settings.VECTOR_DIM) # type: ignore

    # --- Content (FTS Enabled) ---
    content: str             # The raw text chunk

    # --- Graph Edges (The "Contextual Mesh") ---
    prev_node_id: Optional[str] = None  # Pointer to previous context
    next_node_id: Optional[str] = None  # Pointer to next context

    # --- Metadata ---
    source_filename: str     # Origin filename
    page_number: int         # Page reference
    file_hash: str           # MD5 of file content (Idempotency)

    # --- Temporal ---
    created_at: datetime = datetime.now()

    class Config:
        # Pydantic V2 config to validate defaults
        validate_assignment = True
