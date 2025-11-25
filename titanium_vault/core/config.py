import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # --- Project Identity ---
    PROJECT_NAME: str = "Titanium Vault v999"

    # --- Paths ---
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    DB_PATH: str = os.path.join(BASE_DIR, "data", "titanium-db")

    # --- Vector Model (FastEmbed) ---
    # BAAI/bge-small-en-v1.5 is great, but creating the configuration
    # ensures we stick to the quantized version if available.
    VECTOR_MODEL_NAME: str = "BAAI/bge-small-en-v1.5"
    VECTOR_DIM: int = 384

    # --- Reranker (FlashRank) ---
    # ms-marco-TinyBERT-L-2-v2 is ~4MB and runs effectively instantly on CPU
    RERANK_MODEL_NAME: str = "ms-marco-TinyBERT-L-2-v2"

    # --- Ingestion Constraints ---
    CHUNK_SIZE: int = 512
    CHUNK_OVERLAP: int = 50

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()

# Ensure data directory exists on load
os.makedirs(settings.DB_PATH, exist_ok=True)
