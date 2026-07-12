import React, { useState, useEffect } from 'react';

interface VerificationResult {
  id: string;
  sourceUrl: string;
  sourceTitle: string;
  claim: string;
  status: 'verified' | 'unverified' | 'disputed' | 'pending';
  confidence: number;
  evidence: string[];
  verifiedAt: Date;
}

interface SourceVerificationProps {
  userId: string;
}

export function SourceVerification({ userId }: SourceVerificationProps) {
  const [claimInput, setClaimInput] = useState('');
  const [results, setResults] = useState<VerificationResult[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [selectedResult, setSelectedResult] = useState<VerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchVerifications();
  }, [userId]);

  const fetchVerifications = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/verifications`);
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch (error) {
      console.error('Failed to fetch verifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyClaim = async () => {
    if (!claimInput) return;

    setIsVerifying(true);
    try {
      const response = await fetch('/api/verify-source', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, claim: claimInput }),
      });

      if (response.ok) {
        const result = await response.json();
        setResults(prev => [result, ...prev]);
        setSelectedResult(result);
        setClaimInput('');
      }
    } catch (error) {
      console.error('Verification failed:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      verified: 'bg-green-100 text-green-700',
      unverified: 'bg-red-100 text-red-700',
      disputed: 'bg-yellow-100 text-yellow-700',
      pending: 'bg-gray-100 text-gray-700',
    };
    return colors[status] || colors.pending;
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, string> = {
      verified: '✓',
      unverified: '✗',
      disputed: '⚠',
      pending: '⟳',
    };
    return icons[status] || '⟳';
  };

  if (isLoading) return <div>Loading verifications...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Source Verification</h2>

      {/* Claim Input */}
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-3">Verify Claim</h3>
        <div className="space-y-4">
          <textarea
            value={claimInput}
            onChange={(e) => setClaimInput(e.target.value)}
            placeholder="Enter a claim or statement to verify..."
            className="w-full border rounded px-3 py-2"
            rows={3}
          />
          <button
            onClick={verifyClaim}
            disabled={!claimInput || isVerifying}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
          >
            {isVerifying ? 'Verifying...' : 'Verify'}
          </button>
        </div>
      </div>

      {/* Verification Results */}
      <div className="space-y-4">
        <h3 className="font-semibold">Verification History</h3>
        {results.map((result) => (
          <div
            key={result.id}
            onClick={() => setSelectedResult(result)}
            className={`border rounded-lg p-4 cursor-pointer ${
              selectedResult?.id === result.id ? 'border-blue-500' : ''
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs ${getStatusColor(result.status)}`}>
                  {getStatusIcon(result.status)} {result.status}
                </span>
                <span className="text-sm font-medium">
                  {(result.confidence * 100).toFixed(0)}% confidence
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {new Date(result.verifiedAt).toLocaleString()}
              </span>
            </div>
            <p className="text-sm">{result.claim}</p>
            <p className="text-sm text-gray-600 mt-1">Source: {result.sourceTitle}</p>
          </div>
        ))}
      </div>

      {/* Result Detail */}
      {selectedResult && (
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-semibold">Verification Details</h3>
            <button
              onClick={() => setSelectedResult(null)}
              className="text-gray-600 hover:text-gray-800"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Claim</p>
              <p className="font-medium">{selectedResult.claim}</p>
            </div>

            <div className="flex items-center gap-4">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <span className={`px-2 py-1 rounded text-sm ${getStatusColor(selectedResult.status)}`}>
                  {getStatusIcon(selectedResult.status)} {selectedResult.status}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Confidence</p>
                <p className="font-medium">{(selectedResult.confidence * 100).toFixed(1)}%</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600">Source</p>
              <p className="font-medium">{selectedResult.sourceTitle}</p>
              <a href={selectedResult.sourceUrl} target="_blank" className="text-blue-600 hover:text-blue-800 text-sm">
                {selectedResult.sourceUrl}
              </a>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">Evidence</p>
              <div className="space-y-2">
                {selectedResult.evidence.map((evidence, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded text-sm">
                    {evidence}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button className="px-3 py-1 bg-green-500 text-white rounded text-sm">
                Mark as Verified
              </button>
              <button className="px-3 py-1 bg-red-500 text-white rounded text-sm">
                Mark as False
              </button>
              <button className="px-3 py-1 border rounded text-sm">
                Flag for Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="border rounded-lg p-4">
          <p className="text-sm text-gray-600">Verified</p>
          <p className="text-2xl font-bold text-green-600">
            {results.filter(r => r.status === 'verified').length}
          </p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-gray-600">Unverified</p>
          <p className="text-2xl font-bold text-red-600">
            {results.filter(r => r.status === 'unverified').length}
          </p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-gray-600">Disputed</p>
          <p className="text-2xl font-bold text-yellow-600">
            {results.filter(r => r.status === 'disputed').length}
          </p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-gray-600">Avg Confidence</p>
          <p className="text-2xl font-bold">
            {results.length > 0
              ? (results.reduce((sum, r) => sum + r.confidence, 0) / results.length * 100).toFixed(1)
              : 0}%
          </p>
        </div>
      </div>
    </div>
  );
}
