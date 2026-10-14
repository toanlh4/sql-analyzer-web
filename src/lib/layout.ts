export const NODE_WIDTH = 260;
/** Vertical gap between column rows (Tailwind `space-y-1`). */
export const ROW_GAP = 4;
/** Padding above the first row inside the scroll area (`py-0.5`). */
export const LIST_PADDING = 2;
/** Card border + padding + header. */
const CARD_HEAD = 4 + 24 + 36;
/** Divider + spacing above the column list. */
const LIST_CHROME = 12 + 1 + 8;
/** Footer with the +parents / +children buttons. */
const FOOTER = 12 + 1 + 24;
/** Smallest column area kept when the max node height is very small. */
export const MIN_LIST_HEIGHT = 40;

/** Height of a list of `count` rows, without any max-height cap. */
export function listHeight(count: number, rowHeight: number): number {
  return count === 0 ? 0 : LIST_PADDING * 2 + count * rowHeight + (count - 1) * ROW_GAP;
}

/** Max height of the scrollable column area for a given max node height (0 = no cap). */
export function listMaxHeight(nodeMaxHeight: number): number | null {
  if (nodeMaxHeight <= 0) return null;
  return Math.max(MIN_LIST_HEIGHT, nodeMaxHeight - CARD_HEAD - LIST_CHROME - FOOTER);
}

export function estimateNodeHeight(columnCount: number, folded: boolean, rowHeight: number, nodeMaxHeight: number): number {
  if (folded || columnCount === 0) return CARD_HEAD + FOOTER;
  const full = listHeight(columnCount, rowHeight);
  const cap = listMaxHeight(nodeMaxHeight);
  return CARD_HEAD + LIST_CHROME + (cap === null ? full : Math.min(full, cap)) + FOOTER;
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
