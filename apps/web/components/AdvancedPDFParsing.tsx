import React, { useState, useEffect } from 'react';

interface ParsedDocument {
  id: string;
  fileName: string;
  sections: {
    title: string;
    content: string;
    pageNumbers: number[];
  }[];
  metadata: {
    author?: string;
    subject?: string;
    keywords?: string[];
    creationDate?: Date;
  };
  tables: {
    id: string;
    headers: string[];
    rows: string[][];
  }[];
  extractedAt: Date;
}

interface AdvancedPDFParsingProps {
  userId: string;
}

export function AdvancedPDFParsing({ userId }: AdvancedPDFParsingProps) {
  const [documents, setDocuments] = useState<ParsedDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<ParsedDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, [userId]);

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/parsed-documents`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const parseDocument = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);

    try {
      const response = await fetch('/api/pdf/parse', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const doc = await response.json();
        setDocuments(prev => [doc, ...prev]);
        setSelectedDoc(doc);
      }
    } catch (error) {
      console.error('Failed to parse document:', error);
    }
  };

  if (isLoading) return <div>Loading documents...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Advanced PDF Parsing</h2>

      {/* Upload Section */}
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-3">Upload PDF for Parsing</h3>
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => {
            if (e.target.files?.[0]) parseDocument(e.target.files[0]);
          }}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      {/* Document List */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Document</th>
              <th className="px-4 py-3 text-left font-semibold">Sections</th>
              <th className="px-4 py-3 text-left font-semibold">Tables</th>
              <th className="px-4 py-3 text-left font-semibold">Parsed</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id} className="border-t">
                <td className="px-4 py-3 font-medium">{doc.fileName}</td>
                <td className="px-4 py-3">{doc.sections.length}</td>
                <td className="px-4 py-3">{doc.tables.length}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {new Date(doc.extractedAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setSelectedDoc(doc)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Document Detail View */}
      {selectedDoc && (
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-semibold">{selectedDoc.fileName}</h3>
            <button
              onClick={() => setSelectedDoc(null)}
              className="text-gray-600 hover:text-gray-800"
            >
              ✕
            </button>
          </div>

          {/* Metadata */}
          <div className="mb-4 p-3 bg-gray-50 rounded">
            <h4 className="font-medium text-sm mb-2">Metadata</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {selectedDoc.metadata.author && (
                <div>
                  <span className="text-gray-600">Author:</span> {selectedDoc.metadata.author}
                </div>
              )}
              {selectedDoc.metadata.subject && (
                <div>
                  <span className="text-gray-600">Subject:</span> {selectedDoc.metadata.subject}
                </div>
              )}
              {selectedDoc.metadata.keywords && (
                <div className="col-span-2">
                  <span className="text-gray-600">Keywords:</span>{' '}
                  {selectedDoc.metadata.keywords.join(', ')}
                </div>
              )}
            </div>
          </div>

          {/* Sections */}
          <div className="mb-4">
            <h4 className="font-medium mb-2">Sections</h4>
            <div className="space-y-2">
              {selectedDoc.sections.map((section, idx) => (
                <div key={idx} className="border rounded p-3">
                  <p className="font-medium">{section.title}</p>
                  <p className="text-sm text-gray-600">Pages: {section.pageNumbers.join(', ')}</p>
                  <p className="text-sm mt-1">{section.content.substring(0, 150)}...</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tables */}
          {selectedDoc.tables.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Extracted Tables</h4>
              <div className="space-y-4">
                {selectedDoc.tables.map((table) => (
                  <div key={table.id} className="border rounded overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          {table.headers.map((header, idx) => (
                            <th key={idx} className="px-3 py-2 text-left font-semibold">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {table.rows.slice(0, 5).map((row, rowIdx) => (
                          <tr key={rowIdx} className="border-t">
                            {row.map((cell, cellIdx) => (
                              <td key={cellIdx} className="px-3 py-2">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
