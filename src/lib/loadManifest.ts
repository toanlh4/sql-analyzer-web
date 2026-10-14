import type { ColibriManifest, ColibriTree, ColibriNode } from '../types/colibri';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Fallback tree when the file has none: group nodes by database and schema. */
function buildTree(nodes: Record<string, ColibriNode>, projectName: string): ColibriTree {
  const byDatabase: ColibriTree['byDatabase'] = {};
  const items: string[] = [];
  for (const node of Object.values(nodes)) {
    items.push(node.id);
    if (node.nodeType === 'exposure') continue;
    const db = (node.database ?? 'unknown').toLowerCase();
    const schema = (node.schema ?? 'unknown').toLowerCase();
    ((byDatabase[db] ??= {})[schema] ??= []).push(node.id);
  }
  return { byDatabase, byPath: { [projectName]: { __items__: items } } };
}

/** Parse and validate the text of a colibri-manifest.json file. Throws with a readable message. */
export function parseManifest(text: string): ColibriManifest {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (err) {
    throw new Error(`Invalid JSON: ${err instanceof Error ? err.message : String(err)}`);
  }
  if (!isRecord(raw)) throw new Error('Expected a JSON object at the top level.');
  if (!isRecord(raw.nodes)) throw new Error('Missing "nodes" object. Is this a colibri-manifest.json file?');
  if (!isRecord(raw.lineage) || !Array.isArray(raw.lineage.edges)) {
    throw new Error('Missing "lineage.edges" array. Is this a colibri-manifest.json file?');
  }

  const nodes = raw.nodes as Record<string, ColibriNode>;
  for (const [id, node] of Object.entries(nodes)) {
    if (!isRecord(node)) throw new Error(`Node "${id}" is not an object.`);
    node.id ??= id;
    node.name ??= id.split('.').pop() ?? id;
    node.fullName ??= id;
    node.columns ??= {};
    node.tags ??= [];
    node.refs ??= [];
  }

  const metadata = isRecord(raw.metadata) ? (raw.metadata as ColibriManifest['metadata']) : {};
  const projectName = metadata.dbt_project_name ?? 'project';
  const tree = isRecord(raw.tree) && isRecord(raw.tree.byPath) && isRecord(raw.tree.byDatabase)
    ? (raw.tree as unknown as ColibriTree)
    : buildTree(nodes, projectName);

  return {
    metadata,
    nodes,
    lineage: { edges: raw.lineage.edges as ColibriManifest['lineage']['edges'] },
    tree,
  };
}

export async function readManifestFile(file: File): Promise<ColibriManifest> {
  return parseManifest(await file.text());
}
