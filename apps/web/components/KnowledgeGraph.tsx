import React, { useState, useEffect } from 'react';

interface Node {
  id: string;
  label: string;
  type: 'document' | 'entity' | 'concept';
  properties: Record<string, any>;
}

interface Edge {
  id: string;
  source: string;
  target: string;
  label: string;
  weight: number;
}

interface KnowledgeGraphProps {
  userId: string;
}

export function KnowledgeGraph({ userId }: KnowledgeGraphProps) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchGraphData();
  }, [userId]);

  const fetchGraphData = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/knowledge-graph`);
      if (response.ok) {
        const data = await response.json();
        setNodes(data.nodes);
        setEdges(data.edges);
      }
    } catch (error) {
      console.error('Failed to fetch graph data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addNode = async (label: string, type: Node['type']) => {
    try {
      const response = await fetch('/api/knowledge-graph/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, label, type }),
      });

      if (response.ok) {
        const node = await response.json();
        setNodes(prev => [...prev, node]);
      }
    } catch (error) {
      console.error('Failed to add node:', error);
    }
  };

  const addEdge = async (sourceId: string, targetId: string, label: string) => {
    try {
      const response = await fetch('/api/knowledge-graph/edges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, source: sourceId, target: targetId, label }),
      });

      if (response.ok) {
        const edge = await response.json();
        setEdges(prev => [...prev, edge]);
      }
    } catch (error) {
      console.error('Failed to add edge:', error);
    }
  };

  const getNodeColor = (type: string) => {
    const colors: Record<string, string> = {
      document: 'bg-blue-500',
      entity: 'bg-green-500',
      concept: 'bg-purple-500',
    };
    return colors[type] || 'bg-gray-500';
  };

  const filteredNodes = nodes.filter(node =>
    node.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) return <div>Loading knowledge graph...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Knowledge Graph</h2>

      {/* Controls */}
      <div className="flex gap-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search nodes..."
          className="flex-1 border rounded px-3 py-2"
        />
        <button className="px-4 py-2 bg-blue-500 text-white rounded">
          Export Graph
        </button>
      </div>

      {/* Graph Visualization Placeholder */}
      <div className="border rounded-lg p-4 h-96 flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Interactive graph visualization would display here</p>
      </div>

      {/* Node List */}
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-3">Nodes ({filteredNodes.length})</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {filteredNodes.map((node) => (
            <div
              key={node.id}
              onClick={() => setSelectedNode(node)}
              className={`p-3 rounded border-2 cursor-pointer ${
                selectedNode?.id === node.id ? 'border-blue-500' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${getNodeColor(node.type)}`} />
                <span className="text-sm font-medium capitalize">{node.type}</span>
              </div>
              <p className="text-sm">{node.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Node Details */}
      {selectedNode && (
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-semibold">{selectedNode.label}</h3>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-gray-600 hover:text-gray-800"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2">
            <p><strong>Type:</strong> {selectedNode.type}</p>
            <p><strong>ID:</strong> {selectedNode.id}</p>
            <div>
              <strong>Properties:</strong>
              <pre className="mt-1 bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                {JSON.stringify(selectedNode.properties, null, 2)}
              </pre>
            </div>
          </div>

          <div className="mt-4">
            <h4 className="font-medium mb-2">Connected Edges</h4>
            <div className="space-y-1">
              {edges
                .filter(e => e.source === selectedNode.id || e.target === selectedNode.id)
                .map((edge) => (
                  <div key={edge.id} className="text-sm text-gray-600">
                    {edge.source} → {edge.label} → {edge.target}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Node */}
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-3">Add Node</h3>
        <div className="flex gap-2">
          <input
            type="text"
            id="new-node-label"
            placeholder="Node label"
            className="flex-1 border rounded px-3 py-2"
          />
          <select id="new-node-type" className="border rounded px-3 py-2">
            <option value="document">Document</option>
            <option value="entity">Entity</option>
            <option value="concept">Concept</option>
          </select>
          <button
            onClick={() => {
              const label = (document.getElementById('new-node-label') as HTMLInputElement)?.value;
              const type = (document.getElementById('new-node-type') as HTMLSelectElement)?.value as Node['type'];
              if (label) addNode(label, type);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Add
          </button>
        </div>
      </div>

      {/* Graph Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="border rounded-lg p-4">
          <p className="text-sm text-gray-600">Total Nodes</p>
          <p className="text-2xl font-bold">{nodes.length}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-gray-600">Total Edges</p>
          <p className="text-2xl font-bold">{edges.length}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-gray-600">Avg Connections</p>
          <p className="text-2xl font-bold">
            {nodes.length > 0 ? (edges.length / nodes.length).toFixed(1) : 0}
          </p>
        </div>
      </div>
    </div>
  );
}
