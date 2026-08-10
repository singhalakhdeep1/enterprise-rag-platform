import math

class VectorEmbeddingStore:
    def __init__(self):
        self.vectors = {}

    def insert_chunk(self, doc_id: str, chunk_id: str, vector: list[float], text: str):
        self.vectors[chunk_id] = {
            "doc_id": doc_id,
            "vector": vector,
            "text": text
        }

    def cosine_similarity(self, v1: list[float], v2: list[float]) -> float:
        dot = sum(a * b for a, b in zip(v1, v2))
        norm1 = math.sqrt(sum(a * a for a in v1))
        norm2 = math.sqrt(sum(b * b for b in v2))
        return dot / (norm1 * norm2) if norm1 and norm2 else 0.0

    def query(self, query_vector: list[float], top_k: int = 3):
        results = []
        for cid, data in self.vectors.items():
            sim = self.cosine_similarity(query_vector, data["vector"])
            results.append((sim, data["text"]))
        results.sort(key=lambda x: x[0], reverse=True)
        return results[:top_k]
