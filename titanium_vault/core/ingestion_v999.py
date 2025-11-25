import numpy as np
from typing import List
from sklearn.metrics.pairwise import cosine_similarity
from fastembed import TextEmbedding
from core.config import settings

# The "Sensor" Model - Tiny, fast, just for detecting topic shifts
splitter_model = TextEmbedding(model_name=settings.VECTOR_MODEL_NAME)

def semantic_chunking(text: str, threshold: float = 0.75) -> List[str]:
    """
    The 'Neural Scapel'.
    Instead of cutting by character count, we cut by meaning.
    """
    # 1. Naive Sentence Split (Fast)
    sentences = [s.strip() for s in text.replace('\n', ' ').split('.') if s.strip()]

    if not sentences:
        return []

    # 2. Embed Every Sentence (This is fast on i3 for single sentences)
    # We get a matrix of (N_sentences, 384)
    embeddings = list(splitter_model.embed(sentences))

    # 3. Calculate "Semantic Velocity"
    # Measure distance between S[i] and S[i+1]
    chunks = []
    current_chunk = [sentences[0]]

    for i in range(len(embeddings) - 1):
        # Cosine Similarity between current sentence and next
        sim = cosine_similarity([embeddings[i]], [embeddings[i+1]])[0][0]

        # If similarity is high, they belong together.
        # If similarity drops below threshold (e.g. 0.75), TOPIC SHIFT -> Split.
        if sim >= threshold:
            current_chunk.append(sentences[i+1])
        else:
            chunks.append(" ".join(current_chunk) + ".")
            current_chunk = [sentences[i+1]]

    # Flush remainder
    if current_chunk:
        chunks.append(" ".join(current_chunk) + ".")

    return chunks
