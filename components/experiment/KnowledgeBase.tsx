'use client';

import { useState, useEffect } from 'react';
import { KnowledgeNode } from '@/types';
import { tracking } from '@/lib/tracking';

interface KnowledgeBaseProps {
  onClose?: () => void;
  variant?: 'standalone' | 'embedded';
}

export default function KnowledgeBase({ onClose, variant = 'standalone' }: KnowledgeBaseProps) {
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

  const handleBack = () => {
    setSelectedNode(null);
  };

  const renderNode = (node: KnowledgeNode, level: number = 0): JSX.Element => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedNode?.id === node.id;

    return (
      <div key={node.id}>
        <div
          onClick={() => selectNode(node)}
          className={`knowledge-tree-item flex items-center py-2.5 px-3 rounded-lg cursor-pointer transition-all hover:bg-indigo-50 ${
            isSelected ? 'bg-indigo-100 text-indigo-900 font-medium' : 'text-gray-700 hover:text-indigo-700'
          }`}
          style={{ paddingLeft: `${level * 16 + 12}px` }}
        >
          {hasChildren && (
            <svg
              className={`w-4 h-4 mr-2 transition-transform flex-shrink-0 ${isExpanded ? 'transform rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
          {!hasChildren && (
            <svg className="w-4 h-4 mr-2 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
          <span className={`flex-1 text-sm ${hasChildren ? 'font-semibold text-gray-800' : ''}`}>
            {node.title}
          </span>
          {!hasChildren && (
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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

  // Auto-expand search results and track search
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

      // Track knowledge base search with debounce
      const searchTimeout = setTimeout(() => {
        tracking.knowledgeBaseSearched(searchQuery, displayTree.length, Date.now());
      }, 500); // Debounce 500ms to avoid tracking every keystroke

      return () => clearTimeout(searchTimeout);
    }
  }, [searchQuery, displayTree]);

  if (loading) {
    return (
      <div className={`${variant === 'embedded' ? '' : 'bg-white rounded-lg shadow-sm border border-gray-200'} h-full flex items-center justify-center`}>
        <div className="text-center">
          <div className="spinner mx-auto mb-3"></div>
          <p className="text-sm text-gray-600">Loading knowledge base...</p>
        </div>
      </div>
    );
  }

  const containerClassName = variant === 'embedded'
    ? 'h-full flex flex-col'
    : 'bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col';

  return (
    <div className={containerClassName}>
      {variant !== 'embedded' && (
        <div className="bg-indigo-600 text-white px-4 py-3 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {selectedNode && (
              <button
                onClick={handleBack}
                className="text-white hover:bg-indigo-700 p-1 rounded transition-colors"
                title="Back to navigation"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h3 className="text-lg font-semibold">
              {selectedNode ? selectedNode.title : 'Knowledge Base'}
            </h3>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-white hover:text-indigo-200 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}
      {variant === 'embedded' && selectedNode && (
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200">
          <button
            onClick={handleBack}
            className="text-gray-600 hover:text-indigo-600 p-1 rounded transition-colors"
            title="Back to navigation"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="text-sm font-semibold text-gray-800">{selectedNode.title}</h3>
        </div>
      )}

      {/* Search - Only show when not viewing an article */}
      {!selectedNode && (
        <div className={`p-4 ${variant === 'embedded' ? 'border-b border-gray-200' : 'border-b border-gray-200'}`}>
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
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-xs text-gray-500 mt-2">
              {displayTree.length} result{displayTree.length !== 1 ? 's' : ''} found
            </p>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {selectedNode ? (
          /* Article View */
          <div className="h-full overflow-y-auto">
            <article className="knowledge-article p-6">
              <div dangerouslySetInnerHTML={{ __html: selectedNode.content || '' }} />
            </article>
          </div>
        ) : (
          /* Navigation Tree View */
          <div className="h-full overflow-y-auto p-3">
            {displayTree.length > 0 ? (
              <div className="space-y-1">
                {displayTree.map((node) => renderNode(node))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-gray-500 mb-2">No results found</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Clear search
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer hint - Only show when viewing tree */}
      {!selectedNode && displayTree.length > 0 && (
        <div className="border-t border-gray-200 px-4 py-2 bg-gray-50 rounded-b-lg">
          <p className="text-xs text-gray-500 text-center">
            Click on any article to read its content
          </p>
        </div>
      )}
    </div>
  );
}
