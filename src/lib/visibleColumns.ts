import type { ColibriColumn, ColibriNode } from '../types/colibri';
import { columnKey } from './graphIndex';
import type { ColumnLineage } from './lineage';

/**
 * Columns to render for a node. With "related only" on, nodes in the selected column's lineage
 * keep just the columns in that lineage; other nodes (and nodes only joined/filtered by it) keep all columns.
 */
export function visibleColumns(node: ColibriNode, lineage: ColumnLineage | null, relatedOnly: boolean): ColibriColumn[] {
  const all = Object.values(node.columns);
  if (!relatedOnly || !lineage || !lineage.nodes.has(node.id)) return all;
  const related = all.filter((c) => lineage.columns.has(columnKey(node.id, c.columnName)));
  return related.length > 0 ? related : all;
}
