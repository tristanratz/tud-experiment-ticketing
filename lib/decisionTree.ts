import treeData from '@/data/tree.json';
import { DecisionTree, DecisionTreeNode } from '@/types';

export const decisionTree = treeData as DecisionTree;

export const getTreeNode = (nodeId: string): DecisionTreeNode | undefined =>
  decisionTree.nodes[nodeId];

export const buildDecisionPath = (selections: Record<string, string>) => {
  const nodes: DecisionTreeNode[] = [];
  let currentId: string | undefined = decisionTree.rootId;
  let outcomeId: string | undefined;

  while (currentId) {
    const node = getTreeNode(currentId);
    if (!node) break;

    nodes.push(node);

    if (node.type === 'decision') {
      const selectedOptionId = selections[node.id];
      if (!selectedOptionId) break;
      const option = node.options?.find(opt => opt.id === selectedOptionId);
      if (!option) break;
      currentId = option.next;
      continue;
    }

    if (node.type === 'outcome') {
      outcomeId = node.id;
      break;
    }
  }

  return { nodes, outcomeId };
};

export const pruneSelectionsToPath = (selections: Record<string, string>) => {
  const pruned: Record<string, string> = {};
  let currentId: string | undefined = decisionTree.rootId;

  while (currentId) {
    const node = getTreeNode(currentId);
    if (!node || node.type !== 'decision') break;

    const selectedOptionId = selections[node.id];
    if (!selectedOptionId) break;

    const option = node.options?.find(opt => opt.id === selectedOptionId);
    if (!option) break;

    pruned[node.id] = selectedOptionId;
    currentId = option.next;
  }

  return pruned;
};
