import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { visibleColumns } from '../../lib/visibleColumns';
import {
  Background,
  Controls,
  MiniMap,
  MarkerType,
  Panel,
  ReactFlow,
  applyNodeChanges,
  useReactFlow,
  type Edge,
  type NodeChange,
} from '@xyflow/react';
import { Search } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { matchesFilters } from '../../lib/filters';
import { nodeStyle } from '../../lib/nodeStyle';
import { columnKey } from '../../lib/graphIndex';
import { estimateNodeHeight, layoutGraph } from '../../lib/layout';
import { MODEL_SOURCE_HANDLE, MODEL_TARGET_HANDLE, ModelNode, type ModelFlowNode } from './ModelNode';
import { columnHandleId } from './ColumnRow';
import { GraphToolbar } from './GraphToolbar';
import { NodeContextMenu } from './NodeContextMenu';

const nodeTypes = { modelNode: ModelNode };

const STRUCTURAL_STYLE = {
  join: { stroke: '#f97316', strokeDasharray: '6 4' },
  filter: { stroke: '#a855f7', strokeDasharray: '2 4' },
} as const;

export function LineageCanvas() {
  const manifest = useAppStore((s) => s.manifest);
  const index = useAppStore((s) => s.index);
  const canvasNodes = useAppStore((s) => s.canvasNodes);
  const hidden = useAppStore((s) => s.hidden);
  const folded = useAppStore((s) => s.folded);
  const positions = useAppStore((s) => s.positions);
  const layoutRequest = useAppStore((s) => s.layoutRequest);
  const selectedNodes = useAppStore((s) => s.selectedNodes);
  const lineage = useAppStore((s) => s.lineage);
  const layerFilter = useAppStore((s) => s.graphLayerFilter);
  const tagFilter = useAppStore((s) => s.graphTagFilter);
  const theme = useAppStore((s) => s.theme);
  const detailNode = useAppStore((s) => s.detailNode);
  const showMinimap = useAppStore((s) => s.display.showMinimap);
  const { setSelectedNodes, openDetails, setPositions, movePosition, clearSelection, setSearchOpen, openContextMenu, closeContextMenu } =
    useAppStore.getState();

  const { fitView } = useReactFlow();
  const [nodes, setNodes] = useState<ModelFlowNode[]>([]);

  const visibleIds = useMemo(() => {
    if (!manifest) return [];
    return canvasNodes.filter((id) => {
      const node = manifest.nodes[id];
      return node && !hidden.has(id) && matchesFilters(node, layerFilter, tagFilter);
    });
  }, [manifest, canvasNodes, hidden, layerFilter, tagFilter]);

  // Keep React Flow nodes in sync with the store (membership, positions, selection).
  useEffect(() => {
    setNodes((prev) => {
      const prevById = new Map(prev.map((n) => [n.id, n]));
      const selected = new Set(selectedNodes);
      return visibleIds.map((id) => {
        const old = prevById.get(id);
        return {
          ...(old ?? {}),
          id,
          type: 'modelNode' as const,
          data: old?.data ?? { nodeId: id },
          position: positions[id] ?? old?.position ?? { x: 0, y: 0 },
          selected: selected.has(id),
        };
      });
    });
  }, [visibleIds, positions, selectedNodes]);

  // Full layout whenever a re-layout is requested (nodes added, "Reorganize layout", ...).
  const latestLayout = useRef(0);
  useEffect(() => {
    if (!manifest || !index || layoutRequest === 0) return;
    const { canvasNodes: ids, hidden: hiddenNow, folded: foldedNow, lineage: lineageNow, relatedOnly, display } = useAppStore.getState();
    const layoutIds = ids.filter((id) => !hiddenNow.has(id) && manifest.nodes[id]);
    if (layoutIds.length === 0) return;
    const run = ++latestLayout.current;
    const inputs = layoutIds.map((id) => ({
      id,
      height: estimateNodeHeight(
        visibleColumns(manifest.nodes[id], lineageNow, relatedOnly).length,
        foldedNow.has(id),
        display.rowHeight,
        display.nodeMaxHeight,
      ),
    }));
    const edges = layoutIds.flatMap((target) => [...(index.modelParents.get(target) ?? [])].map((source) => ({ source, target })));
    void layoutGraph(inputs, edges).then((result) => {
      if (run !== latestLayout.current) return;
      setPositions(Object.fromEntries(result));
      requestAnimationFrame(() => void fitView({ padding: 0.15, duration: 300, maxZoom: 1 }));
    });
  }, [layoutRequest, manifest, index, fitView, setPositions]);

  const edges = useMemo<Edge[]>(() => {
    if (!index) return [];
    const visible = new Set(visibleIds);
    const result: Edge[] = [];
    const dimModels = !!lineage;

    for (const target of visibleIds) {
      for (const source of index.modelParents.get(target) ?? []) {
        if (!visible.has(source)) continue;
        result.push({
          id: `m:${source}->${target}`,
          source,
          target,
          sourceHandle: MODEL_SOURCE_HANDLE,
          targetHandle: MODEL_TARGET_HANDLE,
          style: { stroke: theme === 'dark' ? '#6b7280' : '#9ca3af', strokeWidth: 1.5, opacity: dimModels ? 0.25 : 1 },
          markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 },
          selectable: false,
        });
      }
    }

    if (lineage) {
      const handleFor = (node: string, column: string) => (folded.has(node) ? null : columnHandleId(column));
      const seen = new Set<string>();
      for (const e of index.dataEdges) {
        if (!visible.has(e.source) || !visible.has(e.target)) continue;
        if (!lineage.columns.has(columnKey(e.source, e.sourceColumn)) || !lineage.columns.has(columnKey(e.target, e.targetColumn))) continue;
        const id = `c:${e.source}.${e.sourceColumn}->${e.target}.${e.targetColumn}`;
        if (seen.has(id)) continue;
        seen.add(id);
        result.push({
          id,
          source: e.source,
          target: e.target,
          sourceHandle: handleFor(e.source, e.sourceColumn) ?? MODEL_SOURCE_HANDLE,
          targetHandle: handleFor(e.target, e.targetColumn) ?? MODEL_TARGET_HANDLE,
          animated: true,
          style: { stroke: '#3b82f6', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6', width: 14, height: 14 },
          zIndex: 10,
          selectable: false,
        });
      }
      for (const e of index.structuralEdges) {
        if (!e.edgeType || !lineage.kinds.has(e.edgeType) || !visible.has(e.source) || !visible.has(e.target)) continue;
        if (!lineage.columns.has(columnKey(e.source, e.sourceColumn))) continue;
        const id = `s:${e.edgeType}:${e.source}.${e.sourceColumn}->${e.target}`;
        if (seen.has(id)) continue;
        seen.add(id);
        const style = STRUCTURAL_STYLE[e.edgeType];
        result.push({
          id,
          source: e.source,
          target: e.target,
          sourceHandle: handleFor(e.source, e.sourceColumn) ?? MODEL_SOURCE_HANDLE,
          targetHandle: MODEL_TARGET_HANDLE,
          label: e.edgeType,
          labelStyle: { fontSize: 10, fill: style.stroke },
          labelBgStyle: { fill: theme === 'dark' ? '#111827' : '#ffffff' },
          style: { ...style, strokeWidth: 1.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color: style.stroke, width: 12, height: 12 },
          zIndex: 9,
          selectable: false,
        });
      }
    }
    return result;
  }, [index, visibleIds, lineage, folded, theme]);

  const onNodesChange = useCallback(
    (changes: NodeChange<ModelFlowNode>[]) => {
      setNodes((prev) => applyNodeChanges(changes, prev));
      if (changes.some((c) => c.type === 'select')) {
        const selected = new Set(useAppStore.getState().selectedNodes);
        for (const change of changes) {
          if (change.type !== 'select') continue;
          if (change.selected) selected.add(change.id);
          else selected.delete(change.id);
        }
        setSelectedNodes([...selected]);
      }
    },
    [setSelectedNodes],
  );

  if (!manifest) return null;

  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onNodeClick={(_, node) => openDetails(node.id)}
        onNodeDragStop={(_, __, dragged) => dragged.forEach((n) => movePosition(n.id, n.position))}
        onNodeContextMenu={(event, node) => {
          event.preventDefault();
          openContextMenu({ x: event.clientX, y: event.clientY, nodeId: node.id });
        }}
        onPaneClick={() => {
          closeContextMenu();
          clearSelection();
        }}
        colorMode={theme}
        minZoom={0.05}
        maxZoom={2}
        nodesConnectable={false}
        selectionOnDrag={false}
        multiSelectionKeyCode={['Shift', 'Meta', 'Control']}
        deleteKeyCode={null}
      >
        <Background gap={20} size={1} />
        <Controls showInteractive={false} />
        {showMinimap && (
          <MiniMap<ModelFlowNode>
            pannable
            zoomable
            ariaLabel="Lineage minimap"
            nodeBorderRadius={4}
            nodeStrokeWidth={6}
            nodeColor={(n) => {
              const node = manifest.nodes[n.id];
              const color = node ? nodeStyle(node).minimap : '#9ca3af';
              // While a column is traced, fade nodes outside its lineage like the canvas does.
              return lineage && !lineage.nodes.has(n.id) ? `${color}40` : color;
            }}
            nodeStrokeColor={(n) => (n.selected || n.id === detailNode ? '#1d4ed8' : 'transparent')}
            maskColor={theme === 'dark' ? 'rgba(17, 24, 39, 0.6)' : 'rgba(243, 244, 246, 0.6)'}
            className="overflow-hidden rounded-lg border border-gray-200 shadow-sm dark:border-gray-700"
          />
        )}
        <Panel position="top-left">
          <GraphToolbar />
        </Panel>
        {visibleIds.length === 0 && (
          <Panel position="top-center" className="pointer-events-auto mt-24">
            <div className="max-w-sm rounded-lg border border-dashed border-gray-300 bg-white/90 p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900/90 dark:text-gray-400">
              <p className="mb-3">
                {canvasNodes.length === 0 ? 'No nodes loaded.' : 'All loaded nodes are hidden or filtered out.'} Pick a model in the left sidebar, or search for one.
              </p>
              <button type="button" className="btn-primary inline-flex items-center gap-1.5" onClick={() => setSearchOpen(true)}>
                <Search className="h-3.5 w-3.5" /> Search (Ctrl+K)
              </button>
            </div>
          </Panel>
        )}
      </ReactFlow>
      <NodeContextMenu />
    </div>
  );
}
