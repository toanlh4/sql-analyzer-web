import { columnKey, type GraphIndex } from './graphIndex';
import type { StructuralEdgeType } from '../types/colibri';

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

/** Kinds of column lineage a user can choose to trace: SELECT expressions (data edges), JOIN and WHERE (filter) conditions. */
export type LineageKind = 'select' | StructuralEdgeType;

export const LINEAGE_KINDS: { value: LineageKind; label: string; description: string }[] = [
  { value: 'select', label: 'SELECT', description: 'Column flows into another column through a select expression' },
  { value: 'join', label: 'JOIN', description: 'Column is used in a join condition of a downstream model' },
  { value: 'filter', label: 'WHERE', description: 'Column is used in a where / filter condition of a downstream model' },
];

export const ALL_LINEAGE_KINDS: LineageKind[] = LINEAGE_KINDS.map((k) => k.value);

export interface ColumnLineage {
  /** Column keys (node::column) upstream and downstream of the selection, including the selection. */
  columns: Set<string>;
  /** Model ids touched by the lineage, including models only joined/filtered by a traced column. */
  nodes: Set<string>;
  /** Lineage kinds this was computed with. */
  kinds: ReadonlySet<LineageKind>;
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

/**
 * Upstream + downstream lineage of one column. SELECT follows data edges column to column;
 * JOIN / WHERE add the models whose join / filter conditions use any traced column.
 */
export function columnLineage(index: GraphIndex, node: string, column: string, kinds: Iterable<LineageKind> = ALL_LINEAGE_KINDS): ColumnLineage {
  const key = columnKey(node, column);
  const kindSet = new Set(kinds);
  const result: ColumnLineage = { columns: new Set([key]), nodes: new Set([node]), kinds: kindSet };
  if (kindSet.has('select')) {
    walk(index, key, 'up', result);
    walk(index, key, 'down', result);
  }
  for (const colKey of result.columns) {
    for (const ref of index.structuralBySource.get(colKey) ?? []) {
      if (kindSet.has(ref.edgeType)) result.nodes.add(ref.node);
    }
  }
  return result;
}
