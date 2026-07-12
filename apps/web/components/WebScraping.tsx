import React, { useState, useEffect } from 'react';

interface ScrapedContent {
  id: string;
  url: string;
  title: string;
  content: string;
  status: 'pending' | 'scraping' | 'completed' | 'failed';
  scrapedAt?: Date;
  metadata: {
    wordCount: number;
    imageCount: number;
    linksCount: number;
  };
}

interface WebScrapingProps {
  userId: string;
}

export function WebScraping({ userId }: WebScrapingProps) {
  const [scrapedContent, setScrapedContent] = useState<ScrapedContent[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ScrapedContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchScrapedContent();
  }, [userId]);

  const fetchScrapedContent = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/scraped-content`);
      if (response.ok) {
        const data = await response.json();
        setScrapedContent(data);
      }
    } catch (error) {
      console.error('Failed to fetch scraped content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const scrapeUrl = async () => {
    if (!urlInput) return;

    setIsScraping(true);
    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput, userId }),
      });

      if (response.ok) {
        const content = await response.json();
        setScrapedContent(prev => [content, ...prev]);
        setUrlInput('');
      }
    } catch (error) {
      console.error('Failed to scrape URL:', error);
    } finally {
      setIsScraping(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      scraping: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
    };
    return colors[status] || colors.pending;
  };

  if (isLoading) return <div>Loading scraped content...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Web Scraping</h2>

      {/* URL Input */}
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-3">Scrape URL</h3>
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 border rounded px-3 py-2"
          />
          <button
            onClick={scrapeUrl}
            disabled={!urlInput || isScraping}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
          >
            {isScraping ? 'Scraping...' : 'Scrape'}
          </button>
        </div>
      </div>

      {/* Scraped Content List */}
      <div className="space-y-4">
        <h3 className="font-semibold">Scraped Content</h3>
        {scrapedContent.map((content) => (
          <div key={content.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-medium">{content.title}</h4>
                <p className="text-sm text-gray-600">{content.url}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs ${getStatusColor(content.status)}`}>
                {content.status}
              </span>
            </div>

            <div className="flex gap-4 text-sm text-gray-600 mb-2">
              <span>{content.metadata.wordCount} words</span>
              <span>{content.metadata.imageCount} images</span>
              <span>{content.metadata.linksCount} links</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedContent(content)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                View Content
              </button>
              <button className="text-gray-600 hover:text-gray-800 text-sm">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Content Detail View */}
      {selectedContent && (
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-semibold">{selectedContent.title}</h3>
            <button
              onClick={() => setSelectedContent(null)}
              className="text-gray-600 hover:text-gray-800"
            >
              ✕
            </button>
          </div>

          <div className="mb-4 p-3 bg-gray-50 rounded text-sm">
            <p><strong>URL:</strong> {selectedContent.url}</p>
            <p><strong>Scraped:</strong> {selectedContent.scrapedAt?.toLocaleString()}</p>
          </div>

          <div className="mb-4">
            <h4 className="font-medium mb-2">Content Preview</h4>
            <div className="p-3 bg-gray-50 rounded max-h-64 overflow-y-auto">
              <p className="text-sm whitespace-pre-wrap">{selectedContent.content.substring(0, 2000)}...</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="border rounded p-3 text-center">
              <p className="text-2xl font-bold">{selectedContent.metadata.wordCount}</p>
              <p className="text-sm text-gray-600">Words</p>
            </div>
            <div className="border rounded p-3 text-center">
              <p className="text-2xl font-bold">{selectedContent.metadata.imageCount}</p>
              <p className="text-sm text-gray-600">Images</p>
            </div>
            <div className="border rounded p-3 text-center">
              <p className="text-2xl font-bold">{selectedContent.metadata.linksCount}</p>
              <p className="text-sm text-gray-600">Links</p>
            </div>
          </div>
        </div>
      )}

      {/* Scraping Settings */}
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-3">Scraping Settings</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked />
            <span className="text-sm">Extract images</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked />
            <span className="text-sm">Follow links (depth: 1)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" />
            <span className="text-sm">Include JavaScript-rendered content</span>
          </label>
          <div>
            <label className="block text-sm font-medium mb-2">User Agent</label>
            <select className="w-full border rounded px-3 py-2">
              <option>Chrome (Desktop)</option>
              <option>Firefox (Desktop)</option>
              <option>Safari (Mobile)</option>
              <option>Custom</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
