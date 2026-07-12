import React, { useState, useEffect } from 'react';

interface Citation {
  id: string;
  sourceId: string;
  sourceTitle: string;
  pageNumber: number;
  text: string;
  confidence: number;
}

interface CitationHighlightingProps {
  userId: string;
}

export function CitationHighlighting({ userId }: CitationHighlightingProps) {
  const [documentContent, setDocumentContent] = useState('');
  const [citations, setCitations] = useState<Citation[]>([]);
  const [showCitations, setShowCitations] = useState(true);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);

  const sampleDocument = `Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience. It focuses on developing computer programs that can access data and use it to learn for themselves.

Deep learning is a type of machine learning that uses neural networks with multiple layers. These networks are inspired by the structure of the human brain and can learn complex patterns in data.

Natural language processing (NLP) is a branch of AI that helps computers understand, interpret and manipulate human language. NLP powers many applications we use daily, from translation software to chatbots.`;

  useEffect(() => {
    setDocumentContent(sampleDocument);
    // Simulated citations
    setCitations([
      {
        id: '1',
        sourceId: 'doc-1',
        sourceTitle: 'Introduction to Machine Learning',
        pageNumber: 12,
        text: 'Machine learning is a subset of artificial intelligence',
        confidence: 0.95,
      },
      {
        id: '2',
        sourceId: 'doc-2',
        sourceTitle: 'Deep Learning Fundamentals',
        pageNumber: 45,
        text: 'Deep learning is a type of machine learning that uses neural networks',
        confidence: 0.88,
      },
      {
        id: '3',
        sourceId: 'doc-3',
        sourceTitle: 'NLP Applications',
        pageNumber: 23,
        text: 'Natural language processing (NLP) is a branch of AI',
        confidence: 0.92,
      },
    ]);
  }, []);

  const highlightCitations = (text: string) => {
    if (!showCitations) return text;

    let highlightedText = text;
    citations.forEach((citation, idx) => {
      const regex = new RegExp(citation.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      highlightedText = highlightedText.replace(
        regex,
        `<mark class="bg-yellow-200 cursor-pointer" data-citation="${idx}">$&</mark>`
      );
    });

    return highlightedText;
  };

  const handleCitationClick = (idx: number) => {
    setSelectedCitation(citations[idx]);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Citation Highlighting</h2>

      {/* Controls */}
      <div className="flex gap-4 items-center">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showCitations}
            onChange={(e) => setShowCitations(e.target.checked)}
          />
          <span className="text-sm">Show Citations</span>
        </label>
        <button className="px-4 py-2 bg-blue-500 text-white rounded">
          Export with Citations
        </button>
      </div>

      {/* Document with Highlights */}
      <div className="border rounded-lg p-6">
        <h3 className="font-semibold mb-4">Document</h3>
        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{
            __html: highlightCitations(documentContent).replace(/\n/g, '<br />'),
          }}
          onClick={() => {
            const mark = document.querySelector('mark[data-citation]') as HTMLElement;
            if (mark) {
              const idx = parseInt(mark.dataset.citation || '0');
              handleCitationClick(idx);
            }
          }}
        />
      </div>

      {/* Citation Panel */}
      {showCitations && (
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Citations ({citations.length})</h3>
          <div className="space-y-3">
            {citations.map((citation, idx) => (
              <div
                key={citation.id}
                onClick={() => setSelectedCitation(citation)}
                className={`p-3 rounded cursor-pointer ${
                  selectedCitation?.id === citation.id ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <p className="font-medium text-sm">{citation.sourceTitle}</p>
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                    {(citation.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-sm text-gray-600">Page {citation.pageNumber}</p>
                <p className="text-xs text-gray-500 mt-1">"{citation.text}"</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Citation Detail */}
      {selectedCitation && (
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-semibold">Citation Details</h3>
            <button
              onClick={() => setSelectedCitation(null)}
              className="text-gray-600 hover:text-gray-800"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2">
            <p><strong>Source:</strong> {selectedCitation.sourceTitle}</p>
            <p><strong>Page:</strong> {selectedCitation.pageNumber}</p>
            <p><strong>Confidence:</strong> {(selectedCitation.confidence * 100).toFixed(1)}%</p>
            <div>
              <strong>Cited Text:</strong>
              <p className="mt-1 p-3 bg-gray-50 rounded text-sm">{selectedCitation.text}</p>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button className="px-3 py-1 bg-blue-500 text-white rounded text-sm">
              View Source
            </button>
            <button className="px-3 py-1 border rounded text-sm">
              Verify Citation
            </button>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="border rounded-lg p-4">
          <p className="text-sm text-gray-600">Total Citations</p>
          <p className="text-2xl font-bold">{citations.length}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-gray-600">Avg Confidence</p>
          <p className="text-2xl font-bold">
            {citations.length > 0
              ? (citations.reduce((sum, c) => sum + c.confidence, 0) / citations.length * 100).toFixed(1)
              : 0}%
          </p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-gray-600">Unique Sources</p>
          <p className="text-2xl font-bold">
            {new Set(citations.map(c => c.sourceId)).size}
          </p>
        </div>
      </div>
    </div>
  );
}
