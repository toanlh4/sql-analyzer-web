import type { ColibriManifest, ColibriNode } from '../types/colibri';
import { nodeLayer } from './nodeStyle';

/** Empty filter lists mean "no filter". A node passes the tag filter if it has any selected tag. */
export function matchesFilters(node: ColibriNode, layers: string[], tags: string[]): boolean {
  if (layers.length > 0 && !layers.includes(nodeLayer(node))) return false;
  if (tags.length > 0 && !node.tags.some((t) => tags.includes(t))) return false;
  return true;
}

export function allLayers(nodes: ColibriNode[]): string[] {
  return [...new Set(nodes.map(nodeLayer))].sort();
}

export function allTags(nodes: ColibriNode[]): string[] {
  return [...new Set(nodes.flatMap((n) => n.tags))].sort();
}

export function manifestNodes(manifest: ColibriManifest | null): ColibriNode[] {
  return manifest ? Object.values(manifest.nodes) : [];
}
