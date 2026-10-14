import type { ColibriEdge, ColibriManifest, StructuralEdgeType } from '../types/colibri';

export interface ColumnRef {
  node: string;
  column: string;
}

export interface StructuralRef extends ColumnRef {
  edgeType: StructuralEdgeType;
}

/** Precomputed adjacency maps over the manifest's lineage edges. Built once per loaded file. */
export interface GraphIndex {
  modelParents: Map<string, Set<string>>;
  modelChildren: Map<string, Set<string>>;
  /** Column key -> upstream source columns (data edges only). */
  columnUp: Map<string, ColumnRef[]>;
  /** Column key -> downstream target columns (data edges only). */
  columnDown: Map<string, ColumnRef[]>;
  /** Target model id -> source columns used to filter/join it. */
  structuralByTarget: Map<string, StructuralRef[]>;
  /** Source column key -> target models it filters/joins. */
  structuralBySource: Map<string, { node: string; edgeType: StructuralEdgeType }[]>;
  dataEdges: ColibriEdge[];
  structuralEdges: ColibriEdge[];
}

export const columnKey = (node: string, column: string): string => `${node}::${column}`;

function push<K, V>(map: Map<K, V[]>, key: K, value: V): void {
  const list = map.get(key);
  if (list) list.push(value);
  else map.set(key, [value]);
}

function addToSet(map: Map<string, Set<string>>, key: string, value: string): void {
  const set = map.get(key);
  if (set) set.add(value);
  else map.set(key, new Set([value]));
}

export function buildGraphIndex(manifest: ColibriManifest): GraphIndex {
  const index: GraphIndex = {
    modelParents: new Map(),
    modelChildren: new Map(),
    columnUp: new Map(),
    columnDown: new Map(),
    structuralByTarget: new Map(),
    structuralBySource: new Map(),
    dataEdges: [],
    structuralEdges: [],
  };

  for (const edge of manifest.lineage.edges) {
    if (edge.source !== edge.target) {
      addToSet(index.modelParents, edge.target, edge.source);
      addToSet(index.modelChildren, edge.source, edge.target);
    }
    if (edge.edgeType) {
      index.structuralEdges.push(edge);
      push(index.structuralByTarget, edge.target, { node: edge.source, column: edge.sourceColumn, edgeType: edge.edgeType });
      push(index.structuralBySource, columnKey(edge.source, edge.sourceColumn), { node: edge.target, edgeType: edge.edgeType });
    } else if (edge.sourceColumn && edge.targetColumn) {
      index.dataEdges.push(edge);
      push(index.columnUp, columnKey(edge.target, edge.targetColumn), { node: edge.source, column: edge.sourceColumn });
      push(index.columnDown, columnKey(edge.source, edge.sourceColumn), { node: edge.target, column: edge.targetColumn });
    }
  }
  return index;
}
