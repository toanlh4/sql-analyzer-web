import type { ColibriNode } from '../types/colibri';

/** Build a dbt command selecting the given nodes with their upstream and downstream (`+name+`). */
export function dbtCommand(nodes: ColibriNode[]): string {
  const selectors = nodes
    .filter((n) => n.nodeType !== 'exposure')
    .map((n) => (n.nodeType === 'source' ? `+source:${n.id.split('.').slice(2).join('.')}+` : `+${n.name}+`));
  return selectors.length > 0 ? `dbt build -s ${selectors.join(' ')}` : '';
}
