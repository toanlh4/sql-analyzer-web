import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { ColibriColumn } from '../../types/colibri';
import { dataTypeIcon } from '../../lib/dataTypeIcon';
import { LineageBadge, lineageLabel } from './LineageBadge';

export const hiddenHandleStyle = { opacity: 0, pointerEvents: 'none' as const, top: '50%' };

export const columnHandleId = (column: string): string => `col:${column}`;

interface ColumnRowProps {
  column: ColibriColumn;
  state: 'selected' | 'related' | 'none';
  dimmed: boolean;
  showBadge: boolean;
  onClick: (column: string) => void;
}

const STATE_CLASSES = {
  selected: 'bg-blue-500 text-white font-semibold ring-1 ring-blue-500 [&_svg]:!text-white',
  related: 'bg-blue-100 text-blue-800 font-semibold ring-1 ring-blue-400 dark:bg-blue-900 dark:text-blue-100',
  none: 'text-gray-700 hover:bg-gray-100 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-gray-800',
};

function ColumnRowImpl({ column, state, dimmed, showBadge, onClick }: ColumnRowProps) {
  const Icon = dataTypeIcon(column.dataType);
  const handleId = columnHandleId(column.columnName);
  const tooltip = [
    column.columnName,
    column.dataType ? `Type: ${column.dataType}` : null,
    column.contractType ? `Contract type: ${column.contractType}` : null,
    column.lineageType ? `Lineage: ${lineageLabel(column.lineageType)}` : null,
    column.description ? `\n${column.description}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <div className={`group nodrag nopan relative ${dimmed ? 'opacity-40' : ''}`}>
      <Handle type="target" position={Position.Left} id={handleId} style={hiddenHandleStyle} isConnectable={false} />
      <Handle type="source" position={Position.Right} id={handleId} style={hiddenHandleStyle} isConnectable={false} />
      <div
        title={tooltip}
        data-column-name={column.columnName}
        onClick={(e) => {
          e.stopPropagation();
          onClick(column.columnName);
        }}
        className={`flex min-w-0 cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-xs transition-colors duration-100 ${STATE_CLASSES[state]}`}
      >
        <Icon className="h-3 w-3 shrink-0 text-gray-400 group-hover:text-blue-500" />
        <span className="min-w-0 flex-1 truncate">{column.columnName}</span>
        {showBadge && column.lineageType && (
          <span className="shrink-0">
            <LineageBadge type={column.lineageType} />
          </span>
        )}
      </div>
    </div>
  );
}

export const ColumnRow = memo(ColumnRowImpl);
