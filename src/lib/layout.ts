export const NODE_WIDTH = 260;
const HEADER_HEIGHT = 64;
const COLUMN_ROW_HEIGHT = 26;
const COLUMNS_PADDING = 24;
const FOOTER_HEIGHT = 44;

export function estimateNodeHeight(columnCount: number, folded: boolean): number {
  if (folded || columnCount === 0) return HEADER_HEIGHT + FOOTER_HEIGHT;
  return HEADER_HEIGHT + COLUMNS_PADDING + columnCount * COLUMN_ROW_HEIGHT + FOOTER_HEIGHT;
}

export interface LayoutInput {
  id: string;
  height: number;
}

// ELK is ~1.4 MB, so load it on first layout rather than with the upload screen.
let elkPromise: Promise<InstanceType<typeof import('elkjs/lib/elk.bundled.js').default>> | null = null;
const getElk = () => (elkPromise ??= import('elkjs/lib/elk.bundled.js').then((m) => new m.default()));

/** Left-to-right layered layout. Returns top-left positions keyed by node id. */
export async function layoutGraph(
  nodes: LayoutInput[],
  edges: { source: string; target: string }[],
): Promise<Map<string, { x: number; y: number }>> {
  const ids = new Set(nodes.map((n) => n.id));
  const seen = new Set<string>();
  const elkEdges = [];
  for (const edge of edges) {
    const key = `${edge.source}->${edge.target}`;
    if (edge.source === edge.target || seen.has(key) || !ids.has(edge.source) || !ids.has(edge.target)) continue;
    seen.add(key);
    elkEdges.push({ id: key, sources: [edge.source], targets: [edge.target] });
  }

  const elk = await getElk();
  const result = await elk.layout({
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.layered.spacing.nodeNodeBetweenLayers': '90',
      'elk.spacing.nodeNode': '40',
      'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
      'elk.separateConnectedComponents': 'true',
    },
    children: nodes.map((n) => ({ id: n.id, width: NODE_WIDTH, height: n.height })),
    edges: elkEdges,
  });

  const positions = new Map<string, { x: number; y: number }>();
  for (const child of result.children ?? []) {
    positions.set(child.id, { x: child.x ?? 0, y: child.y ?? 0 });
  }
  return positions;
}
