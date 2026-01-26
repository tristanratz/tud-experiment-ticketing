import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';
import { KnowledgeNode } from '@/types';

const KNOWLEDGE_BASE_PATH = path.join(process.cwd(), 'data', 'knowledge');

export const knowledgeService = {
  // Build hierarchical knowledge tree
  buildKnowledgeTree(): KnowledgeNode[] {
    if (!fs.existsSync(KNOWLEDGE_BASE_PATH)) {
      return [];
    }

    return this.readDirectory(KNOWLEDGE_BASE_PATH);
  },

  // Recursively read directory structure
  readDirectory(dirPath: string, parentId: string = ''): KnowledgeNode[] {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const nodes: KnowledgeNode[] = [];

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const nodeId = parentId ? `${parentId}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        // Directory becomes a category node
        const children = this.readDirectory(fullPath, nodeId);
        nodes.push({
          id: nodeId,
          title: this.formatTitle(entry.name),
          children,
          expanded: false,
        });
      } else if (entry.name.endsWith('.md')) {
        // Markdown file becomes a content node
        const content = this.readMarkdownFile(fullPath);
        nodes.push({
          id: nodeId,
          title: content.title,
          content: content.html,
          expanded: false,
        });
      }
    }

    return nodes.sort((a, b) => a.title.localeCompare(b.title));
  },

  // Read and parse markdown file
  readMarkdownFile(filePath: string): { title: string; html: string } {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContents);

    // Use frontmatter title if available, otherwise extract from first heading
    let title = data.title || this.extractTitle(content) || path.basename(filePath, '.md');
    title = this.formatTitle(title);

    // Configure marked for better HTML output (using GFM for better markdown support)
    const html = marked(content, {
      breaks: true, // Convert line breaks to <br>
      gfm: true, // Enable GitHub Flavored Markdown
    });

    return { title, html: html as string };
  },

  // Extract title from markdown content
  extractTitle(markdown: string): string | null {
    const match = markdown.match(/^#\s+(.+)$/m);
    return match ? match[1] : null;
  },

  // Format title from filename/dirname
  formatTitle(name: string): string {
    return name
      .replace(/\.md$/, '')
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  },

  // Search knowledge base
  searchKnowledge(query: string): KnowledgeNode[] {
    const allNodes = this.flattenTree(this.buildKnowledgeTree());
    const lowerQuery = query.toLowerCase();

    return allNodes.filter(node => {
      const titleMatch = node.title.toLowerCase().includes(lowerQuery);
      const contentMatch = node.content?.toLowerCase().includes(lowerQuery);
      return titleMatch || contentMatch;
    });
  },

  // Flatten tree structure for searching
  flattenTree(nodes: KnowledgeNode[]): KnowledgeNode[] {
    const flattened: KnowledgeNode[] = [];

    for (const node of nodes) {
      flattened.push(node);
      if (node.children) {
        flattened.push(...this.flattenTree(node.children));
      }
    }

    return flattened;
  },

  // Get specific knowledge node by ID
  getNodeById(nodeId: string): KnowledgeNode | null {
    const allNodes = this.flattenTree(this.buildKnowledgeTree());
    return allNodes.find(node => node.id === nodeId) || null;
  },

  // Get all category names (for filtering)
  getCategories(): string[] {
    const tree = this.buildKnowledgeTree();
    return tree.map(node => node.title);
  },
};
