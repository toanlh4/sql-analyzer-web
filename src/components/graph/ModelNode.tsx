import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Handle, Position, useUpdateNodeInternals, type Node, type NodeProps } from '@xyflow/react';
import { ChevronDown, Plus } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { nodeStyle } from '../../lib/nodeStyle';
import { columnKey } from '../../lib/graphIndex';
import { LIST_PADDING, ROW_GAP, listHeight, listMaxHeight } from '../../lib/layout';
import { visibleColumns } from '../../lib/visibleColumns';
import { ColumnRow, columnHandleId, hiddenHandleStyle } from './ColumnRow';

export type ModelFlowNode = Node<{ nodeId: string }, 'modelNode'>;

export const MODEL_SOURCE_HANDLE = 'model-source';
export const MODEL_TARGET_HANDLE = 'model-target';

function ExpandButton({ count, title, onClick }: { count: number; title: string; onClick: () => void }) {
  return (
    <button
      type="button"
      title={count > 0 ? `${title} (${count} not loaded)` : `${title} (all loaded)`}
      disabled={count === 0}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="nodrag nopan flex h-6 min-w-6 items-center justify-center gap-0.5 rounded-full border border-gray-200 bg-gray-100 px-1 text-[10px] text-neutral-700 hover:bg-gray-200 disabled:cursor-default disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
    >
      <Plus className="h-3 w-3" />
      {count > 0 && <span>{count}</span>}
    </button>
  );
}

