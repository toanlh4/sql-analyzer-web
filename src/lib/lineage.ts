import { columnKey, type GraphIndex } from './graphIndex';

export type Direction = 'parents' | 'children';

/** Model ids reachable from `start` within `depth` layers in the given direction (excludes start). */
export function expandModels(index: GraphIndex, start: Iterable<string>, direction: Direction, depth: number): Set<string> {
  const adjacency = direction === 'parents' ? index.modelParents : index.modelChildren;
  const found = new Set<string>();
  let frontier = [...start];
  const seen = new Set(frontier);
  for (let level = 0; level < depth && frontier.length > 0; level++) {
    const next: string[] = [];
    for (const id of frontier) {
      for (const neighbour of adjacency.get(id) ?? []) {
        if (seen.has(neighbour)) continue;
        seen.add(neighbour);
        found.add(neighbour);
        next.push(neighbour);
      }
    }
    frontier = next;
  }
  return found;
}

export interface ColumnLineage {
  /** Column keys (node::column) upstream and downstream of the selection, including the selection. */
  columns: Set<string>;
  /** Model ids touched by the lineage. */
  nodes: Set<string>;
}

function walk(index: GraphIndex, startKey: string, direction: 'up' | 'down', out: ColumnLineage): void {
  const map = direction === 'up' ? index.columnUp : index.columnDown;
  const stack = [startKey];
  const seen = new Set<string>([startKey]);
  while (stack.length > 0) {
    const key = stack.pop() as string;
    for (const ref of map.get(key) ?? []) {
      const refKey = columnKey(ref.node, ref.column);
      if (seen.has(refKey)) continue;
      seen.add(refKey);
      out.columns.add(refKey);
      out.nodes.add(ref.node);
      stack.push(refKey);
    }
  }
}

/** Full upstream + downstream lineage of one column, following data edges. */
export function columnLineage(index: GraphIndex, node: string, column: string): ColumnLineage {
  const key = columnKey(node, column);
  const result: ColumnLineage = { columns: new Set([key]), nodes: new Set([node]) };
  walk(index, key, 'up', result);
  walk(index, key, 'down', result);
  return result;
}
