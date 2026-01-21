'use client';

import { useState, useEffect } from 'react';
import { KnowledgeNode } from '@/types';
import { tracking } from '@/lib/tracking';

interface KnowledgeBaseProps {
  onClose?: () => void;
}

export default function KnowledgeBase({ onClose }: KnowledgeBaseProps) {
  const [knowledgeTree, setKnowledgeTree] = useState<KnowledgeNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch knowledge tree from API
    fetch('/api/knowledge')
      .then((res) => res.json())
      .then((data) => {
        setKnowledgeTree(data.tree);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Failed to load knowledge base:', error);
        setLoading(false);
      });
  }, []);

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const selectNode = (node: KnowledgeNode) => {
    if (node.content) {
      setSelectedNode(node);
      tracking.knowledgeBaseOpened(node.id, node.title);
    } else if (node.children) {
      toggleNode(node.id);
    }
  };

  const renderNode = (node: KnowledgeNode, level: number = 0): JSX.Element => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedNode?.id === node.id;

    return (
      <div key={node.id}>
        <div
          onClick={() => selectNode(node)}
          className={`knowledge-tree-item flex items-center py-2 px-3 rounded cursor-pointer ${
            isSelected ? 'bg-indigo-100 text-indigo-900' : 'text-gray-700'
          }`}
          style={{ paddingLeft: `${level * 16 + 12}px` }}
        >
          {hasChildren && (
            <svg
              className={`w-4 h-4 mr-2 transition-transform ${isExpanded ? 'transform rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
          {!hasChildren && <span className="w-4 mr-2"></span>}
          <span className={`flex-1 text-sm ${hasChildren ? 'font-semibold' : ''}`}>
            {node.title}
          </span>
          {!hasChildren && (
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const filterNodes = (nodes: KnowledgeNode[], query: string): KnowledgeNode[] => {
    if (!query) return nodes;

    const lowerQuery = query.toLowerCase();
    const filtered: KnowledgeNode[] = [];

    for (const node of nodes) {
      const titleMatch = node.title.toLowerCase().includes(lowerQuery);
      const contentMatch = node.content?.toLowerCase().includes(lowerQuery);

      if (titleMatch || contentMatch) {
        filtered.push(node);
      } else if (node.children) {
        const filteredChildren = filterNodes(node.children, query);
        if (filteredChildren.length > 0) {
          filtered.push({ ...node, children: filteredChildren });
        }
      }
    }

    return filtered;
  };

  const displayTree = searchQuery ? filterNodes(knowledgeTree, searchQuery) : knowledgeTree;

  // Auto-expand search results
  useEffect(() => {
    if (searchQuery) {
      const allNodeIds = new Set<string>();
      const collectIds = (nodes: KnowledgeNode[]) => {
        nodes.forEach((node) => {
          allNodeIds.add(node.id);
          if (node.children) collectIds(node.children);
        });
      };
      collectIds(displayTree);
      setExpandedNodes(allNodeIds);
    }
  }, [searchQuery, displayTree]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="bg-indigo-600 text-white px-4 py-3 rounded-t-lg flex items-center justify-between">
        <h3 className="text-lg font-semibold">Knowledge Base</h3>
        {onClose && (
          <button onClick={onClose} className="text-white hover:text-indigo-200">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <input
            type="text"
            placeholder="Search knowledge base..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
          <svg
            className="w-5 h-5 text-gray-400 absolute left-3 top-2.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Tree Navigation */}
        <div className="w-1/2 border-r border-gray-200 overflow-y-auto p-2">
          {displayTree.length > 0 ? (
            displayTree.map((node) => renderNode(node))
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">No results found</p>
          )}
        </div>

        {/* Content Display */}
        <div className="w-1/2 overflow-y-auto p-4">
          {selectedNode ? (
            <div className="prose prose-sm max-w-none">
              <div dangerouslySetInnerHTML={{ __html: selectedNode.content || '' }} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-center">
              <div>
                <svg className="w-16 h-16 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm">Select a topic to view content</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
