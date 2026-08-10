import unittest
from apps.worker.pgvector_indexer import VectorEmbeddingStore

class TestEnterpriseRAG(unittest.TestCase):
    def test_vector_cosine_similarity(self):
        store = VectorEmbeddingStore()
        v1 = [1.0, 0.0, 0.0]
        v2 = [1.0, 0.0, 0.0]
        v3 = [0.0, 1.0, 0.0]

        self.assertAlmostEqual(store.cosine_similarity(v1, v2), 1.0)
        self.assertAlmostEqual(store.cosine_similarity(v1, v3), 0.0)

    def test_vector_query(self):
        store = VectorEmbeddingStore()
        store.insert_chunk("doc1", "c1", [0.9, 0.1, 0.0], "RAG Architecture Docs")
        store.insert_chunk("doc1", "c2", [0.0, 0.9, 0.1], "Unrelated Content")

        matches = store.query([0.95, 0.05, 0.0], top_k=1)
        self.assertEqual(len(matches), 1)
        self.assertEqual(matches[0][1], "RAG Architecture Docs")

if __name__ == '__main__':
    unittest.main()
