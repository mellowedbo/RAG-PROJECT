import lancedb
from lancedb.table import Table
from core.config import settings
from core.database.schema import SemanticNode

class FusionDBManager:
    """
    Manages the connection and the primary data table in LanceDB.
    Follows a singleton pattern to ensure one connection object.
    """

    def __init__(self):
        self.db = lancedb.connect(settings.DB_PATH)
        self.table_name = "titanium_fusion_graph"
        self._table = None

    @property
    def table(self) -> Table:
        """
        Provides access to the LanceDB table, creating it if it doesn't exist.
        Caches the table object for performance.
        """
        if self._table is not None:
            return self._table

        if self.table_name in self.db.table_names():
            self._table = self.db.open_table(self.table_name)
        else:
            print(f"[FUSION_DB] Initializing new Fusion Graph: {self.table_name}")
            self._table = self.db.create_table(
                self.table_name,
                schema=SemanticNode,
                mode="overwrite"
            )
            print("[FUSION_DB] Building FTS Index on 'content'...")
            self._table.create_fts_index("content", replace=True)

        return self._table

    def optimize_indices(self):
        """
        Maintenance routine. Run this after bulk ingestion.
        Compacts fragments and updates the FTS index.
        """
        print("[FUSION_DB] Optimizing storage layout and indices...")

        # 1. Compact small files (Critical for i3 HDD/SSD performance)
        self.table.compact_files()

        # 2. Cleanup old versions
        self.table.cleanup_old_versions()

        # 3. Re-index FTS (LanceDB FTS is not real-time auto-updating in all versions)
        # Note: Depending on LanceDB version, create_fts_index with replace=True
        # acts as the updater.
        print("[FUSION_DB] Re-indexing FTS on 'content'...")
        self.table.create_fts_index("content", replace=True)
        print("[FUSION_DB] Optimization complete.")

# Singleton Instance for global access
fusion_db = FusionDBManager()