function ModelNodeImpl({ data, selected }: NodeProps<ModelFlowNode>) {
  const id = data.nodeId;
  const node = useAppStore((s) => s.manifest?.nodes[id]);
  const index = useAppStore((s) => s.index);
  const folded = useAppStore((s) => s.folded.has(id));
  const lineage = useAppStore((s) => s.lineage);
  const selectedColumn = useAppStore((s) => s.selectedColumn);
  const badgeMode = useAppStore((s) => s.badgeMode);
  const isDetail = useAppStore((s) => s.detailNode === id);
  const canvasNodes = useAppStore((s) => s.canvasNodes);
  const hidden = useAppStore((s) => s.hidden);
  const expandDepth = useAppStore((s) => s.expandDepth);
  const expand = useAppStore((s) => s.expand);
  const toggleFold = useAppStore((s) => s.toggleFold);
  const selectColumn = useAppStore((s) => s.selectColumn);
  const openContextMenu = useAppStore((s) => s.openContextMenu);
  const relatedOnly = useAppStore((s) => s.relatedOnly);
  const { rowHeight, nodeMaxHeight } = useAppStore((s) => s.display);
  const updateNodeInternals = useUpdateNodeInternals();

  const { missingParents, missingChildren } = useMemo(() => {
    const onCanvas = new Set(canvasNodes.filter((n) => !hidden.has(n)));
    const count = (ids: Set<string> | undefined) => [...(ids ?? [])].filter((n) => !onCanvas.has(n)).length;
    return { missingParents: count(index?.modelParents.get(id)), missingChildren: count(index?.modelChildren.get(id)) };
  }, [canvasNodes, hidden, index, id]);

  const columns = useMemo(() => (node ? visibleColumns(node, lineage, relatedOnly) : []), [node, lineage, relatedOnly]);
  const fullHeight = listHeight(columns.length, rowHeight);
  const cap = listMaxHeight(nodeMaxHeight);
  const viewportHeight = cap === null ? fullHeight : Math.min(fullHeight, cap);
  const scrollable = cap !== null && fullHeight > cap;

  // Track the list's scroll offset so column handles can follow (and clamp to the list edges).
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const frame = useRef(0);
  const onScroll = useCallback(() => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => setScrollTop(scrollRef.current?.scrollTop ?? 0));
  }, []);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  // Content height changes can clamp scrollTop without a scroll event.
  useEffect(() => {
    setScrollTop(scrollRef.current?.scrollTop ?? 0);
  }, [columns, rowHeight, cap, folded]);

  // Handles moved: tell React Flow to re-measure them so edges follow.
  useEffect(() => {
    updateNodeInternals(id);
  }, [id, scrollTop, columns, rowHeight, cap, folded, updateNodeInternals]);

  // Scroll the selected (or first related) column into view when the lineage changes.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !lineage || !scrollable) return;
    let idx = selectedColumn?.node === id ? columns.findIndex((c) => c.columnName === selectedColumn.column) : -1;
    if (idx < 0) idx = columns.findIndex((c) => lineage.columns.has(columnKey(id, c.columnName)));
    if (idx < 0) return;
    const top = LIST_PADDING + idx * (rowHeight + ROW_GAP);
    if (top < el.scrollTop || top + rowHeight > el.scrollTop + el.clientHeight) {
      el.scrollTop = Math.max(0, top - el.clientHeight / 3);
    }
    // Only when the lineage itself changes, not on every re-render.
  }, [lineage]);

  const onColumnClick = useCallback((column: string) => selectColumn({ node: id, column }), [selectColumn, id]);
  const onColumnContextMenu = useCallback(
    (column: string, x: number, y: number) => openContextMenu({ x, y, nodeId: id, column }),
    [openContextMenu, id],
  );

  if (!node) return null;
  const style = nodeStyle(node);
  const Icon = style.icon;
  const totalColumns = Object.keys(node.columns).length;
  const inLineage = lineage?.nodes.has(id) ?? false;
  const showBadges = badgeMode === 'all' || (badgeMode === '1' && (isDetail || selected || inLineage));
  const nodeTooltip = [
    node.fullName,
    `Type: ${node.nodeType}${node.materialized && node.materialized !== 'unknown' ? ` (${node.materialized})` : ''}`,
    node.modelType !== 'unknown' ? `Layer: ${node.modelType}` : null,
    `${totalColumns} columns`,
    node.description ? `\n${node.description}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <div
      className={`w-[260px] overflow-visible rounded-lg border-2 px-4 py-3 shadow-md ${style.card} ${
        selected || isDetail ? 'border-blue-500! shadow-lg ring-2 ring-blue-200 dark:ring-blue-800' : style.hover
      } ${lineage && !inLineage ? 'opacity-50' : ''}`}
    >
      <Handle type="target" position={Position.Left} id={MODEL_TARGET_HANDLE} style={hiddenHandleStyle} isConnectable={false} />
      <Handle type="source" position={Position.Right} id={MODEL_SOURCE_HANDLE} style={hiddenHandleStyle} isConnectable={false} />

      <div className="flex items-center justify-between">
        <div className="flex min-w-0 flex-1 items-center space-x-3">
          <Icon className={`h-4 w-4 shrink-0 ${style.iconColor}`} />
          <div className="min-w-0 flex-1">
            <div className="cursor-default truncate text-sm font-semibold text-gray-900 dark:text-gray-100" title={nodeTooltip}>
              {node.name}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {node.nodeType === 'exposure'
                ? node.exposure_metadata?.type ?? 'exposure'
                : columns.length < totalColumns
                  ? `${columns.length} of ${totalColumns} columns`
                  : `${totalColumns} columns`}
              {node.materialized === 'ephemeral' && ' · ephemeral'}
            </div>
          </div>
        </div>
        {totalColumns > 0 && (
          <button
            type="button"
            title={folded ? 'Unfold (Tab)' : 'Fold (Tab)'}
            onClick={(e) => {
              e.stopPropagation();
              toggleFold([id]);
            }}
            className="nodrag ml-2 flex h-6 w-6 items-center justify-center rounded-md text-neutral-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${folded ? '' : 'rotate-180'}`} />
          </button>
        )}
      </div>

      {!folded && columns.length > 0 && (
        <div className="mt-3 border-t border-gray-200 pt-2 dark:border-gray-700">
          <div className="relative">
            <div
              ref={scrollRef}
              onScroll={onScroll}
              style={{ maxHeight: cap ?? undefined }}
              className={`nodrag -mx-1 overflow-y-auto px-1 ${scrollable ? 'nowheel' : ''}`}
            >
              <div className="flex flex-col" style={{ gap: ROW_GAP, paddingBlock: LIST_PADDING }}>
                {columns.map((column) => {
                  const key = columnKey(id, column.columnName);
                  const isSelected = selectedColumn?.node === id && selectedColumn.column === column.columnName;
                  const isRelated = !isSelected && (lineage?.columns.has(key) ?? false);
                  return (
                    <ColumnRow
                      key={column.columnName}
                      column={column}
                      state={isSelected ? 'selected' : isRelated ? 'related' : 'none'}
                      dimmed={!!lineage && inLineage && !isSelected && !isRelated}
                      showBadge={showBadges}
                      height={rowHeight}
                      onClick={onColumnClick}
                      onContextMenu={onColumnContextMenu}
                    />
                  );
                })}
              </div>
            </div>
            {/* Column handles live outside the scroll area, clamped to its top/bottom edge when scrolled out of view. */}
            <div className="pointer-events-none absolute inset-y-0 -right-4 -left-4">
              {columns.map((column, i) => {
                const center = LIST_PADDING + i * (rowHeight + ROW_GAP) + rowHeight / 2 - scrollTop;
                const top = Math.min(Math.max(center, 0), viewportHeight);
                const handleId = columnHandleId(column.columnName);
                const handleStyle = { ...hiddenHandleStyle, top };
                return (
                  <div key={column.columnName}>
                    <Handle type="target" position={Position.Left} id={handleId} style={handleStyle} isConnectable={false} />
                    <Handle type="source" position={Position.Right} id={handleId} style={handleStyle} isConnectable={false} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {!folded && columns.length === 0 && totalColumns > 0 && (
        <div className="mt-3 border-t border-gray-200 pt-2 text-center text-[11px] text-gray-400 dark:border-gray-700">
          No related columns
        </div>
      )}

      <div className="relative mt-3 flex h-6 items-center justify-between border-t border-gray-200 pt-2 dark:border-gray-700">
        <ExpandButton count={missingParents} title={`Load +${expandDepth} parents`} onClick={() => expand([id], 'parents', expandDepth)} />
        <ExpandButton count={missingChildren} title={`Load +${expandDepth} children`} onClick={() => expand([id], 'children', expandDepth)} />
      </div>
    </div>
  );
}

export const ModelNode = memo(ModelNodeImpl);
