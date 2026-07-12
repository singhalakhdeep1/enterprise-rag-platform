import React, { useState, useEffect } from 'react';

interface OCRJob {
  id: string;
  fileName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  pagesProcessed: number;
  totalPages: number;
  extractedText: string;
  confidence: number;
  createdAt: Date;
  completedAt?: Date;
}

interface OCRForPDFsProps {
  userId: string;
}

export function OCRForPDFs({ userId }: OCRForPDFsProps) {
  const [jobs, setJobs] = useState<OCRJob[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, [userId]);

  const fetchJobs = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/ocr-jobs`);
      if (response.ok) {
        const data = await response.json();
        setJobs(data);
      }
    } catch (error) {
      console.error('Failed to fetch OCR jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const uploadAndProcess = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('userId', userId);

    try {
      const response = await fetch('/api/ocr/process', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const job = await response.json();
        setJobs(prev => [job, ...prev]);
        setSelectedFile(null);
      }
    } catch (error) {
      console.error('Failed to upload file:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      processing: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
    };
    return colors[status] || colors.pending;
  };

  if (isLoading) return <div>Loading OCR jobs...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">OCR for PDFs</h2>

      {/* Upload Section */}
      <div className="border rounded-lg p-6">
        <h3 className="font-semibold mb-4">Upload PDF for OCR Processing</h3>
        <div className="space-y-4">
          <div>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          {selectedFile && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="text-sm">{selectedFile.name}</span>
              <span className="text-xs text-gray-600">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
          )}
          <button
            onClick={uploadAndProcess}
            disabled={!selectedFile || isUploading}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
          >
            {isUploading ? 'Processing...' : 'Process PDF'}
          </button>
        </div>
      </div>

      {/* OCR Jobs List */}
      <div className="space-y-4">
        <h3 className="font-semibold">Processing History</h3>
        {jobs.map((job) => (
          <div key={job.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-medium">{job.fileName}</h4>
                <p className="text-sm text-gray-600">
                  {job.pagesProcessed} / {job.totalPages} pages
                </p>
              </div>
              <span className={`px-2 py-1 rounded text-xs ${getStatusColor(job.status)}`}>
                {job.status}
              </span>
            </div>

            {job.status === 'processing' && (
              <div className="mb-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${(job.pagesProcessed / job.totalPages) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {(job.pagesProcessed / job.totalPages * 100).toFixed(0)}% complete
                </p>
              </div>
            )}

            {job.status === 'completed' && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Confidence:</span>
                  <span className="font-medium">{(job.confidence * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Processed:</span>
                  <span className="font-medium">{new Date(job.completedAt!).toLocaleString()}</span>
                </div>
                <button className="text-blue-600 hover:text-blue-800 text-sm">
                  View Extracted Text
                </button>
              </div>
            )}

            {job.status === 'failed' && (
              <p className="text-sm text-red-600">Processing failed. Please try again.</p>
            )}
          </div>
        ))}
      </div>

      {/* OCR Settings */}
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-3">OCR Settings</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked />
            <span className="text-sm">Preserve formatting</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked />
            <span className="text-sm">Extract tables</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" />
            <span className="text-sm">Detect handwriting</span>
          </label>
          <div>
            <label className="block text-sm font-medium mb-2">Language</label>
            <select className="w-full border rounded px-3 py-2">
              <option>English</option>
              <option>Spanish</option>
              <option>French</option>
              <option>German</option>
              <option>Multi-language</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
