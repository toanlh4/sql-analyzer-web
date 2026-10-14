import { memo, useCallback, useMemo } from 'react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { ChevronDown, Plus } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { nodeStyle } from '../../lib/nodeStyle';
import { columnKey } from '../../lib/graphIndex';
import { ColumnRow, hiddenHandleStyle } from './ColumnRow';

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

  const { missingParents, missingChildren } = useMemo(() => {
    const onCanvas = new Set(canvasNodes.filter((n) => !hidden.has(n)));
    const count = (ids: Set<string> | undefined) => [...(ids ?? [])].filter((n) => !onCanvas.has(n)).length;
    return { missingParents: count(index?.modelParents.get(id)), missingChildren: count(index?.modelChildren.get(id)) };
  }, [canvasNodes, hidden, index, id]);

  const onColumnClick = useCallback((column: string) => selectColumn({ node: id, column }), [selectColumn, id]);

  if (!node) return null;
  const style = nodeStyle(node);
  const Icon = style.icon;
  const columns = Object.values(node.columns);
  const inLineage = lineage?.nodes.has(id) ?? false;
  const showBadges = badgeMode === 'all' || (badgeMode === '1' && (isDetail || selected || inLineage));
  const nodeTooltip = [
    node.fullName,
    `Type: ${node.nodeType}${node.materialized && node.materialized !== 'unknown' ? ` (${node.materialized})` : ''}`,
    node.modelType !== 'unknown' ? `Layer: ${node.modelType}` : null,
    `${columns.length} columns`,
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
              {node.nodeType === 'exposure' ? node.exposure_metadata?.type ?? 'exposure' : `${columns.length} columns`}
              {node.materialized === 'ephemeral' && ' · ephemeral'}
            </div>
          </div>
        </div>
        {columns.length > 0 && (
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
          <div className="nodrag -mx-1 space-y-1 px-1 py-0.5">
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
                  onClick={onColumnClick}
                />
              );
            })}
          </div>
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
