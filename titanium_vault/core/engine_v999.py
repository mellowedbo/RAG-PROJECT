import asyncio
import polars as pl
from flashrank import Ranker, RerankRequest
from core.database.fusion_manager import fusion_db
from core.config import settings

# Initialize Ranker (Assuming Global is desired for cache persistence)
# NOTE: Ensure this model path is cached locally to avoid re-downloading.
ranker = Ranker(model_name=settings.RERANK_MODEL_NAME)

async def search_v999_optimized(query_text: str, query_vector: list):
    tbl = fusion_db.table

    # Define columns to select STRICTLY to ensure schemas match for concatenation
    # We do NOT select 'score' or 'distance' because they are incomparable
    # between FTS and Vector search. We rely on the Reranker for the final score.
    target_cols = ["node_id", "content", "source_filename", "page_number"]

    try:
        # --- PHASE 1: Parallel Retrieval (Non-Blocking) ---

        # 1. Keyword Search
        fts_job = asyncio.to_thread(
            lambda: tbl.search(query_text, query_type="fts")
            .limit(50) # Adjusted: 50 high quality FTS
            .select(target_cols)
            .to_polars()
        )

        # 2. Vector Search
        vec_job = asyncio.to_thread(
            lambda: tbl.search(query_vector)
            .nprobes(20)
            .limit(50) # Adjusted: 50 high quality Vector
            .select(target_cols)
            .to_polars()
        )

        # Execute IO operations in parallel
        fts_df, vec_df = await asyncio.gather(fts_job, vec_job)

        # --- PHASE 2: The "Silicon Merge" ---

        # Guard against empty results immediately
        if fts_df.is_empty() and vec_df.is_empty():
            return []

        # Concat and Deduplicate
        # We explicitly cast to ensure schema consistency if types vary slightly
        candidates_df = pl.concat([fts_df, vec_df], how="vertical").unique(subset=["node_id"])

        if candidates_df.height == 0:
            return []

        # OPTIMIZATION: Construct Rerank Inputs efficiently
        # Instead of double looping, we do one transformation.
        # We convert to a list of dicts that ALREADY fits the FlashRank structure.

        # Note: Flashrank expects id, text, and optional meta.
        # We use map_rows or iter_rows for slightly better performance than to_dicts loop,
        # but standard python list comp is readable and fast enough for <200 items.

        passages_list = [
            {
                "id": row["node_id"],
                "text": row["content"],
                "meta": {
                    "source": row["source_filename"],
                    "page": row["page_number"]
                }
            }
            for row in candidates_df.iter_rows(named=True)
        ]

        # --- PHASE 3: Non-Blocking Judgment ---

        rerank_request = RerankRequest(query=query_text, passages=passages_list)

        # FIX: Run the heavy CPU Ranker in a thread to keep the event loop alive
        results = await asyncio.to_thread(ranker.rank, rerank_request)

        # Return Top 5
        return results[:5]

    except Exception as e:
        # Log the error in production
        print(f"Search failed: {e}")
        return []
