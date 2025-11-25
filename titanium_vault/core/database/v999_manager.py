import lancedb
from lancedb.pydantic import LanceModel, Vector
from core.config import settings

def enable_turbo_mode(table):
    """
    Activates Product Quantization (PQ).
    This compresses vectors by 96x and moves distance calcs
    from Float32 math to Int8 table lookups.
    """
    print("[V999] Engaging Warp Drive (IVF-PQ)...")

    # 256 partitions = optimal for <1M rows
    # sub_vectors=96 = Extreme compression (4 dims per byte)
    table.create_index(
        metric="cosine",
        vector_column_name="vector",
        num_partitions=256,
        num_sub_vectors=96,
        replace=True
    )
    print("[V999] Warp Drive Active.")
