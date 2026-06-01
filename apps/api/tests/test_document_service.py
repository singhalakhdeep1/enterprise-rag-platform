import tempfile
import unittest
from pathlib import Path

from app.models.schemas import AnswerRequest, DocumentUploadRequest, EvaluationRequest, SearchRequest
from app.services.document_service import DocumentService


class DocumentServiceTestCase(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        store_path = Path(self.temp_dir.name) / "store.json"
        self.service = DocumentService()
        self.service._documents = {}
        self.service._contents = {}
        self.service._chunks = {}
        self.service._evaluations = []
        self.service._queries_run = 0
        self.service._search_terms = {}
        self.service._store_path = store_path

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def test_upload_search_answer_and_export_flow(self) -> None:
        record = self.service.upload(
            DocumentUploadRequest(
                title="Security Handbook",
                tenant_id="acme",
                source_type="policy",
                content=(
                    "Administrators must use MFA for production access. Incident response requires "
                    "stakeholder updates every 30 minutes until containment is complete."
                ),
            )
        )

        self.assertEqual(record.tenant_id, "acme")
        self.assertGreaterEqual(record.chunk_count, 1)

        search = self.service.search(SearchRequest(tenant_id="acme", query="MFA production access", top_k=3))
        self.assertGreaterEqual(len(search.results), 1)
        self.assertEqual(search.results[0].title, "Security Handbook")

        answer = self.service.answer(AnswerRequest(tenant_id="acme", question="What is required for production access?"))
        self.assertGreater(answer.confidence, 0.2)
        self.assertGreaterEqual(len(answer.citations), 1)

        evaluation = self.service.evaluate(
            EvaluationRequest(
                tenant_id="acme",
                question="What is required for production access?",
                expected_keywords=["MFA", "production"],
            )
        )
        self.assertEqual(evaluation.tenant_id, "acme")
        self.assertEqual(len(evaluation.metrics), 3)

        exported = self.service.export_tenant("acme")
        self.assertEqual(exported.tenant_id, "acme")
        self.assertEqual(len(exported.documents), 1)
        self.assertGreaterEqual(len(exported.chunks), 1)
        self.assertEqual(len(exported.evaluations), 1)

    def test_reset_tenant_removes_documents_and_evaluations(self) -> None:
        self.service.upload(
            DocumentUploadRequest(
                title="Ops Guide",
                tenant_id="ops",
                source_type="runbook",
                content="Escalate pager alerts immediately and document follow-up actions in the incident timeline.",
            )
        )
        self.service.evaluate(
            EvaluationRequest(
                tenant_id="ops",
                question="How should alerts be handled?",
                expected_keywords=["alerts", "incident"],
            )
        )

        reset = self.service.reset_tenant("ops")
        self.assertEqual(reset.removed_documents, 1)
        self.assertEqual(reset.removed_evaluations, 1)
        self.assertEqual(self.service.analytics("ops").total_documents, 0)


if __name__ == "__main__":
    unittest.main()