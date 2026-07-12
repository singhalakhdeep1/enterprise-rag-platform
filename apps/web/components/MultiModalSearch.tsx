import React, { useState, useEffect } from 'react';

interface SearchResult {
  id: string;
  type: 'text' | 'image' | 'video' | 'audio';
  content: string;
  source: string;
  relevance: number;
  metadata: {
    mimeType?: string;
    duration?: number;
    dimensions?: string;
    fileSize?: number;
  };
}

interface MultiModalSearchProps {
  userId: string;
}

export function MultiModalSearch({ userId }: MultiModalSearchProps) {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'text' | 'image' | 'all'>('all');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleTextSearch = async () => {
    if (!query) return;

    setIsSearching(true);
    try {
      const response = await fetch('/api/search/multimodal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, query, type: searchType }),
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleImageSearch = async () => {
    if (!uploadedFile) return;

    setIsSearching(true);
    const formData = new FormData();
    formData.append('file', uploadedFile);
    formData.append('userId', userId);

    try {
      const response = await fetch('/api/search/image', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch (error) {
      console.error('Image search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const getRelevanceColor = (relevance: number) => {
    if (relevance >= 0.8) return 'bg-green-500';
    if (relevance >= 0.5) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      text: '📄',
      image: '🖼️',
      video: '🎬',
      audio: '🎵',
    };
    return icons[type] || '📄';
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Multi-Modal Search</h2>

      {/* Search Type Selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setSearchType('all')}
          className={`px-4 py-2 rounded ${searchType === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          All
        </button>
        <button
          onClick={() => setSearchType('text')}
          className={`px-4 py-2 rounded ${searchType === 'text' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Text
        </button>
        <button
          onClick={() => setSearchType('image')}
          className={`px-4 py-2 rounded ${searchType === 'image' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Image
        </button>
      </div>

      {/* Text Search */}
      {searchType !== 'image' && (
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Text Search</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter search query..."
              className="flex-1 border rounded px-3 py-2"
              onKeyPress={(e) => e.key === 'Enter' && handleTextSearch()}
            />
            <button
              onClick={handleTextSearch}
              disabled={!query || isSearching}
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>
      )}

      {/* Image Search */}
      {searchType === 'image' && (
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Image Search</h3>
          <div className="space-y-4">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files?.[0]) setUploadedFile(e.target.files[0]);
              }}
              className="w-full border rounded px-3 py-2"
            />
            {uploadedFile && (
              <div className="flex items-center gap-4">
                <img
                  src={URL.createObjectURL(uploadedFile)}
                  alt="Preview"
                  className="w-24 h-24 object-cover rounded"
                />
                <div>
                  <p className="font-medium">{uploadedFile.name}</p>
                  <p className="text-sm text-gray-600">{(uploadedFile.size / 1024).toFixed(0)} KB</p>
                </div>
              </div>
            )}
            <button
              onClick={handleImageSearch}
              disabled={!uploadedFile || isSearching}
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
            >
              {isSearching ? 'Searching...' : 'Search by Image'}
            </button>
          </div>
        </div>
      )}

      {/* Search Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold">Results ({results.length})</h3>
          {results.map((result) => (
            <div key={result.id} className="border rounded-lg p-4">
              <div className="flex items-start gap-4">
                <div className="text-3xl">{getTypeIcon(result.type)}</div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{result.content.substring(0, 100)}...</h4>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${getRelevanceColor(result.relevance)}`}
                      />
                      <span className="text-sm text-gray-600">{(result.relevance * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Source: {result.source}</p>
                  {result.metadata.mimeType && (
                    <p className="text-xs text-gray-500">{result.metadata.mimeType}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search Filters */}
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-3">Filters</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked />
            <span className="text-sm">Include documents</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked />
            <span className="text-sm">Include images</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" />
            <span className="text-sm">Include videos</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" />
            <span className="text-sm">Include audio</span>
          </label>
          <div>
            <label className="block text-sm font-medium mb-2">Min Relevance</label>
            <input
              type="range"
              min="0"
              max="100"
              defaultValue="50"
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
